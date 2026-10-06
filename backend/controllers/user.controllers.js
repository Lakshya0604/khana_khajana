import { payoutPendingFor, getMode, setMode, realConfigured } from "../utils/payout.js"
import User from "../models/user.model.js"
import Earning from "../models/earning.model.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(400).json({ message: "userId is not found" })
        }
        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `get current user error ${error}` })
    }
}

export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body
        const user = await User.findByIdAndUpdate(req.userId, {
            location: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            locationUpdatedAt: new Date()
        }, { new: true })
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `update location user error ${error}` })
    }
}


export const saveUpiId = async (req, res) => {
    try {
        const upiId = String(req.body.upiId || "").trim()
        if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
            return res.status(400).json({ message: "Enter a valid UPI ID like name@bank" })
        }
        const user = await User.findOneAndUpdate({ _id: req.userId, role: { $in: ["deliveryBoy", "owner"] } }, { upiId }, { new: true })
        if (!user) return res.status(403).json({ message: "only restaurant owners and delivery partners can add a payout UPI ID" })
        payoutPendingFor(req.userId).catch(() => { })
        return res.status(200).json({ upiId: user.upiId })
    } catch (error) {
        return res.status(500).json({ message: `save upi error ${error}` })
    }
}

export const getMyEarnings = async (req, res) => {
    try {
        const me = await User.findById(req.userId).select("role upiId")
        if (!me || !["deliveryBoy", "owner"].includes(me.role)) return res.status(403).json({ message: "only restaurant owners and delivery partners have earnings" })
        const list = await Earning.find(me.role === "owner" ? { owner: req.userId, kind: "owner" } : { rider: req.userId, kind: { $ne: "owner" } }).sort({ deliveredAt: -1 }).limit(200).lean()
        const sod = new Date(); sod.setHours(0, 0, 0, 0)
        const sum = (a) => a.reduce((t, e) => t + e.amount, 0)
        return res.status(200).json({
            upiId: me.upiId || null,
            role: me.role,
            total: sum(list),
            today: sum(list.filter(e => new Date(e.deliveredAt) >= sod)),
            unpaid: sum(list.filter(e => e.payoutStatus !== "paid")),
            deliveries: list.map(e => ({ id: e._id, shopName: e.shopName, amount: e.amount, payoutStatus: e.payoutStatus, payoutMode: e.payoutMode, payoutTxnId: e.payoutTxnId, payoutNote: e.payoutNote, paidAt: e.paidAt, deliveredAt: e.deliveredAt }))
        })
    } catch (error) {
        return res.status(500).json({ message: `get earnings error ${error}` })
    }
}

const isAdmin = async (userId) => {
    const admins = String(process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(x => x.trim()).filter(Boolean)
    if (!admins.length) return false
    const u = await User.findById(userId).select("email")
    return !!u && admins.includes(String(u.email).toLowerCase())
}

// Platform owner view: who is owed what (unpaid earnings grouped per person)
export const adminPayouts = async (req, res) => {
    try {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ message: "not allowed" })
        const rows = await Earning.aggregate([
            { $match: { payoutStatus: { $in: ["unpaid", "failed"] } } },
            { $group: { _id: { u: { $ifNull: ["$owner", "$rider"] }, kind: "$kind" }, owed: { $sum: "$amount" }, count: { $sum: 1 } } }
        ])
        const users = await User.find({ _id: { $in: rows.map(r => r._id.u) } }).select("fullname email mobile upiId").lean()
        const byId = Object.fromEntries(users.map(u => [String(u._id), u]))
        const list = rows.map(r => {
            const u = byId[String(r._id.u)] || {}
            return { userId: r._id.u, kind: r._id.kind, name: u.fullname, email: u.email, mobile: u.mobile, upiId: u.upiId || null, owed: r.owed, count: r.count }
        }).sort((a, b) => b.owed - a.owed)
        return res.status(200).json({ totalOwed: list.reduce((t, r) => t + r.owed, 0), list, mode: await getMode(), realConfigured: realConfigured() })
    } catch (error) {
        return res.status(500).json({ message: `admin payouts error ${error}` })
    }
}

export const adminMarkPaid = async (req, res) => {
    try {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ message: "not allowed" })
        const { userId, kind } = req.body
        const filter = { payoutStatus: { $in: ["unpaid", "failed"] }, kind: kind === "owner" ? "owner" : "rider", [kind === "owner" ? "owner" : "rider"]: userId }
        const r = await Earning.updateMany(filter, { payoutStatus: "paid", payoutMode: "manual", payoutTxnId: `MANUAL-${Date.now().toString(36).toUpperCase()}`, payoutNote: "Paid by UPI by the admin", paidAt: new Date() })
        return res.status(200).json({ marked: r.modifiedCount })
    } catch (error) {
        return res.status(500).json({ message: `mark paid error ${error}` })
    }
}

export const amIAdmin = async (req, res) => res.status(200).json({ admin: await isAdmin(req.userId) })

export const adminSetMode = async (req, res) => {
    try {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ message: "not allowed" })
        await setMode(req.body.mode)
        return res.status(200).json({ mode: await getMode() })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}
