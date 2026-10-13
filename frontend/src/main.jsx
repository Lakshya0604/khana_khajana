import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import axios from 'axios'

// Browsers that block third-party cookies (incognito, Safari) drop the API cookie, so the
// signed-in token is also kept here and sent as a Bearer header.
const TOKEN_KEY = 'kk_token'
axios.interceptors.request.use((config) => {
  try {
    const t = localStorage.getItem(TOKEN_KEY)
    if (t && String(config.url || '').startsWith(import.meta.env.VITE_SERVER_URL) && !config.headers?.Authorization) config.headers.Authorization = `Bearer ${t}`
  } catch (e) { /* storage unavailable */ }
  return config
})
axios.interceptors.response.use((res) => {
  try {
    const url = res.config?.url || ''
    if (res.data && typeof res.data === 'object' && res.data.token && /\/api\/auth\/(signin|signup|google-auth)/.test(url)) {
      localStorage.setItem(TOKEN_KEY, res.data.token)
      delete res.data.token
    }
    if (/\/api\/auth\/signout/.test(url)) localStorage.removeItem(TOKEN_KEY)
  } catch (e) { /* storage unavailable */ }
  return res
})

createRoot(document.getElementById('root')).render(

  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>


)
