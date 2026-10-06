import mongoose from "mongoose";

// One credit per delivered shop-order. Tracked in-app only; payout to the rider is manual for now.
const earningSchema = new mongoose.Schema({
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    shopOrderId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    shopName: String,
    amount: { type: Number, required: true },
    payoutStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    deliveredAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model("Earning", earningSchema)
