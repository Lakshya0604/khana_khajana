import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpMail = async (to, otp) => {
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: "Reset your password",
        html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}

export const sendDeliveryOtpMail = async (user, otp) => {
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: user.email,
        subject: "Delivery OTP",
        html: `<p>Your OTP for Delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}