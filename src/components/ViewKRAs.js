import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaUser } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewKRAs({ onEditKRA, refreshTrigger }) {
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/kra`;
  const EMPLOYEE_API = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
  
  const [kras, setKras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Load data from backend
  useEffect(() => {
    loadKRAs();
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
      employee: kra.employee || "",
      employeeId: kra.employeeId || "",
      template: kra.template || "",
      manualRate: kra.manualRate || false
    });
    setEmployeeSearchTerm(kra.employee ? `${kra.employee} (${kra.employeeId || ''})` : "");
    alert("Edit mode activated. Update the values and click Save.");
  };

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setEditForm({});
    setEmployeeSearchTerm("");
    setShowEmployeeDropdown(false);
    alert("Edit cancelled.");
  };

  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearchTerm(value);
    setShowEmployeeDropdown(true);
    if (!value.trim()) {
      setEditForm(prev => ({ ...prev, employee: "", employeeId: "" }));
    }
  };

  const handleEmployeeSelect = (emp) => {
    const name = emp.employeeName || emp.fullName || emp.name || "";
    const id = emp.employeeId || "";
    setEditForm(prev => ({ ...prev, employee: name, employeeId: id }));
    setEmployeeSearchTerm(id ? `${name} (${id})` : name);
    setShowEmployeeDropdown(false);
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
        setEmployeeSearchTerm("");
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

Employee: ${kra.employee || "Not assigned"} ${kra.employeeId ? `(${kra.employeeId})` : ''}
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
    const subject = `KRA Details - ${kra.employee || kra.template || "KRA Report"}`;
    const body = `
KRA Details:

Employee: ${kra.employee || "Not assigned"} ${kra.employeeId ? `(${kra.employeeId})` : ''}
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
        "Employee": kra.employee || "Not assigned",
        "Employee ID": kra.employeeId || "",
        "KRA": kra.kra || "",
        "Weightage": kra.weightage || "",
        "Completion": kra.goalCompletion || "",
        "Score": kra.goalScore || "",
        "Template": kra.template || "Not Selected",
        "Manual Rate": kra.manualRate ? "Yes" : "No"
      })));
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Employee
        { wch: 20 },  // Employee ID
        { wch: 40 },  // KRA
        { wch: 12 },  // Weightage
        { wch: 12 },  // Completion
        { wch: 12 },  // Score
        { wch: 20 },  // Template
        { wch: 15 },  // Manual Rate
      ];
      ws['!cols'] = wscols;
      
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

  const filteredEmployees = employees.filter(emp => {
    const searchLower = employeeSearchTerm.toLowerCase();
    const name = emp.employeeName || emp.fullName || emp.name || "";
    const id = emp.employeeId || "";
    return name.toLowerCase().includes(searchLower) || id.toLowerCase().includes(searchLower);
  });

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
                  <th width="20%">Employee</th>
                  <th width="20%">Template</th>
                  <th width="25%">KRA</th>
                  <th width="8%">Weightage</th>
                  <th width="8%">Completion</th>
                  <th width="8%">Score</th>
                  <th width="6%">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kras.map((kra, index) => (
                  <tr key={kra._id}>
                    <td>{index + 1}</td>
                    <td>
                      {editingRowId === kra._id ? (
                        <div className="position-relative">
                          <input
                            type="text"
                            value={employeeSearchTerm}
                            onChange={(e) => handleEmployeeSearchChange(e.target.value)}
                            style={inputStyle}
                            placeholder="Search employee..."
                            className="form-control"
                          />
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
                      ) : (
                        <div>
                          <div className="fw-medium">{kra.employee || "Not assigned"}</div>
                          {kra.employeeId && <small className="text-muted">{kra.employeeId}</small>}
                        </div>
                      )}
                    </td>
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
