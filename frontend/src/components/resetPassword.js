import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/login.css"; // reuse login styles
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import SHA256 from "crypto-js/sha256";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");

    try {
      // Hash password before sending
      const hashedPassword = SHA256(password).toString();

      const res = await fetch(
        "http://localhost:5000/statistics/login/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: hashedPassword }), // send hashed password
        }
      );

      if (!res.ok) throw new Error("Failed to update password");

      setSuccess("Password changed successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Reset Password</h2>

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

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
}