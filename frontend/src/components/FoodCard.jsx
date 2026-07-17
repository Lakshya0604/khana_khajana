import React, { useState } from 'react'
import { IoIosLeaf } from "react-icons/io";
import { GiRoastChicken } from "react-icons/gi";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { IoCart } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux"
import { addToCart } from '../redux/userSlice';

const FoodCard = ({ data }) => {
    const [quantity, setQuantity] = useState(0)
    const dispatch = useDispatch()
    const { cartItems } = useSelector(state => state.user)
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                (i <= rating) ? (<FaStar className='text-amber-300 text-lg' />) : (<FaRegStar className='text-amber-300 text-lg' />)
            )
        }
        return stars
    }

    const handleIncrease = () => {
        setQuantity(prev => prev + 1)
    }

    const handleDecrease = () => {
        setQuantity(prev => Math.max(prev - 1, 0))
    }

    return (
        <div className='w-full max-w-[250px] sm:w-[250px] rounded-2xl border-1 border-[#ff4d2d] bg-white shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col'>
            <div className='relative w-full h-[170px] flex justify-center items-center bg-white'>
                <div className='absolute top-3 right-3 bg-gray-100 rounded-full p-1 shadow'>
                    {data.foodType == "veg" ? <IoIosLeaf className='text-green-400' /> : <GiRoastChicken className='text-red-500' />}
                </div>
                <img src={data.image} alt="" className='w-full h-full object-cover transition-transform duration-300 hover:scale-110' />
            </div>
            <div className='flex-1 flex flex-col p-4'>
                <h1 className='font-semibold text-gray-900 text-base truncate'>{data.name}</h1>
                <div className='flex items-center gap-1 mt-1'>
                    {renderStars(data.rating?.average || 0)}
                    <span className='text-xs text-gray-500'>{data.rating?.count || 0}</span>
                </div>
            </div>
            <div className='flex items-center justify-between mt-auto  p-3'>
                <span className='font-bold text-gray-900 text-lg'>
                    ₹{data.price}
                </span>
                <div className='flex m-1 items-center border rounded-full overflow-hidden shadow-sm'>
                    <button className='px-2 py-1 hover:bg-gray-100 transition' onClick={handleDecrease}><FaMinus size={12} />
                    </button>
                    <span>{quantity}</span>
                    <button className='px-2 py-1 hover:bg-gray-100 transition' onClick={handleIncrease}><FaPlus size={12} />
                    </button>
                    <button className={`${cartItems.some(i => i.id === data._id) ? "bg-gray-800" : "bg-[#ff4d2d]"} text-white px-3 py-2 transition-colors`} onClick={() => {
                        quantity > 0 ? dispatch(addToCart({
                            id: data._id,
                            name: data.name,
                            price: data.price,
                            image: data.image,
                            shop: data.shop,
                            quantity,
                            foodType: data.foodType
                        })) : "null"
                    }}><IoCart /></button>
                </div>
            </div>
        </div>
    )
}

export default FoodCard