import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setAddress, setLocation } from '../redux/mapSlice'
import { setUserData, setCity, setState, setCurrentAddress } from '../redux/userSlice'

function useUpdateLocation() {
    const dispatch = useDispatch()
    const userData = useSelector(state => state.user.userData)
    const userId = userData?._id
    const apikey = import.meta.env.VITE_GEOAPIKEY

    const fetchAddressByCoords = async (lat, lon) => {
        if (!apikey) return
        try {
            const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apikey}`)
            const geoData = result?.data?.results?.[0] || {}
            dispatch(setCity(geoData.city || geoData.city_name || geoData.county || null))
            dispatch(setState(geoData.state || null))
            dispatch(setCurrentAddress(geoData.address_line1 || geoData.address_line2 || null))
            dispatch(setAddress(geoData.address_line2 || null))
        } catch (error) {
            console.error('Error reverse geocoding location:', error)
        }
    }

    useEffect(() => {
        if (!userId) return
        if (!navigator.geolocation) return

        const updateLocation = async (lat, lon) => {
            try {
                console.log('Updating location to:', lat, lon)
                const result = await axios.post(`${serverUrl}/api/user/update-location`, { lat, lon }, { withCredentials: true })
                if (result?.data) {
                    dispatch(setUserData(result.data))
                }
            } catch (error) {
                console.error('Error updating user location:', error)
            }
        }

        const syncLocation = async (lat, lon) => {
            dispatch(setLocation({ lat, lon }))
            await fetchAddressByCoords(lat, lon)
            updateLocation(lat, lon)
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                syncLocation(lat, lon)
            },
            (error) => {
                console.error('Geolocation initial position error:', error)
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        )

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                console.log('Geolocation updated:', lat, lon)
                syncLocation(lat, lon)
            },
            (error) => {
                console.error('Geolocation watch error:', error)
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [userId, dispatch, apikey])
}

export default useUpdateLocation