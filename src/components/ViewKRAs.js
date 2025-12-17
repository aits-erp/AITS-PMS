import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewKRAs({ onEditKRA, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/kra";
  
  const [kras, setKras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Load data from backend
  useEffect(() => {
    loadKRAs();
  }, [refreshTrigger]);

  const loadKRAs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      const data = res.data.data || res.data;
      setKras(Array.isArray(data) ? data : []);
      setEditingRowId(null);
      setEditForm({});
    } catch (err) {
      console.error("Error loading KRAs:", err);
      setKras([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this KRA?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/${id}`);
      if (response.data.success) {
        loadKRAs();
        alert("KRA deleted successfully!");
      } else {
        alert("Failed to delete KRA: " + response.data.error);
      }
    } catch (err) {
      console.error("Error deleting KRA:", err);
      alert("Error deleting KRA: " + (err.response?.data?.error || err.message));
    }
  };

  const startInlineEdit = (kra) => {
    setEditingRowId(kra._id);
    setEditForm({
      kra: kra.kra || "",
      weightage: kra.weightage || "",
      goalCompletion: kra.goalCompletion || "",
      goalScore: kra.goalScore || "",
    });
    alert("Edit mode activated. Update the values and click Save.");
  };

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setEditForm({});
    alert("Edit cancelled.");
  };

  const handleInlineEditChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate goalScore if both weightage and completion are numbers
      if (field === "weightage" || field === "goalCompletion") {
        const weightage = parseFloat(field === "weightage" ? value : updated.weightage) || 0;
        const completion = parseFloat(field === "goalCompletion" ? value : updated.goalCompletion) || 0;
        updated.goalScore = ((weightage * completion) / 100).toFixed(2);
      }
      
      return updated;
    });
  };

  const saveInlineEdit = async () => {
    if (!editingRowId) return;

    try {
      const kraToUpdate = kras.find(k => k._id === editingRowId);
      if (!kraToUpdate) return;

      const updatedData = {
        ...kraToUpdate,
        ...editForm,
      };

      const response = await axios.put(`${API_BASE}/${editingRowId}`, updatedData);
      if (response.data.success) {
        loadKRAs();
        alert("KRA updated successfully!");
      } else {
        alert("Failed to update KRA: " + response.data.error);
      }
    } catch (err) {
      console.error("Error updating KRA:", err);
      alert("Error updating KRA: " + (err.response?.data?.error || err.message));
    }
  };

  const shareWhatsApp = (kra) => {
    const text = `
📊 KRA Details:

Appraisal Template: ${kra.template || "Not Selected"}
Rate Manually: ${kra.manualRate ? "Yes" : "No"}

KRA: ${kra.kra}
Weightage: ${kra.weightage}%
Goal Completion: ${kra.goalCompletion}%
Goal Score: ${kra.goalScore}
    `;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    alert("Sharing on WhatsApp...");
  };

  const shareEmail = (kra) => {
    const subject = `KRA Details - ${kra.template || "KRA Report"}`;
    const body = `
KRA Details:

Appraisal Template: ${kra.template || "Not Selected"}
Rate Manually: ${kra.manualRate ? "Yes" : "No"}

KRA: ${kra.kra}
Weightage: ${kra.weightage}%
Goal Completion: ${kra.goalCompletion}%
Goal Score: ${kra.goalScore}
    `;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    alert("Opening email client...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(kras.map((kra, i) => ({
        "S.No": i + 1,
        "KRA": kra.kra || "",
        "Weightage": kra.weightage || "",
        "Completion": kra.goalCompletion || "",
        "Score": kra.goalScore || "",
        "Template": kra.template || "Not Selected",
        "Manual Rate": kra.manualRate ? "Yes" : "No"
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KRAs");
      XLSX.writeFile(wb, "kras_export.xlsx");
      alert("Data exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const inputStyle = {
    background: "#f7f7f7",
    border: "1px solid #d1d8dd",
    borderRadius: "6px",
    height: "32px",
    fontSize: "14px",
    width: "100%",
    padding: "4px 8px",
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading KRAs...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">KRA Summary & Management</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadKRAs}
            title="Refresh"
          >
            Refresh
          </button>
          {kras.length > 0 && (
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

      {kras.length === 0 ? (
        <div className="alert alert-info">
          No KRAs found. Add KRAs using the form above.
        </div>
      ) : (
        <>
          {/* KRAs Table View */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th width="5%">No</th>
                  <th width="25%">Template</th>
                  <th width="30%">KRA</th>
                  <th width="10%">Weightage</th>
                  <th width="10%">Completion</th>
                  <th width="10%">Score</th>
                  <th width="10%">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kras.map((kra, index) => (
                  <tr key={kra._id}>
                    <td>{index + 1}</td>
                    <td>{kra.template || "Not Selected"}</td>
                    <td>
                      {editingRowId === kra._id ? (
                        <input
                          type="text"
                          value={editForm.kra || ""}
                          onChange={(e) => handleInlineEditChange("kra", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        kra.kra || "Not specified"
                      )}
                    </td>
                    <td>
                      {editingRowId === kra._id ? (
                        <input
                          type="number"
                          value={editForm.weightage || ""}
                          onChange={(e) => handleInlineEditChange("weightage", e.target.value)}
                          style={inputStyle}
                          min="0"
                          max="100"
                        />
                      ) : (
                        `${kra.weightage || "0"}%`
                      )}
                    </td>
                    <td>
                      {editingRowId === kra._id ? (
                        <input
                          type="number"
                          value={editForm.goalCompletion || ""}
                          onChange={(e) => handleInlineEditChange("goalCompletion", e.target.value)}
                          style={inputStyle}
                          min="0"
                          max="100"
                        />
                      ) : (
                        `${kra.goalCompletion || "0"}%`
                      )}
                    </td>
                    <td>
                      {editingRowId === kra._id ? (
                        <input
                          type="text"
                          value={editForm.goalScore || ""}
                          readOnly
                          style={{...inputStyle, background: "#e9ecef"}}
                        />
                      ) : (
                        kra.goalScore || "0"
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {editingRowId === kra._id ? (
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
                              onClick={() => startInlineEdit(kra)}
                              title="Quick Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(kra._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => shareWhatsApp(kra)}
                              title="Share on WhatsApp"
                            >
                              <FaWhatsapp />
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => shareEmail(kra)}
                              title="Share via Email"
                            >
                              <FaEnvelope />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}