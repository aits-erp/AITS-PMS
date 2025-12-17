import React, { useState, useEffect, useRef } from "react";
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

export default function AnnualReport({ editingReport, onSaveSuccess, onCancelEdit }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  const ANNUAL_REPORT_API = `${API_BASE}/api/annual-reports`;
  
  const [form, setForm] = useState({
    employeeName: "",
    jobTitle: "",
    department: "",
    reviewPeriod: "Jan 1, 2024 - Dec 31, 2024",
    managerName: "",
    dateOfReview: "",
    achievements: "",
    developmentGoals: "",
    performanceRating: "",
    managerComments: "",
  });

  const [competencies, setCompetencies] = useState([
    { id: 1, name: "Communication", rating: "", comments: "" },
    { id: 2, name: "Teamwork", rating: "", comments: "" },
    { id: 3, name: "Problem Solving", rating: "", comments: "" },
    { id: 4, name: "Leadership", rating: "", comments: "" },
    { id: 5, name: "Time Management", rating: "", comments: "" },
  ]);

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

  // Update form when editingReport changes
  useEffect(() => {
    if (editingReport) {
      setForm({
        employeeName: editingReport.employeeName || "",
        jobTitle: editingReport.jobTitle || "",
        department: editingReport.department || "",
        reviewPeriod: editingReport.reviewPeriod || "Jan 1, 2024 - Dec 31, 2024",
        managerName: editingReport.managerName || "",
        dateOfReview: editingReport.dateOfReview || "",
        achievements: editingReport.achievements || "",
        developmentGoals: editingReport.developmentGoals || "",
        performanceRating: editingReport.performanceRating || "",
        managerComments: editingReport.managerComments || "",
      });
      setSelectedEmployeeId(editingReport.employeeId || "");
      setSearchTerm(editingReport.employeeName ? 
        `${editingReport.employeeName} (${editingReport.employeeId || ''})` : 
        "");
      
      if (editingReport.competencies && editingReport.competencies.length > 0) {
        const updatedCompetencies = competencies.map(baseComp => {
          const savedComp = editingReport.competencies.find(c => 
            c.name === baseComp.name || c.id === baseComp.id
          );
          return savedComp ? { ...baseComp, ...savedComp } : baseComp;
        });
        setCompetencies(updatedCompetencies);
      }
    } else {
      resetForm();
    }
  }, [editingReport]);

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
    
    setForm(prev => ({ ...prev, employeeName: selectedName }));
    setSelectedEmployeeId(selectedId);
    setSearchTerm(selectedId ? `${selectedName} (${selectedId})` : selectedName);
    setShowSearchDropdown(false);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setSelectedEmployeeId("");
    setForm(prev => ({ ...prev, employeeName: "" }));
    setShowSearchDropdown(false);
  };

  const filteredEmployees = employeeData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const name = item.employeeName || item.fullName || item.name || "";
    const id = item.employeeId || "";
    
    return name.toLowerCase().includes(searchLower) || 
           id.toLowerCase().includes(searchLower);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompetencyChange = (id, field, value) => {
    setCompetencies(prev => prev.map(comp => 
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const resetForm = () => {
    setForm({
      employeeName: "",
      jobTitle: "",
      department: "",
      reviewPeriod: "Jan 1, 2024 - Dec 31, 2024",
      managerName: "",
      dateOfReview: "",
      achievements: "",
      developmentGoals: "",
      performanceRating: "",
      managerComments: "",
    });
    setSelectedEmployeeId("");
    setSearchTerm("");
    setShowSearchDropdown(false);
    setBackendError("");
    setCompetencies(competencies.map(comp => ({ ...comp, rating: "", comments: "" })));
  };

  // Handle retry loading data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.employeeName.trim() || !form.managerName.trim()) {
      alert("Please fill Employee Name and Manager Name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        ...form,
        employeeId: selectedEmployeeId,
        competencies: [...competencies]
      };

      let response;
      if (editingReport && editingReport._id) {
        response = await axios.put(`${ANNUAL_REPORT_API}/${editingReport._id}`, reportData);
        alert("Annual report updated successfully!");
      } else {
        response = await axios.post(ANNUAL_REPORT_API, reportData);
        alert("Annual report submitted successfully!");
      }

      if (response.data.success) {
        resetForm();
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        if (onCancelEdit && editingReport) {
          onCancelEdit();
        }
      } else {
        alert("Error saving report: " + response.data.error);
      }
      
    } catch (err) {
      console.error("Error saving report:", err);
      alert("Error saving report: " + (err.response?.data?.error || err.message));
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
          "Job Title": "Senior Developer",
          "Department": "Engineering",
          "Review Period": "Jan 1, 2024 - Dec 31, 2024",
          "Manager Name": "Sarah Johnson",
          "Date of Review": new Date().toISOString().split('T')[0],
          "Achievements": "1. Successfully launched Project Alpha\n2. Improved team productivity by 25%\n3. Trained 3 new team members",
          "Development Goals": "1. Improve public speaking skills\n2. Complete AWS certification\n3. Develop team leadership capabilities",
          "Performance Rating": "Exceeds Expectations",
          "Manager Comments": "John has shown exceptional performance throughout the year. He consistently exceeds expectations and is a valuable team member.",
          "Communication Rating": "4",
          "Communication Comments": "Clear and effective communicator",
          "Teamwork Rating": "5",
          "Teamwork Comments": "Excellent team player, always supportive",
          "Problem Solving Rating": "4",
          "Problem Solving Comments": "Good analytical skills and creative solutions",
          "Leadership Rating": "3",
          "Leadership Comments": "Shows potential, needs more experience",
          "Time Management Rating": "5",
          "Time Management Comments": "Always meets deadlines, excellent time management"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Annual Report Template");
      
      const wscols = [
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
        { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 40 },
        { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
        { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 30 }
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, "Annual_Report_Template.xlsx");
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
          
          const employeeName = firstRow["Employee Name"] || firstRow["employeeName"] || firstRow["EMPLOYEE NAME"] || firstRow["Employee"] || firstRow["employee"] || "";
          const jobTitle = firstRow["Job Title"] || firstRow["jobTitle"] || firstRow["JOB TITLE"] || firstRow["Title"] || firstRow["title"] || "";
          const department = firstRow["Department"] || firstRow["department"] || firstRow["DEPARTMENT"] || "";
          const reviewPeriod = firstRow["Review Period"] || firstRow["reviewPeriod"] || firstRow["REVIEW PERIOD"] || "Jan 1, 2024 - Dec 31, 2024";
          const managerName = firstRow["Manager Name"] || firstRow["managerName"] || firstRow["MANAGER NAME"] || firstRow["Reviewer"] || firstRow["reviewer"] || "";
          const dateOfReview = firstRow["Date of Review"] || firstRow["dateOfReview"] || firstRow["DATE OF REVIEW"] || firstRow["Date"] || firstRow["date"] || "";
          const achievements = firstRow["Achievements"] || firstRow["achievements"] || firstRow["ACHIEVEMENTS"] || "";
          const developmentGoals = firstRow["Development Goals"] || firstRow["developmentGoals"] || firstRow["DEVELOPMENT GOALS"] || firstRow["Goals"] || firstRow["goals"] || "";
          const performanceRating = firstRow["Performance Rating"] || firstRow["performanceRating"] || firstRow["PERFORMANCE RATING"] || firstRow["Rating"] || firstRow["rating"] || "";
          const managerComments = firstRow["Manager Comments"] || firstRow["managerComments"] || firstRow["MANAGER COMMENTS"] || firstRow["Comments"] || firstRow["comments"] || "";

          setForm({
            employeeName: employeeName.toString(),
            jobTitle: jobTitle.toString(),
            department: department.toString(),
            reviewPeriod: reviewPeriod.toString(),
            managerName: managerName.toString(),
            dateOfReview: dateOfReview.toString(),
            achievements: achievements.toString(),
            developmentGoals: developmentGoals.toString(),
            performanceRating: performanceRating.toString(),
            managerComments: managerComments.toString(),
          });
          setSearchTerm(employeeName.toString());

          const newCompetencies = competencies.map(comp => {
            const rating = firstRow[`${comp.name} Rating`] || firstRow[`${comp.name.toLowerCase()} Rating`] || firstRow[`${comp.name.toUpperCase()} RATING`] || "";
            const comments = firstRow[`${comp.name} Comments`] || firstRow[`${comp.name.toLowerCase()} Comments`] || firstRow[`${comp.name.toUpperCase()} COMMENTS`] || "";
            
            return {
              ...comp,
              rating: rating.toString(),
              comments: comments.toString(),
            };
          });

          setCompetencies(newCompetencies);
          alert("Annual report data loaded from Excel successfully!");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing the uploaded file: " + (error.response?.data?.error || error.message));
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: "120px",
    resize: "vertical",
  };

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Annual Performance Report Management</h5>
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
          {editingReport ? "Edit Annual Report" : "Create New Annual Report"}
        </h6>
        
        <form onSubmit={handleSubmit}>
          {/* Section 1: Key Information */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">1. Key Information</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Employee Name <span className="text-danger">*</span>
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
                      placeholder="Type to search by ID or Name..."
                      style={inputStyle}
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
                {form.employeeName && (
                  <div className="mt-4 p-3 border rounded bg-light" style={{height: "100%"}}>
                    <small className="text-muted d-block mb-1">Selected Employee:</small>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-medium">{form.employeeName}</span>
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

              <div className="col-md-6">
                <label className="form-label fw-semibold">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  className="form-control"
                  placeholder="e.g., Senior Developer"
                  value={form.jobTitle}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  placeholder="e.g., Engineering"
                  value={form.department}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Review Period</label>
                <input
                  type="text"
                  name="reviewPeriod"
                  className="form-control"
                  value={form.reviewPeriod}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Reviewer/Manager Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="managerName"
                  className="form-control"
                  placeholder="Manager Name"
                  value={form.managerName}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Date of Review</label>
                <input
                  type="date"
                  name="dateOfReview"
                  className="form-control"
                  value={form.dateOfReview}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Core Competency Ratings */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">2. Core Competency Ratings</h6>
            <p className="text-muted mb-3">
              Rating Scale: 1 (Needs Improvement) to 5 (Exceeds Expectations)
            </p>
            
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "30%" }}>COMPETENCY</th>
                    <th style={{ width: "20%" }}>RATING (1-5)</th>
                    <th style={{ width: "50%" }}>COMMENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((comp) => (
                    <tr key={comp.id}>
                      <td className="fw-semibold">{comp.name}</td>
                      <td>
                        <select 
                          className="form-select form-select-sm"
                          value={comp.rating}
                          onChange={(e) => handleCompetencyChange(comp.id, "rating", e.target.value)}
                          style={{...inputStyle, padding: "8px"}}
                          disabled={isSubmitting}
                        >
                          <option value="">-- Select --</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Comments..."
                          value={comp.comments}
                          onChange={(e) => handleCompetencyChange(comp.id, "comments", e.target.value)}
                          style={{...inputStyle, padding: "8px"}}
                          disabled={isSubmitting}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Key Achievements & Contributions */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">3. Key Achievements & Contributions</h6>
            <p className="text-muted mb-2">
              Summarize 3–5 major accomplishments during the review period.
            </p>
            <textarea
              className="form-control"
              rows={5}
              name="achievements"
              value={form.achievements}
              onChange={handleChange}
              style={textareaStyle}
              placeholder="1. Successfully launched project X...
2. Improved team productivity by 25%...
3. Trained 3 new team members..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* Section 4: Areas for Development & Goals */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">4. Areas for Development & Goals</h6>
            <p className="text-muted mb-2">
              What skills or behaviors need development?
            </p>
            <textarea
              className="form-control"
              rows={4}
              name="developmentGoals"
              value={form.developmentGoals}
              onChange={handleChange}
              style={textareaStyle}
              placeholder="1. Improve public speaking skills...
2. Complete advanced certification...
3. Develop leadership capabilities..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* Section 5: Overall Summary and Manager Comments */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">5. Overall Summary and Manager Comments</h6>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Overall Performance Rating</label>
                <select
                  className="form-control"
                  name="performanceRating"
                  value={form.performanceRating}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Rating --</option>
                  <option>Outstanding</option>
                  <option>Exceeds Expectations</option>
                  <option>Meets Expectations</option>
                  <option>Below Expectations</option>
                  <option>Poor</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label fw-semibold">Manager's final summary and recommendations</label>
              <textarea
                className="form-control"
                rows={5}
                name="managerComments"
                value={form.managerComments}
                onChange={handleChange}
                style={textareaStyle}
                placeholder="Provide overall assessment and recommendations for the employee's development..."
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>

          {/* Upload and Submit Section */}
          <div className="mt-4">
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
                {editingReport && (
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
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Clear Form
                </button>
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
                      <span>{editingReport ? "Update Report" : "Save Report"}</span>
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