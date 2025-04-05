import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UsersPage from "./pages/UsersPage.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import "./styles/Sidebar.css"; // Import sidebar styles
import "./styles/Dashboard.css"; // Import dashboard styles
import SalesPage from "./pages/SalesPage.jsx";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          key="dashboard"
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={<ProtectedRoute>{<UsersPage />}</ProtectedRoute>}
        />
        <Route key="products" path="/products" element={<ProductsPage />} />
        <Route key="sales" path="/sales" element={<SalesPage />} />
      </Routes>
    </Router>
  );
};

export default App;
