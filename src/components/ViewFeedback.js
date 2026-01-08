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
  FaUser,
  FaFileExcel
} from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";

export default function ViewFeedback({ onEditFeedback, refreshTrigger }) {
  const [cards, setCards] = useState([]);
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

  // API base URL
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/feedback`;
  const EMPLOYEE_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
  const [employees, setEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Load feedback from backend
  useEffect(() => {
    loadFeedback();
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
    }
  };

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setCards(res.data.data || res.data);
    } catch (err) {
      console.error("Error loading feedback", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (card) => {
    setEditingId(card._id);
    setEditForm({
      feedback: card.feedback || "",
      development: card.development || "",
      strengths: card.strengths || "",
      rating: card.rating || 0,
      employee: card.employee || "",
      employeeId: card.employeeId || ""
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
      await loadFeedback();
      setEditingId(null);
      setEditForm({
        feedback: "",
        development: "",
        strengths: "",
        rating: 0,
        employee: "",
        employeeId: ""
      });
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
        loadFeedback();
        alert("Feedback deleted successfully!");
      } catch (err) {
        console.log("Error deleting", err);
        alert("Error deleting feedback");
      }
    }
  };

  const shareWhatsApp = (card) => {
    const text = `
📊 Feedback Details:

Employee: ${card.employee || "Not assigned"} ${card.employeeId ? `(${card.employeeId})` : ''}

Feedback:
${card.feedback}

Areas of Development/Next Step:
${card.development || "N/A"}

Key Strengths/Achievements:
${card.strengths || "N/A"}

Rating: ${card.rating} / 5 ⭐
    `;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing on WhatsApp...");
  };

  const shareEmail = (card) => {
    const subject = `Employee Feedback - ${card.employee || "Feedback Report"}`;
    const body = `
Feedback Details:

Employee: ${card.employee || "Not assigned"} ${card.employeeId ? `(${card.employeeId})` : ''}

Feedback:
${card.feedback}

Areas of Development/Next Step:
${card.development || "N/A"}

Key Strengths/Achievements:
${card.strengths || "N/A"}

Rating: ${card.rating} / 5
    `;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    alert("Opening email client...");
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(cards.map((card, i) => ({
        "S.No": i + 1,
        "Employee": card.employee || "Not assigned",
        "Employee ID": card.employeeId || "",
        "Feedback": card.feedback || "",
        "Areas of Development": card.development || "",
        "Key Strengths": card.strengths || "",
        "Rating": card.rating || 0
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
      XLSX.utils.book_append_sheet(wb, ws, "Feedback");
      XLSX.writeFile(wb, "feedback_export.xlsx");
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
        <h5 className="mb-0">Saved Feedback ({cards.length})</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadFeedback}
            title="Refresh"
          >
            Refresh
          </button>
          {cards.length > 0 && (
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
          <p className="mt-2">Loading feedback...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="alert alert-info">
          No feedback saved yet. Add some feedback using the form.
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
              {cards.map((card) => (
                <tr key={card._id}>
                  <td>
                    <div>
                      <div className="fw-medium">{card.employee || "Not assigned"}</div>
                      {card.employeeId && <small className="text-muted">{card.employeeId}</small>}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {card.feedback}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {card.development || "-"}
                    </div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                      {card.strengths || "-"}
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
                              color: card.rating >= i + 1 ? "#FFD700" : "#d1d8dd",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                      <span>({card.rating}/5)</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(card)}
                        title="Edit"
                        disabled={editingId === card._id}
                      >
                        <FaEdit className="me-1" />
                       
                      </button>
                      
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(card._id)}
                        title="Delete"
                        disabled={!!editingId}
                      >
                        <FaTrash className="me-1" />
                       
                      </button>
                      
                      <button
                        onClick={() => shareWhatsApp(card)}
                        className="btn btn-sm btn-success"
                        title="Share on WhatsApp"
                        disabled={!!editingId}
                      >
                        <FaWhatsapp className="me-1" />
                       
                      </button>
                      
                      <button
                        onClick={() => shareEmail(card)}
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
