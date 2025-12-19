import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaUpload, 
  FaSave, 
  FaFileExcel, 
  FaUser, 
  FaSpinner, 
  FaSearch, 
  FaTimes,
  FaIdCard 
} from "react-icons/fa";

import * as XLSX from "xlsx";
import axios from "axios";

export default function Feedback1({ editingFeedback, onSaveSuccess, onCancelEdit }) {
  //const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const API_BASE = `${process.env.REACT_APP_API_BASE}`;
  const FEEDBACK_API = `${API_BASE}/api/feedback1`;
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  
  // Form state
  const [feedback, setFeedback] = useState("");
  const [development, setDevelopment] = useState("");
  const [strengths, setStrengths] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Employee selection state
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showIdDropdown, setShowIdDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [idSearchTerm, setIdSearchTerm] = useState("");
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  
  const idDropdownRef = useRef(null);
  const nameDropdownRef = useRef(null);
  const idInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Fetch employee data on mount
  useEffect(() => {
    fetchEmployeeData();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (idDropdownRef.current && !idDropdownRef.current.contains(event.target) &&
          idInputRef.current && !idInputRef.current.contains(event.target)) {
        setShowIdDropdown(false);
      }
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target) &&
          nameInputRef.current && !nameInputRef.current.contains(event.target)) {
        setShowNameDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update form when editingFeedback changes
  useEffect(() => {
    if (editingFeedback) {
      setFeedback(editingFeedback.feedback || "");
      setDevelopment(editingFeedback.development || "");
      setStrengths(editingFeedback.strengths || "");
      setRating(editingFeedback.rating || 0);
      setEmployee(editingFeedback.employee || "");
      setEmployeeId(editingFeedback.employeeId || "");
      setNameSearchTerm(editingFeedback.employee || "");
      setIdSearchTerm(editingFeedback.employeeId || "");
    } else {
      resetForm();
    }
  }, [editingFeedback]);

  // Fetch employee data from backend
  const fetchEmployeeData = async () => {
    setIsLoadingData(true);
    setBackendError("");
    try {
      // Try /all-ids first, fallback to /names if it fails
      const response = await fetch(`${RESIGNATION_API}/all-ids`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Fallback to /names endpoint
        const namesResponse = await fetch(`${RESIGNATION_API}/names`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!namesResponse.ok) {
          throw new Error(`Failed to fetch employee data`);
        }
        
        const namesData = await namesResponse.json();
        
        if (namesData.success) {
          // Convert names array to format expected by component
          const formattedData = namesData.data.map(name => ({
            employeeId: `EMP-ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            fullName: name,
            email: "",
            status: "Unknown",
            createdAt: new Date().toISOString()
          }));
          
          setEmployeeData(formattedData);
        } else {
          throw new Error(namesData.error || "Failed to fetch employee names");
        }
      } else {
        const data = await response.json();
        
        if (data.success) {
          setEmployeeData(data.data || []);
        } else {
          throw new Error(data.error || "Failed to fetch employee data");
        }
      }
    } catch (error) {
      setBackendError(error.message);
      setEmployeeData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetForm = () => {
    setFeedback("");
    setDevelopment("");
    setStrengths("");
    setRating(0);
    setEmployee("");
    setEmployeeId("");
    setNameSearchTerm("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  // Handle employee name input change
  const handleEmployeeNameChange = (value) => {
    setEmployee(value);
    setNameSearchTerm(value);
    if (value.trim() === "") {
      setShowNameDropdown(false);
    } else {
      setShowNameDropdown(true);
    }
  };

  // Handle employee ID input change
  const handleEmployeeIdChange = (value) => {
    setEmployeeId(value);
    setIdSearchTerm(value);
    if (value.trim() === "") {
      setShowIdDropdown(false);
    } else {
      setShowIdDropdown(true);
    }
  };

  // Handle ID selection
  const handleIdSelect = (id, name) => {
    setEmployeeId(id);
    setEmployee(name);
    setIdSearchTerm(id);
    setNameSearchTerm(name);
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  // Handle name selection
  const handleNameSelect = (name, id) => {
    setEmployee(name);
    setEmployeeId(id || "");
    setNameSearchTerm(name);
    setIdSearchTerm(id || "");
    setShowNameDropdown(false);
    setShowIdDropdown(false);
  };

  // Clear ID field
  const clearIdField = () => {
    setEmployeeId("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
  };

  // Clear name field
  const clearNameField = () => {
    setEmployee("");
    setNameSearchTerm("");
    setShowNameDropdown(false);
  };

  // Handle ID input focus
  const handleIdInputFocus = () => {
    if (idSearchTerm.trim() !== "" || employeeData.length > 0) {
      setShowIdDropdown(true);
    }
  };

  // Handle name input focus
  const handleNameInputFocus = () => {
    if (nameSearchTerm.trim() !== "" || employeeData.length > 0) {
      setShowNameDropdown(true);
    }
  };

  // Filter employee IDs
  const filteredIds = employeeData.filter(item =>
    item.employeeId?.toLowerCase().includes(idSearchTerm.toLowerCase()) ||
    item.fullName?.toLowerCase().includes(idSearchTerm.toLowerCase())
  );

  // Filter employee names
  const filteredNames = employeeData.filter(item =>
    item.fullName?.toLowerCase().includes(nameSearchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(nameSearchTerm.toLowerCase())
  );

  // Handle retry loading data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim() || rating === 0 || !employee.trim()) {
      alert("Please fill feedback, select rating, and select an employee!");
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        feedback: feedback.trim(),
        development: development.trim(),
        strengths: strengths.trim(),
        rating: rating,
        employee: employee.trim(),
        employeeId: employeeId.trim(),
      };

      let response;
      if (editingFeedback && editingFeedback._id) {
        // Update existing feedback
        response = await axios.put(`${FEEDBACK_API}/${editingFeedback._id}`, feedbackData);
        alert("Feedback updated successfully!");
      } else {
        // Create new feedback
        response = await axios.post(FEEDBACK_API, feedbackData);
        alert("Feedback submitted successfully!");
      }

      resetForm();
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      if (onCancelEdit && editingFeedback) {
        onCancelEdit();
      }
      
    } catch (err) {
      console.error("Error saving feedback", err);
      alert("Error saving feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    // Create empty data for the template - just headers
    const emptyData = [
      {
        "Employee ID": "",
        "Employee": "",
        "Feedback": "",
        "Development": "",
        "Strengths": "",
        "Rating": ""
      },
      {
        "Employee ID": "",
        "Employee": "",
        "Feedback": "",
        "Development": "",
        "Strengths": "",
        "Rating": ""
      }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback Template");
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Employee ID column width
      { wch: 25 }, // Employee column width
      { wch: 40 }, // Feedback column width
      { wch: 30 }, // Development column width
      { wch: 30 }, // Strengths column width
      { wch: 15 }, // Rating column width
    ];
    worksheet["!cols"] = wscols;

    // Generate Excel file
    XLSX.writeFile(workbook, "Feedback_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          const newCards = jsonData.map((row) => {
            const employeeId = row["Employee ID"] || row["employeeId"] || row["EmployeeID"] || "";
            const employee = row["Employee"] || row["employee"] || row["EMPLOYEE"] || "";
            const feedback = row["Feedback"] || row["feedback"] || row["FEEDBACK"] || "";
            const development = row["Development"] || row["development"] || row["Areas of Development"] || row["areas_of_development"] || "";
            const strengths = row["Strengths"] || row["strengths"] || row["STRENGTHS"] || row["Key Strengths"] || row["key_strengths"] || "";
            const rating = row["Rating"] || row["rating"] || row["RATING"] || 0;

            return {
              employeeId: employeeId.toString(),
              employee: employee.toString(),
              feedback: feedback.toString(),
              development: development.toString(),
              strengths: strengths.toString(),
              rating: parseInt(rating) || 0,
            };
          });

          await axios.post(`${FEEDBACK_API}/bulk-import`, newCards);
          
          if (onSaveSuccess) {
            onSaveSuccess();
          }
          
          alert(`${newCards.length} feedback records imported successfully!`);
        }
      } catch (err) {
        console.error("Error importing data", err);
        alert("Error importing data");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const inputStyle = {
    background: "#f8f9fa",
    border: "1px solid #dfe1e5",
    borderRadius: "6px",
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <h5 className="fw-bold mb-4">Feedback Management</h5>

      {/* Feedback Form */}
      <div className="border rounded p-4 bg-light mb-4">
        <h6 className="fw-bold mb-3">
          {editingFeedback ? "Edit Feedback" : "Add New Feedback"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Employee ID Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Employee ID
              </label>
              <div className="position-relative">
                <div className="input-group" ref={idInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaIdCard className="text-muted" />
                  </span>
                  <input
                    value={idSearchTerm}
                    className="form-control"
                    placeholder="Type to search Employee ID (e.g., EMP-RES-2024-12-1234)..."
                    style={inputStyle}
                    onChange={(e) => handleEmployeeIdChange(e.target.value)}
                    onFocus={handleIdInputFocus}
                    autoComplete="off"
                    disabled={isLoadingData || isSubmitting}
                  />
                  {idSearchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearIdField}
                      style={{ cursor: 'pointer' }}
                      disabled={isSubmitting}
                    >
                      <FaTimes className="text-muted" />
                    </button>
                  )}
                  {isLoadingData ? (
                    <span className="input-group-text">
                      <FaSpinner className="fa-spin text-primary" />
                    </span>
                  ) : (
                    <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                      <FaSearch className="text-muted" />
                    </span>
                  )}
                </div>
                
                {/* Employee ID Dropdown */}
                {showIdDropdown && (
                  <div 
                    ref={idDropdownRef}
                    className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                    style={{ 
                      zIndex: 1001, 
                      maxHeight: "250px", 
                      overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    {/* Search Results Header */}
                    <div className="p-2 border-bottom bg-light">
                      <small className="text-muted">
                        {filteredIds.length === 0 
                          ? "No matching employee IDs found" 
                          : `Found ${filteredIds.length} employee(s)`}
                      </small>
                    </div>
                    
                    {/* Search Results */}
                    {filteredIds.length > 0 ? (
                      filteredIds.map((item, index) => (
                        <div
                          key={index}
                          className="dropdown-item py-2 px-3"
                          onClick={() => handleIdSelect(item.employeeId, item.fullName)}
                          style={{ 
                            cursor: "pointer",
                            borderBottom: index < filteredIds.length - 1 ? "1px solid #f0f0f0" : "none",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                          <div className="d-flex align-items-center">
                            <FaIdCard className="me-2 text-primary" size={14} />
                            <div className="flex-grow-1">
                              <div className="fw-medium">{item.employeeId}</div>
                              <small className="text-muted">{item.fullName}</small>
                            </div>
                            <small className="text-muted">Click to select</small>
                          </div>
                        </div>
                      ))
                    ) : idSearchTerm.trim() !== "" && (
                      <div className="p-3 text-center text-muted">
                        <FaSearch className="mb-2" />
                        <div>No employees match your search</div>
                        <small>Try a different ID or name</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Employee Name Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Employee <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <div className="input-group" ref={nameInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    value={nameSearchTerm}
                    className="form-control"
                    placeholder="Type to search employee name..."
                    style={inputStyle}
                    onChange={(e) => handleEmployeeNameChange(e.target.value)}
                    onFocus={handleNameInputFocus}
                    required
                    autoComplete="off"
                    disabled={isLoadingData || isSubmitting}
                  />
                  {nameSearchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearNameField}
                      style={{ cursor: 'pointer' }}
                      disabled={isSubmitting}
                    >
                      <FaTimes className="text-muted" />
                    </button>
                  )}
                  {isLoadingData ? (
                    <span className="input-group-text">
                      <FaSpinner className="fa-spin text-primary" />
                    </span>
                  ) : (
                    <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                      <FaSearch className="text-muted" />
                    </span>
                  )}
                </div>
                
                {/* Employee Name Dropdown */}
                {showNameDropdown && (
                  <div 
                    ref={nameDropdownRef}
                    className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                    style={{ 
                      zIndex: 1000, 
                      maxHeight: "250px", 
                      overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    {/* Search Results Header */}
                    <div className="p-2 border-bottom bg-light">
                      <small className="text-muted">
                        {filteredNames.length === 0 
                          ? "No matching employees found" 
                          : `Found ${filteredNames.length} employee(s)`}
                    </small>
                    </div>
                    
                    {/* Search Results */}
                    {filteredNames.length > 0 ? (
                      filteredNames.map((item, index) => (
                        <div
                          key={index}
                          className="dropdown-item py-2 px-3"
                          onClick={() => handleNameSelect(item.fullName, item.employeeId)}
                          style={{ 
                            cursor: "pointer",
                            borderBottom: index < filteredNames.length - 1 ? "1px solid #f0f0f0" : "none",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                          <div className="d-flex align-items-center">
                            <FaUser className="me-2 text-primary" size={14} />
                            <div className="flex-grow-1">
                              <div className="fw-medium">{item.fullName}</div>
                              <small className="text-muted">{item.employeeId}</small>
                            </div>
                            <small className="text-muted">Click to select</small>
                          </div>
                        </div>
                      ))
                    ) : nameSearchTerm.trim() !== "" && (
                      <div className="p-3 text-center text-muted">
                        <FaSearch className="mb-2" />
                        <div>No employees match your search</div>
                        <small>Try a different name or spelling</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Status Messages */}
              <div className="mt-2">
                {isLoadingData ? (
                  <small className="text-info d-flex align-items-center">
                    <FaSpinner className="fa-spin me-1" />
                    Loading employee data...
                  </small>
                ) : backendError ? (
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="text-danger">
                      <FaTimes className="me-1" />
                      {backendError}
                    </small>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleRetryLoadData}
                      disabled={isSubmitting}
                    >
                      Retry
                    </button>
                  </div>
                ) : employeeData.length > 0 ? (
                  <small className="text-success d-flex align-items-center">
                    <FaUser className="me-1" />
                    {employeeData.length} employees available for selection
                  </small>
                ) : (
                  <small className="text-warning d-flex align-items-center">
                    <FaTimes className="me-1" />
                    No employee data available. Please add resignation records first.
                  </small>
                )}
              </div>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Feedback *</label>
              <textarea
                name="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Enter feedback..."
                style={inputStyle}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">
                Areas of Development/Next Step
              </label>
              <textarea
                name="development"
                value={development}
                onChange={(e) => setDevelopment(e.target.value)}
                className="form-control"
                rows={2}
                placeholder="Enter areas for development or next steps..."
                style={inputStyle}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">
                Key Strengths/Achievements
              </label>
              <textarea
                name="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="form-control"
                rows={2}
                placeholder="Enter key strengths or achievements..."
                style={inputStyle}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Rating *</label>
              <div className="mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => !isSubmitting && setRating(star)}
                    style={{
                      fontSize: "28px",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      color: rating >= star ? "#FFD700" : "#d1d8dd",
                      marginRight: 6,
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <small className="text-muted d-block mt-1">Selected: {rating}/5</small>
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  {/* Download Excel Template Button */}
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={downloadExcelTemplate}
                    title="Download Excel Template"
                    disabled={isSubmitting}
                  >
                    <FaFileExcel />
                    <span>Download Template</span>
                  </button>
                  
                  {/* Upload Excel File */}
                  <div className="position-relative">
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="d-none"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="fileUpload"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      style={{ 
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.6 : 1
                      }}
                      title="Upload Excel File"
                    >
                      <FaUpload />
                      <span>Upload Excel</span>
                    </label>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  {editingFeedback && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        resetForm();
                        if (onCancelEdit) {
                          onCancelEdit();
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-success d-flex align-items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <FaSave />
                    <span>{isSubmitting ? "Saving..." : editingFeedback ? "Update" : "Submit"}</span>
                  </button>
                </div>
              </div>
              
             
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}