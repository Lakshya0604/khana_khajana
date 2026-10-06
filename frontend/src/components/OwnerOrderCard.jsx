import React from 'react'
import { FaPhone } from "react-icons/fa6";
import axios from 'axios'
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus, setMyOrders } from '../redux/userSlice';
import { useState, useEffect } from 'react';
const OwnerOrderCard = ({ data }) => {
    const [availableBoys, setAvailableBoys] = useState(null)
    const dispatch = useDispatch()
    const handleUpdateStatus = async (orderId, shopId, status) => {
        try {
            const result = await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${shopId}`, { status }, { withCredentials: true })
            dispatch(updateOrderStatus({ orderId, shopId, status }))
            setAvailableBoys(result.data.availableBoys)

        } catch (error) {
            console.log(error)
        }
    }


    const [pickupMsg, setPickupMsg] = useState("")
    const status = data.shopOrders.status
    const hasRider = !!data.shopOrders.assignedDeliveryBoy
    const confirmPickup = async () => {
        setPickupMsg("")
        try {
            await axios.post(`${serverUrl}/api/order/confirm-pickup`, { orderId: data._id, shopOrderId: data.shopOrders._id }, { withCredentials: true })
            dispatch(updateOrderStatus({ orderId: data._id, shopId: data.shopOrders.shop._id, status: "out of delivery" }))
        } catch (error) {
            setPickupMsg(error.response?.data?.message || "Could not confirm pickup")
        }
    }
    // while waiting for a rider, check for acceptance every 10s
    useEffect(() => {
        if (status !== "ready for pickup" || hasRider) return
        const t = setInterval(async () => {
            try {
                const r = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
                dispatch(setMyOrders(r.data))
            } catch (e) { }
        }, 10000)
        return () => clearInterval(t)
    }, [status, hasRider])

    return (

        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            <div>
                <h2 className='text-lg font-semibold text-gray-800'>{data.user.fullname}</h2>
                <p className='text-sm text-gray-500'>{data.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'><FaPhone /><span>{data.user.mobile}</span></p>
                {data.paymentMethod == "online" ? <p className='text-sm text-gray-600 mt-1'>Payment: {data.payment ? "true" : "false"}</p> : <p className='text-sm text-gray-600 mt-1'>Payment Method: {data.paymentMethod}</p>}
            </div>

            <div className='flex items-start flex-col gap-2 text-gray-600 text-sm'>
                <p>{data?.deliveryAddress?.text}</p>
                <p className='text-xs text-gray-500 '>Lat :{data?.deliveryAddress?.latitude}, Lon :{data?.deliveryAddress?.longitude}</p>
            </div>

            <div className='flex space-x-4 overflow-x-auto pb-2'>
                {data.shopOrders.shopOrderItems.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                        <img src={item.item.image} alt="" className='w-full h-24 object-cover rounded' />
                        <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-600 gap-2'>QTY: {item.quantity} x ₹{item.price}</p>
                    </div>
                ))}
            </div>

            <div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
                <span className='text-sm'>Status :<span className='font-semibold capitalize text-[#ff4d2d]'>{data.shopOrders.status}</span></span>

                {status !== "out of delivery" && status !== "delivered" ? <select
                    value={data.shopOrders.status}
                    className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]' onChange={(e) => handleUpdateStatus(data._id, data.shopOrders.shop._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready for pickup">Ready for pickup</option>
                </select> : <span className='text-xs text-gray-500'>Locked</span>}
            </div>
            {status === "ready for pickup" && hasRider && <div className='p-3 border border-green-200 rounded-lg bg-green-50 text-sm'>
                <p className='text-green-800 mb-2'>{data.shopOrders.assignedDeliveryBoy.fullname} accepted this order. When they collect the food, confirm below.</p>
                <button className='bg-green-600 text-white px-4 py-2 rounded-lg' onClick={confirmPickup}>Rider picked up the food</button>
                {pickupMsg && <p className='text-red-500 mt-1'>{pickupMsg}</p>}
            </div>}
            {(status == "out of delivery" || status == "ready for pickup" || status == "delivered") &&
                <div className='mt-3 p-2 border rounded-lg text-sm bg-orange-50'>
                    {data.shopOrders.assignedDeliveryBoy ? <p>Assigned Delivery Boy:</p> : <p>Available Delivery Boys</p>}
                    {data.shopOrders.assignedDeliveryBoy ? (
                        <div className='text-gray-500'>
                            {data.shopOrders.assignedDeliveryBoy.fullname} is your Delivery Boy. Contact Number: {data.shopOrders.assignedDeliveryBoy.mobile}
                        </div>
                    ) : availableBoys ? (
                        availableBoys.length > 0 ? (
                            availableBoys.map((b, index) => (
                                <div key={index} className='text-gray-500'>{b.fullname} - {b.mobile}</div>
                            ))
                        ) : <div>Waiting for delivery boys to accept</div>
                    ) : <div>Waiting for delivery boys to accept</div>}
                </div>}
            <div className='text-right font-bold text-gray-800 text-sm'>
                Total : ₹{data.shopOrders.subTotal}
            </div>
        </div>
    )
}

export default OwnerOrderCard