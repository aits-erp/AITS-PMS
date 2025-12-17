import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
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

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;

export default function Overview({ editingItem, onSaveSuccess, onCancelEdit }) {
  const [form, setForm] = useState({
    series: editingItem?.series || "",
    employee: editingItem?.employee || "",
    employeeId: editingItem?.employeeId || "",
    company: editingItem?.company || "",
    appraisalCycle: editingItem?.appraisalCycle || "",
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
  const [debugInfo, setDebugInfo] = useState("");
  
  const idDropdownRef = useRef(null);
  const nameDropdownRef = useRef(null);
  const idInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    checkServerStatus();
    fetchEmployeeData();
    
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

  useEffect(() => {
    if (editingItem) {
      setForm({
        series: editingItem.series || "",
        employee: editingItem.employee || "",
        employeeId: editingItem.employeeId || "",
        company: editingItem.company || "",
        appraisalCycle: editingItem.appraisalCycle || "",
      });
      setNameSearchTerm(editingItem.employee || "");
      setIdSearchTerm(editingItem.employeeId || "");
    }
  }, [editingItem]);

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
    setDebugInfo("Fetching employee data...");
    
    try {
      console.log("🔄 Fetching from:", `${RESIGNATION_API}/all-ids`);
      
      const response = await fetch(`${RESIGNATION_API}/all-ids`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log("📡 Response Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("✅ API Response Data:", data);
      
      if (data.success && data.data) {
        const employeeArray = Array.isArray(data.data) ? data.data : [];
        console.log(`📊 Found ${employeeArray.length} employees in database`);
        
        if (employeeArray.length === 0) {
          setEmployeeData([]);
          setDebugInfo("Database returned empty array. No employees found.");
          return;
        }
        
        // Log first few records to see structure
        console.log("First 3 employee records:", employeeArray.slice(0, 3));
        
        // Transform data - your backend returns: employeeId, fullName, email, status, createdAt
        const formattedData = employeeArray.map(item => ({
          employeeId: item.employeeId || '',
          fullName: item.fullName || '',
          email: item.email || '',
          status: item.status || 'Unknown',
          createdAt: item.createdAt || new Date().toISOString()
        }));
        
        console.log(`✅ Formatted ${formattedData.length} employees`);
        setEmployeeData(formattedData);
        setDebugInfo(`Loaded ${formattedData.length} employees successfully`);
        
      } else {
        console.error("❌ API returned success: false", data);
        setEmployeeData([]);
        setDebugInfo(`API Error: ${data.error || 'Unknown error'}`);
        setBackendError(data.error || "Failed to fetch employee data");
      }
      
    } catch (error) {
      console.error("❌ Error in fetchEmployeeData:", error);
      setBackendError(error.message);
      setDebugInfo(`Error: ${error.message}`);
      setEmployeeData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // DIRECT TEST: Check what the backend actually returns
  const testBackendDirectly = async () => {
    try {
      console.log("🔍 Testing backend directly...");
      
      // Test 1: Check if endpoint exists
      console.log("Testing endpoint:", `${RESIGNATION_API}/all-ids`);
      
      const response = await fetch(`${RESIGNATION_API}/all-ids`);
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok && data.success) {
        alert(`✅ Backend is working!\n\nRecords found: ${data.data?.length || 0}\n\nSample data: ${JSON.stringify(data.data?.slice(0, 2), null, 2)}`);
      } else {
        alert(`❌ Backend error: ${data.error || response.statusText}`);
      }
      
    } catch (error) {
      console.error("Test failed:", error);
      alert(`❌ Test failed: ${error.message}`);
    }
  };

  // Check MongoDB directly (simulate)
  const checkMongoDBStatus = async () => {
    try {
      // Try to get count of documents
      const response = await fetch(`${RESIGNATION_API}`);
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ MongoDB Connection Working!\n\nTotal resignation records: ${data.pagination?.total || data.data?.length || 0}`);
      } else {
        alert(`❌ MongoDB issue: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ MongoDB check failed: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (name === "employee") {
      setNameSearchTerm(value);
      if (value.trim() === "") {
        setShowNameDropdown(false);
      } else {
        setShowNameDropdown(true);
      }
    } else if (name === "employeeId") {
      setIdSearchTerm(value);
      if (value.trim() === "") {
        setShowIdDropdown(false);
      } else {
        setShowIdDropdown(true);
      }
    }
  };

  const handleYearChange = (e) => {
    const value = e.target.value;
    const allowed = /^[0-9-]*$/;
    if (allowed.test(value)) {
      setForm((prev) => ({ ...prev, appraisalCycle: value }));
    }
  };

  const handleIdSelect = (id, name) => {
    setForm((prev) => ({ 
      ...prev, 
      employeeId: id,
      employee: name
    }));
    setIdSearchTerm(id);
    setNameSearchTerm(name);
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  const handleNameSelect = (name, id) => {
    setForm((prev) => ({ 
      ...prev, 
      employee: name,
      employeeId: id
    }));
    setNameSearchTerm(name);
    setIdSearchTerm(id || "");
    setShowNameDropdown(false);
    setShowIdDropdown(false);
  };

  const clearIdField = () => {
    setForm((prev) => ({ ...prev, employeeId: "" }));
    setIdSearchTerm("");
    setShowIdDropdown(false);
  };

  const clearNameField = () => {
    setForm((prev) => ({ ...prev, employee: "" }));
    setNameSearchTerm("");
    setShowNameDropdown(false);
  };

  const handleIdInputFocus = () => {
    if (idSearchTerm.trim() !== "" || employeeData.length > 0) {
      setShowIdDropdown(true);
    }
  };

  const handleNameInputFocus = () => {
    if (nameSearchTerm.trim() !== "" || employeeData.length > 0) {
      setShowNameDropdown(true);
    }
  };

  const filteredIds = employeeData.filter(item =>
    (item.employeeId && item.employeeId.toLowerCase().includes(idSearchTerm.toLowerCase())) ||
    (item.fullName && item.fullName.toLowerCase().includes(idSearchTerm.toLowerCase()))
  );

  const filteredNames = employeeData.filter(item =>
    (item.fullName && item.fullName.toLowerCase().includes(nameSearchTerm.toLowerCase())) ||
    (item.employeeId && item.employeeId.toLowerCase().includes(nameSearchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setForm({
      series: "",
      employee: "",
      employeeId: "",
      company: "",
      appraisalCycle: "",
    });
    setNameSearchTerm("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
    setShowNameDropdown(false);
    setBackendError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.series.trim() || !form.employee.trim() || !form.appraisalCycle.trim()) {
      alert("Please fill in all required fields (Series, Employee, Appraisal Cycle)");
      return;
    }

    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(form.appraisalCycle)) {
      alert("Please enter Appraisal Cycle in format: YYYY-YYYY (e.g., 2023-2024)");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      let url;
      
      if (editingItem && editingItem._id) {
        url = `${API_BASE}/api/overview/${editingItem._id}`;
        response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      } else {
        url = `${API_BASE}/api/overview`;
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      }

      if (!response.ok) {
        let errorMsg = `Request failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (parseError) {
          // Continue with default error message
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      
      alert(editingItem ? "Overview updated successfully!" : "Overview submitted successfully!");
      
      resetForm();
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      if (onCancelEdit && editingItem) {
        onCancelEdit();
      }
      
    } catch (err) {
      console.error("Save error:", err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          "Series": "HR-APR-2023-001",
          "Employee ID": "EMP-RES-2023-12-1234",
          "Employee": "John Doe",
          "Company": "Shrirang Automation and Controls",
          "Appraisal Cycle": "2023-2024"
        },
        {
          "Series": "HR-APR-2023-002",
          "Employee ID": "EMP-RES-2023-12-5678",
          "Employee": "Jane Smith",
          "Company": "Shrirang Automation and Controls",
          "Appraisal Cycle": "2023-2024"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      
      const wscols = [
        { wch: 25 },
        { wch: 30 },
        { wch: 30 },
        { wch: 40 },
        { wch: 20 },
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, "Overview_Template.xlsx");
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
          
          const normalizeKey = (key) => {
            if (!key) return '';
            return key.toString().trim().toLowerCase().replace(/\s+/g, '');
          };

          const rowKeys = Object.keys(firstRow);
          const normalizedRow = {};
          rowKeys.forEach(key => {
            normalizedRow[normalizeKey(key)] = firstRow[key];
          });

          const newForm = {
            series: normalizedRow.series || "",
            employeeId: normalizedRow.employeeid || normalizedRow.id || "",
            employee: normalizedRow.employee || normalizedRow.name || "",
            company: normalizedRow.company || "",
            appraisalCycle: normalizedRow.appraisalcycle || normalizedRow.appraisal || "",
          };
          
          setForm(newForm);
          setIdSearchTerm(newForm.employeeId);
          setNameSearchTerm(newForm.employee);
          
          alert("Data loaded from Excel file successfully!");
        } else {
          alert("The Excel file is empty or has no data rows.");
        }
      } catch (error) {
        alert("Error reading the uploaded file. Please check the format and try again.");
      }
    };
    
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
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
    borderRadius: "6px",
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Overview Management</h5>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-sm btn-outline-info"
            onClick={testBackendDirectly}
            title="Test backend connection directly"
          >
            Test Backend
          </button>
          <button 
            className="btn btn-sm btn-outline-warning"
            onClick={checkMongoDBStatus}
            title="Check MongoDB status"
          >
            Check MongoDB
          </button>
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
          {editingItem ? "Edit Overview" : "Add New Overview"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Series <span className="text-danger">*</span>
              </label>
              <input
                name="series"
                value={form.series}
                placeholder="HR-APR-YYYY-001"
                className="form-control"
                style={inputStyle}
                onChange={handleChange}
                required
              />

              <label className="form-label fw-semibold mt-3">
                Employee ID
              </label>
              <div className="position-relative">
                <div className="input-group" ref={idInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaIdCard className="text-muted" />
                  </span>
                  <input
                    name="employeeId"
                    value={idSearchTerm}
                    className="form-control"
                    placeholder="Type to search Employee ID (auto-generated: EMP-RES-YYYY-MM-XXXX)..."
                    style={inputStyle}
                    onChange={handleChange}
                    onFocus={handleIdInputFocus}
                    autoComplete="off"
                    disabled={isLoadingData}
                  />
                  {idSearchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearIdField}
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
                    <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                      <FaSearch className="text-muted" />
                    </span>
                  )}
                </div>
                
                {/* Employee ID Dropdown */}
                {showIdDropdown && employeeData.length > 0 && (
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
                    <div className="p-2 border-bottom bg-light">
                      <small className="text-muted">
                        {filteredIds.length === 0 
                          ? "No matching employee IDs found" 
                          : `Found ${filteredIds.length} employee(s)`}
                      </small>
                    </div>
                    
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
                          </div>
                        </div>
                      ))
                    ) : idSearchTerm.trim() !== "" && (
                      <div className="p-3 text-center text-muted">
                        <FaSearch className="mb-2" />
                        <div>No employees match your search</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <label className="form-label fw-semibold mt-3">
                Employee <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <div className="input-group" ref={nameInputRef}>
                  <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    name="employee"
                    value={nameSearchTerm}
                    className="form-control"
                    placeholder="Type to search employee name..."
                    style={inputStyle}
                    onChange={handleChange}
                    onFocus={handleNameInputFocus}
                    required
                    autoComplete="off"
                    disabled={isLoadingData}
                  />
                  {nameSearchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearNameField}
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
                    <span className="input-group-text" style={{ background: "#f8f9fa" }}>
                      <FaSearch className="text-muted" />
                    </span>
                  )}
                </div>
                
                {/* Employee Name Dropdown */}
                {showNameDropdown && employeeData.length > 0 && (
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
                    <div className="p-2 border-bottom bg-light">
                      <small className="text-muted">
                        {filteredNames.length === 0 
                          ? "No matching employees found" 
                          : `Found ${filteredNames.length} employee(s)`}
                      </small>
                    </div>
                    
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
                          </div>
                        </div>
                      ))
                    ) : nameSearchTerm.trim() !== "" && (
                      <div className="p-3 text-center text-muted">
                        <FaSearch className="mb-2" />
                        <div>No employees match your search</div>
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
                    {employeeData.length} employees available for selection
                  </small>
                ) : (
                  <div className="alert alert-warning p-2">
                    <small>
                      <FaTimes className="me-1" />
                      <strong>No employee data found.</strong> Check console for details.
                    </small>
                  </div>
                )}
              </div>
              
              {/* Debug Info */}
              {debugInfo && (
                <div className="mt-2">
                  <small className="text-muted">
                    Status: {debugInfo}
                  </small>
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Company <span className="text-danger">*</span>
              </label>
              <input
                name="company"
                value={form.company}
                className="form-control"
                placeholder="Shrirang Automation and Controls"
                style={{ ...inputStyle, opacity: 0.8 }}
                onChange={handleChange}
                required
              />

              <label className="form-label fw-semibold mt-3">
                Appraisal Cycle <span className="text-danger">*</span>
              </label>
              <input
                name="appraisalCycle"
                value={form.appraisalCycle}
                className="form-control"
                placeholder="2023-2024"
                style={inputStyle}
                onChange={handleYearChange}
                required
                pattern="\d{4}-\d{4}"
                title="Format: YYYY-YYYY (e.g., 2023-2024)"
              />
              <small className="text-muted">Format: YYYY-YYYY (e.g., 2023-2024)</small>
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={downloadExcelTemplate}
                    disabled={isSubmitting}
                  >
                    <FaFileExcel className="text-success" />
                    <span>Download Template</span>
                  </button>
                  
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
                    >
                      <FaUpload />
                      <span>Upload Excel</span>
                    </label>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  {editingItem && (
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
                        <span>{editingItem ? "Update" : "Submit"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Debug Panel */}
      <div className="border rounded p-3 bg-light">
        <h6 className="fw-bold mb-2">Debug Information</h6>
        <div className="row">
          <div className="col-md-6">
            <small className="d-block">
              <strong>Server Status:</strong> 
              <span className={`ms-2 fw-bold ${serverStatus === 'online' ? 'text-success' : 'text-danger'}`}>
                {serverStatus.toUpperCase()}
              </span>
            </small>
            <small className="d-block">
              <strong>Employee Data Count:</strong> 
              <span className="ms-2">{employeeData.length}</span>
            </small>
            <small className="d-block">
              <strong>API Base URL:</strong> 
              <span className="ms-2">{API_BASE}</span>
            </small>
          </div>
          <div className="col-md-6">
            <small className="d-block">
              <strong>Resignation API:</strong> 
              <span className="ms-2">{RESIGNATION_API}/all-ids</span>
            </small>
            <small className="d-block">
              <strong>Dropdown Visibility:</strong> 
              <span className="ms-2">ID: {showIdDropdown ? 'Visible' : 'Hidden'}, Name: {showNameDropdown ? 'Visible' : 'Hidden'}</span>
            </small>
            <small className="d-block">
              <strong>Search Terms:</strong> 
              <span className="ms-2">ID: "{idSearchTerm}", Name: "{nameSearchTerm}"</span>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}