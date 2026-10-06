import express from "express"
import { getCurrentUser, updateUserLocation, saveUpiId, getMyEarnings, adminPayouts, adminMarkPaid, amIAdmin, adminSetMode, adminDepositReceived, riderStartDeposit, riderVerifyDeposit } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post("/update-location", isAuth, updateUserLocation)
userRouter.post("/upi", isAuth, saveUpiId)
userRouter.get("/earnings", isAuth, getMyEarnings)
userRouter.get("/admin/payouts", isAuth, adminPayouts)
userRouter.post("/admin/mark-paid", isAuth, adminMarkPaid)
userRouter.post("/admin/payout-mode", isAuth, adminSetMode)
userRouter.post("/admin/deposit-received", isAuth, adminDepositReceived)
userRouter.post("/deposit/start", isAuth, riderStartDeposit)
userRouter.post("/deposit/verify", isAuth, riderVerifyDeposit)
userRouter.get("/admin/me", isAuth, amIAdmin)

export default userRouter