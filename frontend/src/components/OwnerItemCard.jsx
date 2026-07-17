import React from 'react'
import { FaPencil } from "react-icons/fa6";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import axios from 'axios';
const OwnerItemCard = ({ data }) => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleDelete = async () => {
        try {
            const result = await axios.delete(`${serverUrl}/api/item/delete/${data._id}`, { withCredentials: true })
            dispatch(setMyShopData(result.data))
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <div className='flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl'>
            <div className='w-36 flex-shrink-0 bg-gray-50'>
                <img src={data.image} alt="" className='w-full h-full object-cover' />
            </div>
            <div className='flex flex-col justify-between p-3 flex-1 '>
                <div >
                    <h2 className='text-base font-semibold text-[#ff4d2d]'>{data.name}</h2>
                    <p><span className='font-medium text-gray-700'>Category</span> : {data.category}</p>
                    <p><span className='font-medium text-gray-700'>FoodType</span> : {data.foodType}</p>
                </div>
                <div className='flex items-center justify-between'>
                    <div className='font-medium text-orange-400'>Price:{data.price}</div>

                    <div className='p-2  flex items-center gap-4 '>
                        <div className='rounded-full p-2 cursor-pointer hover:bg-[#ff4d2d]/10 text-[#ff4d2d]' onClick={() => navigate(`/edit-item/${data._id}`)}> <FaPencil size={17} /></div>
                        <div className='rounded-full cursor-pointer p-2 hover:bg-[#ff4d2d]/10 text-[#ff4d2d]' onClick={handleDelete}><FaRegTrashCan size={17} /></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OwnerItemCard