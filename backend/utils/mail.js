import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// Gmail SMTP (free). Set GMAIL_USER and GMAIL_APP_PASSWORD in the server env.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
})

const send = async (to, subject, html) => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error("mail is not configured")
    }
    await transporter.sendMail({
        from: `"Khana Khajana" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html
    })
}

export const sendOtpMail = async (to, otp) => {
    await send(to, "Reset your Khana Khajana password",
        `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`)
}

export const sendDeliveryOtpMail = async (user, otp) => {
    await send(user.email, "Your Khana Khajana delivery OTP",
        `<p>Your OTP for delivery is <b>${otp}</b>. Share it with the delivery partner only when your order arrives. It expires in 5 minutes.</p>`)
}
