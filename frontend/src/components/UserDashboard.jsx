import React from 'react'
import Nav from './Nav'
import { categories } from '../category.js'
import CategaoryCard from './CategaoryCard'
import { useSelector } from 'react-redux'
import FoodCard from './FoodCard.jsx'
import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


const UserDashboard = () => {
    const { city, shopsInMyCity, itemsInMyCity, searchItems } = useSelector(state => state.user)
    const [updatedItemsList, setUpdatedItemsList] = useState([])
    const navigate = useNavigate()
    const hasShops = Array.isArray(shopsInMyCity) && shopsInMyCity.length > 0


    const handleFilterByCategory = (category) => {
        if (category == "All") {
            setUpdatedItemsList(itemsInMyCity)
        }
        else {
            const filteredList = itemsInMyCity?.filter(i => i.category === category)
            setUpdatedItemsList(filteredList)
        }
    }

    useEffect(() => {
        setUpdatedItemsList(itemsInMyCity)
    }, [itemsInMyCity])

    return (
        <div className='w-full overflow-x-hidden'>
            <Nav />
            {searchItems && searchItems.length > 0 && (
                <div className='w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-5 items-start p-2 sm:p-5 bg-white shadow-md rounded-2xl mt-2 sm:mt-4'>
                    <h1 className='text-gray-900 text-lg sm:text-2xl lg:text-3xl font-semibold border-b border-gray-200 p-2 w-full'>Search Result</h1>
                    <div className='w-full grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 justify-items-center'>
                        {searchItems.map((item) => (
                            <FoodCard data={item} key={item._id} />
                        ))}
                    </div>
                </div>
            )}

            <div className='w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-5 items-start px-2 sm:px-4 lg:px-6 py-2'>
                <div className='flex items-center justify-between w-full'>
                    <h1 className='text-gray-700 text-lg sm:text-2xl lg:text-3xl'>Inspiration for your first order</h1>
                    <span className='hidden sm:inline text-sm text-gray-400'>Popular picks</span>
                </div>
                <div className='w-full rounded-2xl bg-gradient-to-r from-[#fff7f4] to-white p-2 sm:p-3 shadow-sm border border-orange-100'>
                    <div className='w-full flex overflow-x-auto gap-2 sm:gap-3 pb-2 scrollbar-thin scrollbar-thumb-[#ff4d2d] scrollbar-track-transparent scroll-smooth mt-0'>
                        {categories.map((cate, index) => (
                            <div className='flex-shrink-0' key={index}>
                                <CategaoryCard name={cate.category} image={cate.image} onClick={() => handleFilterByCategory(cate.category)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-5 items-start px-2 sm:px-4 lg:px-6 py-2'>
                <div className='flex items-center justify-between w-full'>
                    <h1 className='text-gray-700 text-lg sm:text-2xl lg:text-3xl truncate pr-2'>Best Shop in {city || 'your area'}</h1>
                    {hasShops && (
                        <span className='text-xs sm:text-sm text-[#ff4d2d] font-medium whitespace-nowrap'>Swipe to explore</span>
                    )}
                </div>
                <div className='w-full rounded-2xl bg-gradient-to-r from-[#fff7f4] to-white p-2 sm:p-3 shadow-sm border border-orange-100'>
                    {hasShops ? (
                        <div className='w-full flex overflow-x-auto gap-3 sm:gap-4 pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#ff4d2d] scrollbar-track-transparent scroll-smooth'>
                            {shopsInMyCity.map((shop, index) => (
                                <div className='snap-start flex-shrink-0' key={shop._id || index}>
                                    <CategaoryCard name={shop.name} image={shop.image} onClick={() => navigate(`/shop/${shop._id}`)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='w-full rounded-2xl border border-dashed border-gray-300 bg-white/80 px-4 py-5 text-center text-sm text-gray-600'>
                            {city ? `No shops are available in ${city} yet.` : 'We are loading your nearby shops. Please wait a moment.'}
                        </div>
                    )}
                </div>
            </div>

            <div className='w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-5 items-start px-2 sm:px-4 lg:px-6 py-2'>
                <div className='flex items-center justify-between w-full'>
                    <h1 className='text-gray-700 text-lg sm:text-2xl lg:text-3xl'>Suggested Food Items</h1>
                    <span className='hidden sm:inline text-sm text-gray-400'>Fresh picks</span>
                </div>
            </div>

            <div className='w-full grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-[20px] justify-center px-3 sm:px-2 lg:px-0 pb-4'>
                {updatedItemsList && updatedItemsList.length > 0 ? (
                    updatedItemsList.map((item, index) => (
                        <FoodCard key={index} data={item} />
                    ))
                ) : (
                    <p className='text-gray-500 py-4 col-span-2'>No food items available in your city right now.</p>
                )}
            </div>
        </div>
    )
}

export default UserDashboard