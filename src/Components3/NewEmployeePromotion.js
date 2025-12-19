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
  FaChartLine,
  FaMoneyBillWave,
  FaBuilding,
  FaCalendarAlt,
  FaFileAlt
} from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function EmployeePromotionForm({ editingPromotion, onSaveSuccess, onCancelEdit }) {
  const API_BASE = process.env.REACT_APP_API_BASE;
  const PROMOTION_API = `${API_BASE}/api/employee-promotions`;
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    currency: "INR",
    company: "Shrirang Automation",
    property: "",
    current: "",
    newValue: "",
    justification: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Employee selection state - Combined search
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const searchDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch employee data on mount
  useEffect(() => {
    fetchEmployeeData();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update form when editingPromotion changes
  useEffect(() => {
    if (editingPromotion) {
      setFormData({
        name: editingPromotion.name || "",
        employeeId: editingPromotion.employeeId || "",
        date: editingPromotion.date ? new Date(editingPromotion.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        currency: editingPromotion.currency || "INR",
        company: editingPromotion.company || "Shrirang Automation",
        property: editingPromotion.property || "",
        current: editingPromotion.current || "",
        newValue: editingPromotion.newValue || "",
        justification: editingPromotion.justification || "",
      });
      setEmployee(editingPromotion.name || "");
      setEmployeeId(editingPromotion.employeeId || "");
      setSearchTerm(editingPromotion.name ? 
        `${editingPromotion.name} (${editingPromotion.employeeId || ''})` : 
        "");
    } else {
      resetForm();
    }
  }, [editingPromotion]);

  // Fetch employee data from multiple sources
  const fetchEmployeeData = async () => {
    setIsLoadingData(true);
    setBackendError("");
    
    try {
      // List of possible endpoints
      const endpoints = [
        `${API_BASE}/api/employee-resignation/all-ids`,
        `${API_BASE}/api/employee-onboarding`,
        `${API_BASE}/api/employees`,
        `${API_BASE}/api/employee/all`
      ];
      
      let foundEmployees = [];
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { timeout: 5000 });
          
          if (response.data) {
            let employees = [];
            
            // Handle different response formats
            if (Array.isArray(response.data)) {
              employees = response.data;
            } else if (response.data.success && Array.isArray(response.data.data)) {
              employees = response.data.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              employees = response.data.data;
            }
            
            if (employees.length > 0) {
              console.log(`Found ${employees.length} employees from ${endpoint}`);
              
              // Format employees consistently
              const formattedEmployees = employees.map(emp => ({
                employeeId: emp.employeeId || emp._id || emp.id || "",
                employeeName: emp.employeeName || emp.fullName || emp.name || "",
                fullName: emp.employeeName || emp.fullName || emp.name || "",
                email: emp.email || emp.workEmail || "",
                status: emp.status || "Active",
                department: emp.department || "",
                position: emp.position || emp.designation || ""
              })).filter(emp => emp.fullName); // Remove entries without names
              
              foundEmployees = [...foundEmployees, ...formattedEmployees];
              break; // Stop if we found data
            }
          }
        } catch (err) {
          console.log(`Failed to fetch from ${endpoint}:`, err.message);
          continue; // Try next endpoint
        }
      }
      
      // If no employees found from APIs, use fallback data
      if (foundEmployees.length === 0) {
        console.log("No employees found from APIs, using fallback data");
        foundEmployees = [
          {
            employeeId: "EMP-001",
            employeeName: "John Doe",
            fullName: "John Doe",
            email: "john@company.com",
            status: "Active",
            department: "Engineering",
            position: "Senior Developer"
          },
          {
            employeeId: "EMP-002",
            employeeName: "Jane Smith",
            fullName: "Jane Smith",
            email: "jane@company.com",
            status: "Active",
            department: "Marketing",
            position: "Marketing Manager"
          },
          {
            employeeId: "EMP-003",
            employeeName: "Robert Johnson",
            fullName: "Robert Johnson",
            email: "robert@company.com",
            status: "Active",
            department: "Sales",
            position: "Sales Executive"
          },
          {
            employeeId: "EMP-004",
            employeeName: "Sarah Williams",
            fullName: "Sarah Williams",
            email: "sarah@company.com",
            status: "Active",
            department: "HR",
            position: "HR Manager"
          },
          {
            employeeId: "EMP-005",
            employeeName: "Michael Brown",
            fullName: "Michael Brown",
            email: "michael@company.com",
            status: "Active",
            department: "Finance",
            position: "Finance Analyst"
          }
        ];
      }
      
      // Remove duplicates
      const uniqueEmployees = Array.from(
        new Map(foundEmployees.map(emp => [emp.employeeId, emp])).values()
      );
      
      setEmployeeData(uniqueEmployees);
      console.log(`Total unique employees loaded: ${uniqueEmployees.length}`);
      
    } catch (error) {
      console.error("Error in fetchEmployeeData:", error);
      setBackendError("Unable to load employee data. Please check your backend server.");
      
      // Set fallback data even on error
      const fallbackEmployees = [
        {
          employeeId: "EMP-001",
          employeeName: "Test Employee 1",
          fullName: "Test Employee 1",
          email: "test1@company.com",
          status: "Active",
          department: "Engineering",
          position: "Developer"
        },
        {
          employeeId: "EMP-002",
          employeeName: "Test Employee 2",
          fullName: "Test Employee 2",
          email: "test2@company.com",
          status: "Active",
          department: "HR",
          position: "HR Manager"
        }
      ];
      setEmployeeData(fallbackEmployees);
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      employeeId: "",
      date: new Date().toISOString().split('T')[0],
      currency: "INR",
      company: "Shrirang Automation",
      property: "",
      current: "",
      newValue: "",
      justification: "",
    });
    setEmployee("");
    setEmployeeId("");
    setSearchTerm("");
    setShowSearchDropdown(false);
    setBackendError("");
    setSuccessMessage("");
  };

  // Search handling functions
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setFormData(prev => ({ ...prev, name: value }));
    
    if (value.trim() === "") {
      setShowSearchDropdown(false);
    } else {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchFocus = () => {
    if (searchTerm.trim() !== "" || employeeData.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleEmployeeSelect = (item) => {
    const selectedName = item.employeeName || item.fullName || item.name || "";
    const selectedId = item.employeeId || "";
    
    setEmployee(selectedName);
    setEmployeeId(selectedId);
    setFormData(prev => ({
      ...prev,
      name: selectedName,
      employeeId: selectedId
    }));
    setSearchTerm(selectedId ? `${selectedName} (${selectedId})` : selectedName);
    setShowSearchDropdown(false);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setEmployee("");
    setEmployeeId("");
    setFormData(prev => ({
      ...prev,
      name: "",
      employeeId: ""
    }));
    setShowSearchDropdown(false);
  };

  const filteredEmployees = employeeData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const name = item.employeeName || item.fullName || item.name || "";
    const id = item.employeeId || "";
    
    return name.toLowerCase().includes(searchLower) || 
           id.toLowerCase().includes(searchLower);
  });

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle retry loading data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Please select an employee!");
      return false;
    }
    if (!formData.date) {
      alert("Please select a promotion date!");
      return false;
    }
    if (!formData.property.trim()) {
      alert("Please select a property!");
      return false;
    }
    if (!formData.newValue.trim()) {
      alert("Please enter new value!");
      return false;
    }
    if (!formData.justification.trim()) {
      alert("Please enter justification!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const promotionData = {
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        date: formData.date,
        currency: formData.currency || "INR",
        company: formData.company.trim() || "Shrirang Automation",
        property: formData.property.trim(),
        current: formData.current.trim() || "",
        newValue: formData.newValue.trim(),
        justification: formData.justification.trim()
      };

      console.log("Submitting promotion data:", promotionData);
      console.log("API Endpoint:", PROMOTION_API);

      let response;
      if (editingPromotion && editingPromotion._id) {
        // Update existing promotion
        response = await axios.put(`${PROMOTION_API}/${editingPromotion._id}`, promotionData);
        setSuccessMessage("Promotion updated successfully!");
      } else {
        // Create new promotion
        response = await axios.post(PROMOTION_API, promotionData);
        setSuccessMessage("Promotion added successfully!");
      }

      console.log("Server response:", response.data);

      if (response.data.success) {
        setTimeout(() => {
          resetForm();
          if (onSaveSuccess) {
            onSaveSuccess();
          }
          if (onCancelEdit && editingPromotion) {
            onCancelEdit();
          }
        }, 1500);
      } else {
        alert("Error: " + (response.data.error || "Unknown error"));
      }
      
    } catch (err) {
      console.error("Detailed error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 400) {
        alert("Invalid data format. Please check your input.");
      } else if (err.response?.status === 404) {
        alert("API endpoint not found. Check server configuration.");
      } else if (err.code === 'ERR_NETWORK') {
        alert("Cannot connect to server. Make sure backend is running.");
      } else {
        alert("Error: " + (err.response?.data?.error || err.message || "Unknown error occurred"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          "Employee Name": "John Doe",
          "Employee ID": "EMP-001",
          "Promotion Date": new Date().toISOString().split('T')[0],
          "Currency": "INR",
          "Company": "Shrirang Automation",
          "Property": "Salary",
          "Current Value": "50000",
          "New Value": "60000",
          "Justification": "Performance based promotion"
        },
        {
          "Employee Name": "Jane Smith",
          "Employee ID": "EMP-002",
          "Promotion Date": new Date().toISOString().split('T')[0],
          "Currency": "INR",
          "Company": "Shrirang Automation",
          "Property": "Designation",
          "Current Value": "Senior Developer",
          "New Value": "Team Lead",
          "Justification": "Leadership skills demonstrated"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Promotion Template");
      
      const wscols = [
        { wch: 20 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 15 }, // Promotion Date
        { wch: 10 }, // Currency
        { wch: 20 }, // Company
        { wch: 15 }, // Property
        { wch: 15 }, // Current Value
        { wch: 15 }, // New Value
        { wch: 30 }, // Justification
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, "Employee_Promotion_Template.xlsx");
      alert("Template downloaded successfully!");
    } catch (error) {
      alert("Error creating Excel template: " + error.message);
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
          
          // Extract data from Excel columns
          const name = firstRow["Employee Name"] || firstRow["Employee"] || 
                       firstRow["Name"] || firstRow["name"] || "";
          const employeeId = firstRow["Employee ID"] || firstRow["Employee ID"] || 
                           firstRow["employeeId"] || firstRow["emp_id"] || "";
          const date = firstRow["Promotion Date"] || firstRow["Date"] || 
                      firstRow["date"] || new Date().toISOString().split('T')[0];
          const currency = firstRow["Currency"] || firstRow["currency"] || "INR";
          const company = firstRow["Company"] || firstRow["company"] || "Shrirang Automation";
          const property = firstRow["Property"] || firstRow["property"] || "";
          const current = firstRow["Current Value"] || firstRow["Current"] || 
                         firstRow["current"] || "";
          const newValue = firstRow["New Value"] || firstRow["New"] || 
                          firstRow["newValue"] || "";
          const justification = firstRow["Justification"] || firstRow["justification"] || "";

          // Format date if needed
          let formattedDate = "";
          if (date) {
            if (typeof date === 'number') {
              // Excel date serial number
              const excelDate = new Date((date - 25569) * 86400 * 1000);
              formattedDate = excelDate.toISOString().split('T')[0];
            } else {
              // String date
              formattedDate = date.toString().split('T')[0];
            }
          }

          setFormData({
            name: name.toString(),
            employeeId: employeeId.toString(),
            date: formattedDate,
            currency: currency.toString(),
            company: company.toString(),
            property: property.toString(),
            current: current.toString(),
            newValue: newValue.toString(),
            justification: justification.toString(),
          });
          
          // Update search term and employee info
          setEmployee(name.toString());
          setEmployeeId(employeeId.toString());
          setSearchTerm(employeeId ? `${name} (${employeeId})` : name);
          
          alert("Promotion data loaded from Excel successfully!");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing the uploaded file: " + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const inputStyle = {
    borderRadius: "10px",
    padding: "12px",
    background: "#f8f9fa",
    border: "1px solid #dfe1e5",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: isSubmitting ? "not-allowed" : "pointer"
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Employee Promotion Management</h5>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchEmployeeData}
            disabled={isLoadingData || isSubmitting}
            title="Refresh employee list"
          >
            <FaSpinner className={isLoadingData ? "fa-spin" : ""} />
            <span className="ms-1">Refresh Employees</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-3">
          <FaChartLine className="me-2" />
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
        </div>
      )}

      <div className="border rounded p-4 bg-light mb-4" style={{ borderRadius: "16px" }}>
        <h6 className="fw-bold mb-3">
          {editingPromotion ? "Edit Promotion" : "Add New Promotion"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Combined Employee Search Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FaUser className="me-1" />
                Search Employee <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <div className="input-group" ref={searchInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="form-control"
                    style={inputStyle}
                    placeholder="Type to search by ID or Name..."
                    required
                    autoComplete="off"
                    disabled={isLoadingData || isSubmitting}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearSearchField}
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
                
                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div 
                    ref={searchDropdownRef}
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
                        {filteredEmployees.length === 0 
                          ? "No matching employees found" 
                          : `Found ${filteredEmployees.length} employee(s)`}
                      </small>
                    </div>
                    
                    {/* Search Results */}
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((item, index) => {
                        const name = item.employeeName || item.fullName || item.name || "Unknown";
                        const id = item.employeeId || "";
                        const dept = item.department || "";
                        
                        return (
                          <div
                            key={index}
                            className="dropdown-item py-2 px-3"
                            onClick={() => handleEmployeeSelect(item)}
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
                                <div className="fw-medium">{name}</div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">{id}</small>
                                  {dept && <small className="text-muted">{dept}</small>}
                                </div>
                              </div>
                              <small className="text-muted">Click to select</small>
                            </div>
                          </div>
                        );
                      })
                    ) : searchTerm.trim() !== "" && (
                      <div className="p-3 text-center text-muted">
                        <FaSearch className="mb-2" />
                        <div>No employees match your search</div>
                        <small>Try a different ID or name</small>
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
                    No employee data available. Using fallback data.
                  </small>
                )}
              </div>
            </div>

            {/* Display selected employee info */}
            <div className="col-md-6">
              {employee && (
                <div className="mt-4 p-3 border rounded bg-light" style={{height: "100%"}}>
                  <small className="text-muted d-block mb-1">Selected Employee:</small>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-medium">{employee}</span>
                      {employeeId && (
                        <small className="text-muted ms-2">({employeeId})</small>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={clearSearchField}
                      disabled={isSubmitting}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Promotion Date */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FaCalendarAlt className="me-1" />
                Promotion Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Currency */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FaMoneyBillWave className="me-1" />
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-control"
                style={selectStyle}
                disabled={isSubmitting}
              >
                <option value="INR">Indian Rupee (INR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
              </select>
            </div>

            {/* Company */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FaBuilding className="me-1" />
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                placeholder="Enter company name"
                disabled={isSubmitting}
              />
            </div>

            {/* Property */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FaChartLine className="me-1" />
                Property <span className="text-danger">*</span>
              </label>
              <select
                name="property"
                value={formData.property}
                onChange={handleChange}
                className="form-control"
                style={selectStyle}
                disabled={isSubmitting}
                required
              >
                <option value="">Select Property</option>
                <option value="Salary">Salary</option>
                <option value="Designation">Designation</option>
                <option value="Role">Role</option>
                <option value="Department">Department</option>
                <option value="Grade">Grade</option>
                <option value="Allowance">Allowance</option>
                <option value="Bonus">Bonus</option>
                <option value="Benefits">Benefits</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Current Value */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Current Value
              </label>
              <input
                type="text"
                name="current"
                value={formData.current}
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                placeholder="e.g., 50000 or Senior Developer"
                disabled={isSubmitting}
              />
              <small className="text-muted">Current salary, designation, etc.</small>
            </div>

            {/* New Value */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                New Value <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="newValue"
                value={formData.newValue}
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                placeholder="e.g., 60000 or Team Lead"
                disabled={isSubmitting}
                required
              />
              <small className="text-muted">Promoted salary, designation, etc.</small>
            </div>

            {/* Justification */}
            <div className="col-md-12">
              <label className="form-label fw-semibold">
                <FaFileAlt className="me-1" />
                Justification <span className="text-danger">*</span>
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                className="form-control"
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  resize: "vertical"
                }}
                placeholder="Explain the reason for this promotion..."
                disabled={isSubmitting}
                required
              />
              <small className="text-muted">Provide detailed justification for the promotion</small>
            </div>

            {/* Excel Import/Export Section */}
            <div className="col-md-12">
              <div className="border rounded p-3 bg-light mt-3">
                <h6 className="fw-semibold mb-3">Excel Operations</h6>
                <div className="d-flex align-items-center gap-3">
                  {/* Download Template */}
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={downloadExcelTemplate}
                    title="Download Excel Template"
                    disabled={isSubmitting}
                    style={{ borderRadius: "8px", padding: "8px 16px" }}
                  >
                    <FaFileExcel />
                    <span>Download Template</span>
                  </button>
                  
                  {/* Upload Excel */}
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
            </div>

            {/* Action Buttons */}
            <div className="col-md-12">
              <div className="d-flex justify-content-end gap-3 mt-4">
                {editingPromotion && (
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
                    style={{ 
                      padding: "12px 24px", 
                      borderRadius: "10px",
                      fontWeight: "600"
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{ 
                    padding: "12px 24px", 
                    borderRadius: "10px",
                    fontWeight: "600"
                  }}
                >
                  Clear Form
                </button>
                
                <button
                  type="submit"
                  className="btn btn-success d-flex align-items-center gap-2"
                  disabled={isSubmitting || isLoadingData}
                  style={{ 
                    padding: "12px 32px",
                    fontWeight: "600",
                    borderRadius: "10px",
                    minWidth: "180px"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="fa-spin" />
                      <span>Processing...</span>
                    </>
                  ) : editingPromotion ? (
                    <>
                      <FaSave />
                      <span>Update Promotion</span>
                    </>
                  ) : (
                    <>
                      <FaChartLine />
                      <span>Save Promotion</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}