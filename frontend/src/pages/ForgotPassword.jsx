import axios from 'axios';
import React, { useState } from 'react'
import { IoArrowBackSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { ClipLoader } from "react-spinners"

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)




    const handleSendOtp = async () => {
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/send-otp`, { email },
                { withCredentials: true })
            console.log(result)
            setError("")
            setStep(2)
            setLoading(false)
        } catch (error) {
            setError(error?.response?.data?.message)
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        try {
            setLoading(true)
            const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp },
                { withCredentials: true })
            console.log(result)
            setError("")
            setStep(3)
            setLoading(false)
        } catch (error) {
            setError(error?.response?.data?.message)
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (newPassword != confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            setLoading(true)
            const result = await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword },
                { withCredentials: true })
            setError("")
            console.log(result)
            setLoading(false)
            navigate("/signin")
        } catch (error) {
            setError(error?.response?.data?.message)
            setLoading(false)
        }
    }
    return (
        <div className='flex items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
                <div className='flex items-center gap-4 mb-4'>
                    <IoArrowBackSharp className='text-[#ff5722] cursor-pointer' size={20} onClick={() => navigate("/signin")} />

                    <h1 className='text-2xl font-bold text-center text-[#cd502a]'>Forgot Password</h1>
                </div>
                {step == 1
                    &&
                    <div>
                        <div className='mb-4'>
                            <label htmlFor='email' className='block text-gray-700 font-medium mb-1'>Email</label>
                            <input type='email' className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your Email ' onChange={(e) => setEmail(e.target.value)} value={email} required />
                        </div>
                        <button type='button' className={`w-full font-semibold flex items-center justify-center p-2 border rounded-lg text-m transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSendOtp} disabled={loading} >
                            {loading ? <ClipLoader size={20} color='white' /> : "Send OTP"}
                        </button>
                        {error && <p className='text-sm text-red-600 mb-3'>{error}</p>}
                    </div>
                }
                {step == 2
                    &&
                    <div>
                        <div className='mb-4'>
                            <label htmlFor='otp' className='block text-gray-700 font-medium ml-1 mb-1'>Enter your OTP below</label>
                            <input type='text' className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter OTP ' onChange={(e) => setOtp(e.target.value)} value={otp} required />
                        </div>
                        <button type='button' className={`w-full font-semibold flex items-center justify-center p-2 border rounded-lg text-m transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? <ClipLoader size={20} color='white' /> : "Verify OTP"}
                        </button>
                        {error && <p className='text-sm text-red-600 mb-3'>{error}</p>}
                    </div>
                }

                {step == 3
                    &&
                    <div>
                        <div className='mb-4'>
                            <label htmlFor='newPassword' className='block text-gray-700 font-medium ml-1 mb-1'>Enter New Password</label>
                            <input type='password' className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter NewPassword' onChange={(e) => setNewPassword(e.target.value)} value={newPassword} />
                        </div>
                        <div className='mb-4'>
                            <label htmlFor='confirmPassword' className='block text-gray-700 font-medium ml-1 mb-1'>Confirm Password</label>
                            <input type='password' className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required />
                        </div>
                        <button type='button' className={`w-full font-semibold flex items-center justify-center p-2 border rounded-lg text-m transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleResetPassword} disabled={loading}>
                            {loading ? <ClipLoader size={20} color='white' /> : "Reset Password"}
                        </button>
                        {error && <p className='text-sm text-red-600 mb-3'>{error}</p>}
                    </div>
                }
            </div>
        </div>
    )
}

export default ForgotPassword