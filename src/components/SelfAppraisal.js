import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaUpload, 
  FaStar, 
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

export default function SelfAppraisal() {
  // Backend API URL
   const API_BASE = `${process.env.REACT_APP_API_BASE}/api/self-appraisals`;
//  const API_BASE = process.env.REACT_APP_API_BASE || "https://pms-lj2e.onrender.com/api/self-appraisals";
  
  // Employee search state
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [backendError, setBackendError] = useState("");

  const searchDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Ratings Table Section
  const [rows, setRows] = useState([]);
  const [newRow, setNewRow] = useState({
    criteria: "",
    weightage: "",
    rating: "",
  });

  // Feedback Section
  const [feedback, setFeedback] = useState("");
  const [development, setDevelopment] = useState("");
  const [strengths, setStrengths] = useState("");
  const [rating, setRating] = useState(0);
  const [cards, setCards] = useState([]);

  // Load employee data on mount
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

  // Load draft from backend when component mounts
  useEffect(() => {
    // Load from localStorage first for compatibility
    const storedEmployee = localStorage.getItem("selectedEmployee");
    const storedEmployeeId = localStorage.getItem("selectedEmployeeId");
    
    if (storedEmployee) {
      setEmployee(storedEmployee);
      setEmployeeId(storedEmployeeId || "");
      setSearchTerm(storedEmployeeId ? `${storedEmployee} (${storedEmployeeId})` : storedEmployee);
    }
    
    loadDraftFromBackend();
  }, []);

  // Fetch employee data from backend
  const fetchEmployeeData = async () => {
    setIsLoadingData(true);
    setBackendError("");
    try {
      // Use the resignation API endpoints
      //const RESIGNATION_API = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
       const RESIGNATION_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
      // Try /all-ids endpoint
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
		
        const RESIGNATION_API = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
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
    setEmployee(item.fullName);
    setEmployeeId(item.employeeId);
    setSearchTerm(`${item.fullName} (${item.employeeId})`);
    setShowSearchDropdown(false);
    
    // Save to localStorage for persistence
    localStorage.setItem("selectedEmployee", item.fullName);
    localStorage.setItem("selectedEmployeeId", item.employeeId);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setShowSearchDropdown(false);
  };

  const clearEmployeeSelection = () => {
    setEmployee("");
    setEmployeeId("");
    setSearchTerm("");
    setShowSearchDropdown(false);
    localStorage.removeItem("selectedEmployee");
    localStorage.removeItem("selectedEmployeeId");
  };

  const filteredEmployees = employeeData.filter(item =>
    item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Retry loading employee data
  const handleRetryLoadData = () => {
    fetchEmployeeData();
  };

  // Load existing draft from backend
  const loadDraftFromBackend = async () => {
    try {
      // If no employee selected, don't load
      if (!employee && !employeeId) return;
      
      const queryEmployeeId = employeeId || localStorage.getItem("selectedEmployeeId");
      if (!queryEmployeeId) return;
      
      const response = await axios.get(`${API_BASE}?employeeId=${queryEmployeeId}&status=draft`);
      if (response.data.success && response.data.data.length > 0) {
        const draft = response.data.data[0];
        setRows(draft.ratings || []);
        setCards(draft.feedbackCards || []);
        console.log("Loaded draft from backend:", draft);
      }
    } catch (error) {
      console.log("No draft found or error loading:", error);
    }
  };

  // Save draft to backend
  const saveDraftToBackend = async () => {
    try {
      // Check if employee is selected
      if (!employee || !employeeId) {
        alert("Please select an employee first!");
        return false;
      }

      // Format data correctly for backend
      const formattedRatings = rows.map(row => ({
        criteria: row.criteria,
        weightage: parseFloat(row.weightage) || 0,
        rating: parseFloat(row.rating) || 0
      }));

      const formattedFeedbackCards = cards.map(card => ({
        feedback: card.feedback,
        development: card.development || "",
        strengths: card.strengths || "",
        rating: parseInt(card.rating) || 0
      }));

      const appraisalData = {
        userId: employeeId, // Use employeeId as userId
        userName: employee,
        employeeId: employeeId,
        appraisalPeriod: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
        ratings: formattedRatings,
        feedbackCards: formattedFeedbackCards,
        status: "draft"
      };

      console.log("Saving draft to backend:", appraisalData);

      // Check if draft exists
      const checkResponse = await axios.get(`${API_BASE}?employeeId=${employeeId}&status=draft`);
      
      if (checkResponse.data.success && checkResponse.data.data.length > 0) {
        // Update existing draft
        const draftId = checkResponse.data.data[0]._id;
        const response = await axios.put(`${API_BASE}/${draftId}`, appraisalData);
        console.log("Draft updated in backend:", response.data);
        return response.data.success;
      } else {
        // Create new draft
        const response = await axios.post(API_BASE, appraisalData);
        console.log("New draft created in backend:", response.data);
        return response.data.success;
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      console.error("Error response:", error.response?.data);
      return false;
    }
  };

  const addRow = () => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    if (!newRow.criteria || !newRow.weightage || !newRow.rating) {
      alert("Please fill all fields!");
      return;
    }
    
    const weightage = parseFloat(newRow.weightage);
    const rating = parseFloat(newRow.rating);
    
    if (isNaN(weightage) || weightage < 0 || weightage > 100) {
      alert("Weightage must be a number between 0 and 100!");
      return;
    }
    
    if (isNaN(rating) || rating < 1 || rating > 5) {
      alert("Rating must be a number between 1 and 5!");
      return;
    }
    
    const newRowObj = {
      id: Date.now(),
      criteria: newRow.criteria,
      weightage: weightage,
      rating: rating,
    };

    const updatedRows = [...rows, newRowObj];
    
    setRows(updatedRows);
    setNewRow({ criteria: "", weightage: "", rating: "" });
    
    // Auto-save to backend
    saveDraftToBackend();
    
    // Show success alert
    alert("Rating row added successfully!");
  };

  // Download Excel template for Ratings
  const downloadRatingsTemplate = () => {
    const emptyData = [
      {
        "Criteria": "",
        "Weightage": "",
        "Rating": ""
      },
      {
        "Criteria": "",
        "Weightage": "",
        "Rating": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ratings Template");
    
    const wscols = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Ratings_Template.xlsx");
  };

  // Download Excel template for Feedback
  const downloadFeedbackTemplate = () => {
    const emptyData = [
      {
        "Feedback": "",
        "Development": "",
        "Strengths": "",
        "Rating": ""
      },
      {
        "Feedback": "",
        "Development": "",
        "Strengths": "",
        "Rating": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback Template");
    
    const wscols = [
      { wch: 40 },
      { wch: 30 },
      { wch: 30 },
      { wch: 10 },
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Feedback_Template.xlsx");
  };

  const handleFileUpload = (e) => {
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
          const firstRow = jsonData[0];
          const hasCriteria = firstRow["Criteria"] !== undefined || firstRow["criteria"] !== undefined;
          const hasFeedback = firstRow["Feedback"] !== undefined || firstRow["feedback"] !== undefined;

          if (hasCriteria) {
            const newRows = jsonData.map((row, index) => {
              const criteria = row["Criteria"] || row["criteria"] || "";
              const weightage = parseFloat(row["Weightage"] || row["weightage"] || 0);
              const rating = parseFloat(row["Rating"] || row["rating"] || 0);

              return {
                id: Date.now() + index,
                criteria: criteria.toString(),
                weightage: weightage,
                rating: rating,
              };
            }).filter(row => row.criteria && !isNaN(row.weightage) && !isNaN(row.rating));

            setRows((prev) => [...prev, ...newRows]);
            
            await saveDraftToBackend();
            
            alert(`${newRows.length} rating rows uploaded successfully!`);
          } else if (hasFeedback) {
            const newCards = jsonData.map((row, index) => {
              const feedback = row["Feedback"] || row["feedback"] || "";
              const development = row["Development"] || row["development"] || row["Areas of Development"] || "";
              const strengths = row["Strengths"] || row["strengths"] || row["Key Strengths"] || "";
              const rating = parseInt(row["Rating"] || row["rating"] || 0);

              return {
                id: Date.now() + index,
                feedback: feedback.toString(),
                development: development.toString(),
                strengths: strengths.toString(),
                rating: rating,
              };
            }).filter(card => card.feedback && !isNaN(card.rating));

            setCards((prev) => [...prev, ...newCards]);
            
            await saveDraftToBackend();
            
            alert(`${newCards.length} feedback entries uploaded successfully!`);
          } else {
            alert("File format not recognized. Please use the provided templates.");
          }
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing the uploaded file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitFeedback = async () => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    if (!feedback || rating === 0) {
      alert("Please fill feedback and select rating!");
      return;
    }

    const newCard = {
      id: Date.now(),
      feedback,
      development: development || "",
      strengths: strengths || "",
      rating: rating,
    };

    setCards((prev) => [...prev, newCard]);
    
    await saveDraftToBackend();
    
    alert("Feedback added successfully!");
    
    setFeedback("");
    setDevelopment("");
    setStrengths("");
    setRating(0);
  };

  const handleSubmitAll = async () => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    if (rows.length === 0) {
      alert("Please add at least one rating before submitting!");
      return;
    }

    const totalWeightage = rows.reduce((sum, row) => sum + (parseFloat(row.weightage) || 0), 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      alert(`Total weightage must be 100% (Currently: ${totalWeightage.toFixed(2)}%)`);
      return;
    }

    try {
      const formattedRatings = rows.map(row => ({
        criteria: row.criteria,
        weightage: parseFloat(row.weightage) || 0,
        rating: parseFloat(row.rating) || 0
      }));

      const formattedFeedbackCards = cards.map(card => ({
        feedback: card.feedback,
        development: card.development || "",
        strengths: card.strengths || "",
        rating: parseInt(card.rating) || 0
      }));

      const appraisalData = {
        userId: employeeId,
        userName: employee,
        employeeId: employeeId,
        appraisalPeriod: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
        ratings: formattedRatings,
        feedbackCards: formattedFeedbackCards,
        status: "submitted"
      };

      console.log("Submitting to backend:", appraisalData);

      let response;
      
      try {
        const checkResponse = await axios.get(`${API_BASE}?employeeId=${employeeId}&status=draft`);
        
        if (checkResponse.data.success && checkResponse.data.data.length > 0) {
          const draftId = checkResponse.data.data[0]._id;
          console.log("Updating existing draft:", draftId);
          
          response = await axios.put(`${API_BASE}/${draftId}`, appraisalData);
          console.log("Update response:", response.data);
          
          if (response.data.success) {
            const submitResponse = await axios.post(`${API_BASE}/${draftId}/submit`);
            console.log("Submit response:", submitResponse.data);
            
            if (submitResponse.data.success) {
              setRows([]);
              setCards([]);
              
              localStorage.setItem("selfAppraisalData", JSON.stringify({
                ratings: rows,
                feedbackCards: cards
              }));
              
              alert("Self Appraisal submitted successfully to backend!");
              return;
            }
          }
        } else {
          console.log("Creating new appraisal");
          const createResponse = await axios.post(API_BASE, appraisalData);
          console.log("Create response:", createResponse.data);
          
          if (createResponse.data.success && createResponse.data.data?._id) {
            const newAppraisalId = createResponse.data.data._id;
            
            const submitResponse = await axios.post(`${API_BASE}/${newAppraisalId}/submit`);
            console.log("Submit response:", submitResponse.data);
            
            if (submitResponse.data.success) {
              setRows([]);
              setCards([]);
              
              localStorage.setItem("selfAppraisalData", JSON.stringify({
                ratings: rows,
                feedbackCards: cards
              }));
              
              alert("Self Appraisal submitted successfully to backend!");
              return;
            }
          }
        }
      } catch (backendError) {
        console.error("Backend error:", backendError.response?.data || backendError.message);
        throw backendError;
      }
      
    } catch (error) {
      console.error("Error submitting to backend:", error);
      
      const localStorageData = {
        ratings: rows,
        feedbackCards: cards,
      };
      
      localStorage.setItem("selfAppraisalData", JSON.stringify(localStorageData));
      alert("Backend submission failed! Data saved to localStorage as backup.");
    }
  };

  const calculateTotalWeightage = () => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.weightage) || 0), 0);
  };

  return (
    <div className="p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <h4 className="fw-bold mb-4">Self Appraisal Form</h4>

      {/* Employee Search Section */}
      <div className="border rounded p-4 bg-light mb-4">
        <h5 className="fw-bold mb-3">Select Employee</h5>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Search Employee *
            </label>
            <div className="position-relative">
              <div className="input-group" ref={searchInputRef}>
                <span className="input-group-text" style={{ background: "#f7f7f7" }}>
                  <FaUser className="text-muted" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="form-control"
                  placeholder="Type to search by ID or Name..."
                  style={{
                    background: "#f7f7f7",
                    border: "1px solid #d1d8dd",
                    borderRadius: "6px",
                    height: "38px",
                    fontSize: "14px",
                  }}
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
                  <span className="input-group-text" style={{ background: "#f7f7f7" }}>
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
                  <div className="p-2 border-bottom bg-light">
                    <small className="text-muted">
                      {filteredEmployees.length === 0 
                        ? "No employees found" 
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
            
            {/* Employee Data Status */}
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
            {employee && (
              <div className="mt-4 p-3 border rounded bg-light" style={{height: "100%"}}>
                <small className="text-muted d-block mb-1">Selected Employee:</small>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-medium">{employee}</span>
                    <small className="text-muted ms-2">({employeeId})</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearEmployeeSelection}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weightage Warning */}
      {rows.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4">
          <div>
            <strong>Total Weightage:</strong> {calculateTotalWeightage().toFixed(2)}% 
            <span className={Math.abs(calculateTotalWeightage() - 100) <= 0.01 ? "text-success ms-2" : "text-danger ms-2"}>
              {Math.abs(calculateTotalWeightage() - 100) <= 0.01 
                ? "✓ Perfect!" 
                : `❌ Must be exactly 100%`}
            </span>
          </div>
        </div>
      )}

      {/* Ratings Section */}
      <div className="mb-5">
        <h5 className="fw-bold mb-3">Ratings</h5>

        <div className="border rounded bg-white mb-3">
          <table className="table mb-0" style={{ fontSize: "14px" }}>
            <thead style={{ background: "#f7f7f7" }}>
              <tr>
                <th>No.</th>
                <th>Criteria *</th>
                <th>Weightage (%)</th>
                <th>Rating</th>
              </tr>
            </thead>

            <tbody>
              <tr style={{ background: "#f9f9f9" }}>
                <td>{rows.length + 1}</td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newRow.criteria}
                    onChange={(e) => setNewRow({...newRow, criteria: e.target.value})}
                    placeholder="Enter criteria"
                    disabled={!employee}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={newRow.weightage}
                    onChange={(e) => setNewRow({...newRow, weightage: e.target.value})}
                    placeholder="0-100"
                    step="0.1"
                    min="0"
                    max="100"
                    disabled={!employee}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={newRow.rating}
                    onChange={(e) => setNewRow({...newRow, rating: e.target.value})}
                    placeholder="1-5"
                    disabled={!employee}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center gap-3 mb-4">
          <button 
            className="btn btn-primary" 
            onClick={addRow}
            disabled={!employee}
          >
            Add Row
          </button>
          
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={downloadRatingsTemplate}
            title="Download Ratings Excel Template"
            disabled={!employee}
          >
            <FaFileExcel />
            <span>Download Ratings Template</span>
          </button>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mb-5">
        <h5 className="fw-bold mb-4">Feedback</h5>

        <div className="border rounded p-4 bg-light mb-4">
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label fw-semibold">Feedback *</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Enter feedback..."
                disabled={!employee}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Areas of Development/Next Step</label>
              <textarea
                value={development}
                onChange={(e) => setDevelopment(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Enter areas for development or next steps..."
                disabled={!employee}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Key Strengths/Achievements</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Enter key strengths or achievements..."
                disabled={!employee}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Rating *</label>
              <div className="mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => !employee ? null : setRating(star)}
                    style={{
                      fontSize: "28px",
                      cursor: employee ? "pointer" : "not-allowed",
                      color: rating >= star ? "#FFD700" : "#d1d8dd",
                      marginRight: 6,
                      opacity: employee ? 1 : 0.6
                    }}
                  >
                    ★
                  </span>
                ))}
                <span className="ms-3 fw-semibold">
                  {rating > 0 ? `${rating}/5` : "Select rating"}
                </span>
              </div>
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={downloadFeedbackTemplate}
                    title="Download Feedback Excel Template"
                    disabled={!employee}
                  >
                    <FaFileExcel />
                    <span>Download Feedback Template</span>
                  </button>
                  
                  <div className="position-relative">
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="d-none"
                      disabled={!employee}
                    />
                    <label
                      htmlFor="fileUpload"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      style={{ 
                        cursor: employee ? "pointer" : "not-allowed",
                        opacity: employee ? 1 : 0.6
                      }}
                      title="Upload Excel File"
                    >
                      <FaUpload />
                      <span>Upload Excel</span>
                    </label>
                  </div>
                </div>

                <button 
                  className="btn btn-success d-flex align-items-center gap-2" 
                  onClick={handleSubmitFeedback}
                  disabled={!employee}
                >
                  <FaSave />
                  <span>Add Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit All Button */}
      <div className="d-flex justify-content-end mt-4">
        <button 
          className="btn btn-success btn-lg px-5 d-flex align-items-center gap-2" 
          onClick={handleSubmitAll}
          disabled={!employee || rows.length === 0 || Math.abs(calculateTotalWeightage() - 100) > 0.01}
        >
          <FaSave />
          <span>Submit Appraisal</span>
        </button>
      </div>
    </div>
  );
}