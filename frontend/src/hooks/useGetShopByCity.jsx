import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity, setUserData } from '../redux/userSlice'

function useGetShopByCity() {
    const dispatch = useDispatch()
    const { city, userData } = useSelector(state => state.user)
    const uid = userData?._id
    useEffect(() => {
        if (!city || !uid) return
        dispatch(setShopsInMyCity(null))
        const fetchShop = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/shop/get-by-city/${city}`, { withCredentials: true })
                dispatch(setShopsInMyCity(result.data))

            } catch (error) {
                console.log(error)
                dispatch(setShopsInMyCity([]))
            }
        }
        fetchShop()
    }, [city, uid])
}

export default useGetShopByCity
