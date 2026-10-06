import fs from "fs"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import User from "../models/user.model.js"
import Shop from "../models/shop.model.js"
import Item from "../models/item.model.js"

const IMG = "https://khana-khajana-2ijn.onrender.com/food-placeholder.svg"

// Maps a Zomato menu section + dish name to this app's fixed category list.
const pickCategory = (name, sec) => {
    const t = `${name} ${sec}`.toLowerCase()
    const has = (...w) => w.some(x => t.includes(x))
    if (has("pizza")) return "Pizza"
    if (has("burger")) return "Burgers"
    if (has("sandwich", "sandwhich", "toast")) return "Sandwitches"
    if (has("dosa", "idli", "uttapam", "uttappam", "sambar", "south indian", "pongal", "appam", "medu vada", "rasam", "filter coffee")) return "South Indian"
    if (has("chinese", "noodle", "manchurian", "chowmein", "chow mein", "fried rice", "hakka", "schezwan", "szechwan", "momo", "chilli ", "chilly ")) return "Chinese"
    if (has("dessert", "sweet", "kulfi", "ice cream", "halwa", "gulab", "rasgulla", "jalebi", "mithai", "cake", "brownie", "falooda", "kheer", "rabri", "pastry", "rasmalai", "ladoo", "barfi", "sundae")) return "Dessert"
    if (has("beverage", "drink", "lassi", "shake", "juice", "soda", "cola", "tea", "coffee", "water", "shikanji", "thandai", "mocktail", "lemonade")) return "Others"
    if (has("roll", "fries", "pav", "vada", "chaat", "samosa", "kachori", "tikki", "pakora", "pakoda", "snack", "puff", "momos", "nugget", "kathi", "frankie", "franky", "bhel", "puri", "dahi")) return "Snacks"
    if (has("tandoor", "kabab", "kebab", "tikka", "starter", "naan", "roti", "paratha", "parantha", "kulcha", "paneer", "dal ", "makhani", "butter", "masala", "korma", "curry", "rogan", "nihari", "biryani", "pulao", "thali")) return "North Indian"
    if (has("combo", "meal", "main", "gravy", "rice", "bread")) return "Main Course"
    return "Others"
}

export const seedListings = async () => {
    const data = JSON.parse(fs.readFileSync(new URL("./listings.json", import.meta.url), "utf8"))
    const email = "listings@khana-khajana.invalid"
    let owner = await User.findOne({ email })
    if (!owner) {
        owner = await User.create({
            fullname: "Khana Khajana Listings",
            email, role: "owner", mobile: "0000000000",
            password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10)
        })
    }
    let shops = 0, items = 0
    for (const l of data) {
        const fields = {
            name: l.name, image: l.image || IMG, owner: owner._id, city: l.city, state: l.state, address: l.address,
            isListing: true, listingSource: l.source, osmRef: l.osmRef || undefined,
            latitude: l.lat ?? undefined, longitude: l.lon ?? undefined,
            cuisines: l.cuisines, menuSource: l.items.length ? l.source : undefined
        }
        let shop = await Shop.findOne({ listingSource: l.source })
        if (shop) {
            // already seeded: never rebuild items (keeps item IDs stable), but fill in a missing real photo
            if (l.image && shop.image === IMG) { shop.image = l.image; await shop.save() }
            // fill in real per-dish photos on items that still carry the generic image
            const withImg = (l.items || []).filter(i => i.image)
            if (withImg.length) {
                const existing = await Item.find({ shop: shop._id, image: IMG })
                for (const it of existing) {
                    const m = withImg.find(i => i.name === it.name)
                    if (m) { it.image = m.image; await it.save() }
                }
            }
            continue
        }
        shop = await Shop.create(fields)
        await Item.deleteMany({ shop: shop._id })
        const docs = await Item.insertMany(l.items.map(i => ({
            name: i.name, image: i.image || IMG, shop: shop._id, price: i.price,
            category: pickCategory(i.name, i.cat), sourceCategory: i.cat,
            foodType: i.type === "veg" ? "veg" : "non veg"
        })))
        shop.items = docs.map(d => d._id)
        await shop.save()
        shops++; items += docs.length
    }
    await fillSampleMenus(owner._id)
    console.log(`[seed] listings upserted: ${shops} shops, ${items} items`)
}

// Listing shops with no verified menu get a SAMPLE menu copied from the best-stocked listing in the same city,
// prices nudged and the restaurant's own photo used, flagged shop.sampleMenu so the page says so. Idempotent.
const nudge = (price, seed) => {
    const f = 0.88 + (seed % 25) / 100 // 0.88 .. 1.12
    return Math.max(10, Math.round((price * f) / 5) * 5)
}
export const fillSampleMenus = async (ownerId) => {
    // refresh dish photos on sample shops created earlier (they got the restaurant photo): use the donor's matching dish photo
    for (const sh of await Shop.find({ owner: ownerId, isListing: true, sampleMenu: true })) {
        const donors = await Shop.find({ owner: ownerId, isListing: true, city: sh.city, _id: { $ne: sh._id }, sampleMenu: { $ne: true }, "items.0": { $exists: true } })
        const mine = new Set((sh.cuisines || "").toLowerCase().split(/[,\s]+/).filter(w => w.length > 3))
        const ov = x => [...new Set((x.cuisines || "").toLowerCase().split(/[,\s]+/).filter(w => w.length > 3))].filter(w => mine.has(w)).length
        donors.sort((a, b) => (ov(b) - ov(a)) || (b.items.length - a.items.length))
        if (!donors.length) continue
        const dItems = await Item.find({ shop: donors[0]._id })
        for (const it of await Item.find({ shop: sh._id, image: sh.image })) {
            const m = dItems.find(x => x.name === it.name && x.image !== donors[0].image)
            if (m) { it.image = m.image; await it.save() }
        }
    }
    const empties = await Shop.find({ owner: ownerId, isListing: true, sampleMenu: { $ne: true }, $or: [{ items: { $size: 0 } }, { items: { $exists: false } }] })
    let n = 0
    for (const shop of empties) {
        const donors = await Shop.find({ owner: ownerId, isListing: true, city: shop.city, _id: { $ne: shop._id }, sampleMenu: { $ne: true }, "items.0": { $exists: true } })
        if (!donors.length) continue
        const toks = x => new Set((x.cuisines || "").toLowerCase().split(/[,\s]+/).filter(w => w.length > 3))
        const mine = toks(shop)
        const overlap = x => [...toks(x)].filter(w => mine.has(w)).length
        donors.sort((a, b) => (overlap(b) - overlap(a)) || (b.items.length - a.items.length))
        const donor = donors[0]
        const src = await Item.find({ shop: donor._id }).limit(20)
        let seed = [...shop.name].reduce((a, c) => a + c.charCodeAt(0), 0)
        const docs = await Item.insertMany(src.map((i, k) => ({
            name: i.name, image: (i.image && i.image !== donor.image) ? i.image : (shop.image || i.image), shop: shop._id, price: nudge(i.price, seed + k * 7),
            category: i.category, sourceCategory: i.sourceCategory, foodType: i.foodType
        })))
        shop.items = docs.map(d => d._id)
        shop.sampleMenu = true
        await shop.save()
        n++
    }
    console.log(`[seed] sample menus filled: ${n} shops`)
}

// One-off: removes the QA accounts/shop/orders created while testing. Matches exact identifiers only.
export const cleanupQa = async () => {
    const Order = (await import("../models/order.model.js")).default
    const DA = (await import("../models/deliveryAssignment.model.js")).default
    const users = await User.find({ email: { $in: ["qa.loc@example.com", "lakshyayaduvanshi28+khowner@gmail.com", "qa.mobile@example.com", "qa.cust@example.com", "qa.owner@example.com", "qa.rider@example.com", "qa.admin@example.com", "qa.rider2@example.com"] } })
    const ids = users.map(u => u._id)
    const shops = await Shop.find({ owner: { $in: ids }, name: "QA Test Shop" })
    const shopIds = shops.map(s => s._id)
    const orders = await Order.find({ $or: [{ user: { $in: ids } }, { "shopOrders.owner": { $in: ids } }] }).select("_id")
    const r1 = await DA.deleteMany({ order: { $in: orders.map(o => o._id) } })
    const r2 = await Order.deleteMany({ _id: { $in: orders.map(o => o._id) } })
    const r3 = await Item.deleteMany({ shop: { $in: shopIds } })
    const r4 = await Shop.deleteMany({ _id: { $in: shopIds } })
    const Earning = (await import("../models/earning.model.js")).default
    await Earning.deleteMany({ $or: [{ rider: { $in: ids } }, { owner: { $in: ids } }] })
    await (await import("../models/codDeposit.model.js")).default.deleteMany({ rider: { $in: ids } })
    // orphaned items whose shop no longer exists (e.g. a deleted shop)
    const liveShops = await Shop.find().select("_id")
    const r6 = await Item.deleteMany({ shop: { $nin: liveShops.map(x => x._id) } })
    const r5 = await User.deleteMany({ _id: { $in: ids } })
    console.log(`[cleanup] assignments ${r1.deletedCount}, orders ${r2.deletedCount}, items ${r3.deletedCount}, shops ${r4.deletedCount}, users ${r5.deletedCount}, orphan items ${r6.deletedCount}`)
}
