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
} from "react-icons/fa";
import axios from "axios";

export default function ViewFeedback({ onEditFeedback, refreshTrigger }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    feedback: "",
    development: "",
    strengths: "",
    rating: 0,
  });

  // API base URL
 // const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/feedback";
    const API_BASE = `${process.env.REACT_APP_API_BASE}/api/feedback`;

  // Load feedback from backend
  useEffect(() => {
    loadFeedback();
  }, [refreshTrigger]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setCards(res.data);
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

    try {
      await axios.put(`${API_BASE}/${editingId}`, editForm);
      await loadFeedback();
      setEditingId(null);
      setEditForm({
        feedback: "",
        development: "",
        strengths: "",
        rating: 0,
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
    });
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
    const text = `Feedback:\n${card.feedback}\n\nAreas of Development:\n${card.development}\n\nKey Strengths:\n${card.strengths}\n\nRating: ${card.rating} / 5`;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing on WhatsApp...");
  };

  const shareEmail = (card) => {
    const subject = "Employee Feedback";
    const body = `Feedback:\n${card.feedback}\n\nAreas of Development:\n${card.development}\n\nKey Strengths:\n${card.strengths}\n\nRating: ${card.rating} / 5`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    alert("Opening email client...");
  };

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
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={loadFeedback}
          title="Refresh"
        >
          Refresh
        </button>
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
                <th width="25%">Feedback</th>
                <th width="20%">Areas of Development</th>
                <th width="20%">Key Strengths</th>
                <th width="10%">Rating</th>
                <th width="25%">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card._id}>
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