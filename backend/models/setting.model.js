import mongoose from "mongoose"
const settingSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: String }, { timestamps: true })
export default mongoose.model("Setting", settingSchema)
