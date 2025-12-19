import React, { useState, useEffect, useRef } from "react";
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

export default function PipManagement({ editingPip, onSaveSuccess, onCancelEdit }) {
	const API_BASE = `${process.env.REACT_APP_API_BASE}`;
//  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  const PIP_API = `${API_BASE}/api/pips`;
  
  const [form, setForm] = useState({
    employee: "",
    employeeId: "",
    dateIssued: "",
    reason: "",
    targets: "",
    comments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showIdDropdown, setShowIdDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [idSearchTerm, setIdSearchTerm] = useState("");
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");
  
  const idDropdownRef = useRef(null);
  const nameDropdownRef = useRef(null);
  const idInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Load employee data on mount
  useEffect(() => {
    checkServerStatus();
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

  // Update form when editingPip changes
  useEffect(() => {
    if (editingPip) {
      setForm({
        employee: editingPip.employee || "",
        employeeId: editingPip.employeeId || "",
        dateIssued: editingPip.dateIssued || "",
        reason: editingPip.reason || "",
        targets: editingPip.targets || "",
        comments: editingPip.comments || "",
      });
      setNameSearchTerm(editingPip.employee || "");
      setIdSearchTerm(editingPip.employeeId || "");
    } else {
      resetForm();
    }
  }, [editingPip]);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/`);
      if (response.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("error");
      }
    } catch (error) {
      setServerStatus("offline");
    }
  };

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

  // Handle employee name input change
  const handleEmployeeNameChange = (value) => {
    setForm(prev => ({ ...prev, employee: value }));
    setNameSearchTerm(value);
    if (value.trim() === "") {
      setShowNameDropdown(false);
    } else {
      setShowNameDropdown(true);
    }
  };

  // Handle employee ID input change
  const handleEmployeeIdChange = (value) => {
    setForm(prev => ({ ...prev, employeeId: value }));
    setIdSearchTerm(value);
    if (value.trim() === "") {
      setShowIdDropdown(false);
    } else {
      setShowIdDropdown(true);
    }
  };

  // Handle other form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle ID selection
  const handleIdSelect = (id, name) => {
    setForm(prev => ({ 
      ...prev, 
      employeeId: id,
      employee: name
    }));
    setIdSearchTerm(id);
    setNameSearchTerm(name);
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  // Handle name selection
  const handleNameSelect = (name, id) => {
    setForm(prev => ({ 
      ...prev, 
      employee: name,
      employeeId: id || ""
    }));
    setNameSearchTerm(name);
    setIdSearchTerm(id || "");
    setShowNameDropdown(false);
    setShowIdDropdown(false);
  };

  // Clear ID field
  const clearIdField = () => {
    setForm(prev => ({ ...prev, employeeId: "" }));
    setIdSearchTerm("");
    setShowIdDropdown(false);
  };

  // Clear name field
  const clearNameField = () => {
    setForm(prev => ({ ...prev, employee: "" }));
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

  const resetForm = () => {
    setForm({
      employee: "",
      employeeId: "",
      dateIssued: "",
      reason: "",
      targets: "",
      comments: "",
    });
    setNameSearchTerm("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
    setShowNameDropdown(false);
    setBackendError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.employee.trim() || !form.dateIssued) {
      alert("Employee and Date Issued are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const pipData = {
        employee: form.employee.trim(),
        employeeId: form.employeeId.trim(),
        dateIssued: form.dateIssued,
        reason: form.reason.trim(),
        targets: form.targets.trim(),
        comments: form.comments.trim(),
      };

      let response;
      if (editingPip && editingPip._id) {
        // Update existing PIP
        response = await axios.put(`${PIP_API}/${editingPip._id}`, pipData);
        alert("PIP updated successfully!");
      } else {
        // Create new PIP
        response = await axios.post(PIP_API, pipData);
        alert("PIP submitted successfully!");
      }

      if (response.data.success) {
        resetForm();
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        if (onCancelEdit && editingPip) {
          onCancelEdit();
        }
      } else {
        alert("Error saving PIP: " + response.data.error);
      }
    } catch (err) {
      console.error("Error saving PIP:", err);
      alert("Error saving PIP: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          "Employee ID": "EMP-RES-2023-12-1234",
          "Employee": "John Doe",
          "Date Issued": new Date().toISOString().split('T')[0],
          "Reason": "Performance below expectations in Q4",
          "Targets": "Increase sales by 20% within next quarter, Complete all assigned tasks on time",
          "Comments": "Employee has shown improvement but needs consistent performance"
        },
        {
          "Employee ID": "EMP-RES-2023-12-5678",
          "Employee": "Jane Smith",
          "Date Issued": new Date().toISOString().split('T')[0],
          "Reason": "Missed multiple project deadlines",
          "Targets": "Complete project management training, Submit weekly progress reports",
          "Comments": "Employee needs to improve time management skills"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PIP Template");
      
      const wscols = [
        { wch: 25 }, // Employee ID
        { wch: 25 }, // Employee
        { wch: 15 }, // Date Issued
        { wch: 40 }, // Reason
        { wch: 40 }, // Targets
        { wch: 40 }, // Comments
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, "PIP_Template.xlsx");
    } catch (error) {
      alert("Error creating Excel template. Please try again.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert("Please upload a valid Excel or CSV file");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          
          const employeeId = firstRow["Employee ID"] || firstRow["employeeId"] || firstRow["EmployeeID"] || "";
          const employee = firstRow["Employee"] || firstRow["employee"] || firstRow["EMPLOYEE"] || "";
          const dateIssued = firstRow["Date Issued"] || firstRow["date_issued"] || firstRow["Date"] || firstRow["date"] || firstRow["DATE"] || "";
          const reason = firstRow["Reason"] || firstRow["reason"] || firstRow["REASON"] || firstRow["Reason for PIP"] || firstRow["reason_for_pip"] || "";
          const targets = firstRow["Targets"] || firstRow["targets"] || firstRow["TARGETS"] || firstRow["Specific Improvement Targets"] || firstRow["targets_and_timeline"] || "";
          const comments = firstRow["Comments"] || firstRow["comments"] || firstRow["COMMENTS"] || firstRow["Manager Review Comments"] || firstRow["review_comments"] || "";

          setForm({
            employeeId: employeeId.toString(),
            employee: employee.toString(),
            dateIssued: dateIssued.toString(),
            reason: reason.toString(),
            targets: targets.toString(),
            comments: comments.toString(),
          });
          setIdSearchTerm(employeeId.toString());
          setNameSearchTerm(employee.toString());

          // Import all rows from Excel if more than one
          if (jsonData.length > 1) {
            const pipData = jsonData.map(row => ({
              employeeId: (row["Employee ID"] || row["employeeId"] || row["EmployeeID"] || "").toString(),
              employee: (row["Employee"] || row["employee"] || row["EMPLOYEE"] || "").toString(),
              dateIssued: (row["Date Issued"] || row["date_issued"] || row["Date"] || row["date"] || row["DATE"] || "").toString(),
              reason: (row["Reason"] || row["reason"] || row["REASON"] || row["Reason for PIP"] || row["reason_for_pip"] || "").toString(),
              targets: (row["Targets"] || row["targets"] || row["TARGETS"] || row["Specific Improvement Targets"] || row["targets_and_timeline"] || "").toString(),
              comments: (row["Comments"] || row["comments"] || row["COMMENTS"] || row["Manager Review Comments"] || row["review_comments"] || "").toString(),
            }));

            const response = await axios.post(`${PIP_API}/bulk-import`, pipData);
            if (response.data.success) {
              if (onSaveSuccess) {
                onSaveSuccess();
              }
              alert(`${jsonData.length} PIP records imported successfully!`);
            }
          } else {
            alert("PIP data loaded from Excel successfully!");
          }
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing the uploaded file: " + (error.response?.data?.error || error.message));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  const inputStyle = {
    background: "#f8f9fa",
    border: "1px solid #dfe1e5",
    borderRadius: "10px",
    padding: "12px",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "100px",
    resize: "vertical",
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Performance Improvement Plan (PIP) Management</h5>
        <div className="d-flex align-items-center gap-2">
          {serverStatus === 'offline' && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={checkServerStatus}
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      <div className="border rounded p-4 bg-light mb-4">
        <h6 className="fw-bold mb-3">
          {editingPip ? "Edit Performance Improvement Plan" : "Create New Performance Improvement Plan"}
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
                    placeholder="Type to search Employee ID..."
                    className="form-control"
                    style={inputStyle}
                    value={idSearchTerm}
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
                Employee on PIP <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <div className="input-group" ref={nameInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    placeholder="Type to search employee name..."
                    className="form-control"
                    style={inputStyle}
                    value={nameSearchTerm}
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

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Date Issued <span className="text-danger">*</span>
              </label>
              <input
                name="dateIssued"
                type="date"
                className="form-control"
                style={inputStyle}
                value={form.dateIssued}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Reason for PIP</label>
              <textarea
                name="reason"
                rows={3}
                placeholder="Enter reason for performance improvement plan..."
                className="form-control"
                style={textareaStyle}
                value={form.reason}
                onChange={handleChange}
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Specific Improvement Targets & Timeline</label>
              <textarea
                name="targets"
                rows={3}
                placeholder="Enter specific improvement targets and timeline..."
                className="form-control"
                style={textareaStyle}
                value={form.targets}
                onChange={handleChange}
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Manager Review Comments</label>
              <textarea
                name="comments"
                rows={3}
                placeholder="Enter manager review comments..."
                className="form-control"
                style={textareaStyle}
                value={form.comments}
                onChange={handleChange}
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
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
                  {editingPip && (
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
                    disabled={isSubmitting || isLoadingData}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="fa-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave />
                        <span>{editingPip ? "Update PIP" : "Create PIP"}</span>
                      </>
                    )}
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