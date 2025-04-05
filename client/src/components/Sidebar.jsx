import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch(logoutUser());
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div className="sidebar-mobile-header">
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h2 className="sidebar-title">POS System</h2>
      </div>

      <div className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <h2 className="sidebar-title">POS System</h2>
        <ul>
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard" className="nav-link">
              <FaTachometerAlt className="nav-icon" />
              <span className="nav-text">Dashboard</span>
            </Link>
          </li>
          <li className={location.pathname === "/products" ? "active" : ""}>
            <Link to="/products" className="nav-link">
              <FaBox className="nav-icon" />
              <span className="nav-text">Products</span>
            </Link>
          </li>
          <li className={location.pathname === "/sales" ? "active" : ""}>
            <Link to="/sales" className="nav-link">
              <FaShoppingCart className="nav-icon" />
              <span className="nav-text">Sales</span>
            </Link>
          </li>
          <li className={location.pathname === "/users" ? "active" : ""}>
            <Link to="/users" className="nav-link">
              <FaUsers className="nav-icon" />
              <span className="nav-text">Users</span>
            </Link>
          </li>
          <li className="logout">
            <button onClick={handleLogout} className="nav-link">
              <FaSignOutAlt className="nav-icon" />
              <span className="nav-text">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
