import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'

function useGetMyOrders() {
    const dispatch = useDispatch()
    const userId = useSelector(state => state.user.userData?._id)
    useEffect(() => {
        if (!userId) return
        const fetchOrders = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
                dispatch(setMyOrders(result.data))
                console.log(result.data)

            } catch (error) {

                console.log(error)
            }
        }
        fetchOrders()
    }, [userId])
}

export default useGetMyOrders