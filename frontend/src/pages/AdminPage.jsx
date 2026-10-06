import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import AdminPayouts from './AdminPayouts'
import Spinner from '../components/Spinner'

const api = (p) => axios.get(`${serverUrl}/api/admin/${p}`, { withCredentials: true })
const rs = (n) => `₹${Math.round((n || 0) * 100) / 100}`
const when = (d) => d ? new Date(d).toLocaleString() : '-'
const Card = ({ label, value, sub }) => (
    <div className='bg-white rounded-2xl shadow p-4 border border-orange-100'>
        <p className='text-xs text-gray-500'>{label}</p>
        <p className='text-xl font-bold text-gray-800'>{value}</p>
        {sub && <p className='text-xs text-gray-400'>{sub}</p>}
    </div>
)

const Overview = () => {
    const [d, setD] = useState(null)
    useEffect(() => { api('overview').then(r => setD(r.data)).catch(() => { }) }, [])
    if (!d) return <Spinner />
    const m = d.money
    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <Card label='Orders today' value={d.ordersToday} sub={`${d.ordersAll} all time`} />
                <Card label='Customers' value={d.users.user || 0} />
                <Card label='Restaurant owners' value={d.users.owner || 0} sub={`${d.shops.real} shops, ${d.shops.listings} listings`} />
                <Card label='Delivery partners' value={d.users.deliveryBoy || 0} />
            </div>
            <div className='bg-white rounded-2xl shadow p-4 border border-orange-100'>
                <p className='font-semibold text-gray-800 mb-2'>Order status (per restaurant order)</p>
                <div className='flex flex-wrap gap-2 text-sm'>
                    {Object.entries(d.shopOrderStatus).map(([k, v]) => <span key={k} className='px-3 py-1 rounded-full bg-orange-50 text-[#ff4d2d]'>{k}: {v}</span>)}
                </div>
            </div>
            <p className='font-semibold text-gray-800'>Money (payout mode: {d.mode})</p>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <Card label='Online collected (Razorpay)' value={rs(m.onlineCollected)} sub='food + delivery fee' />
                <Card label='COD food collected by riders' value={rs(m.codDeliveredFood)} />
                <Card label='COD deposits pending' value={rs(m.codPendingDeposits)} sub={`${rs(m.codDeposited)} deposited`} />
                <Card label='Owners: owed / paid' value={`${rs(m.ownerOwed)} / ${rs(m.ownerPaid)}`} />
                <Card label='Riders: owed / paid' value={`${rs(m.riderOwed)} / ${rs(m.riderPaid)}`} />
            </div>
            <p className='text-xs text-gray-400'>Real owner/rider payouts and deposits are simulated while the mode is simulation.</p>
        </div>
    )
}

const Orders = () => {
    const [list, setList] = useState(null)
    const [f, setF] = useState('all')
    const load = () => api('orders?limit=150').then(r => setList(r.data)).catch(() => { })
    useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [])
    if (!list) return <Spinner />
    const live = (o) => o.shopOrders.some(s => s.status !== 'delivered')
    const shown = list.filter(o => f === 'all' ? true : f === 'live' ? live(o) : !live(o))
    return (
        <div>
            <div className='flex gap-2 mb-3 text-sm'>
                {['all', 'live', 'completed'].map(x => <button key={x} onClick={() => setF(x)} className={`px-3 py-1 rounded-lg border ${f === x ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'text-gray-700'}`}>{x}</button>)}
                <span className='text-xs text-gray-400 self-center'>auto-refresh every 20s</span>
            </div>
            <div className='space-y-3'>
                {shown.length === 0 && <p className='text-sm text-gray-400'>No orders.</p>}
                {shown.map(o => (
                    <div key={o.id} className='bg-white rounded-xl shadow p-3 border border-orange-100 text-sm'>
                        <div className='flex flex-wrap justify-between gap-2'>
                            <span className='font-medium text-gray-800'>{o.customer?.fullname} <span className='text-xs text-gray-500'>{o.customer?.mobile}</span></span>
                            <span className='font-bold text-green-600'>{rs(o.total)} <span className='text-xs text-gray-500'>({o.paymentMethod}{o.paymentMethod === 'online' ? (o.paid ? ', paid' : ', unpaid') : ''}, fee {rs(o.deliveryFee)})</span></span>
                        </div>
                        <p className='text-xs text-gray-500'>{when(o.createdAt)} - {o.address}</p>
                        {o.shopOrders.map((s, i) => <p key={i} className='text-xs text-gray-700 mt-1'>{s.shop}: <b className='text-[#ff4d2d]'>{s.status}</b> ({rs(s.subTotal)}){s.rider ? ` - rider ${s.rider}` : ''}</p>)}
                    </div>
                ))}
            </div>
        </div>
    )
}

const Users = () => {
    const [list, setList] = useState(null)
    const [role, setRole] = useState('all')
    const load = () => api('users').then(r => setList(r.data)).catch(() => { })
    useEffect(() => { load() }, [])
    const toggle = async (u) => {
        if (!window.confirm(`${u.blocked ? 'Unblock' : 'Block'} ${u.fullname}?`)) return
        await axios.post(`${serverUrl}/api/admin/user-blocked`, { userId: u._id, blocked: !u.blocked }, { withCredentials: true }).catch(e => alert(e.response?.data?.message || 'failed'))
        load()
    }
    if (!list) return <Spinner />
    const shown = list.filter(u => role === 'all' || u.role === role)
    return (
        <div>
            <div className='flex gap-2 mb-3 text-sm'>
                {['all', 'user', 'owner', 'deliveryBoy'].map(x => <button key={x} onClick={() => setRole(x)} className={`px-3 py-1 rounded-lg border ${role === x ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'text-gray-700'}`}>{x === 'user' ? 'customers' : x === 'deliveryBoy' ? 'riders' : x === 'owner' ? 'owners' : 'all'}</button>)}
                <span className='text-xs text-gray-400 self-center'>{shown.length} people</span>
            </div>
            <div className='bg-white rounded-2xl shadow border border-orange-100 divide-y'>
                {shown.map(u => (
                    <div key={u._id} className='p-3 flex flex-wrap justify-between items-center gap-2 text-sm'>
                        <div>
                            <p className='font-medium text-gray-800'>{u.fullname} <span className='text-xs text-gray-500'>({u.role === 'deliveryBoy' ? 'rider' : u.role === 'user' ? 'customer' : u.role})</span> {u.blocked && <span className='text-xs text-red-500'>BLOCKED</span>}</p>
                            <p className='text-xs text-gray-500'>{u.email} - {u.mobile}{u.upiId ? ` - UPI ${u.upiId}` : ''}</p>
                            <p className='text-xs text-gray-400'>Joined {when(u.createdAt)}</p>
                        </div>
                        {u.role !== 'user' && <button onClick={() => toggle(u)} className={`px-3 py-1 rounded-lg text-white ${u.blocked ? 'bg-green-600' : 'bg-red-500'}`}>{u.blocked ? 'Unblock' : 'Block'}</button>}
                    </div>
                ))}
            </div>
        </div>
    )
}

const Shops = () => {
    const [d, setD] = useState(null)
    const load = () => api('shops').then(r => setD(r.data)).catch(() => { })
    useEffect(() => { load() }, [])
    const toggle = async (s) => {
        await axios.post(`${serverUrl}/api/admin/shop-hidden`, { shopId: s._id, hidden: !s.hidden }, { withCredentials: true })
        load()
    }
    if (!d) return <Spinner />
    return (
        <div>
            <p className='text-xs text-gray-500 mb-2'>Restaurants registered by owners. {d.listings} Zomato-sourced listing shops are not shown here.</p>
            <div className='bg-white rounded-2xl shadow border border-orange-100 divide-y'>
                {d.shops.length === 0 && <p className='p-3 text-sm text-gray-400'>No owner restaurants yet.</p>}
                {d.shops.map(s => (
                    <div key={s._id} className='p-3 flex flex-wrap justify-between items-center gap-2 text-sm'>
                        <div>
                            <p className='font-medium text-gray-800'>{s.name} {s.hidden && <span className='text-xs text-red-500'>HIDDEN</span>}</p>
                            <p className='text-xs text-gray-500'>{s.city}, {s.state} - owner {s.owner?.fullname} ({s.owner?.email})</p>
                        </div>
                        <button onClick={() => toggle(s)} className={`px-3 py-1 rounded-lg text-white ${s.hidden ? 'bg-green-600' : 'bg-red-500'}`}>{s.hidden ? 'Show' : 'Hide from customers'}</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const AdminPage = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const signOut = async () => {
        try { await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true }) } catch (e) { }
        dispatch(setUserData(null))
        navigate('/signin')
    }
    const [tab, setTab] = useState('overview')
    const [ok, setOk] = useState(null)
    useEffect(() => { api('overview').then(() => setOk(true)).catch(() => setOk(false)) }, [])
    if (ok === false) return <div className='min-h-screen flex items-center justify-center text-gray-500'>This page is only for the platform admin.</div>
    const tabs = [['overview', 'Overview'], ['orders', 'Orders'], ['users', 'People'], ['shops', 'Restaurants'], ['payouts', 'Payouts and deposits']]
    return (
        <div className='min-h-screen bg-[#fff9f6] p-4 flex flex-col items-center'>
            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-3 mb-3'>
                    <h1 className='text-xl font-bold text-gray-800'>Admin control room</h1>
                    <button onClick={signOut} className='ml-auto text-sm text-[#ff4d2d] underline'>Sign out</button>
                </div>
                <div className='flex flex-wrap gap-2 mb-4 text-sm'>
                    {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg border ${tab === k ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-700'}`}>{l}</button>)}
                </div>
                {tab === 'overview' && <Overview />}
                {tab === 'orders' && <Orders />}
                {tab === 'users' && <Users />}
                {tab === 'shops' && <Shops />}
                {tab === 'payouts' && <AdminPayouts embedded />}
            </div>
        </div>
    )
}
export default AdminPage
