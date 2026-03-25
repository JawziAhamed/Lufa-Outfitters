import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components';
import DashboardLayout from './layouts/DashboardLayout';
import MainLayout from './layouts/MainLayout';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import InventoryPage from './pages/admin/InventoryPage';
import OrdersManagementPage from './pages/admin/OrdersManagementPage';
import ProductsManagementPage from './pages/admin/ProductsManagementPage';
import PromoManagementPage from './pages/admin/PromoManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import ReturnsComplaintsPage from './pages/admin/ReturnsComplaintsPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import CustomerComplaintsPage from './pages/customer/CustomerComplaintsPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerReturnsPage from './pages/customer/CustomerReturnsPage';
import OrderDetailsPage from './pages/customer/OrderDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={['customer', 'admin', 'staff']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['customer']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="returns" element={<CustomerReturnsPage />} />
          <Route path="complaints" element={<CustomerComplaintsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="products" element={<ProductsManagementPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="returns-complaints" element={<ReturnsComplaintsPage />} />
          <Route path="promos" element={<PromoManagementPage />} />
          <Route
            path="reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<CustomerProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
