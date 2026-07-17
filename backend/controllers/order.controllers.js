import Shop from "../models/shop.model.js"
import Order from "../models/order.model.js"
import User from "../models/user.model.js"
import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import { sendDeliveryOtpMail } from "../utils/mail.js"
import Razorpay from "razorpay"
import dotenv, { parse } from "dotenv"
dotenv.config()


let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
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
            const items = groupItemsByShop[shopId]
            const subTotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            shopOrders.push({
                shop: shop._id,
                owner: shop.owner._id,
                subTotal,
                shopOrderItems: items.map((i) => ({
                    item: i._id || i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            })
        }

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
            shopOrders
        })
        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name socketId")
        await newOrder.populate("user", "name email mobile")

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

        return res.status(201).json(newOrder)

    } catch (error) {
        console.error("placeOrder error:", error)
        return res.status(500).json({ message: "place order error", error: error.message })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body
        const payment = await instance.payments.fetch(razorpay_payment_id)
        if (!payment || payment.status !== "captured") {
            return res.status(400).json({ message: "payment not successful" })
        }
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shop", "name socketId")
        await order.populate("user", "name email mobile")
        await order.populate("shopOrders.shopOrderItems.item", "name image price")

        const io = req.app.get('io')
        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
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
            });
        }
        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: "verify payment error", error: error.message })
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
                shopOrders: order.shopOrders.find(o => o.owner._id.toString() == req.userId.toString()),
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
        shopOrder.status = status
        let deliveryBoysPayload = []


        if (status == "out of delivery" && !shopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                        $maxDistance: 5000
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
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")
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
            result.push({
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
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "Enter valid order/shopOrderId" })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        shopOrder.deliveryOtp = otp
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
        await order.save()
        await sendDeliveryOtpMail(order.user, otp)
        return res.status(200).json({ message: `Otp sent Successfuly to ${order?.user?.fullname}` })
    } catch (error) {
        return res.status(500).json({ message: "delivery otp error", error: error.message })

    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "Enter valid order/shopOrderId" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" })
        }
        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        shopOrder.deliveryOtp = null
        shopOrder.otpExpires = null
        await order.save()
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