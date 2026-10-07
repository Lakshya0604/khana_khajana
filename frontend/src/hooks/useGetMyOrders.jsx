import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'
import { subscribeOrderResync } from '../utils/orderResync'

function useGetMyOrders() {
    const dispatch = useDispatch()
    const userId = useSelector(state => state.user.userData?._id)
    const socket = useSelector(state => state.user.socket)
    useEffect(() => {
        if (!userId) return
        let active = true
        let requestId = 0
        const fetchOrders = async () => {
            const id = ++requestId
            try {
                const result = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
                if (active && id === requestId) dispatch(setMyOrders(result.data))
                console.log(result.data)

            } catch (error) {

                console.log(error)
                // Keep the last known state on a temporary network failure.
            }
        }
        if (!socket?.connected) fetchOrders()
        const unsubscribe = subscribeOrderResync(socket, fetchOrders)
        return () => { active = false; unsubscribe() }
    }, [userId, socket])
}

export default useGetMyOrders