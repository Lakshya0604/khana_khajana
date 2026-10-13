import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
const isAuth = async (req, res, next) => {
    try {
        const bearer = (req.headers.authorization || "").startsWith("Bearer ") ? req.headers.authorization.slice(7) : null
        const token = req.cookies.token || bearer
        if (!token) {
            return res.status(401).json({ message: "token not found" })
        }
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!decodeToken) {
            return res.status(401).json({ message: "token not verified" })
        }

        req.userId = decodeToken.userId
        const u = await User.findById(req.userId).select("blocked").lean()
        if (u?.blocked) return res.status(403).json({ message: "This account has been blocked. Contact Khana Khajana support." })
        next()

    } catch (error) {
        return res.status(401).json({ message: "invalid or expired token", error: error.message })
    }
}

export default isAuth
