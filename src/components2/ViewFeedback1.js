import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaWhatsapp,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaStar,
  FaSave,
  FaTimes,
  FaFileExcel,
  FaUser
} from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";

export default function ViewFeedback1({ onEditFeedback1, refreshTrigger }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    feedback: "",
    development: "",
    strengths: "",
    rating: 0,
    employee: "",
    employeeId: ""
  });
  const [employees, setEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // API base URL
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/feedback1`;
  const EMPLOYEE_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;

  // Load feedback from backend
  useEffect(() => {
    loadFeedbacks();
    fetchEmployees();
  }, [refreshTrigger]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${EMPLOYEE_API}/all-ids`);
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback: try to get employee names
      try {
        const response = await axios.get(`${EMPLOYEE_API}/names`);
        if (response.data.success) {
          const namesData = response.data.data || [];
          const formattedEmployees = namesData.map((name, index) => ({
            employeeId: `EMP-${index + 1000}`,
            employeeName: name,
            fullName: name,
            email: "",
            status: "Active"
          }));
          setEmployees(formattedEmployees);
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setFeedbacks(res.data.data || res.data);
    } catch (err) {
      console.error("Error loading feedbacks", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (feedback) => {
    setEditingId(feedback._id);
    setEditForm({
      feedback: feedback.feedback || "",
      development: feedback.development || "",
      strengths: feedback.strengths || "",
      rating: feedback.rating || 0,
      employee: feedback.employee || "",
      employeeId: feedback.employeeId || ""
    });
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("Editing mode activated. Update the values and click Save.");
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle employee search
  const handleEmployeeSearch = (value) => {
    setEditForm({
      ...editForm,
      employee: value
    });
    setShowEmployeeDropdown(true);
  };

  const handleEmployeeSelect = (emp) => {
    const name = emp.employeeName || emp.fullName || emp.name || "";
    const id = emp.employeeId || "";
    setEditForm({
      ...editForm,
      employee: name,
      employeeId: id
    });
    setShowEmployeeDropdown(false);
  };

  // Handle rating change
  const handleRatingChange = (star) => {
    setEditForm({
      ...editForm,
      rating: star,
    });
  };

  // Save edited feedback
  const handleSaveEdit = async () => {
    if (!editForm.feedback.trim() || editForm.rating === 0) {
      alert("Please fill feedback and select rating!");
      return;
    }

    if (!editForm.employee.trim() || !editForm.employeeId.trim()) {
      alert("Please select an employee!");
      return;
    }

    try {
      await axios.put(`${API_BASE}/${editingId}`, editForm);
      await loadFeedbacks();
      setEditingId(null);
      setEditForm({
        feedback: "",
        development: "",
        strengths: "",
        rating: 0,
        employee: "",
        employeeId: ""
      });
      setShowEmployeeDropdown(false);
      alert("Feedback updated successfully!");
    } catch (err) {
      console.log("Error updating feedback", err);
      alert("Error updating feedback");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      feedback: "",
      development: "",
      strengths: "",
      rating: 0,
      employee: "",
      employeeId: ""
    });
    setShowEmployeeDropdown(false);
    alert("Edit cancelled.");
  };

  // Delete from backend
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await axios.delete(`${API_BASE}/${id}`);
        loadFeedbacks();
        alert("Feedback deleted successfully!");
      } catch (err) {
        console.log("Error deleting", err);
        alert("Error deleting feedback");
      }
    }
  };

  const shareWhatsApp = (feedback) => {
    const text = `
📊 Feedback1 Details:

Employee: ${feedback.employee || "Not assigned"} ${feedback.employeeId ? `(${feedback.employeeId})` : ''}

Feedback:
${feedback.feedback}

Areas of Development/Next Step:
${feedback.development || "N/A"}

Key Strengths/Achievements:
${feedback.strengths || "N/A"}

Rating: ${feedback.rating} / 5 ⭐
    `;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing on WhatsApp...");
  };

  const shareEmail = (feedback) => {
    const subject = `Employee Feedback - ${feedback.employee || "Feedback Report"}`;
    const body = `
Feedback1 Details:

Employee: ${feedback.employee || "Not assigned"} ${feedback.employeeId ? `(${feedback.employeeId})` : ''}

Feedback:
${feedback.feedback}

Areas of Development/Next Step:
${feedback.development || "N/A"}

Key Strengths/Achievements:
${feedback.strengths || "N/A"}

Rating: ${feedback.rating} / 5
    `;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    alert("Opening email client...");
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(feedbacks.map((feedback, i) => ({
        "S.No": i + 1,
        "Employee": feedback.employee || "Not assigned",
        "Employee ID": feedback.employeeId || "",
        "Feedback": feedback.feedback || "",
        "Areas of Development": feedback.development || "",
        "Key Strengths": feedback.strengths || "",
        "Rating": feedback.rating || 0
      })));
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Employee
        { wch: 20 },  // Employee ID
        { wch: 50 },  // Feedback
        { wch: 40 },  // Areas of Development
        { wch: 40 },  // Key Strengths
        { wch: 10 },  // Rating
      ];
      ws['!cols'] = wscols;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Feedback1");
      XLSX.writeFile(wb, "feedback1_export.xlsx");
      alert("Data exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = editForm.employee.toLowerCase();
    const name = emp.employeeName || emp.fullName || emp.name || "";
    const id = emp.employeeId || "";
    return name.toLowerCase().includes(searchLower) || id.toLowerCase().includes(searchLower);
  });

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Edit Form - Only shows when editing */}
      {editingId && (
        <div className="border rounded p-4 bg-light mb-4">
          <h5 className="fw-bold mb-3 text-warning">
            <FaEdit className="me-2" />
            Edit Feedback
          </h5>
          
          <div className="row g-3">
            {/* Employee Selection */}
            <div className="col-md-12">
              <label className="form-label fw-semibold">Employee *</label>
              <div className="position-relative">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    name="employee"
                    value={editForm.employee}
                    onChange={(e) => handleEmployeeSearch(e.target.value)}
                    className="form-control"
                    placeholder="Search employee by name or ID..."
                    required
                  />
                </div>
                
                {showEmployeeDropdown && (
                  <div className="position-absolute bg-white border rounded mt-1 shadow-lg"
                       style={{ zIndex: 1000, width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredEmployees.map((emp, idx) => (
                      <div
                        key={idx}
                        className="dropdown-item py-2 px-3"
                        onClick={() => handleEmployeeSelect(emp)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center">
                          <FaUser className="me-2 text-primary" size={14} />
                          <div>
                            <div className="fw-medium">{emp.employeeName || emp.fullName || emp.name}</div>
                            {emp.employeeId && <small className="text-muted">{emp.employeeId}</small>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div className="p-2 text-muted text-center">No employees found</div>
                    )}
                  </div>
                )}
              </div>
              <small className="text-muted">Selected Employee ID: {editForm.employeeId || "Not selected"}</small>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Feedback *</label>
              <textarea
                name="feedback"
                value={editForm.feedback}
                onChange={handleEditChange}
                className="form-control"
                rows={3}
                placeholder="Enter feedback..."
                required
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">
                Areas of Development/Next Step
              </label>
              <textarea
                name="development"
                value={editForm.development}
                onChange={handleEditChange}
                className="form-control"
                rows={2}
                placeholder="Enter areas for development or next steps..."
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">
                Key Strengths/Achievements
              </label>
              <textarea
                name="strengths"
                value={editForm.strengths}
                onChange={handleEditChange}
                className="form-control"
                rows={2}
                placeholder="Enter key strengths or achievements..."
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Rating *</label>
              <div className="mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    style={{
                      fontSize: "28px",
                      cursor: "pointer",
                      color: editForm.rating >= star ? "#FFD700" : "#d1d8dd",
                      marginRight: 6,
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <small className="text-muted d-block mt-1">Selected: {editForm.rating}/5</small>
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  <FaTimes className="me-1" />
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleSaveEdit}
                >
                  <FaSave className="me-1" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Saved Feedback1 ({feedbacks.length})</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadFeedbacks}
            title="Refresh"
          >
            Refresh
          </button>
          {feedbacks.length > 0 && (
            <button
              className="btn btn-sm btn-success"
              onClick={exportToExcel}
              title="Export to Excel"
            >
              <FaFileExcel className="me-1" />
              Export Excel
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="alert alert-info">
          No feedbacks saved yet. Add some feedback using the form.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-light">
              <tr>
                <th width="15%">Employee</th>
                <th width="20%">Feedback</th>
                <th width="15%">Areas of Development</th>
                <th width="15%">Key Strengths</th>
                <th width="10%">Rating</th>
                <th width="25%">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((feedback) => (
                <tr key={feedback._id}>
                  <td>
                    <div>
                      <div className="fw-medium">{feedback.employee || "Not assigned"}</div>
                      {feedback.employeeId && <small className="text-muted">{feedback.employeeId}</small>}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {feedback.feedback}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {feedback.development || "-"}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {feedback.strengths || "-"}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ color: "#FFD700" }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "16px",
                              color: feedback.rating >= i + 1 ? "#FFD700" : "#d1d8dd",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                      <span>({feedback.rating}/5)</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(feedback)}
                        title="Edit"
                        disabled={editingId === feedback._id}
                      >
                        <FaEdit className="me-1" />
                      </button>
                      
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(feedback._id)}
                        title="Delete"
                        disabled={!!editingId}
                      >
                        <FaTrash className="me-1" />
                      </button>
                      
                      <button
                        onClick={() => shareWhatsApp(feedback)}
                        className="btn btn-sm btn-success"
                        title="Share on WhatsApp"
                        disabled={!!editingId}
                      >
                        <FaWhatsapp className="me-1" />
                      </button>
                      
                      <button
                        onClick={() => shareEmail(feedback)}
                        className="btn btn-sm btn-info"
                        title="Share via Email"
                        disabled={!!editingId}
                      >
                        <FaEnvelope className="me-1" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
