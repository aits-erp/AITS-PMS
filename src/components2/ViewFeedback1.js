import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaStar } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewFeedback1({ onEditFeedback, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/feedback1";
  
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    feedback: "",
    development: "",
    strengths: "",
    rating: 0,
  });

  // Load data from backend
  useEffect(() => {
    loadFeedback();
  }, [refreshTrigger]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setFeedbackData(res.data.data || res.data);
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading feedback", err);
      alert("Failed to load feedback data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback record?")) return;
    
    try {
      await axios.delete(`${API_BASE}/${id}`);
      alert("Feedback record deleted successfully!");
      loadFeedback();
    } catch (err) {
      console.error("Error deleting feedback", err);
      alert("Error deleting feedback record");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one feedback record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected feedback records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} feedback record(s) deleted successfully!`);
      loadFeedback();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some feedback records could not be deleted");
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
    if (selectedRows.length === feedbackData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(feedbackData.map(item => item._id));
    }
  };

  const startInlineEdit = (feedback) => {
    setEditingRowId(feedback._id);
    setInlineEditForm({
      feedback: feedback.feedback || "",
      development: feedback.development || "",
      strengths: feedback.strengths || "",
      rating: feedback.rating || 0,
    });
  };

  const cancelInlineEdit = () => {
    if (inlineEditForm.feedback || inlineEditForm.development || inlineEditForm.strengths || inlineEditForm.rating > 0) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({
          feedback: "",
          development: "",
          strengths: "",
          rating: 0,
        });
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({
        feedback: "",
        development: "",
        strengths: "",
        rating: 0,
      });
    }
  };

  const handleInlineEditChange = (field, value) => {
    setInlineEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineRatingChange = (star) => {
    setInlineEditForm(prev => ({ ...prev, rating: star }));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.feedback || inlineEditForm.rating === 0) {
      alert("Please fill feedback and select rating!");
      return;
    }

    try {
      await axios.put(`${API_BASE}/${editingRowId}`, inlineEditForm);
      alert("Feedback updated successfully!");
      loadFeedback();
    } catch (err) {
      console.error("Error updating feedback", err);
      alert("Error updating feedback record");
    }
  };

  const shareWhatsApp = (feedback) => {
    const text = `Feedback:\n${feedback.feedback}\n\nAreas of Development:\n${feedback.development}\n\nKey Strengths:\n${feedback.strengths}\n\nRating: ${feedback.rating} / 5`;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing on WhatsApp...");
  };

  const shareEmail = (feedback) => {
    const subject = "Employee Feedback";
    const body = `Feedback:\n${feedback.feedback}\n\nAreas of Development:\n${feedback.development}\n\nKey Strengths:\n${feedback.strengths}\n\nRating: ${feedback.rating} / 5`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(feedbackData.map((item, i) => ({
        "S.No": i + 1,
        "Feedback": item.feedback || "",
        "Areas of Development": item.development || "",
        "Key Strengths": item.strengths || "",
        "Rating": item.rating || 0,
        "Rating (Stars)": "★".repeat(item.rating) + "☆".repeat(5 - item.rating)
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Feedback");
      XLSX.writeFile(wb, "feedback_export.xlsx");
      alert("All feedback data exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one feedback record to export");
      return;
    }

    try {
      const selectedData = feedbackData.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Feedback": item.feedback || "",
        "Areas of Development": item.development || "",
        "Key Strengths": item.strengths || "",
        "Rating": item.rating || 0,
        "Rating (Stars)": "★".repeat(item.rating) + "☆".repeat(5 - item.rating)
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Feedback");
      XLSX.writeFile(wb, "selected_feedback_export.xlsx");
      alert(`${selectedRows.length} feedback record(s) exported to Excel successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading feedback data...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Saved Feedback</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadFeedback}
            title="Refresh"
          >
            Refresh
          </button>
          {feedbackData.length > 0 && (
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
          <span>{selectedRows.length} feedback record(s) selected</span>
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

      {feedbackData.length === 0 ? (
        <div className="alert alert-info">
          No feedback saved yet. Add some feedback using the form above.
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
                      checked={selectedRows.length === feedbackData.length && feedbackData.length > 0}
                      onChange={handleSelectAll}
                      disabled={feedbackData.length === 0}
                    />
                  </th>
                  <th width="25%">Feedback</th>
                  <th width="20%">Areas of Development</th>
                  <th width="20%">Key Strengths</th>
                  <th width="10%">Rating</th>
                  <th width="20%">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackData.map((feedback) => (
                  <tr key={feedback._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(feedback._id)}
                        onChange={() => handleSelectRow(feedback._id)}
                      />
                    </td>
                    <td>
                      {editingRowId === feedback._id ? (
                        <textarea
                          value={inlineEditForm.feedback || ""}
                          onChange={(e) => handleInlineEditChange("feedback", e.target.value)}
                          className="form-control form-control-sm"
                          rows={3}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {feedback.feedback}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingRowId === feedback._id ? (
                        <textarea
                          value={inlineEditForm.development || ""}
                          onChange={(e) => handleInlineEditChange("development", e.target.value)}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {feedback.development || "-"}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingRowId === feedback._id ? (
                        <textarea
                          value={inlineEditForm.strengths || ""}
                          onChange={(e) => handleInlineEditChange("strengths", e.target.value)}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {feedback.strengths || "-"}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingRowId === feedback._id ? (
                        <div>
                          <div className="mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                onClick={() => handleInlineRatingChange(star)}
                                style={{
                                  fontSize: "20px",
                                  cursor: "pointer",
                                  color: inlineEditForm.rating >= star ? "#FFD700" : "#d1d8dd",
                                  marginRight: 4,
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <small>({inlineEditForm.rating}/5)</small>
                        </div>
                      ) : (
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
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {editingRowId === feedback._id ? (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={saveInlineEdit}
                              title="Save"
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={cancelInlineEdit}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => startInlineEdit(feedback)}
                              title="Quick Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(feedback._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => shareWhatsApp(feedback)}
                          className="btn btn-sm btn-success"
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>
                        
                        <button
                          onClick={() => shareEmail(feedback)}
                          className="btn btn-sm btn-info"
                          title="Share via Email"
                        >
                          <FaEnvelope />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-muted small">
            <div>Total Feedback Records: {feedbackData.length}</div>
            <div>Selected: {selectedRows.length}</div>
            <div>Average Rating: {(feedbackData.reduce((sum, item) => sum + (item.rating || 0), 0) / feedbackData.length || 0).toFixed(1)}/5</div>
          </div>
        </>
      )}
    </div>
  );
}