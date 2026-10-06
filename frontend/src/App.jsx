import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import CityPicker from './components/CityPicker'
import { io } from 'socket.io-client'
import { setSocket } from './redux/userSlice'

export const serverUrl = import.meta.env.VITE_SERVER_URL

function App() {
  useGetCurrentUser()
  useUpdateLocation()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemsByCity()
  useGetMyOrders()

  const { userData } = useSelector(state => state.user)
  const dispatch = useDispatch()


  useEffect(() => {
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
    if (d) setMeta('meta[name="description"]', 'content', d)
    const base = 'https://khana-khajana-2ijn.onrender.com'
    const url = base + (['/signin', '/signup', '/forgot-password'].includes(pathname) ? pathname : '/')
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', document.title)
  }, [pathname])
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
      <Route path='/earnings' element={userData?.role === 'deliveryBoy' ? <Earnings /> : <Navigate to={"/"} />} />
      <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to={"/signin"} />} />

      <Route path='*' element={<Navigate to={"/"} replace />} />
    </Routes>
    </>
  )
}

export default App
