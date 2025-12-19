import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewEmployeePromotion({ onEditPromotion, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE ;
  const PROMOTION_API = `${API_BASE}/api/employee-promotions`;

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    name: "",
    date: "",
    currency: "",
    company: "",
    property: "",
    current: "",
    newValue: "",
    justification: "",
  });

  // Load data from backend
  useEffect(() => {
    loadPromotions();
  }, [refreshTrigger]);

  const loadPromotions = async () => {
    try {
      setLoading(true);

      const res = await axios.get(PROMOTION_API);

      console.log("FULL RESPONSE:", res.data);

      if (res.data && Array.isArray(res.data.data)) {
        setPromotions(res.data.data);
      } else {
        setPromotions([]);
      }

    } catch (err) {
      console.error("Error loading promotions", err);
      alert("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion record?")) return;
    
    try {
      await axios.delete(`${PROMOTION_API}/${id}`);
      alert("Promotion record deleted successfully!");
      loadPromotions();
    } catch (err) {
      console.error("Error deleting promotion", err);
      alert("Error deleting promotion record");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one promotion record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected promotions?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${PROMOTION_API}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} promotion record(s) deleted successfully!`);
      loadPromotions();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some promotions could not be deleted");
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
    if (selectedRows.length === promotions.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(promotions.map(item => item._id));
    }
  };

  const startInlineEdit = (promotion) => {
    setEditingRowId(promotion._id);
    setInlineEditForm({
      name: promotion.name || "",
      date: promotion.date || "",
      currency: promotion.currency || "INR",
      company: promotion.company || "Shrirang Automation",
      property: promotion.property || "",
      current: promotion.current || "",
      newValue: promotion.newValue || "",
      justification: promotion.justification || "",
    });
  };

  const cancelInlineEdit = () => {
    // Check if there are any unsaved changes
    const hasChanges = 
      inlineEditForm.name || 
      inlineEditForm.property || 
      inlineEditForm.justification ||
      inlineEditForm.date ||
      inlineEditForm.current ||
      inlineEditForm.newValue;
    
    if (hasChanges) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        resetEditForm();
      }
    } else {
      // No changes, just exit edit mode
      setEditingRowId(null);
      resetEditForm();
    }
  };

  // Helper function to reset edit form
  const resetEditForm = () => {
    setInlineEditForm({
      name: "",
      date: "",
      currency: "",
      company: "",
      property: "",
      current: "",
      newValue: "",
      justification: "",
    });
  };

  const handleInlineEditChange = (e) => {
    const { name, value } = e.target;
    setInlineEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.name || !inlineEditForm.date || !inlineEditForm.property) {
      alert("Please fill required fields (Employee, Date, Property)!");
      return;
    }

    try {
      await axios.put(`${PROMOTION_API}/${editingRowId}`, inlineEditForm);
      alert("Promotion record updated successfully!");
      setEditingRowId(null);
      resetEditForm();
      loadPromotions();
    } catch (err) {
      console.error("Error updating promotion", err);
      alert("Error updating promotion record");
    }
  };

  const shareWhatsapp = (promotion) => {
    const text = `Employee: ${promotion.name}\nDate: ${promotion.date}\nCompany: ${promotion.company}\nProperty: ${promotion.property}\nCurrent: ${promotion.current}\nNew: ${promotion.newValue}\nJustification: ${promotion.justification}`;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    alert("Sharing promotion details on WhatsApp...");
  };

  const shareEmail = (promotion) => {
    const subject = `Promotion: ${promotion.name} - ${promotion.property}`;
    const body = `Employee: ${promotion.name}\nDate: ${promotion.date}\nCompany: ${promotion.company}\nProperty: ${promotion.property}\nCurrent: ${promotion.current}\nNew: ${promotion.newValue}\nJustification: ${promotion.justification}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share promotion details...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(promotions.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.name || "",
        "Date": item.date || "",
        "Company": item.company || "",
        "Currency": item.currency || "",
        "Property": item.property || "",
        "Current": item.current || "",
        "New": item.newValue || "",
        "Justification": item.justification || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Promotions");
      XLSX.writeFile(wb, "promotions_export.xlsx");
      alert("All promotions exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one promotion record to export");
      return;
    }

    try {
      const selectedData = promotions.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.name || "",
        "Date": item.date || "",
        "Company": item.company || "",
        "Currency": item.currency || "",
        "Property": item.property || "",
        "Current": item.current || "",
        "New": item.newValue || "",
        "Justification": item.justification || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Promotions");
      XLSX.writeFile(wb, "selected_promotions_export.xlsx");
      alert(`${selectedRows.length} promotion record(s) exported to Excel successfully!`);
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
        <p className="mt-2">Loading promotions...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Saved Promotions</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadPromotions}
            title="Refresh"
          >
            Refresh
          </button>
          {promotions.length > 0 && (
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
          <span>{selectedRows.length} promotion(s) selected</span>
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

      {promotions.length === 0 ? (
        <div className="alert alert-info">
          No promotions saved yet. Add some promotions using the form above.
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
                      checked={selectedRows.length === promotions.length && promotions.length > 0}
                      onChange={handleSelectAll}
                      disabled={promotions.length === 0}
                    />
                  </th>
                  <th width="5%">#</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Currency</th>
                  <th>Property</th>
                  <th>Current</th>
                  <th>New</th>
                  <th>Justification</th>
                  <th className="text-center" width="220px">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion, index) => (
                  <tr key={promotion._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(promotion._id)}
                        onChange={() => handleSelectRow(promotion._id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    
                    {/* Employee Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="name"
                          value={inlineEditForm.name || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.name
                      )}
                    </td>
                    
                    {/* Date Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="date"
                          name="date"
                          value={inlineEditForm.date || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.date
                      )}
                    </td>
                    
                    {/* Company Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="company"
                          value={inlineEditForm.company || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.company
                      )}
                    </td>
                    
                    {/* Currency Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="currency"
                          value={inlineEditForm.currency || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.currency
                      )}
                    </td>
                    
                    {/* Property Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="property"
                          value={inlineEditForm.property || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.property
                      )}
                    </td>
                    
                    {/* Current Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="current"
                          value={inlineEditForm.current || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.current
                      )}
                    </td>
                    
                    {/* New Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <input
                          type="text"
                          name="newValue"
                          value={inlineEditForm.newValue || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        promotion.newValue
                      )}
                    </td>
                    
                    {/* Justification Column */}
                    <td>
                      {editingRowId === promotion._id ? (
                        <textarea
                          name="justification"
                          value={inlineEditForm.justification || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {promotion.justification || "-"}
                        </div>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {editingRowId === promotion._id ? (
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
                              onClick={() => startInlineEdit(promotion)}
                              title="Quick Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(promotion._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => shareWhatsapp(promotion)}
                              title="Share on WhatsApp"
                            >
                              <FaWhatsapp />
                            </button>

                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => shareEmail(promotion)}
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

          <div className="mt-3 text-muted small">
            <div>Total Promotions: {promotions.length}</div>
            <div>Selected: {selectedRows.length}</div>
            <div>Unique Employees: {[...new Set(promotions.map(p => p.name))].length}</div>
          </div>
        </>
      )}
    </div>
  );
}