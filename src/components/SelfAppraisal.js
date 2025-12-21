import React, { useState, useEffect, useRef, useCallback } from "react";
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
  FaIdCard,
  FaExclamationTriangle,
  FaRedo
} from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function SelfAppraisal() {
  // Backend API URL
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/self-appraisals`;
  
  // Employee search state
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [backendError, setBackendError] = useState("");
  const [currentAppraisalId, setCurrentAppraisalId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });

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
    
    // Load saved employee from localStorage
    const savedEmployee = localStorage.getItem("selectedEmployee");
    const savedEmployeeId = localStorage.getItem("selectedEmployeeId");
    if (savedEmployee && savedEmployeeId) {
      setEmployee(savedEmployee);
      setEmployeeId(savedEmployeeId);
      setSearchTerm(`${savedEmployee} (${savedEmployeeId})`);
    }
    
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

  // Load draft from backend when employee changes
  useEffect(() => {
    if (employeeId) {
      loadDraftFromBackend();
    } else {
      // Clear data if no employee selected
      setRows([]);
      setCards([]);
      setCurrentAppraisalId("");
    }
  }, [employeeId]);

  // Fetch employee data from backend
  const fetchEmployeeData = async () => {
    setIsLoadingData(true);
    setBackendError("");
    try {
      const RESIGNATION_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
      const response = await axios.get(`${RESIGNATION_API}/all-ids`);
      
      if (response.data.success) {
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
      setBackendError("Unable to load employee data. Please ensure resignation records exist.");
      setEmployeeData([]);
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

  const handleEmployeeSelect = async (item) => {
    setEmployee(item.fullName);
    setEmployeeId(item.employeeId);
    setSearchTerm(`${item.fullName} (${item.employeeId})`);
    setShowSearchDropdown(false);
    
    // Save to localStorage for persistence
    localStorage.setItem("selectedEmployee", item.fullName);
    localStorage.setItem("selectedEmployeeId", item.employeeId);
    
    // Load draft for this employee
    await loadDraftFromBackend();
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
    setCurrentAppraisalId("");
    setRows([]);
    setCards([]);
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

  // Get current appraisal period
  const getCurrentAppraisalPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
  };

  // Load existing draft from backend
  const loadDraftFromBackend = async () => {
    try {
      if (!employeeId) return null;
      
      console.log("Loading draft for employee:", employeeId);
      
      const response = await axios.get(`${API_BASE}/employee/${employeeId}`, {
        params: { status: 'draft' }
      });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const draft = response.data.data[0];
        
        // VERIFY the draft actually exists by checking it has an _id
        if (!draft._id) {
          console.log("Draft has no ID, treating as new");
          setCurrentAppraisalId("");
          setRows([]);
          setCards([]);
          return null;
        }
        
        setCurrentAppraisalId(draft._id);
        
        // Ensure we have arrays
        const draftRatings = Array.isArray(draft.ratings) ? draft.ratings : [];
        const draftFeedbackCards = Array.isArray(draft.feedbackCards) ? draft.feedbackCards : [];
        
        // Update state with draft data
        setRows(draftRatings);
        setCards(draftFeedbackCards);
        
        console.log("Loaded draft from backend:", {
          id: draft._id,
          ratingsCount: draftRatings.length,
          feedbackCardsCount: draftFeedbackCards.length
        });
        return draft;
      } else {
        console.log("No draft found for employee:", employeeId);
        setCurrentAppraisalId("");
        setRows([]);
        setCards([]);
        return null;
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      
      // If it's a 404, clear the current ID
      if (error.response?.status === 404) {
        setCurrentAppraisalId("");
      }
      
      setSaveStatus({
        message: "Failed to load draft data",
        type: "error"
      });
      
      setRows([]);
      setCards([]);
      return null;
    }
  };

  // Save draft to backend - FIXED VERSION
  const saveDraftToBackend = async (action = "auto-save") => {
    if (!employee || !employeeId) {
      console.log("Cannot save: No employee selected");
      return false;
    }

    setIsSaving(true);
    setSaveStatus({ message: "Saving...", type: "info" });

    try {
      console.log(`Saving draft (${action}) for employee:`, employeeId);
      console.log("Current appraisal ID:", currentAppraisalId);
      console.log("Current rows:", rows);
      console.log("Current cards:", cards);

      // Validate and format data
      const formattedRatings = rows.map((row, index) => ({
        criteria: String(row.criteria || "").trim(),
        weightage: parseFloat(row.weightage) || 0,
        rating: parseFloat(row.rating) || 0
      }));

      const formattedFeedbackCards = cards.map(card => ({
        feedback: String(card.feedback || "").trim(),
        development: String(card.development || "").trim(),
        strengths: String(card.strengths || "").trim(),
        rating: parseInt(card.rating) || 0
      }));

      // Prepare complete data
      const appraisalData = {
        userId: employeeId,
        userName: employee,
        employeeId: employeeId,
        appraisalPeriod: getCurrentAppraisalPeriod(),
        ratings: formattedRatings,
        feedbackCards: formattedFeedbackCards,
        status: "draft"
      };

      console.log("Sending to backend:", appraisalData);

      let response;
      let success = false;
      
      // FIRST, check if the ID actually exists by trying to fetch it
      let shouldCreateNew = true;
      
      if (currentAppraisalId) {
        try {
          // Try to fetch the existing appraisal to see if it exists
          const checkResponse = await axios.get(`${API_BASE}/${currentAppraisalId}`);
          if (checkResponse.data.success) {
            shouldCreateNew = false; // ID exists, we can update
          }
        } catch (checkError) {
          // If we get 404 or any error, the ID doesn't exist
          console.log("ID doesn't exist or error checking:", checkError);
          setCurrentAppraisalId(""); // Clear the invalid ID
        }
      }
      
      if (shouldCreateNew || !currentAppraisalId) {
        // CREATE new draft
        console.log("Creating NEW draft");
        response = await axios.post(API_BASE, appraisalData);
        success = response.data.success;
        if (success && response.data.data?._id) {
          setCurrentAppraisalId(response.data.data._id);
          console.log("New draft created:", response.data);
        }
      } else {
        // UPDATE existing draft
        console.log("UPDATING existing draft with ID:", currentAppraisalId);
        response = await axios.put(`${API_BASE}/${currentAppraisalId}`, appraisalData);
        success = response.data.success;
        console.log("Draft updated:", response.data);
      }

      if (success) {
        setSaveStatus({
          message: action === "auto-save" ? "Auto-saved successfully" : "Saved successfully",
          type: "success"
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveStatus({ message: "", type: "" });
        }, 3000);
        
        return true;
      } else {
        throw new Error(response.data.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      
      let errorMessage = "Failed to save data";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If it's a 404, clear the ID and try to create new on next save
      if (error.response?.status === 404) {
        setCurrentAppraisalId("");
        errorMessage = "Draft not found. Creating new one...";
      }
      
      setSaveStatus({
        message: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async () => {
      if (rows.length > 0 || cards.length > 0) {
        await saveDraftToBackend("auto-save");
      }
    }, 1000),
    [rows, cards, employee, employeeId, currentAppraisalId]
  );

  // Auto-save when rows or cards change
  useEffect(() => {
    if (employeeId && (rows.length > 0 || cards.length > 0)) {
      debouncedSave();
    }
  }, [rows, cards, employeeId, debouncedSave]);

  // Add row with better validation
  const addRow = async () => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    if (!newRow.criteria || !newRow.weightage || !newRow.rating) {
      alert("Please fill all fields!");
      return;
    }
    
    const weightage = parseFloat(newRow.weightage);
    const ratingValue = parseFloat(newRow.rating);
    
    if (isNaN(weightage) || weightage < 0 || weightage > 100) {
      alert("Weightage must be a number between 0 and 100!");
      return;
    }
    
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      alert("Rating must be a number between 1 and 5!");
      return;
    }
    
    const newRowObj = {
      id: Date.now(),
      criteria: newRow.criteria,
      weightage: weightage,
      rating: ratingValue,
    };

    // Update state immediately
    setRows(prevRows => [...prevRows, newRowObj]);
    setNewRow({ criteria: "", weightage: "", rating: "" });
    
    // Manual save with feedback
    const saved = await saveDraftToBackend("add-row");
    
    if (saved) {
      console.log("Row added and saved successfully");
    } else {
      // Revert if save failed
      setRows(prevRows => prevRows.slice(0, -1));
      alert("Failed to save rating. Please try again.");
    }
  };

  // Delete row
  const deleteRow = async (index) => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
    
    // Save after deletion
    await saveDraftToBackend("delete-row");
  };

  // Delete feedback card
  const deleteFeedbackCard = async (index) => {
    if (!employee || !employeeId) {
      alert("Please select an employee first!");
      return;
    }
    
    const updatedCards = cards.filter((_, i) => i !== index);
    setCards(updatedCards);
    
    // Save after deletion
    await saveDraftToBackend("delete-feedback");
  };

  // Reset and create new draft
  const resetAndCreateNewDraft = async () => {
    if (!employee || !employeeId) return;
    
    const confirmed = window.confirm("Reset draft and create new? This will clear any unsaved changes.");
    if (!confirmed) return;
    
    setCurrentAppraisalId("");
    setRows([]);
    setCards([]);
    
    // Force a fresh save
    await saveDraftToBackend("reset-draft");
  };

  // Download Excel template for Ratings
  const downloadRatingsTemplate = () => {
    const emptyData = [
      {
        "Criteria": "Example: Communication Skills",
        "Weightage": "20",
        "Rating": "4"
      },
      {
        "Criteria": "Example: Teamwork",
        "Weightage": "30",
        "Rating": "5"
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
        "Feedback": "Excellent communication skills",
        "Development": "Could improve presentation skills",
        "Strengths": "Team player, always helpful",
        "Rating": "4"
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!employee || !employeeId) {
      alert("Please select an employee first!");
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
          const hasCriteria = firstRow["Criteria"] !== undefined || firstRow["criteria"] !== undefined;
          const hasFeedback = firstRow["Feedback"] !== undefined || firstRow["feedback"] !== undefined;

          let newItems = [];
          let itemType = "";

          if (hasCriteria) {
            newItems = jsonData.map((row, index) => {
              const criteria = row["Criteria"] || row["criteria"] || "";
              const weightage = parseFloat(row["Weightage"] || row["weightage"] || 0);
              const ratingValue = parseFloat(row["Rating"] || row["rating"] || 0);

              return {
                id: Date.now() + index,
                criteria: criteria.toString(),
                weightage: weightage,
                rating: ratingValue,
              };
            }).filter(row => row.criteria && !isNaN(row.weightage) && !isNaN(row.rating));
            
            itemType = "rating";
            setRows(prev => [...prev, ...newItems]);
          } else if (hasFeedback) {
            newItems = jsonData.map((row, index) => {
              const feedback = row["Feedback"] || row["feedback"] || "";
              const development = row["Development"] || row["development"] || row["Areas of Development"] || "";
              const strengths = row["Strengths"] || row["strengths"] || row["Key Strengths"] || "";
              const ratingValue = parseInt(row["Rating"] || row["rating"] || 0);

              return {
                id: Date.now() + index,
                feedback: feedback.toString(),
                development: development.toString(),
                strengths: strengths.toString(),
                rating: ratingValue,
              };
            }).filter(card => card.feedback && !isNaN(card.rating));
            
            itemType = "feedback";
            setCards(prev => [...prev, ...newItems]);
          } else {
            alert("File format not recognized. Please use the provided templates.");
            return;
          }

          // Save to backend
          const saved = await saveDraftToBackend("upload-file");
          
          if (saved) {
            alert(`${newItems.length} ${itemType} ${newItems.length === 1 ? 'entry' : 'entries'} uploaded successfully!`);
          } else {
            alert("Uploaded but failed to save. Please try again.");
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

    // Update state immediately
    setCards(prev => [...prev, newCard]);
    
    // Save to backend
    const saved = await saveDraftToBackend("add-feedback");
    
    if (saved) {
      // Clear form on success
      setFeedback("");
      setDevelopment("");
      setStrengths("");
      setRating(0);
    } else {
      // Revert if save failed
      setCards(prev => prev.slice(0, -1));
      alert("Failed to save feedback. Please try again.");
    }
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

    if (!window.confirm("Are you sure you want to submit this appraisal? This action cannot be undone.")) {
      return;
    }

    setIsSaving(true);
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
        appraisalPeriod: getCurrentAppraisalPeriod(),
        ratings: formattedRatings,
        feedbackCards: formattedFeedbackCards,
        status: "submitted",
        submittedAt: new Date().toISOString()
      };

      console.log("Submitting final appraisal:", appraisalData);

      let response;
      
      if (currentAppraisalId) {
        // Update existing draft and submit
        response = await axios.put(`${API_BASE}/${currentAppraisalId}`, appraisalData);
        console.log("Update response:", response.data);
        
        if (response.data.success) {
          const submitResponse = await axios.post(`${API_BASE}/${currentAppraisalId}/submit`);
          console.log("Submit response:", submitResponse.data);
          
          if (submitResponse.data.success) {
            // Clear all data
            setRows([]);
            setCards([]);
            setCurrentAppraisalId("");
            setEmployee("");
            setEmployeeId("");
            setSearchTerm("");
            localStorage.removeItem("selectedEmployee");
            localStorage.removeItem("selectedEmployeeId");
            
            alert("Self Appraisal submitted successfully!");
            return;
          }
        }
      } else {
        // Create new and submit
        response = await axios.post(API_BASE, appraisalData);
        console.log("Create response:", response.data);
        
        if (response.data.success && response.data.data?._id) {
          const newAppraisalId = response.data.data._id;
          const submitResponse = await axios.post(`${API_BASE}/${newAppraisalId}/submit`);
          console.log("Submit response:", submitResponse.data);
          
          if (submitResponse.data.success) {
            // Clear all data
            setRows([]);
            setCards([]);
            setCurrentAppraisalId("");
            setEmployee("");
            setEmployeeId("");
            setSearchTerm("");
            localStorage.removeItem("selectedEmployee");
            localStorage.removeItem("selectedEmployeeId");
            
            alert("Self Appraisal submitted successfully!");
            return;
          }
        }
      }
      
      throw new Error("Submission failed");
    } catch (error) {
      console.error("Error submitting appraisal:", error);
      
      let errorMessage = "Submission failed";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalWeightage = () => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.weightage) || 0), 0);
  };

  return (
    <div className="p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <h4 className="fw-bold mb-4">Self Appraisal Form</h4>

      {/* Save Status */}
      {saveStatus.message && (
        <div className={`alert alert-${saveStatus.type === "error" ? "danger" : saveStatus.type === "success" ? "success" : "info"} d-flex align-items-center justify-content-between mb-4`}>
          <div className="d-flex align-items-center">
            {saveStatus.type === "error" && <FaExclamationTriangle className="me-2" />}
            {saveStatus.type === "success" && <FaSave className="me-2" />}
            {saveStatus.type === "info" && <FaSpinner className="fa-spin me-2" />}
            <span>{saveStatus.message}</span>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSaveStatus({ message: "", type: "" })}
          />
        </div>
      )}

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
                    {currentAppraisalId ? (
                      <div>
                        <small className="d-block text-success mt-1">
                          Draft loaded ({rows.length} ratings, {cards.length} feedback)
                          {isSaving && <FaSpinner className="fa-spin ms-2" />}
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning mt-1"
                          onClick={resetAndCreateNewDraft}
                          disabled={isSaving}
                        >
                          <FaRedo className="me-1" />
                          Reset Draft
                        </button>
                      </div>
                    ) : (
                      <small className="d-block text-info mt-1">
                        No draft found. New one will be created on save.
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearEmployeeSelection}
                    disabled={isSaving}
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
          <div>
            <small className="text-muted">
              Total Ratings: {rows.length} | Total Feedback: {cards.length}
            </small>
          </div>
        </div>
      )}

      {/* Ratings Section */}
      <div className="mb-5">
        <h5 className="fw-bold mb-3">Ratings</h5>

       

        {/* Add new row form */}
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
                    disabled={!employee || isSaving}
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
                    disabled={!employee || isSaving}
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
                    disabled={!employee || isSaving}
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
            disabled={!employee || isSaving}
          >
            {isSaving ? <FaSpinner className="fa-spin me-2" /> : null}
            Add Row
          </button>
          
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={downloadRatingsTemplate}
            title="Download Ratings Excel Template"
            disabled={!employee || isSaving}
          >
            <FaFileExcel />
            <span>Download Ratings Template</span>
          </button>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mb-5">
        <h5 className="fw-bold mb-4">Feedback</h5>

       
        {/* Add new feedback form */}
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
                disabled={!employee || isSaving}
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
                disabled={!employee || isSaving}
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
                disabled={!employee || isSaving}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Rating *</label>
              <div className="mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => !employee || isSaving ? null : setRating(star)}
                    style={{
                      fontSize: "28px",
                      cursor: employee && !isSaving ? "pointer" : "not-allowed",
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
                    disabled={!employee || isSaving}
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
                      disabled={!employee || isSaving}
                    />
                    <label
                      htmlFor="fileUpload"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      style={{ 
                        cursor: employee && !isSaving ? "pointer" : "not-allowed",
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
                  disabled={!employee || !feedback || rating === 0 || isSaving}
                >
                  {isSaving ? <FaSpinner className="fa-spin me-2" /> : <FaSave />}
                  <span>Add Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*Submit All Button
      <div className="d-flex justify-content-between align-items-center mt-4 p-3 border rounded bg-light">
        <div>
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => saveDraftToBackend("manual-save")}
            disabled={!employee || isSaving}
          >
            {isSaving ? <FaSpinner className="fa-spin me-2" /> : <FaSave />}
            <span>Save Draft</span>
          </button>
        </div>
        <div>
          <button 
            className="btn btn-success btn-lg px-5 d-flex align-items-center gap-2" 
            onClick={handleSubmitAll}
            disabled={!employee || rows.length === 0 || Math.abs(calculateTotalWeightage() - 100) > 0.01 || isSaving}
          >
            {isSaving ? <FaSpinner className="fa-spin me-2" /> : <FaSave />}
            <span>Submit Appraisal</span>
          </button>
        </div>
      </div>*/}

     
    </div>
  );
}

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}