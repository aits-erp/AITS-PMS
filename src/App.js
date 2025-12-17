// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import Mnavigation from './Navigation/Mnavigation';
import UserDashboard from './UserDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState(''); // 'admin' or 'employee'

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    const user = localStorage.getItem('user') || localStorage.getItem('employeeData');
    const type = localStorage.getItem('userType');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        setUserType(type || (parsedUser.type || 'admin'));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  // Handle successful login
  const handleLoginSuccess = (token, user) => {
    // Determine user type
    const userType = user.type || (user.employeeId ? 'employee' : 'admin');
    
    // Store data based on user type
    if (userType === 'employee') {
      localStorage.setItem('employeeToken', token);
      localStorage.setItem('employeeData', JSON.stringify(user));
    } else {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    localStorage.setItem('userType', userType);
    
    setUserData(user);
    setUserType(userType);
    setIsLoggedIn(true);
  };

  // Handle logout - IMPORTANT: Make this available to child components
  const handleLogout = () => {
    // Clear all auth data
    localStorage.clear();
    
    setUserData(null);
    setUserType('');
    setIsLoggedIn(false);
    
    // Force redirect to login
    window.location.href = '/login';
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading AITS PMS System...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Route - Login Page */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? (
              userType === 'employee' ? (
                <Navigate to="/employee-dashboard" replace />
              ) : (
                <Navigate to="/admin-dashboard" replace />
              )
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Admin Dashboard Route */}
        <Route 
          path="/admin-dashboard/*" 
          element={
            isLoggedIn && userType === 'admin' ? (
              <Mnavigation user={userData} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Employee Dashboard Route */}
        <Route 
          path="/employee-dashboard" 
          element={
            isLoggedIn && userType === 'employee' ? (
              <UserDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Default Route */}
        <Route 
          path="/" 
          element={
            isLoggedIn ? (
              userType === 'employee' ? (
                <Navigate to="/employee-dashboard" replace />
              ) : (
                <Navigate to="/admin-dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Catch all route - redirect to login */}
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;