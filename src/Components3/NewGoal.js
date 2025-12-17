import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaUpload, 
  FaSave, 
  FaFileExcel, 
  FaUser, 
  FaSpinner, 
  FaSearch, 
  FaTimes
} from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function NewGoal({ editingGoal, onSaveSuccess, onCancelEdit }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const GOALS_API = `${API_BASE}/api/new-goals`;
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  
  // Form state
  const [goal, setGoal] = useState("");
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("Pending");
  const [isGroup, setIsGroup] = useState(false);
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Employee selection state - Combined search
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  
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

  // Update form when editingGoal changes
  useEffect(() => {
    if (editingGoal) {
      setGoal(editingGoal.goal || "");
      setProgress(editingGoal.progress || "");
      setStatus(editingGoal.status || "Pending");
      setIsGroup(editingGoal.isGroup || false);
      setCompany(editingGoal.company || "");
      setDescription(editingGoal.description || "");
      setEmployee(editingGoal.employee || "");
      setEmployeeId(editingGoal.employeeId || "");
      setSearchTerm(editingGoal.employee ? 
        `${editingGoal.employee} (${editingGoal.employeeId || ''})` : 
        "");
    } else {
      resetForm();
    }
  }, [editingGoal]);

  // Fetch employee data from backend
  const fetchEmployeeData = async () => {
    setIsLoadingData(true);
    setBackendError("");
    try {
      // Try /all-ids endpoint first
      const response = await axios.get(`${RESIGNATION_API}/all-ids`);
      
      if (response.data.success) {
        setEmployeeData(response.data.data || []);
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
            employeeName: name,
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

  const resetForm = () => {
    setGoal("");
    setProgress("");
    setStatus("Pending");
    setIsGroup(false);
    setCompany("");
    setDescription("");
    setEmployee("");
    setEmployeeId("");
    setSearchTerm("");
    setShowSearchDropdown(false);
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
    const selectedName = item.employeeName || item.fullName || item.name || "";
    const selectedId = item.employeeId || "";
    
    setEmployee(selectedName);
    setEmployeeId(selectedId);
    setSearchTerm(selectedId ? `${selectedName} (${selectedId})` : selectedName);
    setShowSearchDropdown(false);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setEmployee("");
    setEmployeeId("");
    setShowSearchDropdown(false);
  };

  const filteredEmployees = employeeData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const name = item.employeeName || item.fullName || item.name || "";
    const id = item.employeeId || "";
    
    return name.toLowerCase().includes(searchLower) || 
           id.toLowerCase().includes(searchLower);
  });

  // Handle retry loading data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goal.trim() || !employee.trim()) {
      alert("Please fill goal and select an employee!");
      return;
    }

    setIsSubmitting(true);
    try {
      const goalData = {
        goal: goal.trim(),
        progress: progress.trim(),
        isGroup: isGroup,
        status: status,
        employee: employee.trim(),
        employeeId: employeeId.trim(),
        company: company.trim(),
        description: description.trim()
      };

      let response;
      if (editingGoal && editingGoal._id) {
        // Update existing goal
        response = await axios.put(`${GOALS_API}/${editingGoal._id}`, goalData);
        alert("Goal updated successfully!");
      } else {
        // Create new goal
        response = await axios.post(GOALS_API, goalData);
        alert("Goal submitted successfully!");
      }

      resetForm();
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      if (onCancelEdit && editingGoal) {
        onCancelEdit();
      }
      
    } catch (err) {
      console.error("Error saving goal", err);
      alert("Error saving goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const emptyData = [
      {
        "Goal": "",
        "Progress": "",
        "IsGroup": "",
        "Status": "",
        "Employee ID": "",
        "Employee": "",
        "Company": "",
        "Description": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Goals Template");
    
    const wscols = [
      { wch: 30 }, // Goal column width
      { wch: 15 }, // Progress column width
      { wch: 15 }, // IsGroup column width
      { wch: 15 }, // Status column width
      { wch: 25 }, // Employee ID column width
      { wch: 25 }, // Employee column width
      { wch: 35 }, // Company column width
      { wch: 40 }, // Description column width
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Goals_Template.xlsx");
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
          const newGoals = jsonData.map((row) => {
            const goal = row["Goal"] || row["goal"] || row["GOAL"] || "";
            const progress = row["Progress"] || row["progress"] || row["PROGRESS"] || "";
            const isGroup = row["Is Group"] || row["IsGroup"] || row["is_group"] || row["Group"] || row["group"] || false;
            const status = row["Status"] || row["status"] || row["STATUS"] || "Pending";
            const employeeId = row["Employee ID"] || row["employeeId"] || row["EmployeeID"] || "";
            const employee = row["Employee"] || row["employee"] || row["EMPLOYEE"] || "";
            const company = row["Company"] || row["company"] || row["COMPANY"] || "";
            const description = row["Description"] || row["description"] || row["DESCRIPTION"] || "";

            return {
              goal: goal.toString(),
              progress: progress.toString(),
              isGroup: isGroup === "Yes" || isGroup === "yes" || isGroup === true || isGroup === "TRUE",
              status: status.toString(),
              employeeId: employeeId.toString(),
              employee: employee.toString(),
              company: company.toString(),
              description: description.toString(),
            };
          });

          await axios.post(`${GOALS_API}/bulk-import`, newGoals);
          
          if (onSaveSuccess) {
            onSaveSuccess();
          }
          
          alert(`${newGoals.length} goals imported successfully!`);
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
      <h5 className="fw-bold mb-4">Goal Management</h5>

      {/* Goal Form */}
      <div className="border rounded p-4 bg-light mb-4">
        <h6 className="fw-bold mb-3">
          {editingGoal ? "Edit Goal" : "Add New Goal"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Combined Employee Search Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
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
                                {id && <small className="text-muted">{id}</small>}
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
                    No employee data available. Please add resignation records first.
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

            <div className="col-md-12">
              <label className="form-label fw-semibold">
                Goal <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="form-control"
                style={inputStyle}
                placeholder="Enter goal..."
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Progress</label>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="form-control"
                style={inputStyle}
                placeholder="e.g., 50%"
                disabled={isSubmitting}
				required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-control"
                style={inputStyle}
                disabled={isSubmitting}
              >
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                  className="form-check-input"
                  id="isGroup"
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  disabled={isSubmitting}
                />
                <label className="form-label m-0" htmlFor="isGroup" style={{ cursor: "pointer" }}>
                  Is Group Goal?
                </label>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="form-control"
                style={inputStyle}
                disabled={isSubmitting}
				required
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={inputStyle}
                placeholder="Enter description here..."
                disabled={isSubmitting}
              ></textarea>
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
                  {editingGoal && (
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
                    <span>{isSubmitting ? "Saving..." : editingGoal ? "Update" : "Submit"}</span>
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