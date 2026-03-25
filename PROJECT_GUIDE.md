# Project Guide and Full Feature Check

This guide tells you exactly how to open every page, test every major feature, and map key components/functions.

## 1. Start the project

### Backend test

```bash
cd server
npm install
npm run dev
```

Expected: API running on `http://localhost:8080`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Expected: app running on `http://localhost:5173`.

## 2. Demo accounts

- Admin: `admin@example.com` / `Admin@12345`
- Staff: `staff@example.com` / `Staff@12345`
- Customer: `customer@example.com` / `Customer@12345`

## 3. Public pages checklist

### Home
- URL: `/`
- File: `client/src/pages/HomePage.jsx`
- Check:
  - Hero content renders.
  - Buttons navigate to products/register.

### Products listing
- URL: `/products`
- File: `client/src/pages/ProductsPage.jsx`
- Check:
  - Product cards appear.
  - Search and category filters work.
  - Pagination works.

### Product details + 3D customizer
- URL: `/products/:id`
- File: `client/src/pages/ProductDetailsPage.jsx`
- Key component: `client/src/components/customizer3d/ThreeDCustomizer.jsx`
- Check:
  - Product info loads.
  - Change size/color/quantity.
  - 3D shirt preview renders.
  - Upload logo/full image updates decal.
  - AI logo/full generation works when logged in.
  - Add to cart works.

### Login
- URL: `/login`
- File: `client/src/pages/LoginPage.jsx`
- Check:
  - Login with demo accounts works.
  - Redirect to `/products` after success.

### Register
- URL: `/register`
- File: `client/src/pages/RegisterPage.jsx`
- Check:
  - New customer account can be created.

### Forgot password
- URL: `/forgot-password`
- File: `client/src/pages/ForgotPasswordPage.jsx`
- Check:
  - Submit email.
  - Backend returns success.
  - Mock email token is logged in server console.

### Reset password
- URL: `/reset-password`
- File: `client/src/pages/ResetPasswordPage.jsx`
- Check:
  - Use token from logs.
  - Set new password.
  - Login with new password.

### Cart
- URL: `/cart`
- File: `client/src/pages/CartPage.jsx`
- Check:
  - Line items appear.
  - Quantity update/remove works.

### Checkout
- URL: `/checkout`
- File: `client/src/pages/CheckoutPage.jsx`
- Check:
  - Address form validation.
  - Payment method options: COD/installment/gift card.
  - Quote calculation works.
  - Order placement works.

## 4. Customer dashboard checklist

### My Orders
- URL: `/dashboard/orders`
- File: `client/src/pages/customer/CustomerOrdersPage.jsx`
- Check:
  - Order history appears.
  - Status/payment fields visible.
  - Installment payment button works for installment orders.

### My Returns
- URL: `/dashboard/returns`
- File: `client/src/pages/customer/CustomerReturnsPage.jsx`
- Check:
  - Submit return with required damaged image.
  - Track return status updates.

### My Complaints
- URL: `/dashboard/complaints`
- File: `client/src/pages/customer/CustomerComplaintsPage.jsx`
- Check:
  - Create complaint.
  - Track status + admin response.

### Profile
- URL: `/dashboard/profile`
- File: `client/src/pages/customer/CustomerProfilePage.jsx`
- Check:
  - Update profile fields.
  - Wallet balance visible.

## 5. Admin / Staff dashboard checklist

### Analytics
- URL: `/admin/analytics`
- File: `client/src/pages/admin/AnalyticsPage.jsx`
- Check:
  - Summary cards render.
  - Sales/returns charts render.
  - Top products table loads.

### Users management (Admin only)
- URL: `/admin/users`
- File: `client/src/pages/admin/UsersManagementPage.jsx`
- Check:
  - Search users.
  - Update role.
  - Delete user.

### Products management
- URL: `/admin/products`
- File: `client/src/pages/admin/ProductsManagementPage.jsx`
- Check:
  - Create/update/delete product.
  - Image upload.
  - Sizes/colors/templates/tags fields save.

### Inventory
- URL: `/admin/inventory`
- File: `client/src/pages/admin/InventoryPage.jsx`
- Check:
  - Update stock and thresholds.
  - Low-stock indicator appears.

### Orders
- URL: `/admin/orders`
- File: `client/src/pages/admin/OrdersManagementPage.jsx`
- Check:
  - List/filter orders.
  - Update order status.

### Returns & complaints
- URL: `/admin/returns-complaints`
- File: `client/src/pages/admin/ReturnsComplaintsPage.jsx`
- Check:
  - Update return status.
  - Update complaint status and add admin response.

### Promo management
- URL: `/admin/promos`
- File: `client/src/pages/admin/PromoManagementPage.jsx`
- Check:
  - Create/toggle/delete promo codes.
  - Broadcast promotional alert.

## 6. Backend feature map

- App bootstrap: `server/src/app.js`, `server/index.js`
- Auth/session/password lock/reset: `server/src/controllers/authController.js`
- Users + role management: `server/src/controllers/userController.js`
- Products: `server/src/controllers/productController.js`
- Inventory + low stock: `server/src/controllers/inventoryController.js`
- Orders/payments/installments/refunds: `server/src/controllers/orderController.js`
- Returns/refunds-to-wallet: `server/src/controllers/returnController.js`
- Complaints: `server/src/controllers/complaintController.js`
- Promos/broadcast: `server/src/controllers/promoController.js`
- Analytics: `server/src/controllers/analyticsController.js`
- AI image generation: `server/src/controllers/aiController.js`
- Models: `server/src/models/*`
- Security middleware: `server/src/middleware/*`

## 7. Components map (frontend)

- Routing shell: `client/src/App.jsx`
- Layouts: `client/src/layouts/MainLayout.jsx`, `client/src/layouts/DashboardLayout.jsx`
- Shared UI: `client/src/components/common/*`
- Product card: `client/src/components/ProductCard.jsx`
- 3D customizer components:
  - `client/src/components/customizer3d/ThreeDCustomizer.jsx`
  - `client/src/components/customizer3d/CanvasPreview.jsx`
  - `client/src/components/customizer3d/ShirtModel.jsx`
  - `client/src/components/customizer3d/CameraRig.jsx`
  - `client/src/components/customizer3d/Backdrop.jsx`
- Stores:
  - `client/src/store/authStore.js`
  - `client/src/store/cartStore.js`
- API service layer: `client/src/services/*`

## 8. Missing items fixed

- Added missing frontend password reset flow pages/routes:
  - `/forgot-password`
  - `/reset-password`
- Added login page link to forgot-password.
- Restricted users management page to admin role in UI routing.

## 9. Notes

- If login behaves oddly, clear local storage:
  - `localStorage.removeItem('auth_token')`
  - `localStorage.removeItem('auth_user')`
- API docs file: `server/API_DOCS.md`
