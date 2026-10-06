import express from "express"
import { getCurrentUser, updateUserLocation, saveUpiId, getMyEarnings } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post("/update-location", isAuth, updateUserLocation)
userRouter.post("/upi", isAuth, saveUpiId)
userRouter.get("/earnings", isAuth, getMyEarnings)

export default userRouter