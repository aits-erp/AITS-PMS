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

export default function EmployeeDetails({ editingEmployee, onSaveSuccess, onCancelEdit }) {
  //const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const API_BASE = `${process.env.REACT_APP_API_BASE}`;
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  const EMPLOYEE_DETAILS_API = `${API_BASE}/api/employee-details`;
  
  const [form, setForm] = useState({
    employee: "",
    reviewer: "",
    addedOn: "",
    company: "",
    rating: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [backendError, setBackendError] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");

  const searchDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load employee data on mount
  useEffect(() => {
    checkServerStatus();
    fetchEmployeeData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update form when editingEmployee changes
  useEffect(() => {
    if (editingEmployee) {
      setForm({
        employee: editingEmployee.employee || "",
        reviewer: editingEmployee.reviewer || "",
        addedOn: convertDisplayToInput(editingEmployee.addedOn) || "",
        company: editingEmployee.company || "",
        rating: editingEmployee.rating || "",
      });
      setSelectedEmployeeId(editingEmployee.employeeId || "");
      setSearchTerm(editingEmployee.employee ? 
        `${editingEmployee.employee} (${editingEmployee.employeeId || ''})` : 
        "");
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
      // Try /all-ids endpoint first
      const response = await axios.get(`${RESIGNATION_API}/all-ids`);
      
      if (response.data.success) {
        // Transform the data to match expected format
        const formattedData = response.data.data.map(item => ({
          employeeId: item.employeeId || item._id,
          fullName: item.employeeName || item.fullName || item.name || "Unknown",
          email: item.email || "",
          status: item.status || "Unknown"
        }));
        setEmployeeData(formattedData);
      } else {
        throw new Error(response.data.error || "Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      
      // Fallback to /names endpoint
      try {
        const response = await axios.get(`${RESIGNATION_API}/names`);
        
        if (response.data.success) {
          const namesData = response.data.data || [];
          // Convert names array to expected format
          const formattedData = namesData.map((name, index) => ({
            employeeId: `EMP-${index + 1000}`,
            fullName: name,
            email: "",
            status: "Active"
          }));
          setEmployeeData(formattedData);
        } else {
          throw new Error("Failed to fetch employee names");
        }
      } catch (fallbackError) {
        setBackendError("Unable to load employee data. Please ensure resignation records exist.");
        setEmployeeData([]);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Search handling functions
  const handleSearchChange = (value) => {
    setSearchTerm(value);
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
    setForm((prev) => ({ ...prev, employee: item.fullName }));
    setSelectedEmployeeId(item.employeeId);
    setSearchTerm(`${item.fullName} (${item.employeeId})`);
    setShowSearchDropdown(false);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setSelectedEmployeeId("");
    setForm((prev) => ({ ...prev, employee: "" }));
    setShowSearchDropdown(false);
  };

  const filteredEmployees = employeeData.filter(item =>
    item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      employee: "",
      reviewer: "",
      addedOn: "",
      company: "",
      rating: "",
    });
    setSelectedEmployeeId("");
    setSearchTerm("");
    setShowSearchDropdown(false);
    setBackendError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.employee.trim() || !form.reviewer.trim()) {
      alert("Please fill required fields (Employee & Reviewer).");
      return;
    }

    setIsSubmitting(true);
    try {
      const employeeData = {
        employee: form.employee.trim(),
        employeeId: selectedEmployeeId,
        reviewer: form.reviewer.trim(),
        addedOnInput: form.addedOn || new Date().toISOString().slice(0, 16),
        company: form.company.trim() || "",
        rating: form.rating || ""
      };

      let response;
      if (editingEmployee && editingEmployee._id) {
        // Update existing
        response = await axios.put(`${EMPLOYEE_DETAILS_API}/${editingEmployee._id}`, employeeData);
        alert("Employee details updated successfully!");
      } else {
        // Create new
        response = await axios.post(EMPLOYEE_DETAILS_API, employeeData);
        alert("Employee details saved successfully!");
      }

      resetForm();
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      if (onCancelEdit && editingEmployee) {
        onCancelEdit();
      }
      
    } catch (err) {
      console.error("Error saving employee details", err);
      alert("Error saving data: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry loading employee data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        "Employee": "John Doe",
        "Reviewer": "Manager Name",
        "Company": "Shrirang Automation and Controls",
        "Rating": "Excellent",
        "Added On": new Date().toISOString().slice(0, 16)
      },
      {
        "Employee": "Jane Smith",
        "Reviewer": "HR Manager",
        "Company": "Shrirang Automation and Controls",
        "Rating": "Outstanding",
        "Added On": new Date().toISOString().slice(0, 16)
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Details Template");
    
    const wscols = [
      { wch: 25 }, // Employee column width
      { wch: 25 }, // Reviewer column width
      { wch: 35 }, // Company column width
      { wch: 20 }, // Rating column width
      { wch: 25 }, // Added On column width
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Employee_Details_Template.xlsx");
  };

  const convertDisplayToInput = (display) => {
    if (!display) return "";
    const m = display.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return "";
    const [, dd, mm, yyyy, hh, mi] = m;
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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
          const newItems = jsonData.map((row) => {
            const employee = row["Employee"] || row["employee"] || row["EMPLOYEE"] || "";
            const reviewer = row["Reviewer"] || row["reviewer"] || row["REVIEWER"] || "";
            const company = row["Company"] || row["company"] || row["COMPANY"] || "";
            const rating = row["Rating"] || row["rating"] || row["RATING"] || "";
            
            const addedOnInput = row["Added On"] || row["AddedOn"] || row["added_on"] || 
                                 row["Date"] || row["date"] || row["DATE"] ||
                                 new Date().toISOString().slice(0, 16);
            
            return {
              employee: employee.toString(),
              reviewer: reviewer.toString(),
              company: company.toString(),
              rating: rating.toString(),
              addedOnInput: addedOnInput.toString()
            };
          });

          await axios.post(`${EMPLOYEE_DETAILS_API}/bulk-import`, newItems);
          
          if (onSaveSuccess) {
            onSaveSuccess();
          }
          
          alert(`${newItems.length} employee records imported successfully!`);
        }
      } catch (err) {
        console.error("Error importing data", err);
        alert("Error importing data: " + (err.response?.data?.error || err.message));
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Employee Details Management</h5>
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
          {editingEmployee ? "Edit Employee Details" : "Add New Employee Details"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Combined Employee Search Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                For Employee <span className="text-danger">*</span>
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
                    disabled={isLoadingData}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-0"
                      onClick={clearSearchField}
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
                
                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div 
                    ref={searchDropdownRef}
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
                        {filteredEmployees.length === 0 
                          ? "No matching employees found" 
                          : `Found ${filteredEmployees.length} employee(s)`}
                      </small>
                    </div>
                    
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((item, index) => (
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
                              <div className="fw-medium">{item.fullName}</div>
                              <small className="text-muted">{item.employeeId}</small>
                            </div>
                            <small className="text-muted">Click to select</small>
                          </div>
                        </div>
                      ))
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

            {/* Display selected employee info */}
            <div className="col-md-6">
              {form.employee && (
                <div className="mt-4 p-3 border rounded bg-light" style={{height: "100%"}}>
                  <small className="text-muted d-block mb-1">Selected Employee:</small>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-medium">{form.employee}</span>
                      {selectedEmployeeId && (
                        <small className="text-muted ms-2">({selectedEmployeeId})</small>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={clearSearchField}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Fields */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Reviewer <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="reviewer"
                value={form.reviewer}
                onChange={(e) => setForm({...form, reviewer: e.target.value})}
                className="form-control"
                style={inputStyle}
                placeholder="Enter reviewer name"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Added On <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                name="addedOn"
                value={form.addedOn}
                onChange={(e) => setForm({...form, addedOn: e.target.value})}
                className="form-control"
                style={inputStyle}
                required
              />
              <small className="text-muted">Asia/Kolkata timezone</small>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Overall Performance Rating <span className="text-danger">*</span>
              </label>
              <select
                name="rating"
                value={form.rating}
                onChange={(e) => setForm({...form, rating: e.target.value})}
                className="form-control"
                style={inputStyle}
                required
              >
                <option value="">Select Rating</option>
                <option value="Outstanding">Outstanding</option>
                <option value="Excellent">Excellent</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Need Improvement">Need Improvement</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Company <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={(e) => setForm({...form, company: e.target.value})}
                className="form-control"
                style={inputStyle}
                placeholder="Shrirang Automation and Controls"
                required
                
              />
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
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
                  {editingEmployee && (
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
                        <span>{editingEmployee ? "Update" : "Submit"}</span>
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