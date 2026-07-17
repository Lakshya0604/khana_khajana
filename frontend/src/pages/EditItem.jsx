import React, { useEffect } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AiTwotoneShop } from "react-icons/ai";
import { useState } from 'react';
import axios from 'axios'
import { serverUrl } from "../App"
import { setMyShopData } from '../redux/ownerSlice'
import { ClipLoader } from 'react-spinners';


const EditItem = () => {
    const navigate = useNavigate()
    const { myShopData } = useSelector(state => state.owner)
    const { itemId } = useParams()
    const [currentItem, setCurrentItem] = useState(null)
    const [name, setName] = useState("")
    const [price, setPrice] = useState("0")
    const [category, setCategory] = useState("")
    const [foodType, setFoodType] = useState("")
    const categories = ["Snacks", "Main Course", "Dessert", "Pizza", "Burgers", "Sandwitches", "South Indian", "North Indian", "Chinese", "Fast Food", "Others"]
    const [frontendImage, setFrontendImage] = useState("")
    const [backendImage, setBackendImage] = useState(null)
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)

    const handleImage = (e) => {
        const file = e.target.files[0]
        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("category", category)
            formData.append("foodType", foodType)
            formData.append("price", price)
            if (backendImage) {
                formData.append("image", backendImage)
            }
            const result = await axios.post(`${serverUrl}/api/item/edit-item/${itemId}`, formData, { withCredentials: true })
            dispatch(setMyShopData(result.data))
            setLoading(false)
            navigate("/")
        } catch (error) {
            console.log("CreateEditShop error", error.response || error)
            setLoading(false)
        }
    }
    useEffect(() => {
        const handleGetItemById = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/item/get-by-id/${itemId}`, { withCredentials: true })
                setCurrentItem(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        handleGetItemById()
    }, [itemId])


    useEffect(() => {
        setName(currentItem?.name || "")
        setPrice(currentItem?.price || 0)
        setCategory(currentItem?.category || "")
        setFoodType(currentItem?.foodType || "")
        setFrontendImage(currentItem?.image || "")

    }, [currentItem])
    return (
        <div className='flex justify-center flex-col items-center p-6 bg-linear-to-br from-orange-50 relative to-white min-h-screen'>
            <div className='absolute top-5 left-5 z-10 mb-2.5' onClick={() => navigate("/")}><IoArrowBack size={25} className='text-[#ff4d2d]' /></div>
            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 rounded-full mb-4'>
                        <AiTwotoneShop className='text-[#ff4d2d] w-16 h-16' />
                    </div>
                    <div className='text-3xl font-extrabold text-gray-900'>
                        Edit food
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className='mt-6 space-y-5'>
                            <label className='block text-sm font-medium text-gray-600 mb-1'>Name</label>
                            <input type="text" placeholder='Food Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setName(e.target.value)} value={name} />
                        </div>

                        <div className='mt-6 space-y-5'>
                            <label className='block text-sm font-medium text-gray-600 mb-1'>Food Image</label>
                            <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={handleImage} />
                            {frontendImage && <div className='mt-4'><img src={frontendImage} alt="" className='w-full h-48 object-cover rounded-lg border' /></div>}
                            <div className=' space-y-5'>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>Price</label>
                                <input type="number" placeholder='0' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setPrice(e.target.value)} value={price} />
                            </div>

                            <div className=' space-y-5'>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>Select Category</label>
                                <select className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setCategory(e.target.value)} value={category} >
                                    <option value="">Select Category</option>
                                    {categories.map((cate, index) => (
                                        <option value={cate} key={index}>{cate}</option>
                                    ))}
                                </select>
                            </div>


                            <div className=' space-y-5'>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>Select Food Type</label>
                                <select className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setFoodType(e.target.value)} value={foodType}>
                                    <option value="veg">veg</option>
                                    <option value="non veg">non veg</option>

                                </select>
                            </div>





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

export default EditItem