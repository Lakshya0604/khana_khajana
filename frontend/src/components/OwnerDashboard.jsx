import React from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { CiForkAndKnife } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import { FaPen } from "react-icons/fa";
import OwnerItemCard from './OwnerItemCard';

const OwnerDashboard = () => {
    const { myShopData } = useSelector(state => state.owner)
    const navigate = useNavigate();
    return (
        <div className='pt-[70px] min-h-screen bg-orange-50'>
            <Nav />
            <div>
                {!myShopData &&
                    <div className='flex justify-center items-center p-4 sm:p-6'>
                        <div className='w-full max-w-md bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
                            <div className='flex flex-col items-center text-center'>
                                <CiForkAndKnife className='text-amber-600 w-16 h-16 sm:w-20 sm:h-20 mb-4' />
                                <h2 className='text-2xl pt-2 font-medium'>Add your Restaurant</h2>
                                <p className='pt-4 text-amber-700 font-serif'>Grow Your Restaurant with Khana Khajana</p>
                                <button className='bg-[#ff4d2d] mt-4 text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-500 transition-colors duration-200' onClick={() => navigate("/create-edit-shop")}>Get Started</button>
                            </div>
                        </div>
                    </div>
                }

                {myShopData &&
                    <div className='w-full px-6 sm:px-6 pt-6 pb-10'>

                        {/* Welcome Heading */}
                        <h1 className='text-xl rounded-full sm:text-3xl text-gray-700 flex items-center gap-2 p-4 mb-6 border border-orange-100 bg-white overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300'>
                            <CiForkAndKnife className='text-amber-600 w-10 h-10 sm:w-12 sm:h-12' />
                            Welcome to {myShopData.name}
                        </h1>

                        {/* 2 column layout for desktop, single column for mobile */}
                        <div className='flex flex-col md:flex-row gap-6 items-start'>

                            {/* Left — Shop Card */}
                            <div className='bg-white rounded-xl overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300 w-full md:w-[45%] relative flex-shrink-0'>
                                <div className='absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full cursor-pointer z-10'>
                                    <FaPen size={16} onClick={() => navigate("/create-edit-shop")} />
                                </div>
                                <img src={myShopData.image} alt={myShopData.name} className='w-full h-[50vh] object-cover' />
                                <div className='p-4 sm:p-6'>
                                    <h1 className='text-xl sm:text-2xl font-bold text-gray-700'>{myShopData.name}</h1>
                                    <p className='text-gray-500 mt-1'>{myShopData.city}</p>
                                    <p className='text-gray-500'>{myShopData.address}</p>
                                </div>
                            </div>

                            {/* Right — Item Cards */}
                            <div className='flex flex-col gap-4 w-full md:flex-1'>

                                {myShopData.items.length === 0 &&
                                    <div className='bg-white shadow-lg rounded-xl p-6 border border-gray-100'>
                                        <div className='flex flex-col items-center text-center'>
                                            <CiForkAndKnife className='text-amber-600 w-16 h-16 mb-4' />
                                            <h2 className='text-2xl font-medium'>Add your Food Item</h2>
                                            <p className='pt-4 text-amber-700 font-serif'>Good food finds its people — help them find yours</p>
                                            <button className='bg-[#ff4d2d] mt-4 text-white px-6 py-2 rounded-full font-medium hover:bg-orange-500' onClick={() => navigate("/add-item")}>Add Food</button>
                                        </div>
                                    </div>
                                }

                                {myShopData.items.map((item, index) => (
                                    <OwnerItemCard data={item} key={index} />
                                ))}

                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default OwnerDashboard