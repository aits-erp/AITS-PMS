import React, { useState, useEffect, useRef } from "react";
import { FaUserEdit, FaUpload, FaFileExcel, FaUser, FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function UserView() {
  //const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const API_BASE = `${process.env.REACT_APP_API_BASE}`;
 
  const USER_VIEWS_API = `${API_BASE}/api/user-views`;
  const RESIGNATION_API = `${API_BASE}/api/employee-resignation`;
  
  // State for user data
  const [userData, setUserData] = useState({
    userName: "Ethan Hunt",
    employeeId: "",
    role: "Data Analyst",
    department: "Tech",
    performance: "Excellent",
    q2Score: 85,
    q1GoalsMet: 4,
    q2GoalsMet: 3,
    documents: [
      { name: "Download Last Review (PDF)", url: "#" },
      { name: "View PDP (Development Plan)", url: "#" }
    ]
  });

  // Form states
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Employee search states (like in Goals page)
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [backendError, setBackendError] = useState("");
  
  const searchDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
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

  // Fetch employee data from backend (like in Goals page)
  const fetchEmployeeData = async () => {
    setIsLoadingEmployeeData(true);
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
      setIsLoadingEmployeeData(false);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${USER_VIEWS_API}/user/ethan-hunt`);
      
      if (response.data.success) {
        const user = response.data.data;
        setUserData({
          userName: user.userName || "Ethan Hunt",
          employeeId: user.employeeId || "",
          role: user.role || "Data Analyst",
          department: user.department || "Tech",
          performance: user.performance || "Excellent",
          q2Score: user.q2Score || 85,
          q1GoalsMet: user.q1GoalsMet || 4,
          q2GoalsMet: user.q2GoalsMet || 3,
          documents: user.documents || [
            { name: "Download Last Review (PDF)", url: "#" },
            { name: "View PDP (Development Plan)", url: "#" }
          ]
        });
        
        if (user._id) {
          setUserId(user._id);
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search handling functions (like in Goals page)
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setShowSearchDropdown(false);
      setName("");
      setEmployeeId("");
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
    
    setName(selectedName);
    setEmployeeId(selectedId);
    setSearchTerm(selectedId ? `${selectedName} (${selectedId})` : selectedName);
    setShowSearchDropdown(false);
  };

  const clearSearchField = () => {
    setSearchTerm("");
    setName("");
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

  const performanceColor = (performance) => {
    switch(performance) {
      case "Excellent": return "#196600";
      case "Good": return "#0066cc";
      case "Average": return "#cc9900";
      case "Poor": return "#cc0000";
      default: return "#196600";
    }
  };

  const performanceBgColor = (performance) => {
    switch(performance) {
      case "Excellent": return "#eafcce";
      case "Good": return "#e6f2ff";
      case "Average": return "#fff7e6";
      case "Poor": return "#ffe6e6";
      default: return "#eafcce";
    }
  };

  const handleSubmit = async () => {
    // Check all required fields
    if (!name || !employeeId || !phone || !contact || !address) {
      alert("Please fill all fields");
      return;
    }

    try {
      const contactData = { 
        name: name.trim(),
        employeeId: employeeId.trim(),
        phone: phone.trim(),
        contact: contact.trim(),
        address: address.trim()
      };

      if (editIndex !== null) {
        // Update existing contact
        if (userId) {
          const response = await axios.put(`${USER_VIEWS_API}/${userId}/contacts/${editIndex}`, contactData);
          if (response.data.success) {
            setEditIndex(null);
          }
        } else {
          setEditIndex(null);
        }
        alert("Contact updated successfully!");
      } else {
        // Add new contact
        if (userId) {
          const response = await axios.post(`${USER_VIEWS_API}/${userId}/contacts`, contactData);
          if (response.data.success) {
            // Success - do nothing
          }
        } else {
          // Local add if no userId
        }
        alert("Contact added successfully!");
      }

      // Clear form
      setSearchTerm("");
      setName("");
      setEmployeeId("");
      setPhone("");
      setContact("");
      setAddress("");
      
    } catch (err) {
      console.error("Error saving contact:", err);
      alert("Error saving contact: " + (err.response?.data?.error || err.message));
    }
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const emptyData = [
      {
        "Name": "",
        "Employee ID": "",
        "Phone": "",
        "Contact": "",
        "Address": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Template");
    
    const wscols = [
      { wch: 25 }, // Name column width
      { wch: 20 }, // Employee ID column width
      { wch: 20 }, // Phone column width
      { wch: 25 }, // Contact column width
      { wch: 40 }, // Address column width
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Contact_Template.xlsx");
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
          const firstRow = jsonData[0];
          
          // Extract all fields
          const extractedName = firstRow["Name"] || firstRow["name"] || firstRow["NAME"] || 
                               firstRow["Employee Name"] || firstRow["employeeName"] || 
                               firstRow["Full Name"] || firstRow["fullName"] || "";
          
          const extractedEmployeeId = firstRow["Employee ID"] || firstRow["employeeId"] || 
                                     firstRow["EmployeeID"] || firstRow["EMPLOYEE_ID"] || 
                                     firstRow["ID"] || firstRow["id"] || "";
          
          const extractedPhone = firstRow["Phone"] || firstRow["phone"] || firstRow["Phone Number"] || 
                               firstRow["phone_number"] || firstRow["PHONE"] || firstRow["Mobile"] || 
                               firstRow["mobile"] || "";
          
          const extractedContact = firstRow["Contact"] || firstRow["contact"] || firstRow["Emergency Contact"] || 
                                 firstRow["emergency_contact"] || firstRow["CONTACT"] || 
                                 firstRow["Emergency Name"] || firstRow["emergency_name"] || "";
          
          const extractedAddress = firstRow["Address"] || firstRow["address"] || firstRow["Current Address"] || 
                                  firstRow["current_address"] || firstRow["ADDRESS"] || 
                                  firstRow["Location"] || firstRow["location"] || "";

          // Format phone number
          let formattedPhone = extractedPhone.toString();
          if (typeof extractedPhone === 'number') {
            formattedPhone = extractedPhone.toString();
            if (formattedPhone.length === 10) {
              formattedPhone = `${formattedPhone.slice(0, 3)}-${formattedPhone.slice(3, 6)}-${formattedPhone.slice(6)}`;
            }
          }

          // Format contact
          let formattedContact = extractedContact.toString();
          if (formattedContact && !formattedContact.includes('(')) {
            const relationship = firstRow["Relationship"] || firstRow["relationship"] || firstRow["RELATIONSHIP"] || "Contact";
            formattedContact = `${formattedContact} (${relationship})`;
          }

          // Set search term and form fields
          const displaySearch = extractedEmployeeId ? 
            `${extractedName} (${extractedEmployeeId})` : 
            extractedName;
          
          setSearchTerm(displaySearch);
          setName(extractedName.toString());
          setEmployeeId(extractedEmployeeId.toString());
          setPhone(formattedPhone);
          setContact(formattedContact);
          setAddress(extractedAddress.toString());
          
          alert("Contact details loaded from Excel successfully!");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Error reading file. Please make sure it's a valid Excel/CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setSearchTerm("");
    setName("");
    setEmployeeId("");
    setPhone("");
    setContact("");
    setAddress("");
  };

  const inputStyle = {
    background: "#f8f9fa",
    border: "1px solid #dfe1e5",
    borderRadius: "6px",
  };

  return (
    <>
      <div className="container py-4">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading user data...</p>
          </div>
        )}

        {/* TITLE */}
        {/*<h3 className="fw-bold mb-4">
          User View: {userData.userName}'s Profile
        </h3>*/}

        {/* BASIC INFO */}
        {/*<div className="p-4 rounded mb-4"
          style={{ background:"#fff7e6", border:"1px solid #f1dca9" }}>
          
          <h5 className="fw-bold mb-3" style={{ color:"#8b4500" }}>
            Basic Info
          </h5>

          {userData.employeeId && (
            <p className="m-0"><strong>Employee ID:</strong> {userData.employeeId}</p>
          )}
          
          <p className="m-0"><strong>Name:</strong> {userData.userName}</p>
          <p className="m-0"><strong>Role:</strong> {userData.role}</p>
          <p className="m-0"><strong>Department:</strong> {userData.department}</p>

          <p className="m-0">
            <strong>Performance:</strong>
            <span className="px-2 fw-semibold rounded ms-2"
              style={{ 
                background: performanceBgColor(userData.performance),
                color: performanceColor(userData.performance)
              }}>
              {userData.performance}
            </span>
          </p>
        </div>*/}

        {/*GOALS SUMMARY
        <div className="p-4 rounded mb-4"
          style={{ background:"#fff7e6", border:"1px solid #f1dca9" }}>
          
          <h5 className="fw-bold mb-3" style={{ color:"#8b4500" }}>
            Goals Summary
          </h5>

          <p className="m-0"><strong>Q2 Score:</strong> {userData.q2Score}</p>
          <p className="m-0"><strong>Q1 Goals Met:</strong> {userData.q1GoalsMet}</p>
          <p className="m-0"><strong>Q2 Goals Met:</strong> {userData.q2GoalsMet}</p>
        </div>*/}

        {/* DOCUMENTS */}
        {/*<div className="p-4 rounded mb-4"
          style={{ background:"#fff7e6", border:"1px solid #f1dca9" }}>
          
          <h5 className="fw-bold mb-3" style={{ color:"#8b4500" }}>
            Documents
          </h5>

          {userData.documents.map((doc, index) => (
            <p key={index} className="m-0 text-primary" style={{ cursor:"pointer" }}>
              {doc.name}
            </p>
          ))}
        </div>*/}

        {/* CONTACT DETAILS FORM */}
        <div className="p-4 rounded mb-4 bg-white border">
          <h5 className="fw-bold mb-3" style={{ color:"#8b4500" }}>
            Contact Details
          </h5>

          {/* EMPLOYEE SEARCH FIELD (like in Goals page) */}
          <div className="mb-4">
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
                {isLoadingEmployeeData ? (
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
              {isLoadingEmployeeData ? (
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
                    onClick={fetchEmployeeData}
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

            {/* Display selected employee info */}
            {name && (
              <div className="mt-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted d-block mb-1">Selected Employee:</small>
                    <div>
                      <span className="fw-medium">{name}</span>
                      {employeeId && (
                        <small className="text-muted ms-2">({employeeId})</small>
                      )}
                    </div>
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

          <div className="mb-3">
            <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
            <input
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-123-4567"
              required
              style={inputStyle}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Emergency Contact <span className="text-danger">*</span></label>
            <input
              className="form-control"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Jane Hunt (Spouse)"
              required
              style={inputStyle}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Current Address <span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Tech Lane, San Jose, CA"
              required
              style={inputStyle}
            />
          </div>

          {/* UPLOAD SECTION */}
          <div className="mb-4 border rounded p-3 bg-light">
            <h6 className="fw-semibold mb-2">Upload Contact Data</h6>
            <div className="d-flex align-items-center gap-3 mb-3">
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
                />
                <label
                  htmlFor="fileUpload"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  title="Upload Excel/CSV File"
                >
                  <FaUpload />
                  <span>Upload Excel</span>
                </label>
              </div>
            </div>
            
            <small className="text-muted">
              Upload an Excel file with columns: Name, Employee ID, Phone, Contact, Address
            </small>
          </div>

          <div className="d-flex gap-3">
            <button className="btn btn-success fw-semibold px-4 d-flex align-items-center" onClick={handleSubmit}>
              <FaUserEdit className="me-2" />
              {editIndex !== null ? "Update Contact" : "Save Contact Updates"}
            </button>
            
            {editIndex !== null && (
              <button className="btn btn-secondary fw-semibold px-4" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}