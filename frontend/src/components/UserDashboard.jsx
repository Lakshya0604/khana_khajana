import Spinner from './Spinner'
import React from 'react'
import Nav from './Nav'
import { categories } from '../category.js'
import CategaoryCard from './CategaoryCard'
import { useSelector } from 'react-redux'
import FoodCard from './FoodCard.jsx'
import { useState } from 'react'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'


const UserDashboard = () => {
    const { city, shopsInMyCity, itemsInMyCity, searchItems } = useSelector(state => state.user)
    const [activeCategory, setActiveCategory] = useState("All")
    const [diet, setDiet] = useState("all")
    const [sort, setSort] = useState("default")
    const [visible, setVisible] = useState(40)
    const navigate = useNavigate()
    const hasShops = Array.isArray(shopsInMyCity) && shopsInMyCity.length > 0
    const shopsLoading = shopsInMyCity === null
    const itemsLoading = itemsInMyCity === null || itemsInMyCity === undefined


    // Tile labels differ from the stored category names for these two
    const CATEGORY_ALIAS = { "desserts": "Dessert", "sandwitches": "Sandwitches" }
    const handleFilterByCategory = (category) => {
        setActiveCategory(category)
        setVisible(40)
    }

    const updatedItemsList = useMemo(() => {
        let list = Array.isArray(itemsInMyCity) ? itemsInMyCity : []
        if (activeCategory !== "All") {
            const want = CATEGORY_ALIAS[activeCategory.toLowerCase()] || activeCategory
            list = list.filter(i => i.category === want)
        }
        if (diet === "veg") list = list.filter(i => i.foodType === "veg")
        if (diet === "nonveg") list = list.filter(i => i.foodType === "non veg")
        if (sort === "low") list = [...list].sort((x, y) => x.price - y.price)
        if (sort === "high") list = [...list].sort((x, y) => y.price - x.price)
        return list
    }, [itemsInMyCity, activeCategory, diet, sort])

    useEffect(() => { setVisible(40) }, [diet, sort, city])

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

            {Array.isArray(searchItems) && searchItems.length === 0 && (
                <p className='w-full max-w-6xl mx-auto text-center text-gray-500 bg-white shadow-md rounded-2xl mt-4 p-4'>No dishes or restaurants found for your search in {city || 'this city'}.</p>
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
                                <div className={activeCategory === cate.category ? 'rounded-xl ring-2 ring-[#ff4d2d]' : ''}><CategaoryCard name={cate.category} image={cate.image} onClick={() => handleFilterByCategory(cate.category)} /></div>
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
                    {shopsLoading ? (
                        <Spinner label='Loading restaurants...' className='py-6' />
                    ) : hasShops ? (
                        <div className='w-full flex overflow-x-auto gap-3 sm:gap-4 pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#ff4d2d] scrollbar-track-transparent scroll-smooth'>
                            {shopsInMyCity.map((shop, index) => (
                                <div className='snap-start flex-shrink-0' key={shop._id || index}>
                                    <CategaoryCard name={shop.name} image={shop.image} onClick={() => navigate(`/shop/${shop._id}`)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='w-full rounded-2xl border border-dashed border-gray-300 bg-white/80 px-4 py-5 text-center text-sm text-gray-600'>
                            No shops are available in {city} yet.
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

            <div className='w-full max-w-6xl mx-auto flex flex-wrap items-center gap-2 px-3 sm:px-6 pb-3'>
                {[['all', 'All'], ['veg', 'Veg'], ['nonveg', 'Non-veg']].map(([v, label]) => (
                    <button key={v} onClick={() => setDiet(v)} className={`px-3 py-1.5 rounded-full text-sm border ${diet === v ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-700 border-gray-300'}`}>{label}</button>
                ))}
                <select value={sort} onChange={(e) => setSort(e.target.value)} className='ml-auto px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white text-gray-700'>
                    <option value='default'>Sort: Relevance</option>
                    <option value='low'>Price: Low to High</option>
                    <option value='high'>Price: High to Low</option>
                </select>
                <span className='w-full text-xs text-gray-500'>{itemsLoading ? 'Loading...' : `${updatedItemsList.length} item${updatedItemsList.length === 1 ? '' : 's'}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`}</span>
            </div>

            <div className='w-full grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-[20px] justify-center px-3 sm:px-2 lg:px-0 pb-4'>
                {itemsLoading ? (
                    <div className='col-span-2 w-full'><Spinner label='Loading dishes...' /></div>
                ) : updatedItemsList.length > 0 ? (
                    updatedItemsList.slice(0, visible).map((item) => (
                        <FoodCard key={item._id} data={item} />
                    ))
                ) : (
                    <p className='text-gray-500 py-4 col-span-2'>{itemsInMyCity && itemsInMyCity.length > 0 ? 'No items match these filters. Try another category or clear Veg/Non-veg.' : 'No food items available in your city right now.'}</p>
                )}
            </div>
            {updatedItemsList.length > visible && (
                <div className='w-full flex justify-center pb-10'>
                    <button onClick={() => setVisible(v => v + 40)} className='px-6 py-2 rounded-full bg-[#ff4d2d] text-white text-sm font-medium'>Show more ({updatedItemsList.length - visible} left)</button>
                </div>
            )}
        </div>
    )
}

export default UserDashboard