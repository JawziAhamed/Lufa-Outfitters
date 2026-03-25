# Web-Based Customized T-Shirt Printing Management System

Production-style MERN project with role-based access and integrated 3D t-shirt customization.

## Highlights
- React + Vite frontend with Tailwind, React Router, Axios, React Hook Form, Zustand, and toast notifications.
- Node.js + Express backend with MongoDB, Mongoose, JWT auth, multer uploads, Cloudinary storage, express-validator.
- Security baseline: Helmet, CORS, rate limiting, schema validations, centralized error handling.
- Roles: `admin`, `staff`, `customer`.
- Account lockout after repeated failed logins (15 minutes).
- Mock email service for registration/login/reset/order confirmation/promotional alerts.
- Existing 3D customization feature integrated into Product Details flow.

## Project Structure

```text
root/
├── client/
├── server/
└── README.md
```

### Server

```text
server/src/
├── config/
├── models/
├── controllers/
├── routes/
├── middleware/
├── services/
├── utils/
├── seed/
└── app.js
```

### Client

```text
client/src/
├── components/
├── pages/
├── layouts/
├── services/
├── store/
├── hooks/
└── utils/
```

## Core Features Implemented

### 1. User Management
- Registration, login, profile update, JWT session handling.
- Password reset request + reset token flow.
- Role management by admin.
- Failed login lockout for 15 minutes.
- Mock email alerts:
  - registration
  - login
  - password reset

### 2. Product Management
- Admin/staff CRUD for products.
- Product image upload with Cloudinary (and local fallback).
- Sizes, colors, pricing modifiers, template URLs, tags.
- Customer product browsing and details page.
- Customer customization through integrated 3D editor.
- Promo code CRUD and promotional broadcast.

### 3. Inventory Management
- Inventory records linked to products.
- Stock updates and low-stock thresholds.
- Automatic stock reduction on order placement.
- Stock increase on approved returns.
- Low-stock alert endpoint.
- Monthly sales and dashboard analytics endpoints.

### 4. Order & Payment Management
- Customized order placement with address, promo, gift card, and payment method.
- Payment methods:
  - COD
  - 3-month installment (first payment mandatory)
  - Gift card
- Delivery fee computed from destination.
- Payment records stored.
- Order status tracking and history.
- Refunds to customer wallet through return workflow.

### 5. Return, Refund & Complaints
- Customer return request with mandatory damaged image upload.
- Customer complaints submission and tracking.
- Admin/staff actions:
  - approve/reject/refund returns
  - respond to complaints
  - view returns/complaints reporting endpoints

## Frontend Pages

### Public
- Home
- Products listing
- Product details (with 3D customization)
- Login / Register
- Cart
- Checkout

### Customer Dashboard
- My Orders
- My Returns
- My Complaints
- Profile

### Admin Dashboard
- Analytics
- Users management
- Products management
- Inventory
- Orders
- Returns & complaints
- Promo management

## Environment Variables

### Server
Copy `server/.env.example` to `server/.env`.

```env
NODE_ENV=development
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/customized_tshirt
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=customized-tshirt/products
SEED_ADMIN_PASSWORD=Admin@12345
SEED_STAFF_PASSWORD=Staff@12345
SEED_CUSTOMER_PASSWORD=Customer@12345
```

### Client
Copy `client/.env.example` to `client/.env`.

```env
VITE_API_URL=http://localhost:8080/api
VITE_ASSET_URL=http://localhost:8080
```

## Setup & Run

## 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

## 2. Seed sample data

```bash
cd server
npm run seed
```

Seed includes:
- 1 admin
- 1 staff
- 1 customer
- 5 products
- sample inventory
- sample promo codes
- sample gift card

## 3. Start backend

```bash
cd server
npm run dev
```

## 4. Start frontend

```bash
cd client
npm run dev
```

Frontend default URL: `http://localhost:5173`
Backend default URL: `http://localhost:8080`

## Demo Credentials

- Admin: `admin@example.com` / `Admin@12345`
- Staff: `staff@example.com` / `Staff@12345`
- Customer: `customer@example.com` / `Customer@12345`

## API Documentation

Detailed endpoints are documented in:
- [server/API_DOCS.md](server/API_DOCS.md)

## Notes
- AI generation endpoint falls back to generated placeholder imagery if `OPENAI_API_KEY` is not configured.
- Product image uploads prefer Cloudinary and fall back to local `server/uploads` if Cloudinary is not configured or fails.
- This project is structured for extension (payment gateways, real email providers, object storage, advanced reporting).
