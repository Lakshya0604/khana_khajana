import express from "express"
import { getCurrentUser, updateUserLocation, saveUpiId, getMyEarnings, adminPayouts, adminMarkPaid, amIAdmin } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post("/update-location", isAuth, updateUserLocation)
userRouter.post("/upi", isAuth, saveUpiId)
userRouter.get("/earnings", isAuth, getMyEarnings)
userRouter.get("/admin/payouts", isAuth, adminPayouts)
userRouter.post("/admin/mark-paid", isAuth, adminMarkPaid)
userRouter.get("/admin/me", isAuth, amIAdmin)

export default userRouter