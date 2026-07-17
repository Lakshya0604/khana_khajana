import React, { useEffect } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AiTwotoneShop } from "react-icons/ai";
import { useState } from 'react';
import axios from 'axios'
import { serverUrl } from "../App"
import { setMyShopData } from '../redux/ownerSlice'
import { ClipLoader } from 'react-spinners';


const CreateEditShop = () => {
    const navigate = useNavigate()
    const { myShopData } = useSelector(state => state.owner)
    const { city: userCity, state: userState, currentAddress } = useSelector(state => state.user)
    const [name, setName] = useState(myShopData?.name || "")
    const [address, setAddress] = useState(myShopData?.address || currentAddress || "")
    const [shopCity, setShopCity] = useState(myShopData?.city || userCity || "")
    const [shopState, setShopState] = useState(myShopData?.state || userState || "")
    const [frontendImage, setFrontendImage] = useState(myShopData?.image || "")
    const [backendImage, setBackendImage] = useState(null)
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (myShopData) {
            setName(myShopData.name || "")
            setAddress(myShopData.address || currentAddress || "")
            setShopCity(myShopData.city || userCity || "")
            setShopState(myShopData.state || userState || "")
            setFrontendImage(myShopData.image || "")
        } else {
            setAddress(prev => prev || currentAddress || "")
            setShopCity(prev => prev || userCity || "")
            setShopState(prev => prev || userState || "")
        }
    }, [myShopData, currentAddress, userCity, userState])

    const handleImage = (e) => {
        const file = e.target.files[0]
        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        console.log("CreateEditShop submit", { name, shopCity, shopState, address, backendImage })
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("city", shopCity)
            formData.append("state", shopState)
            formData.append("address", address)
            if (backendImage) {
                formData.append("image", backendImage)
            }
            const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData, { withCredentials: true })
            dispatch(setMyShopData(result.data))
            setLoading(false)
            navigate("/")
        } catch (error) {
            console.log("CreateEditShop error", error.response || error)
            setLoading(false)
        }
    }

    return (
        <div className='flex justify-center flex-col items-center p-6 bg-linear-to-br from-orange-50 relative to-white min-h-screen'>
            <div className='absolute top-5 left-5 z-10 mb-2.5' onClick={() => navigate("/")}><IoArrowBack size={25} className='text-[#ff4d2d]' /></div>
            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 rounded-full mb-4'>
                        <AiTwotoneShop className='text-[#ff4d2d] w-16 h-16' />
                    </div>
                    <div className='text-3xl font-extrabold text-gray-900'>
                        {myShopData ? "Edit Shop" : "Add Shop"}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className='mt-6 space-y-5'>
                            <label className='block text-sm font-medium text-gray-600 mb-1'>Name</label>
                            <input type="text" placeholder='Enter Shop Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setName(e.target.value)} value={name} />
                        </div>

                        <div className='mt-6 space-y-5'>
                            <label className='block text-sm font-medium text-gray-600 mb-1'>Shop Image</label>
                            <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={handleImage} />
                            {frontendImage && <div className='mt-4'><img src={frontendImage} alt="" className='w-full h-48 object-cover rounded-lg border' /></div>}
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 m-2'>
                            <div>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>State</label>
                                <input type="text" placeholder='State' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setShopState(e.target.value)} value={shopState} />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>City</label>
                                <input type="text" placeholder='City' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setShopCity(e.target.value)} value={shopCity} />
                            </div>
                        </div>

                        <div className='mt-6 space-y-5'>
                            <label className='block text-sm font-medium text-gray-600 mb-1'>Shop Address</label>
                            <input type="text" placeholder='Enter Shop Address' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setAddress(e.target.value)} value={address} />
                        </div>
                        <button type='submit' className='w-full bg-[#ff4d2d] mt-4 text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-500 transition-colors duration-200 cursor-pointer' disabled={loading}>
                            {loading ? <ClipLoader size={20} color='white' /> : "Save"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreateEditShop