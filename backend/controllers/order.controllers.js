import Shop from "../models/shop.model.js"
import Order from "../models/order.model.js"
import User from "../models/user.model.js"
import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Item from "../models/item.model.js"
import Earning from "../models/earning.model.js"
import { payoutEarning } from "../utils/payout.js"
import { DELIVERY_FEE, MAX_RIDER_KM, LOCATION_FRESH_MS, distanceKm, riderLocationOk } from "../utils/delivery.js"
import { sendDeliveryOtpMail, sendNewOrderMail } from "../utils/mail.js"

// Emails each shop about its part of an order. Listing shops route to the platform inbox (MAIL_FROM), never the business.
const notifyShops = async (order) => {
    const customer = order.user
    for (const shopOrder of order.shopOrders) {
        try {
            const shopId = shopOrder.shop?._id || shopOrder.shop
            const shop = await Shop.findById(shopId).populate("owner", "email")
            if (!shop) continue
            const to = shop.isListing ? process.env.MAIL_FROM : shop.owner?.email
            if (!to || to.endsWith(".invalid")) continue
            await sendNewOrderMail({ to, shopName: shop.name, isListing: shop.isListing, order, shopOrder, customer })
        } catch (e) {
            console.log("new order mail failed:", e.message)
        }
    }
}
import crypto from "crypto"
import Razorpay from "razorpay"
import dotenv, { parse } from "dotenv"
dotenv.config()


let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress } = req.body
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "cart is empty" })
        }
        if (!deliveryAddress?.text || !deliveryAddress?.latitude || !deliveryAddress?.longitude) {
            return res.status(400).json({ message: "send complete delivery address" })
        }

        const groupItemsByShop = {}
        cartItems.forEach(item => {
            const shopId = item.shop
            if (!shopId) {
                throw new Error("cart item missing shop id")
            }
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = []
        for (const shopId of Object.keys(groupItemsByShop)) {
            const shop = await Shop.findById(shopId).populate("owner")
            if (!shop) {
                return res.status(400).json({ message: `shop not found: ${shopId}` })
            }
            const rawItems = groupItemsByShop[shopId]
            // Prices and names always come from the database, never from the client
            const items = []
            for (const ri of rawItems) {
                const dbItem = await Item.findById(ri._id || ri.id)
                const qty = Math.floor(Number(ri.quantity))
                if (!dbItem || String(dbItem.shop) !== String(shop._id) || !(qty >= 1)) {
                    return res.status(400).json({ message: "cart has an invalid item, please refresh your cart" })
                }
                items.push({ _id: dbItem._id, price: dbItem.price, quantity: qty, name: dbItem.name })
            }
            const subTotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            shopOrders.push({
                shop: shop._id,
                owner: shop.owner._id,
                subTotal,
                shopOrderItems: items.map((i) => ({
                    item: i._id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            })
        }

        // Flat Rs 40 delivery charge for every restaurant delivery in the order
        const deliveryFee = DELIVERY_FEE * shopOrders.length
        const totalAmount = shopOrders.reduce((t, so) => t + so.subTotal, 0) + deliveryFee

        if (paymentMethod === "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt: `order_rcptid_${Date.now()}`,
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                deliveryFee,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })
            return res.status(201).json({
                razorOrder,
                orderId: newOrder._id,
            })

        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            deliveryFee,
            shopOrders
        })
        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name socketId")
        await newOrder.populate("user", "fullname name email mobile")

        const io = req.app.get('io')
        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        deliveryAddress: newOrder.deliveryAddress,
                        payment: newOrder.payment

                    })
                }
            })
        }

        notifyShops(newOrder).catch(() => { })
        return res.status(201).json(newOrder)

    } catch (error) {
        console.error("placeOrder error:", error)
        return res.status(500).json({ message: "place order error", error: error.message })
    }
}

// Marks an online order as paid exactly once and fires the shop notifications.
const finalizePaid = async (order, paymentId, io) => {
    if (order.payment) return order
    order.payment = true
    order.razorpayPaymentId = paymentId
    await order.save()
    await order.populate("shopOrders.shop", "name socketId")
    await order.populate("user", "fullname name email mobile")
    await order.populate("shopOrders.shopOrderItems.item", "name image price")
    if (io) {
        order.shopOrders.forEach(shopOrder => {
            const ownerSocketId = shopOrder.owner?.socketId
            if (ownerSocketId) {
                io.to(ownerSocketId).emit('newOrder', {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: shopOrder,
                    createdAt: order.createdAt,
                    deliveryAddress: order.deliveryAddress,
                    payment: order.payment
                })
            }
        })
    }
    notifyShops(order).catch(() => { })
    return order
}

export const getRazorpayKey = (req, res) => {
    // Key ID is public by design; the secret never leaves the server
    return res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID || null })
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
            return res.status(400).json({ message: "payment details missing" })
        }
        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")
        const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature))
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return res.status(400).json({ message: "payment signature mismatch" })
        }
        const order = await Order.findById(orderId)
        if (!order || String(order.user) !== String(req.userId) || order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: "order not found" })
        }
        const payment = await instance.payments.fetch(razorpay_payment_id)
        if (!payment || payment.status !== "captured" || payment.order_id !== razorpay_order_id || Number(payment.amount) !== Math.round(order.totalAmount * 100)) {
            return res.status(400).json({ message: "payment not successful" })
        }
        const done = await finalizePaid(order, razorpay_payment_id, req.app.get('io'))
        return res.status(200).json(done)
    } catch (error) {
        return res.status(500).json({ message: "verify payment error", error: error.message })
    }
}

// Razorpay server-to-server webhook: covers the case where the customer closes the tab right after paying
export const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET
        if (!secret) return res.status(503).json({ message: "webhook not configured" })
        const sig = String(req.headers["x-razorpay-signature"] || "")
        const expected = crypto.createHmac("sha256", secret).update(req.rawBody || "").digest("hex")
        const a = Buffer.from(expected), b = Buffer.from(sig)
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return res.status(400).json({ message: "invalid signature" })
        }
        const evt = req.body
        if (evt?.event === "payment.captured") {
            const pay = evt.payload?.payment?.entity
            const order = pay?.order_id ? await Order.findOne({ razorpayOrderId: pay.order_id }) : null
            if (order && Number(pay.amount) === Math.round(order.totalAmount * 100)) {
                await finalizePaid(order, pay.id, req.app.get('io'))
            }
        }
        return res.status(200).json({ ok: true })
    } catch (error) {
        console.error("razorpay webhook error", error.message)
        return res.status(500).json({ message: "webhook error" })
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        if (user.role === "user") {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")

            return res.status(200).json(orders)
        } else if (user.role === "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullname mobile ")

            const filteredOrders = orders.map((order => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: (() => {
                    const so = order.shopOrders.find(o => o.owner._id.toString() == req.userId.toString())
                    if (!so) return so
                    const plain = so.toObject()
                    delete plain.deliveryOtp
                    delete plain.otpExpires
                    return plain
                })(),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress,
                payment: order.payment

            }))).filter(order => order.shopOrders != null)
            return res.status(200).json(filteredOrders)
        }

        return res.status(200).json([])
    } catch (error) {
        return res.status(500).json({ message: "get user order error", error: error.message })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status } = req.body
        const order = await Order.findById(orderId)
        if (!order) {
            console.error('updateOrderStatus: order not found', orderId)
            return res.status(404).json({ message: 'order not found' })
        }
        const shopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId))
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" })
        }
        if (String(shopOrder.owner) !== String(req.userId)) {
            return res.status(403).json({ message: "only the shop owner can update this order" })
        }
        if (!["pending", "preparing", "ready for pickup"].includes(status)) {
            return res.status(400).json({ message: "Use 'Rider picked up' to send the order out for delivery" })
        }
        if (shopOrder.status === "out of delivery" || shopOrder.status === "delivered") {
            return res.status(400).json({ message: "This order is already out for delivery" })
        }
        if (status === "ready for pickup" && String(order.paymentMethod) === "online" && !order.payment) {
            return res.status(400).json({ message: "Online payment not completed yet" })
        }
        shopOrder.status = status
        let deliveryBoysPayload = []


        if (status == "ready for pickup" && !shopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                locationUpdatedAt: { $gte: new Date(Date.now() - LOCATION_FRESH_MS) },
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                        $maxDistance: MAX_RIDER_KM * 1000
                    }
                }
            })

            const nearByIds = nearByDeliveryBoys.map(b => b._id)
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $nin: ["brodcasted", "completed"] }
            }).distinct("assignedTo")
            const busyIdSet = new Set(busyIds.map(id => String(id)))
            const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)))
            const candidates = availableBoys.map(b => b._id)

            if (candidates.length == 0) {
                await order.save()
                return res.json({ message: "order status updated but there is no delivery Boy available" })
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: shopOrder.shop,
                shopOrderId: shopOrder._id,
                brodcastedTo: candidates,
                status: "brodcasted"
            })
            shopOrder.assignment = deliveryAssignment._id
            deliveryBoysPayload = availableBoys.map(b => ({
                id: b._id,
                fullname: b.fullname,
                longitude: b.location.coordinates[0],
                latitude: b.location.coordinates[1],
                mobile: b.mobile
            }))
            await deliveryAssignment.populate('order')
            await deliveryAssignment.populate('shop')

            const io = req.app.get('io')
            if (io) {
                availableBoys.forEach(boy => {
                    const boySocketId = boy.socketId

                    if (boySocketId) {
                        io.to(boySocketId).emit('newAssignment', {
                            sentTo: boy._id,
                            assignmentId: deliveryAssignment._id,
                            orderId: deliveryAssignment.order._id,
                            shopName: deliveryAssignment.shop.name,
                            deliveryAddress: deliveryAssignment.order.deliveryAddress,
                            items: deliveryAssignment.order.shopOrders.find(so => so._id.equals(deliveryAssignment.shopOrderId)).shopOrderItems || [],
                            subTotal: deliveryAssignment.order.shopOrders.find(so => so._id.equals(deliveryAssignment.shopOrderId))?.subTotal
                        })

                    }

                })
            }
        }
        await order.save()

        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.assignedDeliveryBoy", "fullname email mobile")
        await order.populate("user", "socketId")
        const updatedShopOrder = order.shopOrders.find(o => {
            const shopField = o.shop && o.shop._id ? o.shop._id : o.shop
            return String(shopField) === String(shopId)
        })

        if (!updatedShopOrder) {
            console.error('updateOrderStatus: updatedShopOrder not found after save', 'orderId=', order._id.toString(), 'shopId=', shopId)
            return res.status(500).json({ message: 'updated shop order not found after save' })
        }

        const io = req.app.get('io')
        if (io) {
            const userSocketId = order.user.socketId
            console.log('updateOrderStatus: userSocketId=', userSocketId, 'orderId=', order._id.toString(), 'shopId=', shopId, 'status=', updatedShopOrder.status)
            if (userSocketId) {
                io.to(userSocketId).emit('update-status', {
                    orderId: order._id,
                    shopId: shopId,
                    status: updatedShopOrder.status,
                    userId: order.user._id
                })
                console.log('updateOrderStatus: emitted to user socketId')
            } else {
                console.log('updateOrderStatus: userSocketId not found, broadcasting update-status to all clients as fallback')
                io.emit('update-status', {
                    orderId: order._id,
                    shopId: shopId,
                    status: updatedShopOrder.status,
                    userId: order.user._id
                })
            }
        }

        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayload,
            assignment: updatedShopOrder?.assignment?._id || null
        })

    } catch (error) {
        console.error('updateOrderStatus error:', error)
        return res.status(500).json({ message: "order status error", error: error.message })
    }
}

export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const me = await User.findById(deliveryBoyId).select("location locationUpdatedAt")
        if (!riderLocationOk(me)) {
            return res.status(200).json([])
        }
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: deliveryBoyId,
            status: "brodcasted"
        })
            .populate("order")
            .populate("shop")

        const formated = assignments.reduce((result, a) => {
            if (!a.order) {
                console.error('getDeliveryBoyAssignment: assignment has no order', a._id)
                return result
            }
            const shopOrder = a.order.shopOrders?.find(so => so._id?.equals(a.shopOrderId))
            if (!shopOrder) {
                console.error('getDeliveryBoyAssignment: shopOrder not found for assignment', a._id, a.shopOrderId)
                return result
            }
            const dLat = a.order.deliveryAddress?.latitude, dLon = a.order.deliveryAddress?.longitude
            const km = distanceKm(me.location.coordinates[1], me.location.coordinates[0], dLat, dLon)
            if (!(km <= MAX_RIDER_KM)) return result
            result.push({
                distanceKm: Math.round(km * 10) / 10,
                deliveryFee: DELIVERY_FEE,
                assignmentId: a._id,
                orderId: a.order._id,
                shopName: a.shop?.name || "",
                deliveryAddress: a.order.deliveryAddress,
                items: shopOrder.shopOrderItems || [],
                subTotal: shopOrder?.subTotal || 0
            })
            return result
        }, [])
        return res.status(200).json(formated)
    } catch (error) {
        console.error('getDeliveryBoyAssignment error:', error)
        return res.status(500).json({ message: "get assignment error", error: error.message })
    }
}

export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params
        const assignment = await DeliveryAssignment.findById(assignmentId)
        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" })
        }
        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" })
        }
        if (!assignment.brodcastedTo.some(id => String(id) === String(req.userId))) {
            return res.status(403).json({ message: "this order was not offered to you" })
        }
        const rider = await User.findById(req.userId).select("role location locationUpdatedAt")
        if (!rider || rider.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery partners can accept orders" })
        }
        if (!riderLocationOk(rider)) {
            return res.status(400).json({ message: "Turn on your location to accept orders" })
        }
        const ord = await Order.findById(assignment.order).select("deliveryAddress")
        const kmAway = ord ? distanceKm(rider.location.coordinates[1], rider.location.coordinates[0], ord.deliveryAddress.latitude, ord.deliveryAddress.longitude) : Infinity
        if (!(kmAway <= MAX_RIDER_KM)) {
            return res.status(400).json({ message: `This order is more than ${MAX_RIDER_KM} km from you` })
        }
        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        })
        if (alreadyAssigned) {
            return res.status(400).json({ message: "You are already assigned to another order" })
        }
        assignment.assignedTo = req.userId
        assignment.status = 'assigned'
        assignment.acceptedAt = new Date()
        await assignment.save()

        const order = await Order.findById(assignment.order)
        if (!order) {
            return res.status(500).json({ message: "order not found" })
        }
        const shopOrder = order.shopOrders.id(assignment.shopOrderId)
        shopOrder.assignedDeliveryBoy = req.userId
        await order.save()

        try {
            const io = req.app.get('io')
            if (io) {
                await order.populate({ path: 'shopOrders.owner', model: 'User', select: 'socketId fullname mobile' })
                await order.populate('user', 'socketId fullname')

                const shopOrderAfter = order.shopOrders.id(assignment.shopOrderId)
                const ownerId = shopOrderAfter.owner || shopOrderAfter.owner._id
                const owner = await User.findById(ownerId)
                const userSocketId = order.user?.socketId
                const ownerSocketId = owner?.socketId

                const deliveryBoy = await User.findById(req.userId).select('fullname mobile')
                const payload = {
                    orderId: order._id,
                    shopId: shopOrderAfter.shop,
                    assignmentId: assignment._id,
                    assignedDeliveryBoy: {
                        _id: req.userId,
                        fullname: deliveryBoy?.fullname,
                        mobile: deliveryBoy?.mobile
                    }
                }

                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('assignmentAccepted', payload)
                }
                if (userSocketId) {
                    io.to(userSocketId).emit('assignmentAccepted', payload)
                }
                if (!ownerSocketId && !userSocketId) {
                    io.emit('assignmentAccepted', payload)
                }
            }
        } catch (err) {
            console.error('emit assignmentAccepted error', err)
        }
        return res.status(200).json({ message: "order accepted" })
    } catch (error) {
        return res.status(500).json({ message: "accept order error", error: error.message })
    }
}

export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullname email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullname email location mobile" }]
            })
        if (!assignment) {
            return res.json(null)
        }
        if (!assignment.order) {
            await DeliveryAssignment.deleteOne({ _id: assignment._id })
            return res.json(null)
        }
        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))
        if (!shopOrder) {
            return res.status(400).json({ message: "shopOrder not found" })
        }

        let deliveryBoyLocation = { lat: null, lon: null }
        if (assignment.assignedTo.location.coordinates.length == 2) {

            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1]
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0]
        }

        let customerLocation = { lat: null, lon: null }
        if (assignment.order.deliveryAddress) {

            customerLocation.lat = assignment.order.deliveryAddress.latitude
            customerLocation.lon = assignment.order.deliveryAddress.longitude

        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        })


    } catch (error) {
        return res.status(500).json({ message: "current order error", error: error.message })

    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User"
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item"
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        return res.status(200).json(order)

    } catch (error) {
        return res.status(500).json({ message: "get by id order error", error: error.message })

    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order?.shopOrders?.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "Enter valid order/shopOrderId" })
        }
        if (shopOrder.status !== "out of delivery") {
            return res.status(400).json({ message: "The restaurant has not confirmed pickup yet" })
        }
        if (String(shopOrder.assignedDeliveryBoy) !== String(req.userId)) {
            return res.status(403).json({ message: "only the assigned delivery partner can do this" })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        shopOrder.deliveryOtp = otp
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
        await order.save()
        let emailed = true
        try {
            await sendDeliveryOtpMail(order.user, otp)
        } catch (mailError) {
            emailed = false
            console.log("delivery otp mail failed:", mailError.message)
        }
        return res.status(200).json({ message: emailed ? `OTP sent to ${order?.user?.fullname} by email and shown in their app` : `Email could not be sent. OTP is shown in ${order?.user?.fullname}'s app under My Orders` })
    } catch (error) {
        return res.status(500).json({ message: "delivery otp error", error: error.message })

    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order?.shopOrders?.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "Enter valid order/shopOrderId" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" })
        }
        if (shopOrder.status !== "out of delivery") {
            return res.status(400).json({ message: "Order is not out for delivery" })
        }
        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        shopOrder.deliveryOtp = null
        shopOrder.otpExpires = null
        await order.save()
        if (shopOrder.assignedDeliveryBoy) {
            try {
                const shopDoc = await Shop.findById(shopOrder.shop).select("name")
                await Earning.updateOne(
                    { shopOrderId: shopOrder._id, kind: "rider" },
                    { $setOnInsert: { kind: "rider", rider: shopOrder.assignedDeliveryBoy, order: order._id, shopOrderId: shopOrder._id, shopName: shopDoc?.name || "", amount: DELIVERY_FEE, deliveredAt: new Date() } },
                    { upsert: true }
                )
                const re = await Earning.findOne({ shopOrderId: shopOrder._id, kind: "rider" }).select("_id")
                if (re) await payoutEarning(re._id)
            } catch (e) { console.error("earning credit error", e.message) }
        }
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        try {
            const io = req.app.get('io')
            if (io) {
                const shopOrderAfter = order.shopOrders.id(shopOrderId)
                await order.populate({ path: 'shopOrders.owner', model: 'User', select: 'socketId fullname mobile' })
                await order.populate('user', 'socketId fullname')

                const ownerId = shopOrderAfter.owner?._id || shopOrderAfter.owner
                const owner = ownerId ? await User.findById(ownerId).select('socketId') : null
                const userSocketId = order.user?.socketId
                const ownerSocketId = owner?.socketId
                const payload = {
                    orderId: order._id,
                    shopId: shopOrderAfter.shop,
                    status: shopOrderAfter.status,
                    userId: order.user._id
                }
                if (userSocketId) {
                    io.to(userSocketId).emit('update-status', payload)
                }
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('update-status', payload)
                }
                if (!userSocketId && !ownerSocketId) {
                    io.emit('update-status', payload)
                }
            }
        } catch (emitErr) {
            console.error('verifyDeliveryOtp emit error', emitErr)
        }

        return res.status(200).json({ message: "Order Delivered Successfully!" })

    }
    catch (error) {
        return res.status(500).json({ message: "Verify delivery otp error", error: error.message })

    }
}

export const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const startsOfDay = new Date()
        startsOfDay.setHours(0, 0, 0, 0)

        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered",
            "shopOrders.deliveredAt": { $gte: startsOfDay }
        }).lean()
        let todaysDeliveries = []
        orders.forEach(orders => {
            orders.shopOrders.forEach(shopOrder => {
                if (shopOrder.assignedDeliveryBoy == deliveryBoyId &&
                    shopOrder.status == "delivered" &&
                    shopOrder.deliveredAt &&
                    shopOrder.deliveredAt >= startsOfDay
                ) {
                    todaysDeliveries.push(shopOrder)
                }
            })
        })
        let stats = {}
        todaysDeliveries.forEach(shopOrder => {
            const hour = new Date(shopOrder.deliveredAt).getHours()
            stats[hour] = (stats[hour] || 0) + 1
        })
        let formattedStats = Object.keys(stats).map(hour => ({
            hour: parseInt(hour),
            count: stats[hour]
        }))
        formattedStats.sort((a, b) => a.hour - b.hour)
        return res.status(200).json(formattedStats)
    } catch (error) {
        return res.status(500).json({ message: "today delivery error", error: error.message })

    }
}

// Owner confirms the assigned rider collected the food. The owner's food share is credited here (escrow style).
export const confirmPickup = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId)
        const shopOrder = order?.shopOrders?.id(shopOrderId)
        if (!order || !shopOrder) return res.status(400).json({ message: "order not found" })
        if (String(shopOrder.owner) !== String(req.userId)) return res.status(403).json({ message: "only the shop owner can confirm pickup" })
        if (!shopOrder.assignedDeliveryBoy) return res.status(400).json({ message: "No delivery partner has accepted this order yet" })
        if (shopOrder.status !== "ready for pickup") {
            if (shopOrder.status === "out of delivery" || shopOrder.status === "delivered") return res.status(200).json({ message: "already confirmed", status: shopOrder.status })
            return res.status(400).json({ message: "Mark the order 'ready for pickup' first" })
        }
        shopOrder.status = "out of delivery"
        await order.save()
        if (order.payment && order.paymentMethod === "online") {
            try {
                const shopDoc = await Shop.findById(shopOrder.shop).select("name isListing")
                if (shopDoc && !shopDoc.isListing) {
                    await Earning.updateOne(
                        { shopOrderId: shopOrder._id, kind: "owner" },
                        { $setOnInsert: { kind: "owner", owner: shopOrder.owner, order: order._id, shopOrderId: shopOrder._id, shopName: shopDoc.name, amount: shopOrder.subTotal, deliveredAt: new Date() } },
                        { upsert: true }
                    )
                    const oe = await Earning.findOne({ shopOrderId: shopOrder._id, kind: "owner" }).select("_id")
                    if (oe) await payoutEarning(oe._id)
                }
            } catch (e) { console.error("owner earning credit error", e.message) }
        }
        const io = req.app.get("io")
        if (io) {
            await order.populate("user", "socketId")
            if (order.user?.socketId) io.to(order.user.socketId).emit("update-status", { orderId: order._id, shopId: shopOrder.shop, userId: order.user._id, status: "out of delivery" })
        }
        return res.status(200).json({ message: "Pickup confirmed", status: "out of delivery" })
    } catch (error) {
        return res.status(500).json({ message: "confirm pickup error", error: error.message })
    }
}
