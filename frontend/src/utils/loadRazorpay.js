// Loads Razorpay Checkout only when a payment is about to open (keeps it off the first page load).
let pending = null
export function loadRazorpay() {
    if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true)
    if (pending) return pending
    pending = new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.async = true
        s.onload = () => resolve(true)
        s.onerror = () => { pending = null; reject(new Error('Could not load Razorpay')) }
        document.body.appendChild(s)
    })
    return pending
}
