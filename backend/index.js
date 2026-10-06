import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import adminRouter from "./routes/admin.routes.js"
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "https://khana-khajana-2ijn.onrender.com",
    "http://localhost:5173"
]
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["POST", "GET"]
    }
});

app.set("io", io);

const port = process.env.PORT || 5000;
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(cookieParser())
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/shop", shopRouter)
app.use("/api/item", itemRouter)
app.use("/api/order", orderRouter)
app.use("/api/admin", adminRouter)

socketHandler(io)
server.listen(port, () => {
    Promise.resolve(connectDb()).then(async () => {
        if (process.env.CLEANUP_QA === '1') {
            try { const { cleanupQa } = await import('./seed/seedListings.js'); await cleanupQa() } catch (e) { console.log('[cleanup] failed', e.message) }
        }
        if (process.env.SEED_LISTINGS === '1') {
            try { const { seedListings } = await import('./seed/seedListings.js'); await seedListings() } catch (e) { console.log('[seed] failed', e.message) }
        }
    })
    console.log(`server is running at http://localhost:${port}`);
})