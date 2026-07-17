import axios from 'axios';
import { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { ClipLoader } from "react-spinners"
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const SignUp = () => {
    const primaryColor = '#ff5722';
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("user");
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()


    const handleSignUp = async () => {
        setLoading(true)
        try {
            setError("");
            const result = await axios.post(`${serverUrl}/api/auth/signup`, {
                fullname: fullName.trim(),
                email: email.trim(),
                password,
                mobile: mobile.trim(),
                role
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
        if (!mobile) {
            return setError("mobile no. is required")
        }
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        try {
            const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {
                fullname: result.user.displayName,
                email: result.user.email,
                role,
                mobile
            }, { withCredentials: true })
            dispatch(setUserData(data))
            navigate("/")
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            setError(message);  //  show error on UI instead of console.log
            console.log(error)
        }
    }
    return (
        <div className='min-h-screen max-w-full flex items-center justify-center p-2 ' style={{ backgroundColor: bgColor }}>
            <div className='w-full max-w-md bg-white rounded-lg shadow-md p-8 border-1.5' style={{ borderColor: borderColor }} >
                <h1 className='font-bold text-3xl text-center ' style={{ color: primaryColor }}>KHANA KHAJANA</h1>
                <p className='font text-gray-600 text-center mb-6 pt-6'>
                    Create your account to get started with delicious food and deliveries
                </p>
                {/*fullname*/}
                <div className='mb-4'>
                    <label htmlFor='fullName' className='block text-gray-700 font-medium mb-1'>Full Name</label>
                    <input type='text' className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your fullName here..' onChange={(e) => setFullName(e.target.value)} value={fullName} required />

                </div>

                {/*email*/}
                <div className='mb-4'>
                    <label htmlFor='fullName' className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type='email' className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your Email ' onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>

                {/*mobile*/}
                <div className='mb-4'>
                    <label htmlFor='fullName' className='block text-gray-700 font-medium mb-1'>Mobile Number</label>
                    <input type='text' className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your Mobile Number' onChange={(e) => setMobile(e.target.value)} value={mobile} required />
                </div>

                {/* Password */}
                <div className='mb-4'>
                    <label
                        htmlFor='password'
                        className='block text-gray-700 font-medium mb-1'
                    >
                        Password
                    </label>

                    <div className='relative'>
                        <input
                            id='password'
                            type={showPassword ? "text" : "password"}
                            className='w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-orange-500'
                            placeholder='Enter your Password'
                            value={password} required
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            type='button'
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                            onClick={() => setShowPassword(prev => !prev)}>

                            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                        </button>

                    </div>
                </div>

                {/*role*/}
                <div className='mb-4'>
                    <label htmlFor='role' className='block text-gray-700 font-medium mb-1'>Role</label>
                    <div className='flex gap-2'>
                        {["user", "owner", "deliveryBoy"].map((r) => {
                            return (
                                <button type='button' key={r} className='flex-1 border rounded-lg px-3 py-2 text-center font-medium transition-colors'
                                    onClick={() => setRole(r)}
                                    style={
                                        role == r ? { backgroundColor: primaryColor, color: "white" } : { border: `1px solid ${primaryColor}`, color: primaryColor }
                                    }

                                >{r}</button>
                            )
                        })}
                    </div>
                </div>
                <button type='button' className={`w-full font-semibold flex items-center justify-center p-3 border rounded-lg text-m transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignUp} disabled={loading}>
                    {loading ? <ClipLoader size={20} color='white' /> : "SignUp"}
                </button>
                {error && <p className='text-sm text-red-600 mb-3'>{error}</p>}

                <button type='button' className='w-full font-semibold flex items-center justify-center p-3 mt-2 border rounded-lg text-m transition duration-200 border-gray-200 hover:bg-gray-200 cursor-pointer' onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign up with Google</span>
                </button>
                <p className='text-sm ml-5 m-4' onClick={() => navigate("/signin")}>
                    Already have an account ? <span className='text-[#ff4d2d] cursor-pointer mt-4'>Sign In</span>
                </p>
            </div>

        </div>
    )
}

export default SignUp
