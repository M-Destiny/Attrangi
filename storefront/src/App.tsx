import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminLogin from './pages/admin/AdminLogin';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:invoice" element={<OrderSuccess />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="login" element={<Login />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<div className="p-20 text-center">Page not found</div>} />
      </Route>
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<AdminOrders />} />
      <Route path="admin/coupons" element={<AdminCoupons />} />
    </Routes>
  );
}
