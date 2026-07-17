import React from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from 'react-redux';
import CardItemCart from '../components/CardItemCart';

const CartPage = () => {
    const navigate = useNavigate()
    const { cartItems, totalAmount } = useSelector(state => state.user)
    return (
        <div className='min-h-screen bg-[#fff9f6] flex justify-center p-6 '>
            <div className='w-full max-w-200'>
                <div className='flex items-center gap-5 mb-6'>
                    <div className='z-[10px]' onClick={() => navigate("/")}><IoArrowBack size={25} className='text-[#ff4d2d]' /></div>
                    <h1 className='text-3xl font-bold text-start'>Your Cart </h1>
                </div>
                {cartItems?.length == 0 ? (<p className='text-gray-500 text-lg text-center'>Your Cart is Empty</p>) : (<>
                    <div className='space-y-4 '>
                        {cartItems?.map((item, index) => (
                            <CardItemCart data={item} key={index} />
                        ))}
                    </div>
                    <div className='mt-6 bg-white p-4 rounded-xl shadow-flex justify-between items-center border'>
                        <h1 className='text-lg font-bold'>Total Amount <span className='text-xl font-bold text-[#ff4d2d] gap-1'>₹{totalAmount}</span> </h1>
                    </div>
                    <div className='mt-4 flex justify-end'>
                        <button className='bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-lg font-medium hover:bg-[#e64526] transition shadow-2xl cursor-pointer' onClick={() => navigate("/checkout")}>Proceed to Check Out</button>
                    </div>
                </>)}
            </div>
        </div>
    )
}

export default CartPage