import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ClipLoader } from 'react-spinners'

const DeliveryBoy = () => {
    const { userData, socket } = useSelector(state => state.user)
    const [currentOrder, setCurrentOrder] = useState()
    const [showOtpBox, setShowOtpBox] = useState(false)
    const [availableAssignment, setAvailableAssignment] = useState(null)
    const [otp, setOtp] = useState("")
    const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null)
    const [todayDeliveries, setTodayDeliveries] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const navigate = useNavigate()
    const [locState, setLocState] = useState("checking") // checking | on | off
    const [earn, setEarn] = useState(null)

    useEffect(() => {
        if (!socket || userData.role !== 'deliveryBoy') return
        let watchId
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition((position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                setDeliveryBoyLocation({ lat: latitude, lon: longitude })
                setLocState("on")
                axios.post(`${serverUrl}/api/user/update-location`, { lat: latitude, lon: longitude }, { withCredentials: true }).catch(() => { })
                socket.emit('updateLocation', {
                    latitude,
                    longitude,
                    userId: userData._id
                })
            },
                (error) => {
                    console.log(error)
                    setLocState("off")
                },
                {
                    enableHighAccuracy: true
                })
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
        }
    }, [socket, userData])


    const loadEarnings = async () => {
        try {
            const r = await axios.get(`${serverUrl}/api/user/earnings`, { withCredentials: true })
            setEarn(r.data)
        } catch (e) { console.log(e) }
    }
    const retryLocation = () => {
        setLocState("checking")
        navigator.geolocation?.getCurrentPosition(
            (p) => {
                setDeliveryBoyLocation({ lat: p.coords.latitude, lon: p.coords.longitude })
                setLocState("on")
                axios.post(`${serverUrl}/api/user/update-location`, { lat: p.coords.latitude, lon: p.coords.longitude }, { withCredentials: true }).then(() => getAssignments()).catch(() => { })
            },
            () => setLocState("off"),
            { enableHighAccuracy: true }
        )
    }





    const getAssignments = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })
            setAvailableAssignment(result.data)
        } catch (error) {
            console.log(error)
        }
    }

    const getCurrentOrder = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })
            setCurrentOrder(result.data)
        } catch (error) {
            console.log(error)
        }
    }

    const acceptOrder = async (assignmentId) => {
        try {
            await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, { withCredentials: true })
            await getCurrentOrder()
            setAvailableAssignment(prev => prev ? prev.filter(a => a.assignmentId !== assignmentId) : prev)
        } catch (error) {
            console.log(error.response?.data?.message || error.message)
        }
    }

    const sendOtp = async () => {
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/order/send-delivery-otp`, {
                orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id
            }, { withCredentials: true })
            setLoading(false)
            setShowOtpBox(true)
            console.log(result.data)
        } catch (error) {
            console.log(error)
            alert(error.response?.data?.message || "Could not send OTP")
            setLoading(false)
        }
    }

    const verifyOtp = async () => {
        setMessage("")
        try {
            const result = await axios.post(`${serverUrl}/api/order/verify-delivery-otp`, {
                orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id, otp
            }, { withCredentials: true })
            console.log(result.data)
            setMessage(result.data.message)
            location.reload()
        } catch (error) {
            console.log(error)
        }
    }

    const handleTodayDeliveries = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries`, { withCredentials: true })
            console.log(result.data)
            setTodayDeliveries(result.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!socket || !userData) return

        socket.on('newAssignment', (data) => {
            if (String(data.sentTo) === String(userData._id)) {
                setAvailableAssignment(prev => [ ...(prev || []), data ])
            }
        })
        socket.on('assignmentAccepted', (data) => {
            console.log('socket assignmentAccepted received (delivery):', data)
            const assignedId = data?.assignedDeliveryBoy?._id || data?.assignedDeliveryBoy?.id
            if (assignedId && String(assignedId) === String(userData._id)) {
                getCurrentOrder()
                setAvailableAssignment(prev => prev ? prev.filter(a => a.assignmentId !== data.assignmentId) : [])
            }
        })
        return () => {
            socket.off('newAssignment')
            socket.off('assignmentAccepted')
        }
    }, [socket, userData])

    useEffect(() => {
        getAssignments()
        getCurrentOrder()
        handleTodayDeliveries()
        loadEarnings()
    }, [userData])
    return (
        <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
            <Nav />
            <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
                <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-3'>
                    <h1 className='text-2xl font-bold text-[#ff4d2d]'>Welcome, {userData.fullname}</h1>
                    <p className='text-orange-500'><span className='text-gray-500 font-semibold'>Latitude:</span> {deliveryBoyLocation?.lat} , <span className='text-gray-500 font-semibold'>Longitude:</span> {deliveryBoyLocation?.lon}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md ps-5 w-[90%] border border-orange-100'>
                    <h1 className='text-lg font-bold mb-3 text-[#ff4d2d]'>Today Deliveries</h1>
                    <ResponsiveContainer width='100%' height={200}>
                        <BarChart data={todayDeliveries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                            <YAxis allowDecimals={false} />
                            <Tooltip formatter={(value) => [value, "orders"]} labelFormatter={(label) => `${label}:00`} />
                            <Bar dataKey="count" fill='#ff4d2d' />

                        </BarChart>
                    </ResponsiveContainer>
                    <div className='max-w-sm mx-auto  mb-6 pt-5 bg-white rounded-2xl shadow-lg text-center'>
                        <h1 className='text-xl font-semibold text-gray-800 mb-2'>Today's Earning</h1>
                        <span className='text-3xl font-bold text-green-600 p-2'>₹{earn ? earn.today : 0}</span>
                        <p className='text-xs text-gray-500 pb-1'>₹40 per delivery</p>
                        <button className='mb-4 text-sm text-[#ff4d2d] underline' onClick={() => navigate('/earnings')}>View all earnings and set payout UPI</button>
                    </div>
                </div>
                {earn?.deposit?.pending > 0 && <div className={`${earn.deposit.blocked ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-800'} border rounded-2xl p-4 w-[90%] text-sm`}>COD cash to deposit: ₹{earn.deposit.pending}.{earn.deposit.blocked ? ' You will not get cash orders until you deposit.' : ''} <button className='underline' onClick={() => navigate('/earnings')}>Deposit</button></div>}
                {earn && !earn.upiId && <div className='bg-yellow-50 border border-yellow-200 rounded-2xl p-4 w-[90%] text-sm text-yellow-800'>Add your payout UPI ID to get paid. <button className='underline' onClick={() => navigate('/earnings')}>Add now</button></div>}
                {locState !== "on" && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-red-200 text-center'>
                    <h2 className='text-lg font-bold text-red-500 mb-2'>Turn on your location</h2>
                    <p className='text-sm text-gray-600 mb-3'>{locState === "checking" ? "Checking your location..." : "Orders are only shown to delivery partners with location ON, and only within 5 km of you. Allow location access in your browser, then tap the button."}</p>
                    <button className='bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-sm' onClick={retryLocation}>Turn on location</button>
                </div>}
                {locState === "on" && !currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100 '>
                    <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Order</h1>
                    <div className='space-y-4'>
                        {availableAssignment?.length > 0
                            ?
                            (
                                availableAssignment.map((a, index) => (
                                    <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                                        <div className='mt-2'>
                                            <p className='text-sm font-semibold'>
                                                {a?.shopName}
                                            </p>
                                            <p className='text-sm text-gray-500'><span className='text-gray-800'>Delivery Address : </span>{a?.deliveryAddress.text}</p>
                                            <p className='text-sm text-gray-500'><span className='text-gray-800 '>No Of Items and Total : </span>{a.items.length} || {a.subTotal}</p>
                                            <p className='text-sm text-green-600 font-medium'>You earn ₹40{a.distanceKm !== undefined ? ` - ${a.distanceKm} km from you` : ''}</p>
                                        </div>
                                        <button className='bg-orange-400 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-500 cursor-pointer' onClick={() => acceptOrder(a.assignmentId)}>Accept</button>
                                    </div>
                                ))
                            ) : <p className='text-gray-400 text-sm'> No Available Orders</p>}

                    </div>

                </div>}

                {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
                    <h2 className='text-lg font-bold mb-3'>📦Current Order</h2>
                    <div className='border rounded-lg p-4 mb-3 '>
                        <p className='font-semibold text-sm'>{currentOrder?.shopOrder?.shop.name}</p>
                        <p className='text-sm text-gray-500'>{currentOrder?.deliveryAddress?.text}</p>
                        <p className='text-xs text-gray-600'>{currentOrder?.shopOrder?.shopOrderItems.length} items | {currentOrder?.shopOrder?.subTotal}</p>
                    </div>
                    <DeliveryBoyTracking data={{
                        deliveryBoyLocation: deliveryBoyLocation || {
                            lat: userData?.location?.coordinates[1],
                            lon: userData?.location?.coordinates[0]
                        },
                        customerLocation: {
                            lat: currentOrder?.deliveryAddress?.latitude,
                            lon: currentOrder?.deliveryAddress?.longitude
                        }
                    }} />
                    {!showOtpBox ? <button className='mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition-all duration-200 cursor-pointer' onClick={sendOtp} disabled={loading}>
                        {loading ? <ClipLoader size={20} color='white' /> : "Mark as delivered"}
                    </button> : <div className='mt-4 p-4 rounded-xl bg-gray-50'>
                        <p className='text-sm font-semibold mb-2'>
                            Enter Otp send to <span className='text-orange-500'>{currentOrder?.user?.fullname}</span>
                        </p>
                        <input type="text" className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' placeholder='Enter Otp' onChange={(e) => setOtp(e.target.value)} value={otp} />
                        {message && <p className='text-center text-green-400'>{message}</p>}
                        <button className='w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:orange-600 transition-all' onClick={verifyOtp}>Submit Otp</button>
                    </div>}

                </div>}
            </div>
        </div>
    )
}

export default DeliveryBoy