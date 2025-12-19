import React, { useState, useEffect, useRef } from "react";
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
import axios from "axios";

export default function KRAs({ onDataChanged, editingKRA, onCancelEdit }) {
//  const API_BASE = process.env.REACT_APP_API_BASE || "https://pms-lj2e.onrender.com/api/kra";
const API_BASE = `${process.env.REACT_APP_API_BASE}/api/kra`;


  
  const [template, setTemplate] = useState(editingKRA?.template || "");
  const [manualRate, setManualRate] = useState(editingKRA?.manualRate || false);
  const [kra, setKra] = useState(editingKRA?.kra || "");
  const [weightage, setWeightage] = useState(editingKRA?.weightage || "");
  const [goalCompletion, setGoalCompletion] = useState(editingKRA?.goalCompletion || "");
  const [goalScore, setGoalScore] = useState(editingKRA?.goalScore || "");
  const [employee, setEmployee] = useState(editingKRA?.employee || "");
  const [employeeId, setEmployeeId] = useState(editingKRA?.employeeId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Update form when editingKRA changes
  useEffect(() => {
    if (editingKRA) {
      setTemplate(editingKRA.template || "");
      setManualRate(editingKRA.manualRate || false);
      setKra(editingKRA.kra || "");
      setWeightage(editingKRA.weightage || "");
      setGoalCompletion(editingKRA.goalCompletion || "");
      setGoalScore(editingKRA.goalScore || "");
      setEmployee(editingKRA.employee || "");
      setEmployeeId(editingKRA.employeeId || "");
      setNameSearchTerm(editingKRA.employee || "");
      setIdSearchTerm(editingKRA.employeeId || "");
    }
  }, [editingKRA]);

  // Load employee data on mount
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

  // Fetch employee data from backend
// Replace the fetchEmployeeData function in your KRA component
const fetchEmployeeData = async () => {
  setIsLoadingData(true);
  setBackendError("");
  try {
    // Use the resignation API endpoints that exist
    //const RESIGNATION_API = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
    const RESIGNATION_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
    // Try /all-ids first
    const response = await axios.get(`${RESIGNATION_API}/all-ids`);
    
    if (response.data.success) {
      // Transform the data to match expected format
      const formattedData = response.data.data.map(item => ({
        employeeId: item.employeeId,
        fullName: item.employeeName || item.fullName || item.name || "",
        email: item.email || "",
        status: item.status || "Unknown"
      }));
      setEmployeeData(formattedData);
    } else {
      throw new Error(response.data.error || "Failed to fetch employee data");
    }
  } catch (error) {
    console.error("Error fetching employee data:", error);
    
    // Fallback to /names endpoint if /all-ids fails
    try {
      const RESIGNATION_API = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
      const response = await axios.get(`${RESIGNATION_API}/names`);
      
      if (response.data.success) {
        const namesData = response.data.data || [];
        // Convert names array to expected format
        const formattedData = namesData.map(name => ({
          employeeId: `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          fullName: name,
          email: "",
          status: "Unknown"
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
    setTemplate("");
    setManualRate(false);
    setKra("");
    setWeightage("");
    setGoalCompletion("");
    setGoalScore("");
    setEmployee("");
    setEmployeeId("");
    setNameSearchTerm("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!template.trim()) {
      alert("Please enter a template name");
      return;
    }
    
    if (!kra.trim()) {
      alert("Please enter KRA description");
      return;
    }

    setIsSubmitting(true);
    try {
      const kraData = {
        template: template.trim(),
        manualRate,
        kra: kra.trim(),
        weightage: weightage.toString(),
        goalCompletion: goalCompletion.toString(),
        goalScore: goalScore.toString(),
        employee: employee.trim(),
        employeeId: employeeId.trim(),
      };

      let response;
      if (editingKRA && editingKRA._id) {
        // Update existing KRA
        response = await axios.put(`${API_BASE}/${editingKRA._id}`, kraData);
        alert("KRA updated successfully!");
      } else {
        // Create new KRA
        response = await axios.post(API_BASE, kraData);
        alert("KRA submitted successfully!");
      }

      if (response.data.success) {
        resetForm();
        if (onDataChanged) {
          onDataChanged();
        }
        if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        alert("Failed to save KRA: " + response.data.error);
      }
    } catch (err) {
      console.error("Error saving KRA:", err);
      alert("Error saving KRA: " + (err.response?.data?.error || err.message || "Check if server is running"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Employee ID field changes
  const handleEmployeeIdChange = (value) => {
    setEmployeeId(value);
    setIdSearchTerm(value);
    if (value.trim() === "") {
      setShowIdDropdown(false);
    } else {
      setShowIdDropdown(true);
    }
  };

  // Handle Employee Name field changes
  const handleEmployeeChange = (value) => {
    setEmployee(value);
    setNameSearchTerm(value);
    if (value.trim() === "") {
      setShowNameDropdown(false);
    } else {
      setShowNameDropdown(true);
    }
  };

  // Handle Employee ID selection from dropdown
  const handleIdSelect = (id, name) => {
    setEmployeeId(id);
    setEmployee(name); // Auto-fill the name field
    setIdSearchTerm(id);
    setNameSearchTerm(name);
    setShowIdDropdown(false);
    setShowNameDropdown(false);
  };

  // Handle Employee Name selection from dropdown
  const handleNameSelect = (name, id) => {
    setEmployee(name);
    setEmployeeId(id || ""); // Auto-fill the ID field
    setNameSearchTerm(name);
    setIdSearchTerm(id || "");
    setShowNameDropdown(false);
    setShowIdDropdown(false);
  };

  // Clear Employee ID field
  const clearIdField = () => {
    setEmployeeId("");
    setIdSearchTerm("");
    setShowIdDropdown(false);
  };

  // Clear Employee Name field
  const clearNameField = () => {
    setEmployee("");
    setNameSearchTerm("");
    setShowNameDropdown(false);
  };

  // Handle input focus events
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

  // Filter employee data for dropdowns
  const filteredIds = employeeData.filter(item =>
    item.employeeId?.toLowerCase().includes(idSearchTerm.toLowerCase()) ||
    item.fullName?.toLowerCase().includes(idSearchTerm.toLowerCase())
  );

  const filteredNames = employeeData.filter(item =>
    item.fullName?.toLowerCase().includes(nameSearchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(nameSearchTerm.toLowerCase())
  );

  // Retry loading employee data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  // Download Excel template (updated with new fields)
  const downloadExcelTemplate = () => {
    const emptyData = [
      {
        "Employee ID": "",
        "Employee": "",
        "KRA": "",
        "Weightage": "",
        "Completion": "",
        "Goal Score": "",
        "Template": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KRA Template");
    
    const wscols = [
      { wch: 25 }, // Employee ID
      { wch: 30 }, // Employee Name
      { wch: 40 }, // KRA column width
      { wch: 15 }, // Weightage column width
      { wch: 15 }, // Completion column width
      { wch: 15 }, // Goal Score column width
      { wch: 20 }, // Template column width
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "KRA_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsLoading(true);
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          const newRows = jsonData.map((row) => {
            // Normalize column names
            const normalizeKey = (key) => {
              if (!key) return '';
              return key.toString().trim().toLowerCase().replace(/\s+/g, '');
            };

            const rowKeys = Object.keys(row);
            const normalizedRow = {};
            rowKeys.forEach(key => {
              normalizedRow[normalizeKey(key)] = row[key];
            });

            const kra = normalizedRow.kra || "";
            const weightage = normalizedRow.weightage || "";
            const completion = normalizedRow.completion || normalizedRow.goalcompletion || "";
            const goalScore = normalizedRow.goalscore || "";
            const employee = normalizedRow.employee || "";
            const employeeId = normalizedRow.employeeid || "";
            const template = normalizedRow.template || "";
            
            return {
              template: template || "Imported Template",
              manualRate: manualRate,
              kra,
              weightage: weightage.toString(),
              goalCompletion: completion.toString(),
              goalScore: goalScore.toString(),
              employee: employee.toString(),
              employeeId: employeeId.toString(),
            };
          });

          const response = await axios.post(`${API_BASE}/bulk-import`, newRows);
          if (response.data.success) {
            if (onDataChanged) {
              onDataChanged();
            }
            alert(`Successfully imported ${newRows.length} KRAs`);
          } else {
            alert("Failed to import: " + response.data.error);
          }
        } else {
          alert("No valid data found in the uploaded file.");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing the uploaded file. Please check the format.");
      } finally {
        setIsLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const inputStyle = {
    background: "#f7f7f7",
    border: "1px solid #d1d8dd",
    borderRadius: "6px",
    height: "38px",
    fontSize: "14px",
    width: "100%",
    padding: "8px 12px",
  };

  const textareaStyle = {
    ...inputStyle,
    height: "80px",
    resize: "vertical",
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h5 className="fw-bold mb-4">KRA Management</h5>
      
      <div className="border rounded p-4 bg-light mb-4">
        <h6 className="fw-bold mb-3">
          {editingKRA ? "Edit KRA" : "Add New KRA"}
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
                  <span className="input-group-text" style={{ background: "#f7f7f7" }}>
                    <FaIdCard className="text-muted" />
                  </span>
                  <input
                    type="text"
                    value={idSearchTerm}
                    onChange={(e) => handleEmployeeIdChange(e.target.value)}
                    onFocus={handleIdInputFocus}
                    className="form-control"
                    placeholder="Type to search Employee ID..."
                    style={inputStyle}
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
                    <span className="input-group-text" style={{ background: "#f7f7f7" }}>
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
                Employee Name
              </label>
              <div className="position-relative">
                <div className="input-group" ref={nameInputRef}>
                  <span className="input-group-text" style={{ background: "#f7f7f7" }}>
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    type="text"
                    value={nameSearchTerm}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    onFocus={handleNameInputFocus}
                    className="form-control"
                    placeholder="Type to search employee name..."
                    style={inputStyle}
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
                    <span className="input-group-text" style={{ background: "#f7f7f7" }}>
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
            </div>

            {/* Employee Data Status */}
            <div className="col-12">
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
                    No employee data available. Please add employee records first.
                  </small>
                )}
              </div>
            </div>

            {/* Existing Fields */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Appraisal Template *
              </label>
              <input
                type="text"
                placeholder="Enter Template Name (e.g., Q1 2024)"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="form-control"
                style={inputStyle}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold d-block">Rate Goals Manually</label>
              <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={manualRate}
                  onChange={() => setManualRate(!manualRate)}
                  id="manualRate"
				  required
                />
                <label className="form-check-label" htmlFor="manualRate">
                  Enable manual rating
                </label>
              </div>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">KRA Description *</label>
              <textarea
                placeholder="Enter KRA description"
                value={kra}
                onChange={(e) => setKra(e.target.value)}
                className="form-control"
                style={textareaStyle}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Weightage (%)</label>
              <input
                type="number"
                placeholder="0-100"
                value={weightage}
                onChange={(e) => setWeightage(e.target.value)}
                className="form-control"
                style={inputStyle}
                min="0"
                max="100"
                step="0.01"
				required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Goal Completion (%)</label>
              <input
                type="number"
                placeholder="0-100"
                value={goalCompletion}
                onChange={(e) => setGoalCompletion(e.target.value)}
                className="form-control"
                style={inputStyle}
                min="0"
                max="100"
                step="0.01"
				required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Goal Score</label>
              <input
                type="number"
                value={goalScore}
                onChange={(e) => setGoalScore(e.target.value)}
                className="form-control"
                style={inputStyle}
                placeholder="Enter score"
                step="0.01"
				required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Calculated Score</label>
              <input
                type="text"
                value={weightage && goalCompletion ? 
                  ((parseFloat(weightage) * parseFloat(goalCompletion)) / 100).toFixed(2) : 
                  "0.00"}
                readOnly
                className="form-control"
                style={{...inputStyle, background: "#e9ecef", cursor: "not-allowed"}}
                placeholder="Auto-calculated"
				required
              />
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={downloadExcelTemplate}
                    title="Download Excel Template"
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
                      disabled={isLoading || isSubmitting}
					  
                    />
                    <label
                      htmlFor="fileUpload"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      style={{ 
                        cursor: (isLoading || isSubmitting) ? "not-allowed" : "pointer",
                        opacity: (isLoading || isSubmitting) ? 0.6 : 1
                      }}
                      title="Upload Excel File"
                    >
                      <FaUpload />
                      <span>Upload Excel</span>
                    </label>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  {editingKRA && (
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
                    disabled={isSubmitting || isLoading}
                  >
                    <FaSave />
                    <span>{isSubmitting ? "Saving..." : editingKRA ? "Update" : "Submit"}</span>
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