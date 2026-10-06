import mongoose from "mongoose";

// One credit per delivered shop-order. Tracked in-app only; payout to the rider is manual for now.
const earningSchema = new mongoose.Schema({
    kind: { type: String, enum: ["rider", "owner"], default: "rider" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    shopOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    shopName: String,
    amount: { type: Number, required: true },
    payoutStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    deliveredAt: { type: Date, default: Date.now }
}, { timestamps: true })

earningSchema.index({ shopOrderId: 1, kind: 1 }, { unique: true })
const Earning = mongoose.model("Earning", earningSchema)
// drop the old single-field unique index so a rider and an owner credit can share a shopOrderId
Earning.syncIndexes().catch(e => console.log("earning index sync:", e.message))
export default Earning
