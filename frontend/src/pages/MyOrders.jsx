import React, { useEffect } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from 'react-router-dom';
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
import { setMyOrders, updateRealtimeOrderStatus, updateAssignedDeliveryBoy } from '../redux/userSlice';
const MyOrders = () => {
    const { userData, myOrders, socket } = useSelector(state => state.user)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        if (!socket) return
        const handleNewOrder = (data) => {
            console.log('socket newOrder received:', data)
            if (data.shopOrders?.owner._id == userData._id) {
                dispatch(setMyOrders([data, ...myOrders]))
            }
        }

        const handleUpdateStatus = ({ orderId, shopId, status, userId }) => {
            console.log('socket update-status received:', orderId, shopId, status, userId)
            if (userId == userData._id) {
                dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }))
            }
        }

        socket.on('newOrder', handleNewOrder)
        socket.on('update-status', handleUpdateStatus)
        socket.on('assignmentAccepted', (data) => {
            console.log('socket assignmentAccepted received:', data)
            const { orderId, shopId, assignedDeliveryBoy } = data
            if (!orderId || !shopId) return
            dispatch(updateAssignedDeliveryBoy({ orderId, shopId, assignedDeliveryBoy }))
        })

        return () => {
            socket.off('newOrder', handleNewOrder)
            socket.off('update-status', handleUpdateStatus)
            socket.off('assignmentAccepted')
        }
    }, [socket, userData, myOrders, dispatch])
    return (

        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-200 p-4'>
                <div className='flex items-center gap-5 mb-6'>
                    <div className='z-[10px] cursor-pointer' onClick={() => navigate("/")}><IoArrowBack size={25} className='text-[#ff4d2d]' /></div>
                    <h1 className='text-3xl font-bold text-start'>My Orders </h1>
                </div>
                <div className='space-y-6'>
                    {!myOrders || myOrders.length === 0 ? (
                        <div className='rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500'>
                            No orders yet.
                        </div>
                    ) : (
                        myOrders.map((order, index) => (
                            userData?.role === "user" ? (<UserOrderCard data={order} key={index} />) :
                                userData?.role === "owner" ? (<OwnerOrderCard data={order} key={index} />) : null
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default MyOrders