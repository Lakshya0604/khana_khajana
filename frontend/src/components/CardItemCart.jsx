import React from 'react'
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';

const CardItemCart = ({ data }) => {
    const dispatch = useDispatch()
    const handleIncrease = (id, currentQty) => {
        dispatch(updateQuantity({ id, quantity: currentQty + 1 }))
    }

    const handleDecrease = (id, currentQty) => {
        if (currentQty > 1) {
            dispatch(updateQuantity({ id, quantity: currentQty - 1 }))
        }
    }

    return (
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-6 rounded-xl shadow border border-gray-200'>
            <div className='flex items-center gap-3 sm:gap-4 min-w-0'>
                <img src={data.image} alt="" className='w-20 h-20 sm:w-28 sm:h-28 shrink-0 object-cover rounded-lg border' />
                <div>
                    <h1 className='font-medium text-gray-700 break-words'>{data.name}</h1>
                    <p className='font-medium flex text-gray-500'><FaIndianRupeeSign size={12} className='mb-0 mt-2 gap-2 text-gray-500' />{data.price} x {data.quantity}</p>
                    <p className='flex gap-1 font-bold text-green-600' > <FaIndianRupeeSign size={12} className='mb-0 mt-2 gap-2 text-green-400' /> {data.price * data.quantity}</p>
                </div>
            </div>
            <div className='flex items-center justify-end gap-3 self-end sm:self-auto'>

                <button className='p-1 bg-gray-100 rounded-full hover:bg-gray-200' onClick={() => handleDecrease(data.id, data.quantity)} ><FaMinus size={12} />
                </button>
                <span>{data.quantity}</span>
                <button className='p-1 bg-gray-100 rounded-full hover:bg-gray-200' onClick={() => handleIncrease(data.id, data.quantity)}><FaPlus size={12} />
                </button>
                <button className='p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200' onClick={() => dispatch(removeCartItem(data.id))}>
                    <FaTrash size={12} />
                </button>
            </div>
        </div>
    )
}

export default CardItemCart