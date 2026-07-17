import axios from 'axios';
import { useState } from 'react'
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { ClipLoader } from "react-spinners"
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const SignIn = () => {
    const primaryColor = '#ff5722';
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()


    const handleSignIn = async () => {
        setLoading(true)
        try {
            setError("");
            const result = await axios.post(`${serverUrl}/api/auth/signin`, {
                email: email.trim(),
                password
            }, { withCredentials: true })
            dispatch(setUserData(result.data))
            setLoading(false)
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data || error.message;
            setError(message);
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        try {
            const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {
                email: result.user.email,
                fullname: result.user.displayName,
                photoURL: result.user.photoURL,
            }, { withCredentials: true })
            dispatch(setUserData(data))
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <div className='min-h-screen max-w-full flex items-center justify-center p-2 ' style={{ backgroundColor: bgColor }}>
            <div className='w-full max-w-md bg-white rounded-lg shadow-md p-8 border-1.5' style={{ borderColor: borderColor }} >
                <h1 className='font-bold text-3xl text-center ' style={{ color: primaryColor }}>KHANA KHAJANA</h1>
                <p className='font text-gray-600 text-center mb-6 pt-6'>
                    Sign In your account to get started with delicious food and deliveries
                </p>

                {/*email*/}
                <div className='mb-4'>
                    <label htmlFor='fullName' className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type='email' className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your Email ' onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>

                {/* Password */}
                <div className='mb-2'>
                    <label
                        htmlFor='password'
                        className='block text-gray-700 font-medium mb-1'
                    >
                        Password
                    </label>

                    <div className='relative'>
                        <input
                            id='password'
                            type={`${showPassword ? 'text' : 'password'}`}
                            className='w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-orange-500'
                            placeholder='Enter your Password'
                            onChange={(e) => setPassword(e.target.value)} value={password} required
                        />

                        <button
                            type='button'
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                        </button>
                    </div>
                </div>
                <div className='text-right m-2 text-sm text-[#ff4d2d] cursor-pointer' onClick={() => navigate("/forgot-password")}>
                    Forgot Password
                </div>

                {error && <p className='text-sm text-red-600 mb-3'>{error}</p>}
                <button type='button' className={`w-full font-semibold flex items-center justify-center p-3 border rounded-lg text-m transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignIn} disabled={loading}>
                    {loading ? <ClipLoader size={20} color='white' /> : "SignIn"}
                </button>

                <button type='button' className='w-full font-semibold flex items-center justify-center p-3 mt-2 border rounded-lg text-m transition duration-200 border-gray-200 hover:bg-gray-200 cursor-pointer' onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign in with Google</span>
                </button>
                <p className='text-sm ml-5 m-4' onClick={() => navigate("/signUp")}>
                    Want to create a new account  ? <span className='text-[#ff4d2d] cursor-pointer mt-4'>Sign Up</span>
                </p>
            </div>

        </div>
    )
}

export default SignIn
