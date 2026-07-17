import mongoose from "mongoose";
import dotenv from "dotenv";
const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Connected to database successfully");

    } catch (error) {
        console.log("Error in connecting to database", error.message);
    }
}
export default connectDb;