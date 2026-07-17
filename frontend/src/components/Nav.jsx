import React, { useState } from 'react'
import { IoLocationOutline } from "react-icons/io5"
import { IoCartOutline } from "react-icons/io5"
import { FiUser } from "react-icons/fi"
import { CiSearch } from "react-icons/ci"
import { RiCloseLine } from "react-icons/ri"
import { HiOutlineMenuAlt3 } from "react-icons/hi"
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import { setSearchItems, setUserData } from '../redux/userSlice'
import { FaPlus } from "react-icons/fa"
import { LuReceiptIndianRupee } from "react-icons/lu";
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const Nav = () => {
    const { userData, city, currentAddress, cartItems } = useSelector(state => state.user)
    const { myShopData } = useSelector(state => state.owner)
    const [showInfo, setShowInfo] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [query, setQuery] = useState("")
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
        } catch (error) {
            console.log(error)
        }
    }

    const handleSerchItems = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/item/search-items?query=${query}&city=${city}`, { withCredentials: true })
            dispatch(setSearchItems(result.data))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (query) {
            handleSerchItems()
        } else {
            dispatch(setSearchItems(null))
        }
    }, [query])
    return (
        <div className='fixed top-0 left-0 w-full bg-white border-b border-gray-100 z-[9999]'>

            {/* Main Navbar Row */}
            <div className='h-[60px] flex items-center justify-between px-4 md:px-6'>

                {/* Logo */}
                <div className='flex items-center gap-2 min-w-fit'>
                    <div className='w-8 h-8 bg-[#ff4d2d] rounded-lg flex items-center justify-center text-white text-base'>
                        🍛
                    </div>
                    <span className='text-base md:text-lg font-medium text-[#ff4d2d]'>Khana Khajana</span>
                </div>

                {/* Center - Location + Search (desktop, user only) */}
                {userData.role === "user" && (
                    <div className='hidden md:flex flex-1 items-center justify-center px-6'>
                        <div className='flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white h-[38px] w-full max-w-[500px]'>
                            <div className='flex items-center gap-1 px-3 border-r border-gray-200 min-w-fit cursor-pointer hover:bg-gray-50'>
                                <IoLocationOutline size={16} className='text-[#ff4d2d]' />
                                <span className='text-sm text-gray-700 font-medium'>{city || 'Location'}</span>
                            </div>
                            <div className='flex items-center gap-2 px-3 flex-1'>
                                <CiSearch size={16} className='text-gray-400 min-w-fit' />
                                <input
                                    type='text'
                                    placeholder='Search delicious food here...'
                                    className='w-full text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400'
                                    onChange={(e) => setQuery(e.target.value)} value={query}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Section - Desktop */}
                <div className='hidden md:flex items-center gap-3 min-w-fit'>

                    {/* Owner: Add Food Items */}
                    {userData.role === "owner" && (
                        <>
                            {myShopData && <>
                                <button className='flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-amber-500' onClick={() => navigate("/add-item")}>
                                    <FaPlus size={18} />
                                    <span className='text-sm font-medium'>Add Food Items</span>
                                </button>
                            </>
                            }
                            <button className=' relative flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-amber-700' onClick={() => navigate("/my-orders")}><LuReceiptIndianRupee size={20} />
                                <span className='font-bold text-sm'>My Orders</span>
                            </button>
                        </>
                    )}


                    {/* User: Cart + Orders */}
                    {userData?.role === "user" && (
                        <>
                            <button className='flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700' onClick={() => navigate("/cart")}>
                                <IoCartOutline size={18} />
                                Cart
                                <span className='bg-[#ff4d2d] text-white text-xs px-1.5 py-0.5 rounded-full leading-none'>{cartItems.length}</span>
                            </button>
                            <button className='flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-orange-400' onClick={() => navigate("/my-orders")}>
                                My Orders
                            </button>
                        </>
                    )}

                    {/* Avatar + Dropdown (always visible) */}
                    <div className='relative'>
                        <div
                            className='w-9 h-9 rounded-full text-white bg-orange-400 flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-colors font-medium text-sm'
                            onClick={() => setShowInfo(prev => !prev)}
                        >
                            {userData?.fullname?.slice(0, 1)?.toUpperCase()}
                        </div>
                        {showInfo && (
                            <div className='absolute top-[44px] right-0 w-[180px] bg-white shadow-xl rounded-xl p-4 border border-gray-100'>
                                <div className='text-[15px] font-semibold cursor-pointer text-emerald-500 pb-2 border-b border-gray-100'>
                                    {userData?.fullname}
                                </div>
                                <div
                                    className='text-[14px] font-medium cursor-pointer text-red-400 pt-2 hover:text-red-500'
                                    onClick={handleLogout}
                                >
                                    LogOut
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section - Mobile */}
                <div className='flex md:hidden items-center gap-2'>

                    {/* Owner: Add button (icon only) */}
                    {userData?.role === "owner" && (
                        <>
                            {myShopData && <>
                                <button className='w-7 h-7 flex items-center justify-center rounded-lg bg-[#ff4d2d]/10 text-amber-500 gap-1 cursor-pointer' onClick={() => navigate("/add-item")}>
                                    <FaPlus size={18} />
                                </button>


                            </>}
                            <div className='relative flex items-center justify-between gap-1 p-0 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-amber-700'><LuReceiptIndianRupee size={20} onClick={() => navigate("/my-orders")} />
                            </div>

                        </>
                    )}

                    {/* User: Search + Cart */}
                    {userData?.role === "user" && (
                        <>
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className='w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 cursor-pointer'
                            >
                                {searchOpen ? <RiCloseLine size={18} /> : <CiSearch size={18} />}
                            </button>
                            <button className='relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600'>
                                <IoCartOutline className='cursor-pointer' size={18} onClick={() => navigate("/cart")} />
                                <span className='absolute -top-1 -right-1 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full'>{cartItems.length}</span>
                            </button>
                        </>
                    )}

                    {/* Avatar (always visible) */}
                    <div className='w-9 h-9 rounded-full text-white bg-orange-400 flex items-center justify-center cursor-pointer font-medium text-sm'
                        onClick={() => setShowInfo(prev => !prev)}
                    >
                        {userData?.fullname?.slice(0, 1)?.toUpperCase()}
                    </div>

                    {/* Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className='w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600'
                    >
                        {menuOpen ? <RiCloseLine size={18} /> : <HiOutlineMenuAlt3 size={18} />}
                    </button>
                </div>

            </div>

            {/* Mobile Search Bar */}
            {searchOpen && userData?.role === "user" && (
                <div className='md:hidden px-4 pb-3'>
                    <div className='flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white h-[40px]'>
                        <div className='flex items-center gap-1 px-3 border-r border-gray-200 min-w-fit'>
                            <IoLocationOutline size={16} className='text-[#ff4d2d]' />
                            <span className='text-sm text-gray-700 font-medium'>{city}</span>
                        </div>
                        <div className='flex items-center gap-2 px-3 flex-1'>
                            <CiSearch size={16} className='text-gray-400 min-w-fit' />
                            <input
                                autoFocus
                                type='text'
                                placeholder='Search delicious food...'
                                className='w-full text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400'
                                onChange={(e) => setQuery(e.target.value)} value={query}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
                <div className='md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-2'>
                    {userData?.role === "user" && (
                        <>
                            <button className='flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-orange-400 w-full text-left' onClick={() => navigate("/my-orders")}>
                                <FiUser size={18} />
                                My Orders
                            </button>
                        </>
                    )}



                    {userData?.role === "owner" && (
                        <>
                            <div className='text-[15px] font-semibold cursor-pointer text-emerald-500 pb-2 border-b border-gray-100'>
                                {userData?.fullname}
                            </div>
                        </>
                    )}
                    <button
                        className='flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-red-400 w-full text-left'
                        onClick={handleLogout}
                    >
                        LogOut
                    </button>
                </div>
            )}

        </div>
    )
}

export default Nav