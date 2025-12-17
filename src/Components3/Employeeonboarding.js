import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { FaUpload, FaSave, FaUserPlus, FaFileExcel, FaUser, FaSpinner, FaSearch, FaTimes, FaIdCard } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function EmployeeOnboarding({ editingEmployee, onSaveSuccess, onCancelEdit }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  const ONBOARDING_API = `${API_BASE}/api/employee-onboarding`;
  
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "", // Add employeeId field
    workEmail: "",
    hireDate: "",
    department: "",
    reportingManager: "",
    addedOn: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState([]); // Now stores {employeeId, fullName}
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load employee data on mount
  useEffect(() => {
    checkServerStatus();
    fetchEmployeeData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
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
        employeeId: editingEmployee.employeeId || "", // Add employeeId
        workEmail: editingEmployee.workEmail || "",
        hireDate: editingEmployee.hireDate ? new Date(editingEmployee.hireDate).toISOString().split('T')[0] : "",
        department: editingEmployee.department || "",
        reportingManager: editingEmployee.reportingManager || "",
        addedOn: editingEmployee.addedOn ? new Date(editingEmployee.addedOn).toISOString().slice(0, 16) : "",
      });
      setSearchTerm(editingEmployee.fullName || "");
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
      console.log("Fetching employee data from:", `${RESIGNATION_API}/all-ids`);
      
      const response = await fetch(`${RESIGNATION_API}/all-ids`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error("Response not OK:", response.status);
        throw new Error(`Failed to fetch employee data (Status: ${response.status})`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      if (data.success) {
        // Extract employeeId and fullName from response
        const employees = data.data.map(item => ({
          employeeId: item.employeeId || '',
          fullName: item.fullName || '',
          email: item.email || '',
          status: item.status || 'Unknown'
        })).filter(emp => emp.employeeId && emp.fullName); // Filter out empty records
        
        console.log(`Found ${employees.length} employees with IDs`);
        setEmployeeData(employees);
      } else {
        throw new Error(data.error || "Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setBackendError(error.message);
      setEmployeeData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "fullName") {
      setSearchTerm(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
      
      if (value.trim() === "") {
        setShowDropdown(false);
      } else {
        setShowDropdown(true);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({ 
      ...prev, 
      fullName: employee.fullName,
      employeeId: employee.employeeId // Auto-fill employeeId
    }));
    setSearchTerm(employee.fullName);
    setShowDropdown(false);
  };

  const clearEmployeeField = () => {
    setFormData(prev => ({ 
      ...prev, 
      fullName: "",
      employeeId: "" // Also clear employeeId
    }));
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim() !== "" || employeeData.length > 0) {
      setShowDropdown(true);
    }
  };

  const filteredEmployees = employeeData.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
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
    setSearchTerm("");
    setShowDropdown(false);
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
        employeeId: formData.employeeId.trim() || undefined, // Include employeeId if available
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

  // Download Excel template with Employee ID
  const downloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          "Employee ID": "EMP-RES-2023-12-1234", // Add Employee ID
          "Full Name": "John Doe",
          "Work Email": "john.doe@company.com",
          "Hire Date": new Date().toISOString().split('T')[0],
          "Department": "Engineering",
          "Reporting Manager": "Sarah Johnson",
          "Added On": new Date().toISOString().slice(0, 16)
        },
        {
          "Employee ID": "EMP-RES-2023-12-5678", // Add Employee ID
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
          const employeeId = firstRow["Employee ID"] || firstRow["employee_id"] || 
                            firstRow["EmployeeId"] || firstRow["ID"] || firstRow["id"] || "";
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
            fullName: fullName.toString(),
            employeeId: employeeId.toString(),
            workEmail: workEmail.toString(),
            hireDate: formattedHireDate,
            department: department.toString(),
            reportingManager: reportingManager.toString(),
            addedOn: "",
          });
          setSearchTerm(fullName.toString());
          
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

  // Add Employee ID input field
  const renderEmployeeIdField = () => {
    return (
      <Col md={6}>
        <Form.Label className="fw-semibold">
          Employee ID
        </Form.Label>
        <div className="input-group">
          <span className="input-group-text" style={{ 
            background: "#f8f9fa", 
            borderTopLeftRadius: "10px",
            borderBottomLeftRadius: "10px"
          }}>
            <FaIdCard className="text-muted" />
          </span>
          <Form.Control
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            placeholder="Auto-filled when selecting employee"
            style={inputStyle}
            readOnly={true}
            disabled={isSubmitting}
          />
        </div>
        <small className="text-muted">Auto-filled from resignation records</small>
      </Col>
    );
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
              <Col md={6}>
                <Form.Label className="fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <div className="input-group" ref={inputRef}>
                    <span className="input-group-text" style={{ 
                      background: "#f8f9fa", 
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px"
                    }}>
                      <FaUser className="text-muted" />
                    </span>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={searchTerm}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                      placeholder="Type to search existing employees..."
                      style={inputStyle}
                      required
                      autoComplete="off"
                      disabled={isLoadingData}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="input-group-text bg-transparent border-0"
                        onClick={clearEmployeeField}
                        style={{ cursor: 'pointer' }}
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
                  
                  {/* Employee Data Dropdown (with IDs) */}
                  {showDropdown && (
                    <div 
                      ref={dropdownRef}
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
                          {filteredEmployees.length === 0 
                            ? "No matching employees found" 
                            : `Found ${filteredEmployees.length} employee(s)`}
                        </small>
                      </div>
                      
                      {/* Search Results with IDs */}
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp, index) => (
                          <div
                            key={index}
                            className="dropdown-item py-2 px-3"
                            onClick={() => handleEmployeeSelect(emp)}
                            style={{ 
                              cursor: "pointer",
                              borderBottom: index < filteredEmployees.length - 1 ? "1px solid #f0f0f0" : "none",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                          >
                            <div className="d-flex align-items-center">
                              <FaUser className="me-2 text-primary" size={14} />
                              <div className="flex-grow-1">
                                <div className="fw-medium">{emp.fullName}</div>
                                <small className="text-muted">
                                  <FaIdCard className="me-1" size={12} />
                                  {emp.employeeId}
                                </small>
                              </div>
                              <small className="text-muted">Click to select</small>
                            </div>
                          </div>
                        ))
                      ) : searchTerm.trim() !== "" && (
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
                      >
                        Retry
                      </button>
                    </div>
                  ) : employeeData.length > 0 ? (
                    <small className="text-success d-flex align-items-center">
                      <FaUser className="me-1" />
                      {employeeData.length} employees available with IDs
                    </small>
                  ) : (
                    <small className="text-warning d-flex align-items-center">
                      <FaTimes className="me-1" />
                      No employee data available. Please add resignation records first.
                    </small>
                  )}
                </div>
              </Col>

              {/* Employee ID Field (auto-filled) */}
              {renderEmployeeIdField()}

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