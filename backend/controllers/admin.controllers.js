import User from "../models/user.model.js"
import Shop from "../models/shop.model.js"
import Order from "../models/order.model.js"
import Earning from "../models/earning.model.js"
import CodDeposit from "../models/codDeposit.model.js"
import { isAdmin } from "./user.controllers.js"
import { getMode } from "../utils/payout.js"

const guard = async (req, res) => {
    if (await isAdmin(req.userId)) return true
    res.status(403).json({ message: "not allowed" })
    return false
}
const sum = async (Model, match, field = "amount") => (await Model.aggregate([{ $match: match }, { $group: { _id: null, t: { $sum: `$${field}` } } }]))[0]?.t || 0

export const overview = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const sod = new Date(); sod.setHours(0, 0, 0, 0)
        const [roles, shopsReal, shopsListing, statusRows, ordersToday, ordersAll] = await Promise.all([
            User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
            Shop.countDocuments({ isListing: { $ne: true } }),
            Shop.countDocuments({ isListing: true }),
            Order.aggregate([{ $unwind: "$shopOrders" }, { $group: { _id: "$shopOrders.status", n: { $sum: 1 } } }]),
            Order.countDocuments({ createdAt: { $gte: sod } }),
            Order.countDocuments({})
        ])
        const money = {
            onlineCollected: await sum(Order, { paymentMethod: "online", payment: true }, "totalAmount"),
            codDeliveredFood: await sum(CodDeposit, {}),
            codPendingDeposits: await sum(CodDeposit, { status: "pending" }),
            codDeposited: await sum(CodDeposit, { status: "received" }),
            ownerOwed: await sum(Earning, { kind: "owner", payoutStatus: { $ne: "paid" } }),
            ownerPaid: await sum(Earning, { kind: "owner", payoutStatus: "paid" }),
            riderOwed: await sum(Earning, { kind: { $ne: "owner" }, payoutStatus: { $ne: "paid" } }),
            riderPaid: await sum(Earning, { kind: { $ne: "owner" }, payoutStatus: "paid" })
        }
        return res.status(200).json({
            mode: await getMode(),
            users: Object.fromEntries(roles.map(r => [r._id, r.n])),
            shops: { real: shopsReal, listings: shopsListing },
            shopOrderStatus: Object.fromEntries(statusRows.map(r => [r._id, r.n])),
            ordersToday, ordersAll, money
        })
    } catch (e) { return res.status(500).json({ message: e.message }) }
}

export const listOrders = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const limit = Math.min(Number(req.query.limit) || 100, 300)
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(limit)
            .populate("user", "fullname email mobile")
            .populate("shopOrders.shop", "name")
            .populate("shopOrders.assignedDeliveryBoy", "fullname mobile").lean()
        return res.status(200).json(orders.map(o => ({
            id: o._id, createdAt: o.createdAt, customer: o.user, paymentMethod: o.paymentMethod, paid: o.payment,
            total: o.totalAmount, deliveryFee: o.deliveryFee, address: o.deliveryAddress?.text,
            shopOrders: o.shopOrders.map(so => ({ shop: so.shop?.name, status: so.status, subTotal: so.subTotal, rider: so.assignedDeliveryBoy ? `${so.assignedDeliveryBoy.fullname} (${so.assignedDeliveryBoy.mobile})` : null, deliveredAt: so.deliveredAt }))
        })))
    } catch (e) { return res.status(500).json({ message: e.message }) }
}

export const listUsers = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const users = await User.find({ email: { $not: /\.invalid$/ } }).sort({ createdAt: -1 }).limit(500).select("fullname email mobile role upiId blocked createdAt locationUpdatedAt").lean()
        return res.status(200).json(users)
    } catch (e) { return res.status(500).json({ message: e.message }) }
}

export const listShops = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const shops = await Shop.find({ isListing: { $ne: true } }).sort({ createdAt: -1 }).limit(300).populate("owner", "fullname email mobile").select("name city state address hidden owner createdAt").lean()
        const listings = await Shop.countDocuments({ isListing: true })
        return res.status(200).json({ shops, listings })
    } catch (e) { return res.status(500).json({ message: e.message }) }
}

export const setUserBlocked = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const { userId, blocked } = req.body
        const target = await User.findById(userId).select("email role")
        if (!target) return res.status(404).json({ message: "user not found" })
        if (String(target._id) === String(req.userId)) return res.status(400).json({ message: "You cannot block yourself" })
        target.blocked = !!blocked
        await target.save()
        return res.status(200).json({ ok: true, blocked: target.blocked })
    } catch (e) { return res.status(500).json({ message: e.message }) }
}

export const setShopHidden = async (req, res) => {
    try {
        if (!(await guard(req, res))) return
        const { shopId, hidden } = req.body
        const s = await Shop.findByIdAndUpdate(shopId, { hidden: !!hidden }, { new: true })
        if (!s) return res.status(404).json({ message: "shop not found" })
        return res.status(200).json({ ok: true, hidden: s.hidden })
    } catch (e) { return res.status(500).json({ message: e.message }) }
}
