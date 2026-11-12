import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core Landing Storefront (eagerly loaded for instantaneous first paint)
import { HomePage } from './pages/HomePage';

// Customer Storefront Pages (Lazy loaded for optimal initial bundle)
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const BulkEnquiriesPage = lazy(() => import('./pages/BulkEnquiriesPage').then(m => ({ default: m.BulkEnquiriesPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })));
const OurStoryPage = lazy(() => import('./pages/OurStoryPage').then(m => ({ default: m.OurStoryPage })));

// Admin Operations Console Pages (Lazy loaded as isolated admin chunks)
const AdminLayout = lazy(() => import('./components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminSubcategories = lazy(() => import('./pages/admin/AdminSubcategories').then(m => ({ default: m.AdminSubcategories })));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory').then(m => ({ default: m.AdminInventory })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })));
const AdminCombos = lazy(() => import('./pages/admin/AdminCombos').then(m => ({ default: m.AdminCombos })));
const AdminCMS = lazy(() => import('./pages/admin/AdminCMS').then(m => ({ default: m.AdminCMS })));
const AdminHandpicked = lazy(() => import('./pages/admin/AdminHandpicked').then(m => ({ default: m.AdminHandpicked })));
const AdminBestsellers = lazy(() => import('./pages/admin/AdminBestsellers').then(m => ({ default: m.AdminBestsellers })));
const AdminDataManagement = lazy(() => import('./pages/admin/AdminDataManagement').then(m => ({ default: m.AdminDataManagement })));
const AdminFestivals = lazy(() => import('./pages/admin/AdminFestivals').then(m => ({ default: m.AdminFestivals })));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries').then(m => ({ default: m.AdminEnquiries })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminContent = lazy(() => import('./pages/admin/AdminContent').then(m => ({ default: m.AdminContent })));
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement').then(m => ({ default: m.AdminManagement })));
import { AdminPermissionGuard } from './components/AdminPermissionGuard';

import { ToastContainer } from './components/ToastContainer';

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-canvas flex items-center justify-center">
    <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const App: React.FC = () => {
  return (
    <>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Customer Storefront Routes (Grounded in the 7 UI References) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/combos" element={<CategoryPage isCombosPage={true} />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-tracking" element={<OrderTrackingPage />} />
          <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/bulk-enquiries" element={<BulkEnquiriesPage />} />
          <Route path="/bulk-orders" element={<BulkEnquiriesPage />} />

          {/* Public Store Content & Policy Pages */}
          <Route path="/our-story" element={<OurStoryPage />} />
          <Route path="/about" element={<OurStoryPage />} />
          <Route path="/contact" element={<ContentPage forcedSlug="contact" />} />
          <Route path="/faq" element={<ContentPage forcedSlug="faq" />} />
          <Route path="/shipping-policy" element={<ContentPage forcedSlug="shipping-policy" />} />
          <Route path="/cancellation-refund-policy" element={<ContentPage forcedSlug="cancellation-refund-policy" />} />
          <Route path="/privacy-policy" element={<ContentPage forcedSlug="privacy-policy" />} />
          <Route path="/terms" element={<ContentPage forcedSlug="terms" />} />
          <Route path="/pages/:slug" element={<ContentPage />} />

          {/* Admin Operations Console Routes (All 14 Modules) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <AdminPermissionGuard permission="dashboard.view" featureName="Operations Dashboard">
                  <AdminDashboard />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="products"
              element={
                <AdminPermissionGuard permission="products.manage" featureName="Products Management">
                  <AdminProducts />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="subcategories"
              element={
                <AdminPermissionGuard permission={['subcategories.manage', 'products.manage']} featureName="Subcategories Management">
                  <AdminSubcategories />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="inventory"
              element={
                <AdminPermissionGuard permission="inventory.manage" featureName="Inventory Management">
                  <AdminInventory />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="orders"
              element={
                <AdminPermissionGuard permission="orders.manage" featureName="Order Fulfillment & Courier Dispatch">
                  <AdminOrders />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="customers"
              element={
                <AdminPermissionGuard permission="customers.view" featureName="Customer Directory">
                  <AdminCustomers />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="coupons"
              element={
                <AdminPermissionGuard permission="coupons.manage" featureName="Coupons Management">
                  <AdminCoupons />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="combos"
              element={
                <AdminPermissionGuard permission="combos.manage" featureName="Combo Builder">
                  <AdminCombos />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="cms"
              element={
                <AdminPermissionGuard
                  permission={['cms.homepage', 'cms.hero_banners', 'cms.category_banners', 'cms.sections']}
                  featureName="Homepage CMS"
                >
                  <AdminCMS />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="handpicked"
              element={
                <AdminPermissionGuard
                  permission={['cms.homepage', 'cms.sections']}
                  featureName="Handpicked For You"
                >
                  <AdminHandpicked />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="bestsellers"
              element={
                <AdminPermissionGuard
                  permission={['cms.homepage', 'cms.sections']}
                  featureName="Bestseller Management"
                >
                  <AdminBestsellers />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="data-management"
              element={
                <AdminPermissionGuard
                  permission="admins.manage"
                  featureName="Secure Bulk Data Management"
                >
                  <AdminDataManagement />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="festivals"
              element={
                <AdminPermissionGuard
                  permission={['cms.homepage', 'cms.festivals', 'cms.hero_banners']}
                  featureName="Festival Themes & Promotions"
                >
                  <AdminFestivals />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="reviews"
              element={
                <AdminPermissionGuard permission="reviews.moderate" featureName="Reviews Moderation">
                  <AdminReviews />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="enquiries"
              element={
                <AdminPermissionGuard permission="enquiries.manage" featureName="Bulk Enquiries">
                  <AdminEnquiries />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="settings"
              element={
                <AdminPermissionGuard permission="settings.manage" featureName="Store & Payment Settings">
                  <AdminSettings />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="content"
              element={
                <AdminPermissionGuard permission="content.manage" featureName="Store Content & Policies">
                  <AdminContent />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="reports"
              element={
                <AdminPermissionGuard permission="reports.export" featureName="Financial Reports">
                  <AdminReports />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="audit-logs"
              element={
                <AdminPermissionGuard permission="audit_logs.view" featureName="Administrative Audit Logs">
                  <AdminAuditLogs />
                </AdminPermissionGuard>
              }
            />
            <Route
              path="admins"
              element={
                <AdminPermissionGuard superAdminOnly featureName="Admin & Permission Management">
                  <AdminManagement />
                </AdminPermissionGuard>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Subtle In-Place Toast Container (Decision #4) */}
      <ToastContainer />
    </>
  );
};
