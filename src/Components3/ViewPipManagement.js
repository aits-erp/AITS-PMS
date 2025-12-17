import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewPipManagement({ onEditPip, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/pips";
  
  const [pips, setPips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    employee: "",
    dateIssued: "",
    reason: "",
    targets: "",
    comments: "",
  });

  // Load data from backend
  useEffect(() => {
    loadPIPs();
  }, [refreshTrigger]);

  const loadPIPs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setPips(res.data.data || res.data);
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading PIPs:", err);
      setPips([]);
      alert("Failed to load PIP records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PIP record?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/${id}`);
      if (response.data.success) {
        alert("PIP record deleted successfully!");
        loadPIPs();
      } else {
        alert("Error deleting PIP: " + response.data.error);
      }
    } catch (err) {
      console.error("Error deleting PIP:", err);
      alert("Error deleting PIP record: " + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one PIP record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected PIP records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} PIP record(s) deleted successfully!`);
      loadPIPs();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some PIP records could not be deleted");
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
    if (selectedRows.length === pips.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(pips.map(item => item._id));
    }
  };

  const startInlineEdit = (pip) => {
    setEditingRowId(pip._id);
    setInlineEditForm({
      employee: pip.employee || "",
      dateIssued: pip.dateIssued || "",
      reason: pip.reason || "",
      targets: pip.targets || "",
      comments: pip.comments || "",
    });
  };

  const cancelInlineEdit = () => {
    if (inlineEditForm.employee || inlineEditForm.reason || inlineEditForm.targets || inlineEditForm.comments) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({
          employee: "",
          dateIssued: "",
          reason: "",
          targets: "",
          comments: "",
        });
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({
        employee: "",
        dateIssued: "",
        reason: "",
        targets: "",
        comments: "",
      });
    }
  };

  const handleInlineEditChange = (e) => {
    const { name, value } = e.target;
    setInlineEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.employee || !inlineEditForm.dateIssued) {
      alert("Employee and Date Issued are required!");
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/${editingRowId}`, inlineEditForm);
      if (response.data.success) {
        alert("PIP record updated successfully!");
        loadPIPs();
      } else {
        alert("Error updating PIP: " + response.data.error);
      }
    } catch (err) {
      console.error("Error updating PIP:", err);
      alert("Error updating PIP record: " + (err.response?.data?.error || err.message));
    }
  };

  const handleShareWhatsApp = (pip) => {
    const msg = `PIP Details:\nEmployee: ${pip.employee}\nDate: ${pip.dateIssued}\nReason: ${pip.reason}\nTargets: ${pip.targets}\nComments: ${pip.comments}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    alert("Sharing PIP details on WhatsApp...");
  };

  const handleShareEmail = (pip) => {
    const subj = `PIP Details - ${pip.employee}`;
    const body = `Employee: ${pip.employee}\nDate: ${pip.dateIssued}\nReason: ${pip.reason}\nTargets: ${pip.targets}\nComments: ${pip.comments}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    alert("Opening email client to share PIP details...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(pips.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.employee || "",
        "Date Issued": item.dateIssued || "",
        "Reason for PIP": item.reason || "",
        "Specific Improvement Targets & Timeline": item.targets || "",
        "Manager Review Comments": item.comments || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PIP Records");
      XLSX.writeFile(wb, "pip_records_export.xlsx");
      alert("All PIP records exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one PIP record to export");
      return;
    }

    try {
      const selectedData = pips.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.employee || "",
        "Date Issued": item.dateIssued || "",
        "Reason for PIP": item.reason || "",
        "Specific Improvement Targets & Timeline": item.targets || "",
        "Manager Review Comments": item.comments || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected PIP Records");
      XLSX.writeFile(wb, "selected_pip_records_export.xlsx");
      alert(`${selectedRows.length} PIP record(s) exported to Excel successfully!`);
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
        <p className="mt-2">Loading PIP records...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">PIP Records</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadPIPs}
            title="Refresh"
          >
            Refresh
          </button>
          {pips.length > 0 && (
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
          <span>{selectedRows.length} PIP record(s) selected</span>
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

      {pips.length === 0 ? (
        <div className="alert alert-info">
          No PIP records found. Create your first PIP using the form above.
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
                      checked={selectedRows.length === pips.length && pips.length > 0}
                      onChange={handleSelectAll}
                      disabled={pips.length === 0}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Date Issued</th>
                  <th>Reason for PIP</th>
                  <th>Specific Improvement Targets & Timeline</th>
                  <th>Manager Review Comments</th>
                  <th className="text-center" width="220px">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pips.map((pip) => (
                  <tr key={pip._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(pip._id)}
                        onChange={() => handleSelectRow(pip._id)}
                      />
                    </td>
                    
                    {/* Employee Column */}
                    <td>
                      {editingRowId === pip._id ? (
                        <input
                          type="text"
                          name="employee"
                          value={inlineEditForm.employee || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        pip.employee
                      )}
                    </td>
                    
                    {/* Date Column */}
                    <td>
                      {editingRowId === pip._id ? (
                        <input
                          type="date"
                          name="dateIssued"
                          value={inlineEditForm.dateIssued || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        pip.dateIssued
                      )}
                    </td>
                    
                    {/* Reason Column */}
                    <td>
                      {editingRowId === pip._id ? (
                        <textarea
                          name="reason"
                          value={inlineEditForm.reason || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {pip.reason || "-"}
                        </div>
                      )}
                    </td>
                    
                    {/* Targets Column */}
                    <td>
                      {editingRowId === pip._id ? (
                        <textarea
                          name="targets"
                          value={inlineEditForm.targets || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {pip.targets || "-"}
                        </div>
                      )}
                    </td>
                    
                    {/* Comments Column */}
                    <td>
                      {editingRowId === pip._id ? (
                        <textarea
                          name="comments"
                          value={inlineEditForm.comments || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {pip.comments || "-"}
                        </div>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {editingRowId === pip._id ? (
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
                              onClick={() => startInlineEdit(pip)}
                              title="Quick Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(pip._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleShareWhatsApp(pip)}
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>

                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleShareEmail(pip)}
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
            <div>Total PIP Records: {pips.length}</div>
            <div>Selected: {selectedRows.length}</div>
            <div>Unique Employees: {[...new Set(pips.map(p => p.employee))].length}</div>
          </div>
        </>
      )}
    </div>
  );
}