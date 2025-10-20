import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import medianetLogo from "../assets/medianet_transparent_logo.png";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import SHA256 from "crypto-js/sha256";
import ForgotPassword from "./passwordForgot";
import { useAuth } from "../App";
import { showToast } from "./common/toaster";
import 'react-toastify/dist/ReactToastify.css';


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [openForgot, setOpenForgot] = useState(false);
  const [errors, setErrors] = useState({});


  const navigate = useNavigate();
  const { login } = useAuth();

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email address";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    try {
      const hashedPassword = SHA256(password).toString();

      const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: hashedPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Toast for success
        showToast("Logged in successfully!", "success");

        // Store role and permissions from data.user
        const { role, permission } = data.user;
        localStorage.setItem("userRole", role || "");
        localStorage.setItem("userPermissions", JSON.stringify(permission || {}));

        // Optional: store entire user object if needed
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Login via context
        login(data.user, data.token);

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1000);
      } else {
        // handle API errors and show toasts
        if (response.status === 401) {
          showToast("Invalid email or password. Please check your credentials.", "error");

        } else if (response.status === 404) {
          showToast("No account found with this email.", "error");
        } else {
          const msg = data.message || "Login failed. Please try again.";
          showToast(msg, "error");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      const msg =
        "Network error. Please check your connection and try again.";
      setErrors({ general: msg });
      showToast(msg, "error");
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
    if (errors.general) setErrors(prev => ({ ...prev, general: null }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
    if (errors.general) setErrors(prev => ({ ...prev, general: null }));
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <img src={medianetLogo} alt="Medianet Logo" className="login-logo" />
        <h2>Welcome Back!</h2>

        {/* Email Input */}
        <div className={`input-wrapper ${email ? "filled" : ""} ${errors.email ? "error" : ""}`}>
          <FaEnvelope className="input-icon" />
          <input type="email" id="email" value={email} onChange={handleEmailChange} className={errors.email ? "error" : ""} />
          <label htmlFor="email">Email *</label>
        </div>

        {/* Password Input */}
        <div className={`input-wrapper ${password ? "filled" : ""} ${errors.password ? "error" : ""}`}>
          <FaLock className="input-icon" />
          <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={handlePasswordChange} className={errors.password ? "error" : ""} />
          <label htmlFor="password">Password *</label>
          {showPassword ? (
            <FaEyeSlash className="input-icon password-icon" onClick={() => setShowPassword(false)} />
          ) : (
            <FaEye className="input-icon password-icon" onClick={() => setShowPassword(true)} />
          )}
        </div>

        <button type="submit" className="login-btn">
          Login
        </button>

        <p className="forgot-password" onClick={() => setOpenForgot(true)}>
          Forgot Password?
        </p>
      </form>

      <ForgotPassword open={openForgot} handleClose={() => setOpenForgot(false)} />
    </div>
  );
};

export default Login;

