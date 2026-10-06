import dotenv from 'dotenv'
dotenv.config()

// Free-tier hosts block SMTP ports, so mail goes out over HTTPS using the Brevo API (300 emails/day free).
// Env: BREVO_API_KEY and MAIL_FROM (a sender address verified in Brevo).
const send = async (to, subject, html) => {
    if (!process.env.BREVO_API_KEY || !process.env.MAIL_FROM) {
        throw new Error("mail is not configured")
    }
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json"
        },
        body: JSON.stringify({
            sender: { name: "Khana Khajana", email: process.env.MAIL_FROM },
            to: [{ email: to }],
            subject,
            htmlContent: html
        }),
        signal: AbortSignal.timeout(10000)
    })
    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`mail failed ${res.status} ${text.slice(0, 200)}`)
    }
}

export const sendOtpMail = async (to, otp) => {
    await send(to, "Reset your Khana Khajana password",
        `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`)
}

export const sendDeliveryOtpMail = async (user, otp) => {
    await send(user.email, "Your Khana Khajana delivery OTP",
        `<p>Your OTP for delivery is <b>${otp}</b>. Share it with the delivery partner only when your order arrives. It expires in 5 minutes.</p>`)
}

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))

// New-order mail for one shop's part of an order. Listing shops (display only, restaurant not registered)
// go to the platform inbox, never to the business.
export const sendNewOrderMail = async ({ to, shopName, isListing, order, shopOrder, customer }) => {
    const rows = (shopOrder.shopOrderItems || []).map(i =>
        `<li>${esc(i.name || i.item?.name)} x ${esc(i.quantity)} - Rs ${esc(i.price)}</li>`).join("")
    const note = isListing
        ? `<p><b>Listing only:</b> ${esc(shopName)} is not registered on Khana Khajana and was NOT notified. Contact them yourself if this order should be fulfilled.</p>`
        : ""
    await send(to, `New order for ${shopName} - Khana Khajana`,
        `${note}<p>New ${esc(order.paymentMethod)} order for <b>${esc(shopName)}</b>.</p><ul>${rows}</ul>
<p>Shop total: Rs ${esc(shopOrder.subTotal)}</p>
<p>Customer: ${esc(customer?.fullname || customer?.name)} ${esc(customer?.mobile)}<br>Deliver to: ${esc(order.deliveryAddress?.text)}</p>
<p>Order id: ${esc(order._id)}</p>`)
}
