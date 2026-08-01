# 🍽️ Khana Khajana — Real-Time Food Delivery Platform

A full-stack, production-style food delivery web application built with the **MERN stack**, featuring real-time order tracking, live delivery updates, and multi-role dashboards for customers, shop owners, and delivery partners.

🔗 **Live Demo:** [khana-khajana-2ijn.onrender.com](https://khana-khajana-2ijn.onrender.com)

> ⚠️ Note: Hosted on Render's free tier — the backend may take 30-50 seconds to spin up on first load if it's been idle.

---

## 📌 Overview

Khana Khajana is a complete food-ordering ecosystem — think Zomato/Swiggy at a smaller scale — built to solve real problems like live order tracking, multi-party coordination (customer ↔ shop ↔ delivery partner), and secure payments.

It was built end-to-end (architecture, backend APIs, real-time systems, and frontend) as a solo full-stack project to deepen production-level MERN development skills.

---

## ✨ Key Features

- **Three user roles** — Customer, Shop Owner, and Delivery Partner, each with a dedicated dashboard and permissions
- **Real-time order tracking** — Live status updates (placed → preparing → out for delivery → delivered) synced instantly across all three roles using **Socket.io**
- **Live delivery location tracking** — Geolocation-based updates so customers can track their delivery partner in real time
- **Secure payments** — Integrated **Razorpay** for order payments with server-side payment verification
- **Shop & menu management** — Owners can create/edit shops, add items with images (via Cloudinary + Multer)
- **Order lifecycle management** — Full flow from cart → checkout → assignment → delivery, with role-based state updates
- **Authentication** — Secure login/signup with cookie-based session handling (including Google OAuth)

---

## 🛠️ Tech Stack

**Frontend**
- React.js
- Redux Toolkit (global state management)
- Tailwind CSS

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose (MongoDB Atlas)
- Socket.io (real-time bidirectional communication)

**Integrations & Tools**
- Razorpay (payment gateway)
- Cloudinary + Multer (image uploads)
- Firebase (Google OAuth)
- JWT / Cookie-based authentication

---

## 🏗️ Architecture Highlights

- **Event-driven real-time updates:** Socket.io events (e.g. `assignmentAccepted`, order status changes) keep customer, shop owner, and delivery partner views in sync without polling.
- **Role-based access control:** Distinct dashboards and API permissions for each of the three user types.
- **Geospatial data:** Delivery locations stored and queried using MongoDB's GeoJSON `Point` type for live tracking.
- **Payment verification flow:** Server-side Razorpay signature verification before order confirmation, preventing client-side tampering.

---

## 📂 Project Structure

```
khana_khajana/
├── backend/          # Express server, REST APIs, Socket.io handlers, MongoDB models
├── frontend/          # React app, Redux store, role-based UI components
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Razorpay test API keys
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/Lakshya0604/khana_khajana.git
cd khana_khajana

# Setup backend
cd backend
npm install
# Add your .env file (see .env.example)
npm start

# Setup frontend
cd ../frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend` folder with:

```
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📸 Screenshots

> Add these images to a `/screenshots` folder in your repo, then update the paths below (e.g. `![Home](./screenshots/home.png)`).

**Customer Flow**
| Home / Browse | Cart | Checkout & Payment |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

| Razorpay Payment | Order Tracking | Order History (with ratings) |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

**Shop Owner Dashboard**
| Restaurant & Menu Management |
|---|
| _screenshot_ |

**Delivery Partner Dashboard**
| Deliveries & Earnings | Available Orders | Live Location Tracking on Map |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## 🔮 Future Improvements

- [ ] Admin panel for platform-wide analytics
- [ ] Ratings & reviews system
- [ ] Push notifications
- [ ] Order history & re-order feature

---

## 👤 Author

**Lakshya Yadav**
B.Tech Computer Science | MERN Stack Developer
[LinkedIn](#) • [GitHub](https://github.com/Lakshya0604) • [Portfolio](#)

---

⭐ If you find this project interesting, consider giving it a star!
