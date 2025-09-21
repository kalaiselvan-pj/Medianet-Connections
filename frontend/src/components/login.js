import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import medianetLogo from "../assets/medianet_transparent_logo.png";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaExclamationCircle } from "react-icons/fa";
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

      const response = await fetch("http://localhost:5000/statistics/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: hashedPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Toast for success
        showToast("Login successful!", "success");

        // Login via context
        login(data.user, data.token);

        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // handle API errors and show toasts
        if (response.status === 401) {
          setErrors({
            general: "Invalid email or password. Please check your credentials.",
          });
          showToast("Invalid email or password.", "error");
        } else if (response.status === 404) {
          setErrors({ email: "No account found with this email address" });
          showToast("No account found with this email.", "error");
        } else {
          const msg = data.message || "Login failed. Please try again.";
          setErrors({ general: msg });
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
        <h2>Welcome Back</h2>

        {errors.general && (
          <div className="error-message general-error">
            <FaExclamationCircle /> {errors.general}
          </div>
        )}

        {/* Email Input */}
        <div className={`input-wrapper ${email ? "filled" : ""} ${errors.email ? "error" : ""}`}>
          <FaEnvelope className="input-icon" />
          <input type="email" id="email" value={email} onChange={handleEmailChange} className={errors.email ? "error" : ""} />
          <label htmlFor="email">Email *</label>
          {errors.email && (
            <div className="error-message field-error">
              <FaExclamationCircle /> {errors.email}
            </div>
          )}
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
          {errors.password && (
            <div className="error-message field-error">
              <FaExclamationCircle /> {errors.password}
            </div>
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
