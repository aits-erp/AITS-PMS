import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaSave, FaStar, FaFileExcel, FaFilePdf } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewSelfAppraisal() {
 //const API_BASE = `${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/self-appraisals`;
  //const API_BASE = `${process.env.REACT_APP_API_BASE}/api/self-appraisals`;
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/self-appraisals`;
  const [appraisalData, setAppraisalData] = useState({
    ratings: [],
    feedbackCards: []
  });
  const [loading, setLoading] = useState(true);
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editCardForm, setEditCardForm] = useState({});

  // Load data from backend
  useEffect(() => {
    loadAppraisalData();
  }, []);

  const loadAppraisalData = async () => {
    try {
      setLoading(true);
      
      // First try to get from localStorage (for backward compatibility)
      const localStorageData = localStorage.getItem("selfAppraisalData");
      
      // Then try backend
      let backendData = { ratings: [], feedbackCards: [] };
      try {
        const employeeId = localStorage.getItem("employeeId") || "EMP001";
        const response = await axios.get(`${API_BASE}?employeeId=${employeeId}`);
        if (response.data.success && response.data.data.length > 0) {
          // Get the latest appraisal
          const latestAppraisal = response.data.data[0];
          backendData = {
            ratings: latestAppraisal.ratings || [],
            feedbackCards: latestAppraisal.feedbackCards || []
          };
        }
      } catch (err) {
        console.log("No data from backend, using localStorage");
      }
      
      // Use backend data if available, otherwise localStorage
      if (backendData.ratings.length > 0 || backendData.feedbackCards.length > 0) {
        setAppraisalData(backendData);
      } else if (localStorageData) {
        setAppraisalData(JSON.parse(localStorageData));
      } else {
        setAppraisalData({ ratings: [], feedbackCards: [] });
      }
    } catch (err) {
      console.error("Error loading appraisal data:", err);
      alert("Error loading data from server");
      setAppraisalData({ ratings: [], feedbackCards: [] });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get item ID safely
  const getItemId = (item) => {
    if (!item) return '';
    // Try MongoDB _id first
    if (item._id && typeof item._id === 'string') return item._id;
    // Try id field
    if (item.id) return String(item.id);
    // Try to create a unique string from content
    if (item.criteria) return `criteria-${item.criteria}`;
    if (item.feedback) return `feedback-${item.feedback.substring(0, 20)}`;
    // Fallback to index or random
    return `item-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper function to check if ID is MongoDB ID
  const isMongoId = (id) => {
    return id && typeof id === 'string' && id.length === 24 && /^[a-f0-9]{24}$/.test(id);
  };

  // Ratings Functions
  const startEditRating = (rating) => {
    const ratingId = getItemId(rating);
    setEditingRatingId(ratingId);
    setEditForm({ 
      criteria: rating.criteria || "", 
      weightage: rating.weightage || "", 
      rating: rating.rating || "" 
    });
    alert("Edit mode activated for rating. Update the values and click Save.");
  };

  const saveRating = async (id) => {
    if (!editForm.criteria || !editForm.weightage || !editForm.rating) {
      alert("Please fill all fields before saving!");
      return;
    }
    
    try {
      // Update in local state first
      const updatedRatings = appraisalData.ratings.map(rating => {
        const ratingId = getItemId(rating);
        if (ratingId === id) {
          return {
            ...rating,
            criteria: editForm.criteria,
            weightage: editForm.weightage,
            rating: editForm.rating
          };
        }
        return rating;
      });
      
      setAppraisalData(prev => ({
        ...prev,
        ratings: updatedRatings
      }));
      
      // Try to save to backend if it's a MongoDB _id
      if (isMongoId(id)) {
        try {
          const employeeId = localStorage.getItem("employeeId") || "EMP001";
          const response = await axios.get(`${API_BASE}?employeeId=${employeeId}`);
          if (response.data.success && response.data.data.length > 0) {
            const appraisalId = response.data.data[0]._id;
            await axios.put(`${API_BASE}/${appraisalId}/ratings/${id}`, editForm);
          }
        } catch (err) {
          console.log("Couldn't update in backend, saving to localStorage only");
        }
      }
      
      // Save to localStorage
      localStorage.setItem("selfAppraisalData", JSON.stringify({
        ...appraisalData,
        ratings: updatedRatings
      }));
      
      setEditingRatingId(null);
      alert("Rating updated successfully!");
    } catch (err) {
      console.error("Error updating rating:", err);
      alert("Error updating rating");
    }
  };

  const cancelRatingEdit = () => {
    setEditingRatingId(null);
    alert("Rating edit cancelled.");
  };

  const deleteRating = async (id) => {
    if (window.confirm("Are you sure you want to delete this rating?")) {
      try {
        // Remove from local state
        const updatedRatings = appraisalData.ratings.filter(rating => {
          const ratingId = getItemId(rating);
          return ratingId !== id;
        });
        
        setAppraisalData(prev => ({
          ...prev,
          ratings: updatedRatings
        }));
        
        // Try to delete from backend if it's a MongoDB _id
        if (isMongoId(id)) {
          try {
            const employeeId = localStorage.getItem("employeeId") || "EMP001";
            const response = await axios.get(`${API_BASE}?employeeId=${employeeId}`);
            if (response.data.success && response.data.data.length > 0) {
              const appraisalId = response.data.data[0]._id;
              await axios.delete(`${API_BASE}/${appraisalId}/ratings/${id}`);
            }
          } catch (err) {
            console.log("Couldn't delete from backend, removing from localStorage only");
          }
        }
        
        // Update localStorage
        localStorage.setItem("selfAppraisalData", JSON.stringify({
          ...appraisalData,
          ratings: updatedRatings
        }));
        
        alert("Rating deleted successfully!");
      } catch (err) {
        console.error("Error deleting rating:", err);
        alert("Error deleting rating");
      }
    }
  };

  const whatsappShareRating = (rating) => {
    const text = `Appraisal Rating:\nCriteria: ${rating.criteria}\nWeightage: ${rating.weightage}%\nRating: ${rating.rating}/5`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    alert("Sharing rating on WhatsApp...");
  };

  const emailShareRating = (rating) => {
    const subject = `Appraisal Rating - ${rating.criteria}`;
    const body = `Criteria: ${rating.criteria}\nWeightage: ${rating.weightage}%\nRating: ${rating.rating}/5`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share rating...");
  };

  // Feedback Cards Functions
  const startEditCard = (card) => {
    const cardId = getItemId(card);
    setEditingCardId(cardId);
    setEditCardForm({ 
      feedback: card.feedback || "", 
      development: card.development || "", 
      strengths: card.strengths || "", 
      rating: card.rating || 0 
    });
    alert("Edit mode activated for feedback. Update the values and click Save.");
  };

  const saveCard = async (id) => {
    if (!editCardForm.feedback || editCardForm.rating === 0) {
      alert("Please fill feedback and select rating!");
      return;
    }
    
    try {
      // Update in local state
      const updatedCards = appraisalData.feedbackCards.map(card => {
        const cardId = getItemId(card);
        if (cardId === id) {
          return {
            ...card,
            feedback: editCardForm.feedback,
            development: editCardForm.development,
            strengths: editCardForm.strengths,
            rating: editCardForm.rating
          };
        }
        return card;
      });
      
      setAppraisalData(prev => ({
        ...prev,
        feedbackCards: updatedCards
      }));
      
      // Try to save to backend if it's a MongoDB _id
      if (isMongoId(id)) {
        try {
          const employeeId = localStorage.getItem("employeeId") || "EMP001";
          const response = await axios.get(`${API_BASE}?employeeId=${employeeId}`);
          if (response.data.success && response.data.data.length > 0) {
            const appraisalId = response.data.data[0]._id;
            await axios.put(`${API_BASE}/${appraisalId}/feedback/${id}`, editCardForm);
          }
        } catch (err) {
          console.log("Couldn't update in backend, saving to localStorage only");
        }
      }
      
      // Save to localStorage
      localStorage.setItem("selfAppraisalData", JSON.stringify({
        ...appraisalData,
        feedbackCards: updatedCards
      }));
      
      setEditingCardId(null);
      alert("Feedback updated successfully!");
    } catch (err) {
      console.error("Error updating feedback:", err);
      alert("Error updating feedback");
    }
  };

  const cancelCardEdit = () => {
    setEditingCardId(null);
    alert("Feedback edit cancelled.");
  };

  const deleteCard = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        // Remove from local state
        const updatedCards = appraisalData.feedbackCards.filter(card => {
          const cardId = getItemId(card);
          return cardId !== id;
        });
        
        setAppraisalData(prev => ({
          ...prev,
          feedbackCards: updatedCards
        }));
        
        // Try to delete from backend if it's a MongoDB _id
        if (isMongoId(id)) {
          try {
            const employeeId = localStorage.getItem("employeeId") || "EMP001";
            const response = await axios.get(`${API_BASE}?employeeId=${employeeId}`);
            if (response.data.success && response.data.data.length > 0) {
              const appraisalId = response.data.data[0]._id;
              await axios.delete(`${API_BASE}/${appraisalId}/feedback/${id}`);
            }
          } catch (err) {
            console.log("Couldn't delete from backend, removing from localStorage only");
          }
        }
        
        // Update localStorage
        localStorage.setItem("selfAppraisalData", JSON.stringify({
          ...appraisalData,
          feedbackCards: updatedCards
        }));
        
        alert("Feedback deleted successfully!");
      } catch (err) {
        console.error("Error deleting feedback:", err);
        alert("Error deleting feedback");
      }
    }
  };

  const whatsappShareCard = (card) => {
    const text = `Feedback Details:\n\nFeedback: ${card.feedback}\n\nAreas of Development: ${card.development}\n\nKey Strengths: ${card.strengths}\n\nRating: ${card.rating}/5`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    alert("Sharing feedback on WhatsApp...");
  };

  const emailShareCard = (card) => {
    const subject = "Employee Feedback Details";
    const body = `Feedback: ${card.feedback}\n\nAreas of Development: ${card.development}\n\nKey Strengths: ${card.strengths}\n\nRating: ${card.rating}/5`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share feedback...");
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("selfAppraisalData", JSON.stringify(appraisalData));
    alert("Data saved to local storage!");
  };

  const calculateTotalWeightage = () => {
    return appraisalData.ratings.reduce((sum, r) => sum + parseInt(r.weightage || 0), 0);
  };

  const calculateAverageRating = () => {
    if (appraisalData.feedbackCards.length === 0) return 0;
    const sum = appraisalData.feedbackCards.reduce((sum, c) => sum + (c.rating || 0), 0);
    return (sum / appraisalData.feedbackCards.length).toFixed(1);
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Create ratings worksheet
      const ratingsWs = XLSX.utils.json_to_sheet(
        appraisalData.ratings.map((rating, i) => ({
          "S.No": i + 1,
          "Criteria": rating.criteria || "",
          "Weightage (%)": rating.weightage || "",
          "Rating": rating.rating || ""
        }))
      );

      // Create feedback worksheet
      const feedbackWs = XLSX.utils.json_to_sheet(
        appraisalData.feedbackCards.map((card, i) => ({
          "S.No": i + 1,
          "Feedback": card.feedback || "",
          "Areas of Development": card.development || "",
          "Key Strengths": card.strengths || "",
          "Rating": card.rating || ""
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ratingsWs, "Ratings");
      XLSX.utils.book_append_sheet(wb, feedbackWs, "Feedback");
      
      XLSX.writeFile(wb, "self_appraisal_export.xlsx");
      alert("Data exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    try {
      const dataStr = JSON.stringify(appraisalData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'self-appraisal-data.json');
      linkElement.click();
      alert("Data exported as JSON successfully!");
    } catch (error) {
      console.error("Error exporting to JSON:", error);
      alert("Error exporting data to JSON");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading appraisal data...</p>
      </div>
    );
  }

  return (
    <div className="p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0">Appraisal Review</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadAppraisalData}>
            Refresh
          </button>
          {(appraisalData.ratings.length > 0 || appraisalData.feedbackCards.length > 0) && (
            <button className="btn btn-outline-success btn-sm" onClick={exportToExcel}>
              <FaFileExcel className="me-1" /> Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Ratings Section */}
      <div className="mb-5">
        <h5 className="fw-bold mb-3">Ratings ({appraisalData.ratings.length})</h5>
        {appraisalData.ratings.length === 0 ? (
          <div className="alert alert-info">
            No ratings found. Add ratings using the form.
          </div>
        ) : (
          <div className="border rounded bg-white">
            <table className="table mb-0" style={{ fontSize: "14px" }}>
              <thead style={{ background: "#f7f7f7" }}>
                <tr>
                  <th>No.</th>
                  <th>Criteria</th>
                  <th>Weightage (%)</th>
                  <th>Rating</th>
                  <th className="text-center">Share</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appraisalData.ratings.map((rating, index) => {
                  const ratingId = getItemId(rating);
                  return (
                    <tr key={ratingId}>
                      <td>{index + 1}</td>
                      <td>
                        {editingRatingId === ratingId ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editForm.criteria || ""}
                            onChange={(e) => setEditForm({...editForm, criteria: e.target.value})}
                            required
                          />
                        ) : (
                          rating.criteria || "Not specified"
                        )}
                      </td>
                      <td>
                        {editingRatingId === ratingId ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editForm.weightage || ""}
                            onChange={(e) => setEditForm({...editForm, weightage: e.target.value})}
                            min="0"
                            max="100"
                            required
                          />
                        ) : (
                          `${rating.weightage || "0"}%`
                        )}
                      </td>
                      <td>
                        {editingRatingId === ratingId ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="form-control form-control-sm"
                            value={editForm.rating || ""}
                            onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                            required
                          />
                        ) : (
                          `${rating.rating || "0"}/5`
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => whatsappShareRating(rating)}
                            title="Share on WhatsApp"
                          >
                            <FaWhatsapp />
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => emailShareRating(rating)}
                            title="Share via Email"
                          >
                            <FaEnvelope />
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {editingRatingId === ratingId ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => saveRating(ratingId)}
                                title="Save"
                              >
                                <FaSave />
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={cancelRatingEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => startEditRating(rating)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteRating(ratingId)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Cards Section */}
      <div className="mb-4">
        <h5 className="fw-bold mb-4">Feedback ({appraisalData.feedbackCards.length})</h5>
        {appraisalData.feedbackCards.length === 0 ? (
          <div className="alert alert-info">
            No feedback found. Add feedback using the form.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: 20,
            }}
          >
            {appraisalData.feedbackCards.map((card) => {
              const cardId = getItemId(card);
              const displayId = typeof cardId === 'string' ? cardId.substring(0, 8) : 'FB' + String(cardId).substring(0, 4);
              
              return (
                <div
                  key={cardId}
                  className="p-3 border rounded bg-white shadow-sm"
                >
                  {editingCardId === cardId ? (
                    <div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Feedback *</label>
                        <textarea
                          value={editCardForm.feedback || ""}
                          onChange={(e) => setEditCardForm({...editCardForm, feedback: e.target.value})}
                          className="form-control"
                          rows={2}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Areas of Development</label>
                        <textarea
                          value={editCardForm.development || ""}
                          onChange={(e) => setEditCardForm({...editCardForm, development: e.target.value})}
                          className="form-control"
                          rows={2}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Key Strengths</label>
                        <textarea
                          value={editCardForm.strengths || ""}
                          onChange={(e) => setEditCardForm({...editCardForm, strengths: e.target.value})}
                          className="form-control"
                          rows={2}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Rating *</label>
                        <div className="d-flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              onClick={() => setEditCardForm({...editCardForm, rating: star})}
                              style={{
                                cursor: "pointer",
                                fontSize: 24,
                                color: (editCardForm.rating || 0) >= star ? "#FFD700" : "#d1d8dd",
                                marginRight: 5,
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <small className="text-muted">Selected: {editCardForm.rating || 0}/5</small>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => saveCard(cardId)}
                        >
                          <FaSave /> Save
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={cancelCardEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <FaStar style={{ color: "#FFD700" }} />
                          <h6 className="m-0">Feedback ID: {displayId}...</h6>
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => startEditCard(card)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteCard(cardId)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Feedback:</strong>
                        <div className="mt-1 p-2 bg-light rounded">
                          {card.feedback || "No feedback provided"}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Areas of Development:</strong>
                        <div className="mt-1 p-2 bg-light rounded">
                          {card.development || "Not specified"}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Key Strengths:</strong>
                        <div className="mt-1 p-2 bg-light rounded">
                          {card.strengths || "Not specified"}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Rating:</strong>
                        <div className="mt-1 d-flex align-items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                fontSize: 22,
                                color: (card.rating || 0) >= star ? "#FFD700" : "#d1d8dd",
                                marginRight: 6,
                              }}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ms-2">({card.rating || 0}/5)</span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3 pt-3 border-top">
                        <button
                          onClick={() => whatsappShareCard(card)}
                          className="btn btn-sm btn-success"
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp /> 
                        </button>
                        <button
                          onClick={() => emailShareCard(card)}
                          className="btn btn-sm btn-primary"
                          title="Share via Email"
                        >
                          <FaEnvelope />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Options */}
      {(appraisalData.ratings.length > 0 || appraisalData.feedbackCards.length > 0) && (
        <div className="mt-4 pt-4 border-top">
          <h6 className="fw-bold mb-3">Export Options</h6>
          <div className="d-flex gap-3">
            <button 
              className="btn btn-outline-success"
              onClick={exportToJSON}
            >
              <FaFilePdf className="me-1" />
              Export as JSON
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={exportToExcel}
            >
              <FaFileExcel className="me-1" />
              Export as Excel
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={saveToLocalStorage}
            >
              <FaSave className="me-1" />
              Save to Local Storage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}