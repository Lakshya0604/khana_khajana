import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import { serverUrl } from '../App'

const Earnings = () => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [error, setError] = useState("")
    const [upi, setUpi] = useState("")
    const [saving, setSaving] = useState(false)
    const [note, setNote] = useState("")

    const load = async () => {
        try {
            const r = await axios.get(`${serverUrl}/api/user/earnings`, { withCredentials: true })
            setData(r.data)
            setUpi(r.data.upiId || "")
        } catch (e) {
            setError(e.response?.data?.message || "Could not load earnings")
        }
    }
    useEffect(() => { load() }, [])

    const saveUpi = async () => {
        setNote(""); setSaving(true)
        try {
            await axios.post(`${serverUrl}/api/user/upi`, { upiId: upi }, { withCredentials: true })
            setNote("UPI ID saved")
            load()
        } catch (e) {
            setNote(e.response?.data?.message || "Could not save UPI ID")
        }
        setSaving(false)
    }

    return (
        <div className='min-h-screen bg-[#fff9f6] flex flex-col items-center p-4 gap-4'>
            <div className='w-full max-w-2xl flex items-center gap-3'>
                <button onClick={() => navigate("/")} className='flex items-center gap-2 text-[#ff4d2d]'><FaArrowLeft /> Back</button>
                <h1 className='text-xl font-bold text-gray-800'>My Earnings</h1>
            </div>
            {error && <p className='text-red-500'>{error}</p>}
            {data && <>
                <div className='w-full max-w-2xl grid grid-cols-3 gap-3'>
                    {[['Today', data.today], ['Total earned', data.total], ['To be paid out', data.unpaid]].map(([l, v]) => (
                        <div key={l} className='bg-white rounded-2xl shadow p-4 text-center border border-orange-100'>
                            <p className='text-xs text-gray-500'>{l}</p>
                            <p className='text-2xl font-bold text-green-600'>₹{v}</p>
                        </div>
                    ))}
                </div>
                <div className='w-full max-w-2xl bg-white rounded-2xl shadow p-4 border border-orange-100'>
                    <h2 className='font-semibold text-gray-800 mb-1'>Payout UPI ID</h2>
                    <p className='text-xs text-gray-500 mb-3'>{data.role === 'owner' ? 'Your share of online orders (food total) is paid to this UPI ID.' : 'Your earnings are paid to this UPI ID.'} Payouts are done manually by the Khana Khajana team for now.</p>
                    <div className='flex gap-2'>
                        <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder='yourname@bank' className='flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400' />
                        <button onClick={saveUpi} disabled={saving} className='bg-[#ff4d2d] text-white px-4 rounded-lg text-sm'>{saving ? "Saving..." : "Save"}</button>
                    </div>
                    {note && <p className='text-sm mt-2 text-gray-600'>{note}</p>}
                </div>
                <div className='w-full max-w-2xl bg-white rounded-2xl shadow p-4 border border-orange-100'>
                    <h2 className='font-semibold text-gray-800 mb-3'>Deliveries</h2>
                    {data.deliveries.length === 0 ? <p className='text-sm text-gray-400'>{data.role === 'owner' ? 'No paid-out-eligible orders yet. Online-paid orders show here once delivered.' : 'No completed deliveries yet. You earn ₹40 for every delivery.'}</p> :
                        data.deliveries.map(d => (
                            <div key={d.id} className='flex justify-between items-center py-2 border-b last:border-0 text-sm'>
                                <div>
                                    <p className='font-medium text-gray-800'>{d.shopName || "Delivery"}</p>
                                    <p className='text-xs text-gray-500'>{new Date(d.deliveredAt).toLocaleString()} - {d.payoutStatus === "paid" ? "paid out" : "pending payout"}</p>
                                </div>
                                <span className='font-semibold text-green-600'>+₹{d.amount}</span>
                            </div>
                        ))}
                </div>
            </>}
        </div>
    )
}

export default Earnings
