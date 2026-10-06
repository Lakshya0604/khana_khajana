import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

const AdminPayouts = () => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [error, setError] = useState("")
    const load = async () => {
        try {
            const r = await axios.get(`${serverUrl}/api/user/admin/payouts`, { withCredentials: true })
            setData(r.data)
        } catch (e) { setError(e.response?.status === 403 ? "This page is only for the platform admin." : "Could not load") }
    }
    useEffect(() => { load() }, [])
    const [msg, setMsg] = useState("")
    const changeMode = async (mode) => {
        setMsg("")
        try {
            await axios.post(`${serverUrl}/api/user/admin/payout-mode`, { mode }, { withCredentials: true })
            load()
        } catch (e) { setMsg(e.response?.data?.message || "Could not change mode") }
    }
    const markPaid = async (row) => {
        if (!window.confirm(`Mark ₹${row.owed} as paid to ${row.name}? Do this only after you sent it by UPI.`)) return
        await axios.post(`${serverUrl}/api/user/admin/mark-paid`, { userId: row.userId, kind: row.kind }, { withCredentials: true })
        load()
    }
    return (
        <div className='min-h-screen bg-[#fff9f6] p-4 flex flex-col items-center gap-4'>
            <div className='w-full max-w-3xl flex items-center gap-3'>
                <button onClick={() => navigate("/")} className='text-[#ff4d2d]'>Back</button>
                <h1 className='text-xl font-bold text-gray-800'>Payouts owed (not yet paid)</h1>
            </div>
            {error && <p className='text-red-500'>{error}</p>}
            {data && <>
                <div className='w-full max-w-3xl bg-white rounded-2xl shadow p-4 border border-orange-100 text-sm'>
                    <p className='font-semibold text-gray-800 mb-2'>Payout mode</p>
                    <div className='flex flex-wrap gap-2'>
                        {[['simulation', 'Simulation (demo, no real money)'], ['manual', 'Manual (I send UPI myself)'], ['real', 'Real (RazorpayX)']].map(([m, l]) => (
                            <button key={m} onClick={() => changeMode(m)} className={`px-3 py-1 rounded-lg border ${data.mode === m ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'text-gray-700'}`}>{l}</button>
                        ))}
                    </div>
                    {!data.realConfigured && <p className='text-xs text-gray-500 mt-2'>Real mode needs a RazorpayX business account and its keys on the server.</p>}
                    {msg && <p className='text-xs text-red-500 mt-1'>{msg}</p>}
                </div>
                <p className='text-gray-700'>Total owed: <b>₹{data.totalOwed}</b></p>
                <div className='w-full max-w-3xl bg-white rounded-2xl shadow p-4 border border-orange-100'>
                    {data.list.length === 0 && <p className='text-sm text-gray-400'>Nothing owed right now.</p>}
                    {data.list.map(r => (
                        <div key={r.userId + r.kind} className='flex flex-wrap justify-between items-center gap-2 py-3 border-b last:border-0 text-sm'>
                            <div>
                                <p className='font-medium text-gray-800'>{r.name} <span className='text-xs text-gray-500'>({r.kind === 'owner' ? 'restaurant' : 'delivery partner'}, {r.count} orders)</span></p>
                                <p className='text-xs text-gray-500'>{r.mobile} - {r.email}</p>
                                <p className={r.upiId ? 'text-xs text-gray-700' : 'text-xs text-red-500'}>UPI: {r.upiId || "not added yet"}</p>
                            </div>
                            <div className='flex items-center gap-3'>
                                <span className='font-bold text-green-600'>₹{r.owed}</span>
                                <button onClick={() => markPaid(r)} className='bg-[#ff4d2d] text-white px-3 py-1 rounded-lg'>Mark paid</button>
                            </div>
                        </div>
                    ))}
                </div>
            </>}
        </div>
    )
}
export default AdminPayouts
