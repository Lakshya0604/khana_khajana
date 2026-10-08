import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import { useDispatch, useSelector } from 'react-redux'
import Home from './pages/Home'
import useGetCity from './hooks/useGetCity'
import useGetMyShop from './hooks/useGetMyShop'
import CreateEditShop from './pages/CreateEditShop'
import AddItem from './pages/AddItem'
import EditItem from './pages/EditItem'
import useGetShopByCity from './hooks/useGetShopByCity'
import useGetItemsByCity from './hooks/useGetItemsByCity'
import CartPage from './pages/CartPage'
import CheckOut from './pages/CheckOut'
import OrderPlaced from './pages/OrderPlaced'
import MyOrders from './pages/MyOrders'
import useGetMyOrders from './hooks/useGetMyOrders'
import useUpdateLocation from './hooks/useUpdateLocation'
import TrackOrderPage from './pages/TrackOrderPage'
import Shop from './pages/Shop'
import Earnings from './pages/Earnings'
import AdminPayouts from './pages/AdminPayouts'
import AdminPage from './pages/AdminPage'
import CityPicker from './components/CityPicker'
import { io } from 'socket.io-client'
import { setSocket } from './redux/userSlice'

export const serverUrl = import.meta.env.VITE_SERVER_URL

function App() {
  const authChecked = useGetCurrentUser()
  useUpdateLocation()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemsByCity()
  useGetMyOrders()

  const { userData } = useSelector(state => state.user)
  const dispatch = useDispatch()


  useEffect(() => {
    if (!userData) return
    const socketInstance = io(serverUrl, { withCredentials: true })
    dispatch(setSocket(socketInstance))
    socketInstance.on("connect", () => {
      if (userData) {
        socketInstance.emit('identity', { userId: userData._id })
      }
    })
  return () => {
      socketInstance.disconnect()
    }
  }, [userData?._id])
  const { pathname } = useLocation()
  useEffect(() => {
    const titles = { '/signin': 'Sign in', '/signup': 'Create account', '/forgot-password': 'Reset password', '/cart': 'Your cart', '/checkout': 'Checkout', '/my-orders': 'My orders', '/order-placed': 'Order placed', '/add-item': 'Add item', '/create-edit-shop': 'Your shop' }
    const t = titles[pathname]
    document.title = t ? `${t} | Khana Khajana` : 'Khana Khajana Agra - Online Food Delivery from Local Restaurants'
    const descs = {
      '/signin': 'Sign in to Khana Khajana to order food from local restaurants and track your delivery live.',
      '/signup': 'Create a free Khana Khajana account to order food online, or list your restaurant, or deliver orders.',
      '/forgot-password': 'Reset your Khana Khajana password with an email OTP.'
    }
    const d = descs[pathname]
    const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val) }
    const description = d || 'Khana Khajana: browse restaurant and dish guides in Agra and other cities. Check current delivery availability before ordering.'
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', document.title)
    setMeta('meta[name="robots"]', 'content', pathname === '/' ? 'index, follow, max-image-preview:large' : 'noindex, follow')
    const base = 'https://khana-khajana-2ijn.onrender.com'
    const url = base + pathname
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', document.title)
  }, [pathname])
  if (pathname === '/' && !userData) return <main className='min-h-screen bg-[#fff9f6] text-gray-800'><div className='max-w-5xl mx-auto px-5 py-8'><header className='flex flex-wrap gap-4 items-center justify-between border-b border-orange-100 pb-5'><span className='text-xl font-bold text-[#b7371b]'>Khana Khajana</span><Link to='/signin' className='bg-[#c43c1d] text-white px-5 py-3 rounded-lg font-semibold'>Open ordering app</Link></header><section className='py-12'><p className='text-[#b7371b] font-semibold mb-3'>Explore local food</p><h1 className='text-4xl sm:text-5xl font-bold leading-tight mb-6'>Food and restaurants in Agra.<br />More cities to explore.</h1><p className='text-lg text-gray-600 max-w-2xl mb-8'>Browse restaurant listings and dish guides without signing in. Find menu ideas, compare cuisines, and check current availability before you order.</p><div className='flex flex-wrap gap-4'><a href='/cities/agra/' className='bg-[#c43c1d] text-white px-5 py-3 rounded-lg font-semibold'>Explore Agra</a><a href='/browse/' className='border border-orange-300 px-5 py-3 rounded-lg font-semibold text-[#a32e16]'>Browse all cities</a></div></section><aside className='bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm leading-6'>This is a public catalogue, not a list of confirmed delivery partners. Menus and availability may have changed. Confirm directly with the restaurant. Online payments in the app currently run in test mode.</aside><section className='py-8'><h2 className='text-2xl font-bold mb-5'>Explore food in Agra</h2><div className='flex flex-wrap gap-4'>{['biryani','paneer','chicken','pizza','desserts'].map(name => <a key={name} href={'/cities/agra/dishes/'+name+'/'} className='bg-white border border-orange-100 rounded-lg px-5 py-3 capitalize'>{name}</a>)}</div></section><footer className='border-t border-orange-100 pt-5 text-sm text-gray-600'>Khana Khajana · Public restaurant catalogue and ordering app</footer></div></main>
  if (!authChecked) return <div className='min-h-screen flex items-center justify-center text-gray-400'>Loading...</div>
  return (
    <>
    <CityPicker />
    <Routes>
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />
      <Route path='/' element={userData ? <Home /> : <Navigate to={"/signin"} />} />
      <Route path='/create-edit-shop' element={userData ? <CreateEditShop /> : <Navigate to={"/signin"} />} />
      <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to={"/signin"} />} />
      <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to={"/signin"} />} />
      <Route path='/cart' element={userData ? <CartPage /> : <Navigate to={"/signin"} />} />
      <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to={"/signin"} />} />
      <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />} />
      <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to={"/signin"} />} />
      <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />} />
      <Route path='/earnings' element={(userData?.role === 'deliveryBoy' || userData?.role === 'owner') ? <Earnings /> : <Navigate to={"/"} />} />
      <Route path='/admin' element={userData ? <AdminPage /> : <Navigate to={"/signin"} />} />
      <Route path='/admin/payouts' element={userData ? <AdminPayouts /> : <Navigate to={"/signin"} />} />
      <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to={"/signin"} />} />

      <Route path='*' element={<Navigate to={"/"} replace />} />
    </Routes>
    </>
  )
}

export default App
