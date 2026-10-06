import mongoose from "mongoose"

// Cash-on-delivery: the rider collects food + delivery fee, keeps the delivery fee, and owes the food amount to the platform.
const codDepositSchema = new mongoose.Schema({
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    shopOrderId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    shopName: String,
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "received"], default: "pending" },
    receivedVia: { type: String, default: null },
    txnId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    receivedAt: { type: Date, default: null },
    collectedAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model("CodDeposit", codDepositSchema)
