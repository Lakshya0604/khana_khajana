import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { overview, listOrders, listUsers, listShops, setUserBlocked, setShopHidden } from "../controllers/admin.controllers.js"
const r = express.Router()
r.get("/overview", isAuth, overview)
r.get("/orders", isAuth, listOrders)
r.get("/users", isAuth, listUsers)
r.get("/shops", isAuth, listShops)
r.post("/user-blocked", isAuth, setUserBlocked)
r.post("/shop-hidden", isAuth, setShopHidden)
export default r
