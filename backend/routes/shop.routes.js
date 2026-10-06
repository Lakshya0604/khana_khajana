import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import { createAndEditShop, getMyShop, getShopByCity, getShopWhatsapp } from '../controllers/shop.controllers.js'
import { upload } from '../middlewares/multer.js'

const shopRouter = express.Router()

shopRouter.post("/create-edit", isAuth, upload.single("image"), createAndEditShop)
shopRouter.get("/get-my", isAuth, getMyShop)
shopRouter.get("/get-by-city/:city", isAuth, getShopByCity)
shopRouter.get("/whatsapp/:shopId", isAuth, getShopWhatsapp)
export default shopRouter