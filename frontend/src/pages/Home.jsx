import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

const Home = () => {
    const { userData } = useSelector(state => state.user)
    return (
        <div className='w-full min-h-screen pt-[70px] sm:pt-[80px] flex flex-col items-center bg-[#fff9f6]'>
            {userData?.role === "user" && <UserDashboard />}
            {userData?.role === "owner" && <OwnerDashboard />}
            {userData?.role === "deliveryBoy" && <DeliveryBoy />}
        </div>
    )
}

export default Home