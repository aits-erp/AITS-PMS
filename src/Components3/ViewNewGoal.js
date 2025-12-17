import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewNewGoal({ onEditGoal, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/new-goals";
  
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    goal: "",
    progress: "",
    isGroup: false,
    status: "Pending",
    employee: "",
    company: "",
    description: "",
  });

  // Load data from backend
  useEffect(() => {
    loadGoals();
  }, [refreshTrigger]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setGoals(res.data.data || res.data);
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading goals", err);
      alert("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    
    try {
      await axios.delete(`${API_BASE}/${id}`);
      alert("Goal deleted successfully!");
      loadGoals();
    } catch (err) {
      console.error("Error deleting goal", err);
      alert("Error deleting goal");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one goal to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected goals?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} goal(s) deleted successfully!`);
      loadGoals();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some goals could not be deleted");
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
    if (selectedRows.length === goals.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(goals.map(item => item._id));
    }
  };

  const startInlineEdit = (goal) => {
    setEditingRowId(goal._id);
    setInlineEditForm({
      goal: goal.goal || "",
      progress: goal.progress || "",
      isGroup: goal.isGroup || false,
      status: goal.status || "Pending",
      employee: goal.employee || "",
      company: goal.company || "Shrirang Automation and Controls",
      description: goal.description || "",
    });
  };

  const cancelInlineEdit = () => {
    if (inlineEditForm.goal || inlineEditForm.progress || inlineEditForm.employee || inlineEditForm.description) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({
          goal: "",
          progress: "",
          isGroup: false,
          status: "Pending",
          employee: "",
          company: "",
          description: "",
        });
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({
        goal: "",
        progress: "",
        isGroup: false,
        status: "Pending",
        employee: "",
        company: "",
        description: "",
      });
    }
  };

  const handleInlineEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInlineEditForm(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.goal || !inlineEditForm.employee) {
      alert("Please fill required fields (Goal & Employee)!");
      return;
    }

    try {
      await axios.put(`${API_BASE}/${editingRowId}`, inlineEditForm);
      alert("Goal updated successfully!");
      loadGoals();
    } catch (err) {
      console.error("Error updating goal", err);
      alert("Error updating goal");
    }
  };

  const shareEmail = (item) => {
    window.location.href =
      `mailto:?subject=Goal Details - ${item.goal}&body=Goal: ${item.goal}\nProgress: ${item.progress}\nStatus: ${item.status}\nEmployee: ${item.employee}\nDescription: ${item.description}`;
    alert("Opening email client to share goal...");
  };

  const shareWhatsapp = (item) => {
    window.open(
      `https://wa.me/?text=Goal: ${item.goal}%0AProgress: ${item.progress}%0AStatus: ${item.status}%0AEmployee: ${item.employee}%0ADescription: ${item.description}`,
      "_blank"
    );
    alert("Sharing goal on WhatsApp...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(goals.map((item, i) => ({
        "S.No": i + 1,
        "Goal": item.goal || "",
        "Progress": item.progress || "",
        "Is Group": item.isGroup ? "Yes" : "No",
        "Status": item.status || "",
        "Employee": item.employee || "",
        "Company": item.company || "",
        "Description": item.description || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Goals");
      XLSX.writeFile(wb, "goals_export.xlsx");
      alert("All goals exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one goal to export");
      return;
    }

    try {
      const selectedData = goals.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Goal": item.goal || "",
        "Progress": item.progress || "",
        "Is Group": item.isGroup ? "Yes" : "No",
        "Status": item.status || "",
        "Employee": item.employee || "",
        "Company": item.company || "",
        "Description": item.description || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Goals");
      XLSX.writeFile(wb, "selected_goals_export.xlsx");
      alert(`${selectedRows.length} goal(s) exported to Excel successfully!`);
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
        <p className="mt-2">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Saved Goals</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadGoals}
            title="Refresh"
          >
            Refresh
          </button>
          {goals.length > 0 && (
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
          <span>{selectedRows.length} goal(s) selected</span>
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

      {goals.length === 0 ? (
        <div className="alert alert-info">
          No goals saved yet. Add some goals using the form above.
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
                      checked={selectedRows.length === goals.length && goals.length > 0}
                      onChange={handleSelectAll}
                      disabled={goals.length === 0}
                    />
                  </th>
                  <th width="5%">#</th>
                  <th>Goal</th>
                  <th>Progress</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Employee</th>
                  <th>Company</th>
                  <th>Description</th>
                  <th className="text-center" width="200px">Actions</th>
                </tr>
              </thead>

              <tbody>
                {goals.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={() => handleSelectRow(item._id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    
                    {/* Goal Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          name="goal"
                          value={inlineEditForm.goal || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.goal
                      )}
                    </td>
                    
                    {/* Progress Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          name="progress"
                          value={inlineEditForm.progress || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.progress
                      )}
                    </td>
                    
                    {/* Group Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="checkbox"
                          name="isGroup"
                          checked={inlineEditForm.isGroup}
                          onChange={handleInlineEditChange}
                          className="form-check-input"
                        />
                      ) : (
                        item.isGroup ? "Yes" : "No"
                      )}
                    </td>
                    
                    {/* Status Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <select
                          name="status"
                          value={inlineEditForm.status || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        item.status
                      )}
                    </td>
                    
                    {/* Employee Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          name="employee"
                          value={inlineEditForm.employee || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.employee
                      )}
                    </td>
                    
                    {/* Company Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          name="company"
                          value={inlineEditForm.company || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.company
                      )}
                    </td>
                    
                    {/* Description Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <textarea
                          name="description"
                          value={inlineEditForm.description || ""}
                          onChange={handleInlineEditChange}
                          className="form-control form-control-sm"
                          rows={2}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflow: "auto" }}>
                          {item.description || "-"}
                        </div>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        {editingRowId === item._id ? (
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
                              onClick={() => startInlineEdit(item)}
                              title="Quick Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(item._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => shareWhatsapp(item)}
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>

                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => shareEmail(item)}
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
            <div>Total Goals: {goals.length}</div>
            <div>Selected: {selectedRows.length}</div>
            <div>
              Status Summary: 
              <span className="ms-2">Pending: {goals.filter(g => g.status === "Pending").length}</span>
              <span className="ms-2">Preparing: {goals.filter(g => g.status === "Preparing").length}</span>
              <span className="ms-2">Completed: {goals.filter(g => g.status === "Completed").length}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}