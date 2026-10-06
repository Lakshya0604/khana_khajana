import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCity, setCityPickerOpen, setState } from '../redux/userSlice'
import { saveCity } from '../hooks/useGetCity'

const CITIES = [
    ['Agra', 'Uttar Pradesh'], ['Delhi', 'Delhi'], ['Mumbai', 'Maharashtra'], ['Bengaluru', 'Karnataka'],
    ['Hyderabad', 'Telangana'], ['Chennai', 'Tamil Nadu'], ['Kolkata', 'West Bengal'], ['Pune', 'Maharashtra'],
    ['Jaipur', 'Rajasthan'], ['Lucknow', 'Uttar Pradesh'], ['Ahmedabad', 'Gujarat'], ['Amritsar', 'Punjab']
]

function CityPicker() {
    const dispatch = useDispatch()
    const open = useSelector(s => s.user.cityPickerOpen && !!s.user.userData)
    const current = useSelector(s => s.user.city)
    const [text, setText] = useState('')
    if (!open) return null

    const choose = (city, state) => {
        const c = city.trim()
        if (!c) return
        dispatch(setCity(c))
        dispatch(setState(state || null))
        saveCity(c, state)
        dispatch(setCityPickerOpen(false))
        setText('')
    }

    return (
        <div className='fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 kk-fade' role='dialog' aria-modal='true' aria-label='Choose your city'>
            <div className='w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[85vh] overflow-y-auto'>
                <h2 className='text-lg font-semibold text-gray-800'>Choose your city</h2>
                <p className='text-sm text-gray-500 mt-1'>We could not detect your location. Pick a city to see restaurants near you.</p>
                <div className='grid grid-cols-2 gap-2 mt-4'>
                    {CITIES.map(([c, st]) => (
                        <button key={c} onClick={() => choose(c, st)} className='border border-gray-200 rounded-lg py-2 text-sm hover:border-[#ff4d2d] hover:text-[#ff4d2d]'>{c}</button>
                    ))}
                </div>
                <form className='flex gap-2 mt-4' onSubmit={(e) => { e.preventDefault(); choose(text) }}>
                    <input value={text} onChange={(e) => setText(e.target.value)} placeholder='Other city' className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm' />
                    <button type='submit' className='bg-[#ff4d2d] text-white rounded-lg px-4 text-sm'>Go</button>
                </form>
                {current && <button onClick={() => dispatch(setCityPickerOpen(false))} className='mt-3 text-sm text-gray-500 underline'>Keep {current}</button>}
            </div>
        </div>
    )
}

export default CityPicker
