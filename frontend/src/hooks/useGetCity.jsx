import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setCity, setCurrentAddress, setState } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

function useGetCity() {
    const dispatch = useDispatch()
    const apikey = import.meta.env.VITE_GEOAPIKEY

    useEffect(() => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                dispatch(setLocation({ lat: latitude, lon: longitude }))

                const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apikey}`)
                const geoData = result?.data?.results?.[0] || {}

                dispatch(setCity(geoData.city || geoData.city_name || geoData.county || null))
                dispatch(setState(geoData.state || null))
                dispatch(setCurrentAddress(geoData.address_line1 || geoData.address_line2 || null))
                dispatch(setAddress(geoData.address_line2 || null))
            } catch (error) {
                console.log(error)
            }
        }, (error) => {
            console.error('Geolocation getCurrentPosition error:', error)
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
    }, [apikey, dispatch])
}

export default useGetCity