import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

export const signUp = async (req, res) => {
    try {
        const fullname = (req.body.fullname || req.body.fullName || "").trim();
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password || "";
        const mobile = (req.body.mobile || "").trim();
        const role = req.body.role;

        if (!fullname || !email || !password || !mobile || !role) {
            return res.status(400).json({ message: "all fields are required" })
        }
        let user = await User.findOne({ $or: [{ email }, { mobile }] });
        if (user) {
            const field = user.email === email ? "email" : "mobile number";
            return res.status(400).json({ message: `${field} already exists` })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "password must be atleast 6 characters" })
        }
        if (mobile.length < 10) {
            return res.status(400).json({ message: "mobile no. must be atleast 10 digit" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            mobile,
            role
        })
        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
        user.password = undefined;
        return res.status(201).json(user);
    } catch (error) {
        return res.status(500).json(`signup error ${error}`)
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "user not exist" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "password not match" })
        }
        const token = await genToken(user.id)
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
        user.password = undefined;
        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json(`sign in error ${error}`)
    }
}
export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({ message: "Logout successfully" });

    } catch (error) {
        return res.status(500).json({ message: `signout error${error}` })
    }
}

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User does not exist." })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = Date.now() + 5 * 60 * 1000
        user.isOtpVerified = false
        await user.save()
        await sendOtpMail(email, otp)
        return res.status(200).json({ message: "OTP send successfully" })
    } catch (error) {
        return res.status(500).json({ message: `send OTP error${error}` })
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email })
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid / Expire otp" })
        }
        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()
        return res.status(200).json({ message: "OTP is Verify successfully" })

    } catch (error) {
        return res.status(500).json({ message: `Verify OTP error${error}` })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body
        const user = await User.findOne({ email })
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "otp verification is required" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.isOtpVerified = false
        await user.save()
        return res.status(200).json({ message: "Password reset successfully" })


    } catch (error) {
        return res.status(500).json({ message: `Reset Password  error${error}` })

    }
}

export const googleAuth = async (req, res) => {
    try {
        const { fullname, email, mobile, role } = req.body
        let user = await User.findOne({ email })
        if (!user) {
            user = await User.create({
                fullname: fullname || "Google User",
                email,
                ...(mobile ? { mobile } : {}),
                role: role || "user",
            })
        }

        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `Google Auth error${error}` })

    }
}
