// src/AdminLogin.js
import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import AITSLogo from './assets/AITS logo.jpg';
import { 
  FaEnvelope, 
  FaLock, 
  FaBuilding, 
  FaArrowRight, 
  FaEye, 
  FaEyeSlash,
  FaUser,
  FaIdCard,
  FaUserTie,
  FaBriefcase
} from "react-icons/fa";

export default function AdminLogin({ onLoginSuccess }) {
  // Form states
  const [loginType, setLoginType] = useState("employee"); // "employee" or "admin"
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyOTP, setIsVerifyOTP] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Form data states
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [userId, setUserId] = useState("");
  
  // Employee login specific
  const [employeeId, setEmployeeId] = useState("");
  const [employeeLoginType, setEmployeeLoginType] = useState("email"); // "email" or "employeeId"
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // API configuration
//  const API_BASE = process.env.REACT_APP_API_BASE || "https://pms-lj2e.onrender.com/api";
    const API_BASE = `${process.env.REACT_APP_API_BASE}/api`;
  // Clear all form fields
  const clearForm = () => {
    setCompanyName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setEmployeeId("");
    setError("");
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle Employee Login
  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validate inputs
    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (employeeLoginType === "email" && !email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (employeeLoginType === "employeeId" && !employeeId) {
      setError("Employee ID is required");
      setLoading(false);
      return;
    }

    // Prepare login data
    const loginData = {
      password: password,
    };

    if (employeeLoginType === "email") {
      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }
      loginData.email = email.toLowerCase().trim();
    } else {
      loginData.employeeId = employeeId.trim();
    }

    try {
      console.log("Attempting employee login with:", loginData);

      const response = await axios.post(`${API_BASE}/employee-resignation/login`, loginData);
      
      console.log("Employee login response:", response.data);

      if (response.data.success) {
        // Store employee token and data
        localStorage.setItem("employeeToken", response.data.token);
        localStorage.setItem("employeeData", JSON.stringify(response.data.data));
        localStorage.setItem("userType", "employee");
        
        setMessage("Employee login successful! Redirecting to dashboard...");
        
        // Call parent's onLoginSuccess function with employee data
        if (onLoginSuccess && typeof onLoginSuccess === 'function') {
          // Pass both token and user data
          onLoginSuccess(response.data.token, {
            ...response.data.data,
            type: "employee"
          });
        }
      } else {
        setError(response.data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Employee login error:", err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login (your existing admin login)
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: email.toLowerCase().trim(),
        password: password
      });

      console.log("Admin login response:", response.data);

      if (response.data.success) {
        // Call parent's onLoginSuccess function
        if (onLoginSuccess && typeof onLoginSuccess === 'function') {
          onLoginSuccess(response.data.token, {
            ...response.data.user,
            type: "admin"
          });
          setMessage("Admin login successful! Redirecting...");
        } else {
          setError("Login successful but redirection failed.");
        }
      } else {
        setError(response.data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration (Admin only)
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validation
    if (!companyName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (companyName.length < 2) {
      setError("Company name must be at least 2 characters");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        password: password
      });

      console.log("Registration response:", response.data);

      if (response.data.success) {
        // Call parent's onLoginSuccess function
        if (onLoginSuccess && typeof onLoginSuccess === 'function') {
          onLoginSuccess(response.data.token, {
            ...response.data.user,
            type: "admin"
          });
          setMessage("Registration successful! Redirecting...");
        } else {
          setError("Registration successful but redirection failed.");
        }
      } else {
        setError(response.data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password (Admin only)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
        email: email.toLowerCase().trim()
      });

      console.log("Forgot password response:", response.data);

      if (response.data.success) {
        // Check if OTP is returned for debugging
        if (response.data.debugOTP) {
          setMessage(`OTP generated! For testing purposes: ${response.data.debugOTP}`);
        } else {
          setMessage(`OTP has been sent to ${response.data.email || email}. Please check your inbox and spam folder.`);
        }
        setIsVerifyOTP(true);
        setIsForgotPassword(false);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      
      // Check if it's an email configuration error
      if (err.response?.data?.debugInfo) {
        setError(`Email sending failed: ${err.response.data.message}. Please contact support.`);
      } else {
        setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP (Admin only)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp) {
      setError("OTP is required");
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: email.toLowerCase().trim(),
        otp: otp.trim()
      });

      console.log("Verify OTP response:", response.data);

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setUserId(response.data.userId);
        setIsResetPassword(true);
        setIsVerifyOTP(false);
        setMessage("OTP verified successfully! Now set your new password.");
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password (Admin only)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!newPassword || !confirmNewPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        resetToken,
        newPassword,
        userId
      });

      console.log("Reset password response:", response.data);

      if (response.data.success) {
        setMessage("Password reset successful! You can now login with your new password.");
        
        // Reset all states and go back to login
        setTimeout(() => {
          clearForm();
          setIsResetPassword(false);
          setIsForgotPassword(false);
          setIsLogin(true);
        }, 3000);
      } else {
        setError(response.data.message || "Password reset failed");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Form navigation functions
  const toggleForm = () => {
    clearForm();
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setIsVerifyOTP(false);
    setIsResetPassword(false);
  };

  const startForgotPassword = () => {
    clearForm();
    setIsForgotPassword(true);
    setIsLogin(false);
  };

  const goToLogin = () => {
    clearForm();
    setIsLogin(true);
    setIsForgotPassword(false);
    setIsVerifyOTP(false);
    setIsResetPassword(false);
  };

  // Password visibility toggles
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);

  // Switch between Employee and Admin login
  const switchLoginType = (type) => {
    setLoginType(type);
    clearForm();
    setIsLogin(true);
    setIsForgotPassword(false);
    setIsVerifyOTP(false);
    setIsResetPassword(false);
  };

  return (
    <div className="container-fluid vh-100" style={{ 
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      <div className="row h-100">
        {/* Left Side - Brand/Info */}
        <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}>
          <div className="text-center p-4 p-lg-5">
            <div className="mb-5">
			<img 
  src="data:image/jpeg;base64,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" 
  alt="AITS Logo" 
  style={{
    width: "120px",
    height: "120px",
    objectFit: "contain",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  }}
 
/>
              <h1 className="display-4 fw-bold mb-4">P M S</h1>
              <p className="lead mb-4" style={{ fontSize: "1.25rem", opacity: 0.9 }}>
                {loginType === "employee" 
                  ? "Employee Resignation & Management Portal"
                  : "Admin Dashboard & Company Management"}
              </p>
            </div>
            
            <div className="mt-5">
              <div className="d-flex align-items-center justify-content-center mb-4">
                <div className="bg-white rounded-circle p-3 me-3 shadow">
                  {loginType === "employee" ? (
                    <FaUserTie size={32} className="text-primary" />
                  ) : (
                    <FaBuilding size={32} className="text-primary" />
                  )}
                </div>
                <div className="text-start">
                  <h5 className="fw-bold mb-1">
                    {loginType === "employee" ? "Employee Portal" : "Company Management"}
                  </h5>
                  <p className="mb-0" style={{ opacity: 0.9 }}>
                    {loginType === "employee" 
                      ? "Access your resignation details and profile"
                      : "Manage multiple companies with ease"}
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-center justify-content-center mb-4">
                <div className="bg-white rounded-circle p-3 me-3 shadow">
                  <FaLock size={32} className="text-success" />
                </div>
                <div className="text-start">
                  <h5 className="fw-bold mb-1">Secure Access</h5>
                  <p className="mb-0" style={{ opacity: 0.9 }}>
                    {loginType === "employee" 
                      ? "Secure employee login with JWT authentication"
                      : "Enterprise-grade security with JWT"}
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-center justify-content-center">
                <div className="bg-white rounded-circle p-3 me-3 shadow">
                  {loginType === "employee" ? (
                    <FaBriefcase size={32} className="text-warning" />
                  ) : (
                    <FaUser size={32} className="text-warning" />
                  )}
                </div>
                <div className="text-start">
                  <h5 className="fw-bold mb-1">
                    {loginType === "employee" ? "Resignation Management" : "Admin Dashboard"}
                  </h5>
                  <p className="mb-0" style={{ opacity: 0.9 }}>
                    {loginType === "employee" 
                      ? "Track and manage your resignation status"
                      : "Complete control and analytics"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <div className="w-100" style={{ maxWidth: "420px" }}>
            {/* Login Type Switcher */}
            <div className="mb-4">
              <div className="btn-group w-100 shadow-sm" role="group">
                <button
                  type="button"
                  className={`btn ${loginType === "employee" ? "btn-primary" : "btn-outline-primary"} py-2`}
                  onClick={() => switchLoginType("employee")}
                >
                  <FaUserTie className="me-2" />
                  Employee Login
                </button>
                <button
                  type="button"
                  className={`btn ${loginType === "admin" ? "btn-primary" : "btn-outline-primary"} py-2`}
                  onClick={() => switchLoginType("admin")}
                >
                  <FaUser className="me-2" />
                  Admin Login
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ color: "#2c3e50" }}>
                {loginType === "employee" ? "Employee Login" : 
                 isForgotPassword ? "Reset Password" : 
                 isVerifyOTP ? "Verify OTP" : 
                 isResetPassword ? "Set New Password" :
                 isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted mb-0">
                {loginType === "employee" ? "Access your resignation portal" :
                 isForgotPassword ? "Enter your email to receive OTP" : 
                 isVerifyOTP ? "Enter OTP sent to your email" : 
                 isResetPassword ? "Create a strong new password" :
                 isLogin ? "Sign in to your PMS System" : "Register your company account"}
              </p>
            </div>

            {/* Messages */}
            {message && (
              <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">{message}</div>
                  <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">{error}</div>
                  <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
              </div>
            )}

            {/* EMPLOYEE LOGIN FORM */}
            {loginType === "employee" && isLogin && !isForgotPassword && !isVerifyOTP && !isResetPassword && (
              <form onSubmit={handleEmployeeLogin}>
                {/* Login Type Selection */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Login With</label>
                  <div className="btn-group w-100 mb-3">
                    <button
                      type="button"
                      className={`btn ${employeeLoginType === "email" ? "btn-primary" : "btn-outline-primary"} flex-grow-1`}
                      onClick={() => setEmployeeLoginType("email")}
                    >
                      <FaEnvelope className="me-2" />
                      Email
                    </button>
                    <button
                      type="button"
                      className={`btn ${employeeLoginType === "employeeId" ? "btn-primary" : "btn-outline-primary"} flex-grow-1`}
                      onClick={() => setEmployeeLoginType("employeeId")}
                    >
                      <FaIdCard className="me-2" />
                      Employee ID
                    </button>
                  </div>
                </div>

                {/* Email or Employee ID Input */}
                {employeeLoginType === "email" ? (
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <FaEnvelope className="text-muted" />
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        required
                        style={{ borderColor: "#dee2e6" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Employee ID</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <FaIdCard className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="Enter your Employee ID"
                        required
                        style={{ borderColor: "#dee2e6" }}
                      />
                    </div>
                    <small className="text-muted">Format: EMP-RES-YYYY-MM-XXXX</small>
                  </div>
                )}

                {/* Password Input */}
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-start-0 border-end-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      style={{ borderColor: "#dee2e6" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={togglePasswordVisibility}
                      style={{ borderColor: "#dee2e6" }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="rememberMe" style={{ color: "#2c3e50" }}>
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    onClick={() => {
                      setMessage("For employee password reset, please contact HR department.");
                    }}
                    style={{ color: "#667eea" }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    height: "48px"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Employee Login <FaArrowRight className="ms-2" />
                    </>
                  )}
                </button>

                {/* Switch to Admin Login */}
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Admin?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      onClick={() => switchLoginType("admin")}
                      style={{ color: "#667eea" }}
                    >
                      Click here for admin login
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ADMIN LOGIN FORM (Original) */}
            {loginType === "admin" && isLogin && !isForgotPassword && !isVerifyOTP && !isResetPassword && (
              <form onSubmit={handleAdminLogin}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaEnvelope className="text-muted" />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      style={{ borderColor: "#dee2e6" }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-start-0 border-end-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      style={{ borderColor: "#dee2e6" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={togglePasswordVisibility}
                      style={{ borderColor: "#dee2e6" }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="rememberMe" style={{ color: "#2c3e50" }}>
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    onClick={startForgotPassword}
                    style={{ color: "#667eea" }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    height: "48px"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Admin Login <FaArrowRight className="ms-2" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      onClick={toggleForm}
                      style={{ color: "#667eea" }}
                    >
                      Register here
                    </button>
                  </p>
                  <p className="text-muted mb-0 mt-2">
                    Employee?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      onClick={() => switchLoginType("employee")}
                      style={{ color: "#667eea" }}
                    >
                      Click here for employee login
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ADMIN REGISTRATION FORM */}
            {loginType === "admin" && !isLogin && !isForgotPassword && !isVerifyOTP && !isResetPassword && (
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Company Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaBuilding className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      required
                      minLength="2"
                      style={{ borderColor: "#dee2e6" }}
                    />
                  </div>
                  <small className="text-muted">Minimum 2 characters</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaEnvelope className="text-muted" />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter business email"
                      required
                      style={{ borderColor: "#dee2e6" }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-start-0 border-end-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password (min. 6 chars)"
                      required
                      minLength="6"
                      style={{ borderColor: "#dee2e6" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={togglePasswordVisibility}
                      style={{ borderColor: "#dee2e6" }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="text-muted">Minimum 6 characters</small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control border-start-0 border-end-0"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                      minLength="6"
                      style={{ borderColor: "#dee2e6" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={toggleConfirmPasswordVisibility}
                      style={{ borderColor: "#dee2e6" }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    height: "48px",
                    background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                    border: "none"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      onClick={toggleForm}
                      style={{ color: "#667eea" }}
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ADMIN FORGOT PASSWORD FORM */}
            {loginType === "admin" && isForgotPassword && !isVerifyOTP && !isResetPassword && (
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaEnvelope className="text-muted" />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                      style={{ borderColor: "#dee2e6" }}
                    />
                  </div>
                  <small className="text-muted">
                    We'll send a 6-digit OTP to this email address
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    height: "48px"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none fw-semibold"
                    onClick={goToLogin}
                    style={{ color: "#667eea" }}
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* ADMIN VERIFY OTP FORM */}
            {loginType === "admin" && isVerifyOTP && !isResetPassword && (
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Enter OTP</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control text-center"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      required
                      style={{ 
                        letterSpacing: "10px", 
                        fontSize: "24px", 
                        fontWeight: "bold",
                        borderColor: "#dee2e6",
                        height: "60px"
                      }}
                    />
                  </div>
                  <small className="text-muted">
                    Check your email for the OTP (valid for 15 minutes)
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    height: "48px"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none fw-semibold me-3"
                    onClick={() => {
                      setIsVerifyOTP(false);
                      setIsForgotPassword(true);
                    }}
                    style={{ color: "#667eea" }}
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none fw-semibold"
                    onClick={goToLogin}
                    style={{ color: "#667eea" }}
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* ADMIN RESET PASSWORD FORM */}
            {loginType === "admin" && isResetPassword && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-control border-start-0 border-end-0"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength="6"
                      style={{ borderColor: "#dee2e6" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={toggleNewPasswordVisibility}
                      style={{ borderColor: "#dee2e6" }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="text-muted">Minimum 6 characters</small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: "#2c3e50" }}>Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      className="form-control border-start-0"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength="6"
                      style={{ borderColor: "#dee2e6" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 mb-3 fw-semibold"
                  disabled={loading}
                  style={{ 
                    fontSize: "16px",
                    height: "48px",
                    background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                    border: "none"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Resetting Password...
                  </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none fw-semibold"
                    onClick={goToLogin}
                    style={{ color: "#667eea" }}
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* Footer Note */}
            <div className="text-center mt-4">
              <p className="text-muted small">
                © {new Date().getFullYear()} AITS Performance Management System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}