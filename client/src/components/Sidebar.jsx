import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaStore,
  FaUser,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import ".././styles/Sidebar.css";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user from Redux store
  const user = useSelector((state) => state.auth.user);

  // Fallback to localStorage if Redux state is empty
  const getUserInfo = () => {
    if (user && user.name) {
      return user;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  };

  const currentUser = getUserInfo();

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    dispatch(logoutUser());
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    {
      path: "/dashboard",
      icon: FaTachometerAlt,
      label: "Dashboard",
      color: "dashboard",
    },
    {
      path: "/products",
      icon: FaBox,
      label: "Products",
      color: "products",
    },
    {
      path: "/sales",
      icon: FaShoppingCart,
      label: "Sales",
      color: "sales",
    },
    {
      path: "/users",
      icon: FaUsers,
      label: "Users",
      color: "users",
    },
  ];

  // Function to get display name
  const getDisplayName = () => {
    if (currentUser && currentUser.name) {
      return currentUser.name;
    }
    return "User"; // Fallback
  };

  // Function to get role display
  const getRoleDisplay = () => {
    if (currentUser && currentUser.role) {
      return (
        currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)
      );
    }
    return "Point of Sale"; // Fallback
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="mobile-logo">
          <FaUser className="mobile-logo-icon" />
          <h2 className="mobile-logo-text">{getDisplayName()}</h2>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? "sidebar-open" : ""}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <FaUser />
            </div>
            <div className="logo-text">
              <h1>{getDisplayName()}</h1>
              <p>{getRoleDisplay()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`nav-item ${
                  isActive ? "nav-item-active" : ""
                } nav-item-${item.color}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
