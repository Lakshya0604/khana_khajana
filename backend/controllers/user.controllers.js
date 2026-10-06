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
        const user = await User.findOneAndUpdate({ _id: req.userId, role: "deliveryBoy" }, { upiId }, { new: true })
        if (!user) return res.status(403).json({ message: "only delivery partners can add a payout UPI ID" })
        return res.status(200).json({ upiId: user.upiId })
    } catch (error) {
        return res.status(500).json({ message: `save upi error ${error}` })
    }
}

export const getMyEarnings = async (req, res) => {
    try {
        const me = await User.findById(req.userId).select("role upiId")
        if (!me || me.role !== "deliveryBoy") return res.status(403).json({ message: "only delivery partners have earnings" })
        const list = await Earning.find({ rider: req.userId }).sort({ deliveredAt: -1 }).limit(200).lean()
        const sod = new Date(); sod.setHours(0, 0, 0, 0)
        const sum = (a) => a.reduce((t, e) => t + e.amount, 0)
        return res.status(200).json({
            upiId: me.upiId || null,
            total: sum(list),
            today: sum(list.filter(e => new Date(e.deliveredAt) >= sod)),
            unpaid: sum(list.filter(e => e.payoutStatus === "unpaid")),
            deliveries: list.map(e => ({ id: e._id, shopName: e.shopName, amount: e.amount, payoutStatus: e.payoutStatus, deliveredAt: e.deliveredAt }))
        })
    } catch (error) {
        return res.status(500).json({ message: `get earnings error ${error}` })
    }
}
