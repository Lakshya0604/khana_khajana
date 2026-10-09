import React, { useEffect, useState } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { TbCurrentLocation } from "react-icons/tb";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css"
import { setAddress, setLocation } from '../redux/mapSlice';
import { MdDeliveryDining } from "react-icons/md";
import { IoIosPhonePortrait } from "react-icons/io";
import { FaCreditCard } from "react-icons/fa";
import axios from 'axios';
import { serverUrl } from '../App';
import { addMyOrder, clearCart } from '../redux/userSlice';
import { ClipLoader } from 'react-spinners';


function RecenterMap({ location }) {
    const map = useMap()
    useEffect(() => {
        if (location?.lat && location?.lon) {
            map.setView([location.lat, location.lon], 16, { animate: true })
        }
    }, [location?.lat, location?.lon, map])
    return null
}


const CheckOut = () => {
    const navigate = useNavigate()
    const apikey = import.meta.env.VITE_GEOAPIKEY
    const { location, address } = useSelector(state => state.map)
    const { cartItems, totalAmount, userData } = useSelector(state => state.user)
    const [addressInput, setAddressInput] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cod")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()
    // Flat Rs 40 per restaurant delivery (the server computes the same amount)
    const shopCount = new Set((cartItems || []).map(i => String(i.shop))).size || 1
    const deliveryFee = 40 * shopCount
    const amountWithDeliveryFee = totalAmount + deliveryFee
    const onDragEnd = (e) => {
        const { lat, lng } = e.target._latlng
        dispatch(setLocation({ lat, lon: lng }))
        getAddressByLatLng(lat, lng)

    }

    const getCurrentLocation = () => {
        const latitude = userData.location.coordinates[1]
        const longitude = userData.location.coordinates[0]
        dispatch(setLocation({ lat: latitude, lon: longitude }))
        getAddressByLatLng(latitude, longitude)

    }


    const getAddressByLatLng = async (lat, lng) => {
        try {
            const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`)
            dispatch(setAddress(result?.data?.results[0].address_line2))
        } catch (error) {
            console.log(error)
        }

    }

    const getLatLngByAddress = async () => {
        try {
            const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apikey}`)
            const { lat, lon } = result.data.features[0].properties
            dispatch(setLocation({ lat, lon }))
        } catch (error) {
            console.log(error)
        }

    }

    const handlePlaceOrder = async () => {
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/order/place-order`, {
                paymentMethod, deliveryAddress: {
                    text: addressInput,
                    latitude: location.lat,
                    longitude: location.lon
                },
                totalAmount: amountWithDeliveryFee,
                cartItems
            }, { withCredentials: true })
            if (paymentMethod == 'cod') {

                dispatch(addMyOrder(result.data))
                dispatch(clearCart())
                navigate("/order-placed")
            } else {
                const orderId = result.data.orderId
                const razorOrder = result.data.razorOrder
                openRazorpayWindow(orderId, razorOrder)
                setLoading(false)
            }
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    const openRazorpayWindow = async (orderId, razorOrder) => {
        let keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
        try {
            const k = await axios.get(`${serverUrl}/api/order/razorpay-key`, { withCredentials: true })
            if (k.data?.keyId) keyId = k.data.keyId
        } catch (e) { console.log(e) }
        const options = {
            key: keyId,
            amount: razorOrder.amount,
            currency: razorOrder.currency,
            name: "Khana Khajana",
            description: "Food Order Payment",
            order_id: razorOrder.id,
            handler: async function (response) {
                try {
                    const result = await axios.post(`${serverUrl}/api/order/verify-payment`, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId
                    }, { withCredentials: true })
                    dispatch(addMyOrder(result.data))
                dispatch(clearCart())
                    navigate("/order-placed")
                } catch (error) {
                    console.log(error)
                }
            }

        }
        const rzp = new window.Razorpay(options)
        rzp.open()

    }

    useEffect(() => {
        setAddressInput(address)

    }, [address])
    return (
        <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-3 sm:p-6'>
            <div className='absolute top-[20px] left-[20px] z-10 cursor-pointer' onClick={() => navigate("/cart")}><IoArrowBack size={25} className='text-[#ff4d2d]' /></div>
            <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-4 sm:p-6 mt-10 sm:mt-0 space-y-6'>
                <h1 className='text-3xl font-bold text-gray-600'>Check Out</h1>
                <section>
                    <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-700'><FaLocationDot className='text-[#ff4d2d]' />
                        Delivery Location</h2>
                    <div className='flex gap-2 mb-3'>
                        <input type="text" className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]' placeholder='Enter your Delivery Address ' value={addressInput} onChange={(e) => {
                            setAddressInput(e.target.value)
                        }} />
                        <button className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg  flex items-center justify-center cursor-pointer" onClick={getLatLngByAddress}><IoIosSearch /></button>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-lg  flex items-center justify-center cursor-pointer" onClick={getCurrentLocation}><TbCurrentLocation /></button>
                    </div>
                    <div className='rounded-xl border overflow-hidden '>
                        <div className='h-64 w-full flex items-center justify-center'>
                            <MapContainer className='w-full h-full' center={[location?.lat ?? 20.5937, location?.lon ?? 78.9629]} zoom={16}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <RecenterMap location={location} />
                                {location?.lat && location?.lon && <Marker position={[location.lat, location.lon]} draggable eventHandlers={{ dragend: onDragEnd }}></Marker>}
                            </MapContainer>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-600'>Payment Method</h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod == "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setPaymentMethod("cod")}>

                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                                <MdDeliveryDining className='text-green-600 text-xl' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>Cash On Delivery</p>
                                <p className='text-xs text-gray-500'>Pay When Your Food Arrives</p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod == "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setPaymentMethod("online")}>
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                                <IoIosPhonePortrait className='text-purple-700 text-lg' />
                            </span>

                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                                <FaCreditCard className='text-blue-700 text-lg' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>UPI / Credit / Debit Card <span className='ml-1 text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>Recommended</span></p>
                                <p className='text-xs text-gray-500'>Pay Securely Online</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
                    <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
                        {cartItems.map((item, index) => (
                            <div key={index} className='flex justify-between text-sm text-gray-700'>
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <hr className='border-gray-200 my-2' />
                        <div className='flex justify-between font-medium text-gray-800'>
                            <span>SubTotal</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className='flex justify-between text-gray-700'>
                            <span>Delivery Fee{shopCount > 1 ? ` (₹40 x ${shopCount} restaurants)` : ""}</span>
                            <span>₹{deliveryFee}</span>

                        </div>
                        <p className='text-xs text-gray-500'>Split: restaurant gets ₹{totalAmount} (food), delivery partner gets ₹{deliveryFee}.</p>
                        <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-1'>
                            <span>Total</span>
                            <span className='text-green-500'>₹{amountWithDeliveryFee}</span>
                        </div>
                    </div>
                </section>
                <button className='w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold'
                    onClick={handlePlaceOrder}>
                    {loading ? (<ClipLoader size={20} color='#ffffff' />) : (paymentMethod == "cod" ? "Place Order" : "Pay & Place Order")}

                </button>
            </div>
        </div>

    )
}

export default CheckOut
