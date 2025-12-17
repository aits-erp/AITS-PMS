import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { 
  FaUpload, 
  FaSave, 
  FaUserPlus, 
  FaFileExcel, 
  FaUser, 
  FaSpinner, 
  FaSearch, 
  FaTimes,
  FaIdCard 
} from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function EmployeeOnboarding({ editingEmployee, onSaveSuccess, onCancelEdit }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  const ONBOARDING_API = `${API_BASE}/api/employee-onboarding`;
  
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    workEmail: "",
    hireDate: "",
    department: "",
    reportingManager: "",
    addedOn: "",
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

  // Update form when editingEmployee changes
  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        fullName: editingEmployee.fullName || "",
        employeeId: editingEmployee.employeeId || "",
        workEmail: editingEmployee.workEmail || "",
        hireDate: editingEmployee.hireDate ? new Date(editingEmployee.hireDate).toISOString().split('T')[0] : "",
        department: editingEmployee.department || "",
        reportingManager: editingEmployee.reportingManager || "",
        addedOn: editingEmployee.addedOn ? new Date(editingEmployee.addedOn).toISOString().slice(0, 16) : "",
      });
      setNameSearchTerm(editingEmployee.fullName || "");
      setIdSearchTerm(editingEmployee.employeeId || "");
    } else {
      resetForm();
    }
  }, [editingEmployee]);

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
    setFormData(prev => ({ ...prev, fullName: value }));
    setNameSearchTerm(value);
    if (value.trim() === "") {
      setShowNameDropdown(false);
    } else {
      setShowNameDropdown(true);
    }
  };

  // Handle employee ID input change
  const handleEmployeeIdChange = (value) => {
    setFormData(prev => ({ ...prev, employeeId: value }));
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle ID selection
  const handleIdSelect = (id, name) => {
    setFormData(prev => ({ 
      ...prev, 
      employeeId: id,
      fullName: name
    }));
    setIdSearchTerm(id);
    setNameSearchTerm(name);
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  // Handle name selection
  const handleNameSelect = (name, id) => {
    setFormData(prev => ({ 
      ...prev, 
      fullName: name,
      employeeId: id || ""
    }));
    setNameSearchTerm(name);
    setIdSearchTerm(id || "");
    setShowNameDropdown(false);
    setShowIdDropdown(false);
  };

  // Clear ID field
  const clearIdField = () => {
    setFormData(prev => ({ ...prev, employeeId: "" }));
    setIdSearchTerm("");
    setShowIdDropdown(false);
  };

  // Clear name field
  const clearNameField = () => {
    setFormData(prev => ({ ...prev, fullName: "" }));
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
    setFormData({
      fullName: "",
      employeeId: "",
      workEmail: "",
      hireDate: "",
      department: "",
      reportingManager: "",
      addedOn: "",
    });
    setNameSearchTerm("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
    setShowNameDropdown(false);
    setBackendError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.workEmail.trim()) {
      alert("Full Name & Email are required");
      return;
    }

    if (!formData.workEmail.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const employeeData = {
        fullName: formData.fullName.trim(),
        employeeId: formData.employeeId.trim(),
        workEmail: formData.workEmail.trim(),
        hireDate: formData.hireDate || "",
        department: formData.department.trim() || "",
        reportingManager: formData.reportingManager.trim() || "",
        addedOn: formData.addedOn || new Date().toISOString()
      };

      let response;
      if (editingEmployee && editingEmployee._id) {
        // Update existing employee
        response = await axios.put(`${ONBOARDING_API}/${editingEmployee._id}`, employeeData);
        alert("Employee updated successfully!");
      } else {
        // Create new employee
        response = await axios.post(ONBOARDING_API, employeeData);
        alert("Employee onboarded successfully!");
      }

      if (response.data.success) {
        resetForm();
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        if (onCancelEdit && editingEmployee) {
          onCancelEdit();
        }
      } else {
        alert("Error: " + response.data.error);
      }
      
    } catch (err) {
      console.error("Error saving employee:", err);
      alert("Error: " + (err.response?.data?.error || err.message));
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
          "Full Name": "John Doe",
          "Work Email": "john.doe@company.com",
          "Hire Date": new Date().toISOString().split('T')[0],
          "Department": "Engineering",
          "Reporting Manager": "Sarah Johnson",
          "Added On": new Date().toISOString().slice(0, 16)
        },
        {
          "Employee ID": "EMP-RES-2023-12-5678",
          "Full Name": "Jane Smith",
          "Work Email": "jane.smith@company.com",
          "Hire Date": new Date().toISOString().split('T')[0],
          "Department": "Human Resources",
          "Reporting Manager": "Michael Brown",
          "Added On": new Date().toISOString().slice(0, 16)
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Onboarding Template");
      
      const wscols = [
        { wch: 25 }, // Employee ID
        { wch: 25 }, // Full Name
        { wch: 25 }, // Work Email
        { wch: 15 }, // Hire Date
        { wch: 20 }, // Department
        { wch: 25 }, // Reporting Manager
        { wch: 20 }, // Added On
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, "Employee_Onboarding_Template.xlsx");
    } catch (error) {
      alert("Error creating Excel template. Please try again.");
    }
  };

  const handleFileUpload = (e) => {
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
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          
          // Extract data from Excel columns (case-insensitive matching)
          const employeeId = firstRow["Employee ID"] || firstRow["employee_id"] || firstRow["employeeId"] || 
                           firstRow["EMP ID"] || firstRow["emp_id"] || "";
          const fullName = firstRow["Full Name"] || firstRow["full_name"] || firstRow["fullname"] || 
                          firstRow["Employee Name"] || firstRow["employee_name"] || 
                          firstRow["name"] || firstRow["NAME"] || "";
          const workEmail = firstRow["Work Email"] || firstRow["work_email"] || 
                           firstRow["email"] || firstRow["Email"] || 
                           firstRow["EMAIL"] || firstRow["Official Email"] || "";
          const hireDate = firstRow["Hire Date"] || firstRow["hire_date"] || 
                          firstRow["hireDate"] || firstRow["Joining Date"] || 
                          firstRow["joining_date"] || firstRow["date"] || firstRow["DATE"] || "";
          const department = firstRow["Department"] || firstRow["department"] || 
                            firstRow["dept"] || firstRow["DEPT"] || "";
          const reportingManager = firstRow["Reporting Manager"] || firstRow["reporting_manager"] || 
                                  firstRow["manager"] || firstRow["Manager"] || firstRow["MANAGER"] || "";
          
          // Format dates if needed
          let formattedHireDate = "";
          if (hireDate) {
            if (typeof hireDate === 'number') {
              // Excel date serial number
              const excelDate = new Date((hireDate - 25569) * 86400 * 1000);
              formattedHireDate = excelDate.toISOString().split('T')[0];
            } else {
              // String date
              formattedHireDate = hireDate.toString().split('T')[0];
            }
          }

          setFormData({
            employeeId: employeeId.toString(),
            fullName: fullName.toString(),
            workEmail: workEmail.toString(),
            hireDate: formattedHireDate,
            department: department.toString(),
            reportingManager: reportingManager.toString(),
            addedOn: "",
          });
          setIdSearchTerm(employeeId.toString());
          setNameSearchTerm(fullName.toString());
          
          alert("Employee data loaded from Excel successfully!");
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
    borderRadius: "10px",
    padding: "12px",
    background: "#f8f9fa",
    border: "1px solid #dfe1e5",
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Employee Onboarding Management</h5>
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

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3">
            {editingEmployee ? "Edit Employee" : "New Employee Onboarding"}
          </h6>
          
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {/* Employee ID Field */}
              <Col md={6}>
                <Form.Label className="fw-semibold">
                  Employee ID
                </Form.Label>
                <div className="position-relative">
                  <div className="input-group" ref={idInputRef}>
                    <span className="input-group-text" style={{ 
                      background: "#f8f9fa", 
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px"
                    }}>
                      <FaIdCard className="text-muted" />
                    </span>
                    <Form.Control
                      type="text"
                      value={idSearchTerm}
                      onChange={(e) => handleEmployeeIdChange(e.target.value)}
                      onFocus={handleIdInputFocus}
                      placeholder="Type to search Employee ID..."
                      style={inputStyle}
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
                      <span className="input-group-text" style={{ 
                        background: "#f8f9fa",
                        borderTopRightRadius: "10px",
                        borderBottomRightRadius: "10px"
                      }}>
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
              </Col>

              {/* Employee Name Field */}
              <Col md={6}>
                <Form.Label className="fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <div className="input-group" ref={nameInputRef}>
                    <span className="input-group-text" style={{ 
                      background: "#f8f9fa", 
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px"
                    }}>
                      <FaUser className="text-muted" />
                    </span>
                    <Form.Control
                      type="text"
                      value={nameSearchTerm}
                      onChange={(e) => handleEmployeeNameChange(e.target.value)}
                      onFocus={handleNameInputFocus}
                      placeholder="Type to search employee name..."
                      style={inputStyle}
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
                      <span className="input-group-text" style={{ 
                        background: "#f8f9fa",
                        borderTopRightRadius: "10px",
                        borderBottomRightRadius: "10px"
                      }}>
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
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">
                  Work Email <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  placeholder="Enter work email"
                  style={inputStyle}
                  required
                  disabled={isSubmitting}
                />
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Hire Date</Form.Label>
                <Form.Control
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
				  required
                />
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Department</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                  style={inputStyle}
                  disabled={isSubmitting}
				  required
                />
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Reporting Manager</Form.Label>
                <Form.Control
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleChange}
                  placeholder="Enter manager name"
                  style={inputStyle}
                  disabled={isSubmitting}
				  required
                />
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Added On</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="addedOn"
                  value={formData.addedOn}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                />
                <small className="text-muted">Asia/Kolkata timezone</small>
              </Col>

              <Col md={12}>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    {/* Download Excel Template Button */}
                    <Button
                      variant="outline-primary"
                      className="d-flex align-items-center gap-2"
                      onClick={downloadExcelTemplate}
                      title="Download Excel Template"
                      disabled={isSubmitting}
					  required
                      style={{ borderRadius: "8px", padding: "8px 16px" }}
                    >
                      <FaFileExcel />
                      <span>Download Template</span>
                    </Button>
                    
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
                          opacity: isSubmitting ? 0.6 : 1,
                          borderRadius: "8px",
                          padding: "8px 16px"
                        }}
                        title="Upload Excel File"
                      >
                        <FaUpload />
                        <span>Upload Excel</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <div className="d-flex justify-content-end gap-2">
                  {editingEmployee && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        resetForm();
                        if (onCancelEdit) {
                          onCancelEdit();
                        }
                      }}
                      disabled={isSubmitting}
                      style={{ 
                        padding: "12px 24px", 
                        borderRadius: "10px",
                        fontWeight: "600"
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="success"
                    disabled={isSubmitting || isLoadingData}
                    style={{ 
                      padding: "12px 24px",
                      fontWeight: "600",
                      borderRadius: "10px"
                    }}
                    className="d-flex align-items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="fa-spin" />
                        <span>Saving...</span>
                      </>
                    ) : editingEmployee ? (
                      <>
                        <FaSave />
                        <span>Update</span>
                      </>
                    ) : (
                      <>
                        <FaUserPlus />
                        <span>Complete Onboarding</span>
                      </>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}