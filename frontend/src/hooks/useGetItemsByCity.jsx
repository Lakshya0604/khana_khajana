import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'

function useGetItemsByCity() {
    const dispatch = useDispatch()
    const { city } = useSelector(state => state.user)

    useEffect(() => {
        if (!city?.trim()) {
            dispatch(setItemsInMyCity([]))
            return
        }

        const fetchItems = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/item/get-by-city/${encodeURIComponent(city)}`, { withCredentials: true })
                dispatch(setItemsInMyCity(Array.isArray(result?.data) ? result.data : []))
            } catch (error) {
                console.log(error)
                dispatch(setItemsInMyCity([]))
            }
        }

        fetchItems()
    }, [city, dispatch])
}

export default useGetItemsByCity