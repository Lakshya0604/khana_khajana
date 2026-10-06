import crypto from "crypto"
import Earning from "../models/earning.model.js"
import User from "../models/user.model.js"
import Setting from "../models/setting.model.js"
import CodDeposit from "../models/codDeposit.model.js"
import Razorpay from "razorpay"
import { COD_DEPOSIT_LIMIT } from "./delivery.js"

// Payout adapter layer. The ledger (Earning) decides WHAT is owed; an adapter decides HOW it is paid.
//   simulation: no real money. Marks paid with a SIM- transaction id so the whole flow can be demoed.
//   manual:     leaves entries "unpaid"; the admin sends UPI by hand and presses "Mark paid".
//   real:       RazorpayX payouts to the person's UPI ID (needs a RazorpayX business account).
export const MODES = ["simulation", "manual", "real"]

export const realConfigured = () => !!(process.env.RAZORPAYX_KEY_ID && process.env.RAZORPAYX_KEY_SECRET && process.env.RAZORPAYX_ACCOUNT_NUMBER)

export const getMode = async () => {
    const row = await Setting.findOne({ key: "payoutMode" }).lean()
    const m = row?.value || process.env.PAYOUT_MODE || "simulation"
    if (m === "real" && !realConfigured()) return "manual" // never pretend: fall back to manual when keys are missing
    return MODES.includes(m) ? m : "simulation"
}
export const setMode = async (mode) => {
    if (!MODES.includes(mode)) throw new Error("invalid mode")
    if (mode === "real" && !realConfigured()) throw new Error("Real payouts need RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET and RAZORPAYX_ACCOUNT_NUMBER on the server")
    await Setting.updateOne({ key: "payoutMode" }, { value: mode }, { upsert: true })
}

const simulator = {
    async pay(earning) {
        return { status: "paid", txnId: `SIM-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`, note: "Simulated payout, no real money moved" }
    }
}

// RazorpayX adapter: contact -> UPI fund account -> payout. Needs a RazorpayX current account.
// Written against https://razorpay.com/docs/x/payouts/ and NOT yet tested with live keys.
const razorpayx = {
    async call(path, body) {
        const auth = Buffer.from(`${process.env.RAZORPAYX_KEY_ID}:${process.env.RAZORPAYX_KEY_SECRET}`).toString("base64")
        const r = await fetch(`https://api.razorpay.com/v1/${path}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(body) })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error?.description || `RazorpayX ${r.status}`)
        return j
    },
    async pay(earning, user) {
        const contact = await this.call("contacts", { name: user.fullname, email: user.email, contact: user.mobile, type: earning.kind === "owner" ? "vendor" : "employee", reference_id: String(user._id) })
        const fa = await this.call("fund_accounts", { contact_id: contact.id, account_type: "vpa", vpa: { address: user.upiId } })
        const p = await this.call("payouts", { account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, fund_account_id: fa.id, amount: Math.round(earning.amount * 100), currency: "INR", mode: "UPI", purpose: "payout", queue_if_low_balance: true, reference_id: String(earning._id), narration: "Khana Khajana" })
        const done = p.status === "processed"
        return { status: done ? "paid" : "processing", txnId: p.id, note: `RazorpayX ${p.status}` }
    }
}

// Pay one earning through the active adapter. Safe to call repeatedly (only acts on unpaid/failed entries).
export const payoutEarning = async (earningId) => {
    try {
        const e = await Earning.findById(earningId)
        if (!e || !["unpaid", "failed"].includes(e.payoutStatus)) return
        const mode = await getMode()
        if (mode === "manual") return
        const userId = e.kind === "owner" ? e.owner : e.rider
        const user = await User.findById(userId).select("fullname email mobile upiId")
        if (!user?.upiId) {
            e.payoutNote = "Add your UPI ID to receive this payout"
            await e.save()
            return
        }
        // claim the entry first so concurrent calls cannot pay twice
        const claimed = await Earning.findOneAndUpdate({ _id: e._id, payoutStatus: { $in: ["unpaid", "failed"] } }, { payoutStatus: "processing", payoutMode: mode }, { new: true })
        if (!claimed) return
        try {
            const res = await (mode === "real" ? razorpayx : simulator).pay(claimed, user)
            claimed.payoutStatus = res.status
            claimed.payoutTxnId = res.txnId
            claimed.payoutNote = res.note
            claimed.paidAt = res.status === "paid" ? new Date() : null
            await claimed.save()
        } catch (err) {
            claimed.payoutStatus = "failed"
            claimed.payoutNote = err.message
            await claimed.save()
        }
    } catch (err) {
        console.error("payout error:", err.message)
    }
}

// Pay everything pending for one person (used right after they add a UPI ID).
export const payoutPendingFor = async (userId) => {
    const list = await Earning.find({ $or: [{ rider: userId }, { owner: userId }], payoutStatus: { $in: ["unpaid", "failed"] } }).select("_id")
    for (const e of list) await payoutEarning(e._id)
}

// ---- COD deposits (money coming IN from riders). Same three modes as payouts. ----
export const pendingDeposit = async (riderId) => {
    const rows = await CodDeposit.aggregate([{ $match: { rider: new (await import("mongoose")).default.Types.ObjectId(String(riderId)), status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }])
    const total = rows[0]?.total || 0
    return { pending: total, count: rows[0]?.count || 0, limit: COD_DEPOSIT_LIMIT, blocked: total >= COD_DEPOSIT_LIMIT }
}

export const isCodBlocked = async (riderId) => (await pendingDeposit(riderId)).blocked

// Rider starts a deposit. simulation: instantly received (SIM txn). manual: admin marks received. real: Razorpay order, verified afterwards.
export const startDeposit = async (riderId) => {
    const mode = await getMode()
    const pend = await pendingDeposit(riderId)
    if (pend.pending <= 0) return { mode, message: "Nothing to deposit" }
    if (mode === "manual") return { mode, manual: true, amount: pend.pending, message: "Send this amount to the Khana Khajana admin by UPI. They will mark it received." }
    if (mode === "simulation") {
        const txnId = `SIM-DEP-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`
        await CodDeposit.updateMany({ rider: riderId, status: "pending" }, { status: "received", receivedVia: "simulation", txnId, receivedAt: new Date() })
        return { mode, received: pend.pending, txnId, message: "Deposit received (simulated, no real money moved)" }
    }
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    const o = await rz.orders.create({ amount: Math.round(pend.pending * 100), currency: "INR", receipt: `dep_${String(riderId).slice(-6)}_${Date.now()}` })
    await CodDeposit.updateMany({ rider: riderId, status: "pending" }, { razorpayOrderId: o.id })
    return { mode, razorOrder: o, amount: pend.pending }
}

export const verifyDeposit = async (riderId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")
    const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature || ""))
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("payment signature mismatch")
    const r = await CodDeposit.updateMany({ rider: riderId, status: "pending", razorpayOrderId: razorpay_order_id }, { status: "received", receivedVia: "razorpay", txnId: razorpay_payment_id, receivedAt: new Date() })
    return r.modifiedCount
}
