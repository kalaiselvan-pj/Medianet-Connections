import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/login.css"; // reuse login styles
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import SHA256 from "crypto-js/sha256";
import { showErrorToast, showToast } from "./common/toaster";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (!password || !confirmPassword) {
      showErrorToast("Please fill both password fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast("Passwords do not match.", "error");
      return;
    }

    try {
      // Hash password before sending
      const hashedPassword = SHA256(password).toString();

      const res = await fetch(
        `${process.env.REACT_APP_LOCALHOST}/statistics/login/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: hashedPassword }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Password changed successfully!", "success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        // API returned an error
        const msg = data.message || "Failed to update password. Please try again.";
        showToast(msg, "error");
      }
    } catch (err) {
      // Network or unexpected errors
      console.error("Reset password error:", err);
      showToast("Network error. Please try again.", "error");
    }
  };


  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            marginTop: "6px",
            background: "linear-gradient(358deg, rgb(255 255 255 / 99%), rgb(192 192 192 / 67%)) text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold",
          }}
        >Reset Password</h2>

        <div className={`input-wrapper ${password ? "filled" : ""}`}>
          <FaLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="password">New Password *</label>
          {showPassword ? (
            <FaEyeSlash
              className="input-icon password-icon"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <FaEye
              className="input-icon password-icon"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        <div className={`input-wrapper ${confirmPassword ? "filled" : ""}`}>
          <FaLock className="input-icon" />
          <input
            type={showConfirm ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label htmlFor="confirmPassword">Confirm Password *</label>
          {showConfirm ? (
            <FaEyeSlash
              className="input-icon password-icon"
              onClick={() => setShowConfirm(false)}
            />
          ) : (
            <FaEye
              className="input-icon password-icon"
              onClick={() => setShowConfirm(true)}
            />
          )}
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}