import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaEye, FaEyeSlash, FaSave, FaTimes, FaPlus, FaMinus, FaStar } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewAnnualReport({ onEditReport, refreshTrigger }) {
//  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/annual-reports";
    const API_BASE = `${process.env.REACT_APP_API_BASE}/api/annual-reports`;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    employeeName: "",
    jobTitle: "",
    department: "",
    reviewPeriod: "",
    managerName: "",
    dateOfReview: "",
    performanceRating: 0,
    achievements: "",
    developmentGoals: "",
    managerComments: "",
    competencies: [{ name: "", rating: 0, comments: "" }]
  });

  // Load data from backend
  useEffect(() => {
    loadReports();
  }, [refreshTrigger]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      
      if (res.data && res.data.success) {
        // Convert rating from text to number if needed
        const formattedReports = (res.data.data || res.data || []).map(report => ({
          ...report,
          performanceRating: convertRatingToNumber(report.performanceRating)
        }));
        setReports(formattedReports);
      } else if (Array.isArray(res.data)) {
        const formattedReports = res.data.map(report => ({
          ...report,
          performanceRating: convertRatingToNumber(report.performanceRating)
        }));
        setReports(formattedReports);
      } else {
        setReports([]);
      }
      setSelectedRows([]);
      setExpandedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading annual reports:", err);
      setReports([]);
      alert("Failed to load annual reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const convertRatingToNumber = (rating) => {
    if (typeof rating === 'number') return rating;
    if (!rating) return 0;
    
    // Convert text rating to number
    const ratingMap = {
      "Outstanding": 5,
      "Exceeds Expectations": 4,
      "Meets Expectations": 3,
      "Below Expectations": 2,
      "Poor": 1
    };
    
    return ratingMap[rating] || 0;
  };

  const convertNumberToText = (rating) => {
    const ratingMap = {
      5: "Outstanding",
      4: "Exceeds Expectations",
      3: "Meets Expectations",
      2: "Below Expectations",
      1: "Poor"
    };
    
    return ratingMap[rating] || "Not Rated";
  };

  const getRatingColor = (rating) => {
    switch(rating) {
      case 5: return "bg-success";
      case 4: return "bg-primary";
      case 3: return "bg-info";
      case 2: return "bg-warning";
      case 1: return "bg-danger";
      default: return "bg-secondary";
    }
  };

  const getRatingText = (rating) => {
    switch(rating) {
      case 5: return "Outstanding";
      case 4: return "Exceeds Expectations";
      case 3: return "Meets Expectations";
      case 2: return "Below Expectations";
      case 1: return "Poor";
      default: return "Not Rated";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this annual report?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/${id}`);
      if (response.data.success) {
        alert("Annual report deleted successfully!");
        loadReports();
      } else {
        alert("Error deleting report: " + response.data.error);
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Error deleting report: " + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one report to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected reports?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} annual report(s) deleted successfully!`);
      loadReports();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some reports could not be deleted");
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === reports.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(reports.map(item => item._id));
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const startInlineEdit = (report) => {
    setEditingRowId(report._id);
    setInlineEditForm({
      employeeName: report.employeeName || "",
      jobTitle: report.jobTitle || "",
      department: report.department || "",
      reviewPeriod: report.reviewPeriod || "",
      managerName: report.managerName || "",
      dateOfReview: report.dateOfReview || "",
      performanceRating: report.performanceRating || 0,
      achievements: report.achievements || "",
      developmentGoals: report.developmentGoals || "",
      managerComments: report.managerComments || "",
      competencies: report.competencies && report.competencies.length > 0 
        ? report.competencies.map(comp => ({
            name: comp.name || "",
            rating: comp.rating || 0,
            comments: comp.comments || ""
          }))
        : [{ name: "", rating: 0, comments: "" }]
    });
  };

  const cancelInlineEdit = () => {
    if (inlineEditForm.employeeName || inlineEditForm.managerName || inlineEditForm.performanceRating) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({
          employeeName: "",
          jobTitle: "",
          department: "",
          reviewPeriod: "",
          managerName: "",
          dateOfReview: "",
          performanceRating: 0,
          achievements: "",
          developmentGoals: "",
          managerComments: "",
          competencies: [{ name: "", rating: 0, comments: "" }]
        });
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({
        employeeName: "",
        jobTitle: "",
        department: "",
        reviewPeriod: "",
        managerName: "",
        dateOfReview: "",
        performanceRating: 0,
        achievements: "",
        developmentGoals: "",
        managerComments: "",
        competencies: [{ name: "", rating: 0, comments: "" }]
      });
    }
  };

  const handleInlineEditChange = (e) => {
    const { name, value } = e.target;
    setInlineEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setInlineEditForm(prev => ({ ...prev, performanceRating: rating }));
  };

  const handleCompetencyChange = (index, field, value) => {
    setInlineEditForm(prev => {
      const updatedCompetencies = [...prev.competencies];
      updatedCompetencies[index] = {
        ...updatedCompetencies[index],
        [field]: field === 'rating' ? parseInt(value) || 0 : value
      };
      return { ...prev, competencies: updatedCompetencies };
    });
  };

  const handleCompetencyRatingChange = (index, rating) => {
    setInlineEditForm(prev => {
      const updatedCompetencies = [...prev.competencies];
      updatedCompetencies[index] = {
        ...updatedCompetencies[index],
        rating: rating
      };
      return { ...prev, competencies: updatedCompetencies };
    });
  };

  const addCompetency = () => {
    setInlineEditForm(prev => ({
      ...prev,
      competencies: [...prev.competencies, { name: "", rating: 0, comments: "" }]
    }));
  };

  const removeCompetency = (index) => {
    if (inlineEditForm.competencies.length > 1) {
      setInlineEditForm(prev => ({
        ...prev,
        competencies: prev.competencies.filter((_, i) => i !== index)
      }));
    }
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.employeeName || !inlineEditForm.managerName || !inlineEditForm.performanceRating) {
      alert("Please fill required fields (Employee Name, Manager Name, and Performance Rating)!");
      return;
    }

    try {
      // Convert numeric rating to text for backend
      const ratingText = getRatingText(inlineEditForm.performanceRating);
      
      // Create update data with all fields
      const updateData = {
        employeeName: inlineEditForm.employeeName,
        jobTitle: inlineEditForm.jobTitle,
        department: inlineEditForm.department,
        reviewPeriod: inlineEditForm.reviewPeriod,
        managerName: inlineEditForm.managerName,
        dateOfReview: inlineEditForm.dateOfReview,
        achievements: inlineEditForm.achievements,
        developmentGoals: inlineEditForm.developmentGoals,
        performanceRating: ratingText,
        managerComments: inlineEditForm.managerComments,
        competencies: inlineEditForm.competencies
          .filter(comp => comp.name.trim() !== "")
          .map(comp => ({
            ...comp,
            rating: comp.rating ? comp.rating.toString() : "0"
          }))
      };

      const response = await axios.put(`${API_BASE}/${editingRowId}`, updateData);
      if (response.data.success) {
        alert("Annual report updated successfully!");
        loadReports();
      } else {
        alert("Error updating report: " + response.data.error);
      }
    } catch (err) {
      console.error("Error updating report:", err);
      alert("Error updating annual report: " + (err.response?.data?.error || err.message));
    }
  };

  const shareWhatsApp = (report) => {
    const ratingText = getRatingText(report.performanceRating);
    const text = `Annual Performance Report\nEmployee: ${report.employeeName}\nJob Title: ${report.jobTitle}\nDepartment: ${report.department}\nReview Period: ${report.reviewPeriod}\nManager: ${report.managerName}\nRating: ${ratingText} (${report.performanceRating}/5)`;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing annual report on WhatsApp...");
  };

  const shareEmail = (report) => {
    const ratingText = getRatingText(report.performanceRating);
    const subject = `Annual Performance Report - ${report.employeeName}`;
    const body = `Annual Performance Report\n\nEmployee: ${report.employeeName}\nJob Title: ${report.jobTitle}\nDepartment: ${report.department}\nReview Period: ${report.reviewPeriod}\nManager: ${report.managerName}\nRating: ${ratingText} (${report.performanceRating}/5)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share annual report...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(reports.map((item, i) => ({
        "S.No": i + 1,
        "Employee Name": item.employeeName || "",
        "Job Title": item.jobTitle || "",
        "Department": item.department || "",
        "Review Period": item.reviewPeriod || "",
        "Manager Name": item.managerName || "",
        "Date of Review": item.dateOfReview || "",
        "Performance Rating": getRatingText(item.performanceRating),
        "Rating Score": item.performanceRating || 0,
        "Achievements": item.achievements || "",
        "Development Goals": item.developmentGoals || "",
        "Manager Comments": item.managerComments || "",
        "Competencies": item.competencies ? item.competencies.map(c => `${c.name}: ${c.rating}`).join(', ') : ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Annual Reports");
      XLSX.writeFile(wb, "annual_reports_export.xlsx");
      alert("All annual reports exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one report to export");
      return;
    }

    try {
      const selectedData = reports.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Employee Name": item.employeeName || "",
        "Job Title": item.jobTitle || "",
        "Department": item.department || "",
        "Review Period": item.reviewPeriod || "",
        "Manager Name": item.managerName || "",
        "Date of Review": item.dateOfReview || "",
        "Performance Rating": getRatingText(item.performanceRating),
        "Rating Score": item.performanceRating || 0,
        "Achievements": item.achievements || "",
        "Development Goals": item.developmentGoals || "",
        "Manager Comments": item.managerComments || "",
        "Competencies": item.competencies ? item.competencies.map(c => `${c.name}: ${c.rating}`).join(', ') : ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Annual Reports");
      XLSX.writeFile(wb, "selected_annual_reports_export.xlsx");
      alert(`${selectedRows.length} annual report(s) exported to Excel successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating, isEditable = false, onChange = null) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={isEditable && onChange ? () => onChange(star) : undefined}
            style={{
              fontSize: "20px",
              cursor: isEditable ? "pointer" : "default",
              color: rating >= star ? "#FFD700" : "#d1d8dd",
              marginRight: 4,
            }}
          >
            ★
          </span>
        ))}
        {isEditable && (
          <span className="ms-2 small">({rating}/5)</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading annual reports...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Annual Performance Reports</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadReports}
            title="Refresh"
          >
            Refresh
          </button>
          {reports.length > 0 && (
            <button
              className="btn btn-sm btn-success"
              onClick={exportToExcel}
              title="Export All to Excel"
            >
              <FaFileExcel className="me-1" />
              Export All
            </button>
          )}
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
          <span>{selectedRows.length} report(s) selected</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-warning"
              onClick={exportSelectedToExcel}
            >
              <FaFileExcel className="me-1" />
              Export Selected
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
            >
              <FaTrash className="me-1" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="alert alert-info">
          No annual reports found. Create your first report using the form above.
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th width="5%">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === reports.length && reports.length > 0}
                      onChange={handleSelectAll}
                      disabled={reports.length === 0}
                    />
                  </th>
                  <th width="5%">#</th>
                  <th>Employee Name</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Review Period</th>
                  <th>Manager</th>
                  <th>Rating</th>
                  <th className="text-center" width="300px">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <React.Fragment key={report._id}>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(report._id)}
                          onChange={() => handleSelectRow(report._id)}
                          disabled={editingRowId === report._id}
                        />
                      </td>
                      <td>{index + 1}</td>
                      
                      {/* Employee Name Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <input
                            type="text"
                            name="employeeName"
                            value={inlineEditForm.employeeName || ""}
                            onChange={handleInlineEditChange}
                            className="form-control form-control-sm"
                            style={{ width: "100%" }}
                          />
                        ) : (
                          <span className="fw-semibold">{report.employeeName}</span>
                        )}
                      </td>
                      
                      {/* Job Title Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <input
                            type="text"
                            name="jobTitle"
                            value={inlineEditForm.jobTitle || ""}
                            onChange={handleInlineEditChange}
                            className="form-control form-control-sm"
                            style={{ width: "100%" }}
                          />
                        ) : (
                          report.jobTitle || "-"
                        )}
                      </td>
                      
                      {/* Department Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <input
                            type="text"
                            name="department"
                            value={inlineEditForm.department || ""}
                            onChange={handleInlineEditChange}
                            className="form-control form-control-sm"
                            style={{ width: "100%" }}
                          />
                        ) : (
                          report.department || "-"
                        )}
                      </td>
                      
                      {/* Review Period Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <input
                            type="text"
                            name="reviewPeriod"
                            value={inlineEditForm.reviewPeriod || ""}
                            onChange={handleInlineEditChange}
                            className="form-control form-control-sm"
                            style={{ width: "100%" }}
                          />
                        ) : (
                          report.reviewPeriod
                        )}
                      </td>
                      
                      {/* Manager Name Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <input
                            type="text"
                            name="managerName"
                            value={inlineEditForm.managerName || ""}
                            onChange={handleInlineEditChange}
                            className="form-control form-control-sm"
                            style={{ width: "100%" }}
                          />
                        ) : (
                          report.managerName
                        )}
                      </td>
                      
                      {/* Rating Column */}
                      <td>
                        {editingRowId === report._id ? (
                          <div>
                            {renderStars(inlineEditForm.performanceRating, true, handleRatingChange)}
                            <small className="text-muted">Click stars to rate</small>
                          </div>
                        ) : (
                          <div>
                            {renderStars(report.performanceRating)}
                            <small className={`badge ${getRatingColor(report.performanceRating)} ms-2`}>
                              {getRatingText(report.performanceRating)}
                            </small>
                          </div>
                        )}
                      </td>
                      
                      <td className="text-center">
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                          {editingRowId === report._id ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={saveInlineEdit}
                                title="Save"
                              >
                                <FaSave className="me-1" />
                                Save
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={cancelInlineEdit}
                                title="Cancel"
                              >
                                <FaTimes className="me-1" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => toggleRowExpansion(report._id)}
                                title={expandedRows.includes(report._id) ? "Hide Details" : "View Details"}
                              >
                                {expandedRows.includes(report._id) ? <FaEyeSlash /> : <FaEye />}
                              </button>
                              
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => startInlineEdit(report)}
                                title="Edit Report"
                              >
                                <FaEdit />
                              </button>
                              
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(report._id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                              
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => shareWhatsApp(report)}
                                title="Share on WhatsApp"
                              >
                                <FaWhatsapp />
                              </button>

                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => shareEmail(report)}
                                title="Share via Email"
                              >
                                <FaEnvelope />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row - READ ONLY or EDIT MODE */}
                    {expandedRows.includes(report._id) && (
                      <tr>
                        <td colSpan="9" className="p-0">
                          <div className="p-3 bg-light">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="fw-bold text-primary mb-3">Complete Report Details</h6>
                                
                                <div className="row">
                                  <div className="col-md-6 mb-2">
                                    <strong>Employee Name:</strong> {report.employeeName}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Job Title:</strong> {report.jobTitle || "-"}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Department:</strong> {report.department || "-"}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Review Period:</strong> {report.reviewPeriod}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Manager Name:</strong> {report.managerName}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Date of Review:</strong> {formatDate(report.dateOfReview)}
                                  </div>
                                  <div className="col-md-6 mb-2">
                                    <strong>Performance Rating:</strong> 
                                    <div className="d-flex align-items-center">
                                      {renderStars(report.performanceRating)}
                                      <span className={`badge ms-2 ${getRatingColor(report.performanceRating)}`}>
                                        {getRatingText(report.performanceRating)} ({report.performanceRating}/5)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Competencies Table - View Mode */}
                              {editingRowId !== report._id && report.competencies && report.competencies.length > 0 && (
                                <div className="col-md-12 mt-3">
                                  <h6 className="fw-bold text-primary">Core Competency Ratings</h6>
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered mt-2">
                                      <thead className="table-light">
                                        <tr>
                                          <th>Competency</th>
                                          <th width="150">Rating</th>
                                          <th>Comments</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.competencies.map((comp, idx) => (
                                          <tr key={idx}>
                                            <td>{comp.name}</td>
                                            <td>
                                              <div className="d-flex align-items-center">
                                                {renderStars(parseInt(comp.rating) || 0)}
                                                <small className="ms-2">({comp.rating}/5)</small>
                                              </div>
                                            </td>
                                            <td>{comp.comments || "-"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              
                              {/* Competencies Table - Edit Mode */}
                              {editingRowId === report._id && (
                                <div className="col-md-12 mt-3">
                                  <h6 className="fw-bold text-primary">Core Competency Ratings</h6>
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered mt-2">
                                      <thead className="table-light">
                                        <tr>
                                          <th>Competency</th>
                                          <th width="150">Rating</th>
                                          <th>Comments</th>
                                          <th width="60">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {inlineEditForm.competencies.map((comp, idx) => (
                                          <tr key={idx}>
                                            <td>
                                              <input
                                                type="text"
                                                value={comp.name || ""}
                                                onChange={(e) => handleCompetencyChange(idx, "name", e.target.value)}
                                                className="form-control form-control-sm"
                                                placeholder="Enter competency name"
                                              />
                                            </td>
                                            <td>
                                              <div>
                                                {renderStars(comp.rating, true, (rating) => handleCompetencyRatingChange(idx, rating))}
                                              </div>
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                value={comp.comments || ""}
                                                onChange={(e) => handleCompetencyChange(idx, "comments", e.target.value)}
                                                className="form-control form-control-sm"
                                                placeholder="Comments"
                                              />
                                            </td>
                                            <td className="text-center">
                                              {inlineEditForm.competencies.length > 1 && (
                                                <button
                                                  className="btn btn-sm btn-danger"
                                                  onClick={() => removeCompetency(idx)}
                                                  title="Remove"
                                                >
                                                  <FaMinus />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    <button
                                      className="btn btn-sm btn-primary mt-2"
                                      onClick={addCompetency}
                                      title="Add Competency"
                                    >
                                      <FaPlus className="me-1" />
                                      Add Competency
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Achievements - Edit Mode */}
                              {editingRowId === report._id ? (
                                <div className="col-md-6 mt-3">
                                  <h6 className="fw-bold text-primary">Key Achievements & Contributions</h6>
                                  <div className="mt-2">
                                    <textarea
                                      name="achievements"
                                      value={inlineEditForm.achievements || ""}
                                      onChange={handleInlineEditChange}
                                      className="form-control"
                                      rows={5}
                                      placeholder="Enter achievements and contributions"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="col-md-6 mt-3">
                                  <h6 className="fw-bold text-primary">Key Achievements & Contributions</h6>
                                  <div className="mt-2 p-3 bg-white border rounded">
                                    {report.achievements ? (
                                      <div style={{ whiteSpace: "pre-line" }}>{report.achievements}</div>
                                    ) : (
                                      <p className="text-muted">No achievements recorded</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Development Goals - Edit Mode */}
                              {editingRowId === report._id ? (
                                <div className="col-md-6 mt-3">
                                  <h6 className="fw-bold text-primary">Areas for Development & Goals</h6>
                                  <div className="mt-2">
                                    <textarea
                                      name="developmentGoals"
                                      value={inlineEditForm.developmentGoals || ""}
                                      onChange={handleInlineEditChange}
                                      className="form-control"
                                      rows={5}
                                      placeholder="Enter development areas and goals"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="col-md-6 mt-3">
                                  <h6 className="fw-bold text-primary">Areas for Development & Goals</h6>
                                  <div className="mt-2 p-3 bg-white border rounded">
                                    {report.developmentGoals ? (
                                      <div style={{ whiteSpace: "pre-line" }}>{report.developmentGoals}</div>
                                    ) : (
                                      <p className="text-muted">No development goals recorded</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Manager Comments - Edit Mode */}
                              {editingRowId === report._id ? (
                                <div className="col-md-12 mt-3">
                                  <h6 className="fw-bold text-primary">Overall Summary and Manager Comments</h6>
                                  <div className="mt-2">
                                    <textarea
                                      name="managerComments"
                                      value={inlineEditForm.managerComments || ""}
                                      onChange={handleInlineEditChange}
                                      className="form-control"
                                      rows={5}
                                      placeholder="Enter manager comments"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="col-md-12 mt-3">
                                  <h6 className="fw-bold text-primary">Overall Summary and Manager Comments</h6>
                                  <div className="mt-2 p-3 bg-white border rounded">
                                    {report.managerComments ? (
                                      <div style={{ whiteSpace: "pre-line" }}>{report.managerComments}</div>
                                    ) : (
                                      <p className="text-muted">No manager comments recorded</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Date of Review - Edit Mode */}
                              {editingRowId === report._id && (
                                <div className="col-md-6 mt-3">
                                  <h6 className="fw-bold text-primary">Date of Review</h6>
                                  <div className="mt-2">
                                    <input
                                      type="date"
                                      name="dateOfReview"
                                      value={inlineEditForm.dateOfReview || ""}
                                      onChange={handleInlineEditChange}
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-muted small">
            <div>Total Reports: {reports.length}</div>
            <div>Selected: {selectedRows.length}</div>
            <div>
              Average Rating: {(reports.reduce((sum, item) => sum + (item.performanceRating || 0), 0) / reports.length || 0).toFixed(1)}/5
            </div>
          </div>
        </>
      )}
    </div>
  );
}