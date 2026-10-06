import React, { useState } from 'react'
import axios from 'axios'
import { FaWhatsapp } from 'react-icons/fa'
import { serverUrl } from '../App'
import { buildOrderMessage, buildWhatsAppUrl, toWhatsAppNumber } from '../utils/whatsapp'

// Opens WhatsApp with a ready-made order message for ONE shop's items.
const WhatsAppOrderButton = ({ shopId, items, customerName, address }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleClick = async () => {
        setError("")
        setLoading(true)
        // Open the tab right away (inside the click) so mobile browsers do not block the popup.
        const win = window.open("", "_blank")
        try {
            const { data } = await axios.get(`${serverUrl}/api/shop/whatsapp/${shopId}`, { withCredentials: true })
            const number = toWhatsAppNumber(data?.mobile)
            if (!number) {
                win?.close()
                setError(data?.isListing ? "This is a listed restaurant without WhatsApp ordering. Please use Check Out instead." : "This shop has not added a WhatsApp number yet. Please use Check Out instead.")
                return
            }
            const message = buildOrderMessage({ shopName: data.name, items, customerName, address })
            const url = buildWhatsAppUrl(number, message)
            if (win) win.location.href = url
            else window.location.href = url
        } catch (err) {
            win?.close()
            setError("Could not open WhatsApp right now. Please try again.")
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full sm:w-auto'>
            <button
                type='button'
                onClick={handleClick}
                disabled={loading}
                className='w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] disabled:opacity-70 text-white px-4 py-2 rounded-lg text-base sm:text-lg font-medium transition shadow'
            >
                <FaWhatsapp size={22} />
                {loading ? "Opening WhatsApp..." : "Order on WhatsApp"}
            </button>
            {error && <p className='text-sm text-red-500 mt-2'>{error}</p>}
        </div>
    )
}

export default WhatsAppOrderButton
