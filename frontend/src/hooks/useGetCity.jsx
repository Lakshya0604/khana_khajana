import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setCity, setCityPickerOpen, setCurrentAddress, setState } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

const STORE_KEY = 'kk_city'

export const saveCity = (city, state) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ city, state: state || null })) } catch { /* storage off */ }
}

// Free reverse geocoding: Nominatim (OpenStreetMap). Geoapify is used only as a backup if a key is set.
const reverse = async (lat, lon) => {
    try {
        const r = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'jsonv2', zoom: 12, 'accept-language': 'en' },
            timeout: 8000
        })
        const a = r.data?.address || {}
        const city = a.city || a.town || a.village || a.county || a.state_district || null
        if (city) return { city: city.replace(/ (District|Division)$/i, ''), state: a.state || null, line: r.data?.display_name || null }
    } catch { /* fall through to backup */ }
    const key = import.meta.env.VITE_GEOAPIKEY
    if (key) {
        const r = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${key}`, { timeout: 8000 })
        const g = r?.data?.results?.[0] || {}
        const city = g.city || g.city_name || g.county || null
        if (city) return { city, state: g.state || null, line: g.address_line2 || g.address_line1 || null }
    }
    return null
}

function useGetCity() {
    const dispatch = useDispatch()

    useEffect(() => {
        let cancelled = false

        // 1) A city chosen or detected earlier shows instantly, so the app never waits on GPS.
        let saved = null
        try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') } catch { saved = null }
        if (saved?.city) {
            dispatch(setCity(saved.city))
            dispatch(setState(saved.state))
            return
        }

        // 2) First visit: ask for location, detect the city, or fall back to the city picker.
        const fallback = () => { if (!cancelled) dispatch(setCityPickerOpen(true)) }
        if (!navigator.geolocation) { fallback(); return }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords
                dispatch(setLocation({ lat: latitude, lon: longitude }))
                const found = await reverse(latitude, longitude)
                if (cancelled) return
                if (!found) { fallback(); return }
                dispatch(setCity(found.city))
                dispatch(setState(found.state))
                dispatch(setCurrentAddress(found.line))
                dispatch(setAddress(found.line))
                saveCity(found.city, found.state)
            } catch {
                fallback()
            }
        }, fallback, { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 10000 })

        return () => { cancelled = true }
    }, [dispatch])
}

export default useGetCity
