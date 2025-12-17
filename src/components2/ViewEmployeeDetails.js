import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewEmployeeDetails({ onEditEmployee, refreshTrigger }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-details";
  
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({});

  // Load data from backend
  useEffect(() => {
    loadEmployeeDetails();
  }, [refreshTrigger]);

  const loadEmployeeDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setEmployeeData(res.data.data || res.data);
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading employee details", err);
      alert("Failed to load employee details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee record?")) return;
    
    try {
      await axios.delete(`${API_BASE}/${id}`);
      alert("Employee record deleted successfully!");
      loadEmployeeDetails();
    } catch (err) {
      console.error("Error deleting employee", err);
      alert("Error deleting record");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} employee record(s) deleted successfully!`);
      loadEmployeeDetails();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some records could not be deleted");
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
    if (selectedRows.length === employeeData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(employeeData.map(item => item._id));
    }
  };

  const startInlineEdit = (employee) => {
    setEditingRowId(employee._id);
    setInlineEditForm({
      employee: employee.employee || "",
      reviewer: employee.reviewer || "",
      company: employee.company || "",
      rating: employee.rating || "",
      addedOn: convertDisplayToInput(employee.addedOn) || "",
    });
  };

  const cancelInlineEdit = () => {
    if (Object.keys(inlineEditForm).length > 0) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({});
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({});
    }
  };

  const handleInlineEditChange = (field, value) => {
    setInlineEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveInlineEdit = async () => {
    if (!editingRowId) return;

    try {
      const employeeToUpdate = employeeData.find(e => e._id === editingRowId);
      if (!employeeToUpdate) return;

      const updatedData = {
        ...employeeToUpdate,
        ...inlineEditForm,
        addedOnInput: inlineEditForm.addedOn || new Date().toISOString().slice(0, 16)
      };

      await axios.put(`${API_BASE}/${editingRowId}`, updatedData);
      alert("Employee record updated successfully!");
      loadEmployeeDetails();
    } catch (err) {
      console.error("Error updating employee", err);
      alert("Error updating record");
    }
  };

  const convertDisplayToInput = (display) => {
    if (!display) return "";
    const m = display.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return "";
    const [, dd, mm, yyyy, hh, mi] = m;
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const shareWhatsapp = (item) => {
    const text = `Employee: ${item.employee}
Reviewer: ${item.reviewer}
Company: ${item.company}
Performance Rating: ${item.rating}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };

  const shareMail = (item) => {
    const subject = `Employee Appraisal - ${item.employee}`;
    const body = `Employee: ${item.employee}
Reviewer: ${item.reviewer}
Company: ${item.company}
Performance Rating: ${item.rating}`;
    window.location.href =
      "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(employeeData.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.employee || "",
        "Reviewer": item.reviewer || "",
        "Company": item.company || "",
        "Rating": item.rating || "",
        "Added On": item.addedOn || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employee Details");
      XLSX.writeFile(wb, "employee_details_export.xlsx");
      alert("All employee data exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record to export");
      return;
    }

    try {
      const selectedData = employeeData.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Employee": item.employee || "",
        "Reviewer": item.reviewer || "",
        "Company": item.company || "",
        "Rating": item.rating || "",
        "Added On": item.addedOn || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Employee Details");
      XLSX.writeFile(wb, "selected_employee_details_export.xlsx");
      alert(`${selectedRows.length} employee record(s) exported to Excel successfully!`);
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
        <p className="mt-2">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Employee Details Records</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadEmployeeDetails}
            title="Refresh"
          >
            Refresh
          </button>
          {employeeData.length > 0 && (
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
          <span>{selectedRows.length} record(s) selected</span>
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

      {employeeData.length === 0 ? (
        <div className="alert alert-info">
          No employee records found. Add records using the form above.
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
                      checked={selectedRows.length === employeeData.length && employeeData.length > 0}
                      onChange={handleSelectAll}
                      disabled={employeeData.length === 0}
                    />
                  </th>
                  <th width="5%">#</th>
                  <th>Employee</th>
                  <th>Reviewer</th>
                  <th>Company</th>
                  <th>Rating</th>
                  <th>Added On</th>
                  <th className="text-center" width="270px">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {employeeData.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={() => handleSelectRow(item._id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    
                    {/* Employee Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          value={inlineEditForm.employee || ""}
                          onChange={(e) => handleInlineEditChange("employee", e.target.value)}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.employee
                      )}
                    </td>
                    
                    {/* Reviewer Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          value={inlineEditForm.reviewer || ""}
                          onChange={(e) => handleInlineEditChange("reviewer", e.target.value)}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.reviewer
                      )}
                    </td>
                    
                    {/* Company Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="text"
                          value={inlineEditForm.company || ""}
                          onChange={(e) => handleInlineEditChange("company", e.target.value)}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.company
                      )}
                    </td>
                    
                    {/* Rating Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <select
                          value={inlineEditForm.rating || ""}
                          onChange={(e) => handleInlineEditChange("rating", e.target.value)}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        >
                          <option value="">Select Rating</option>
                          <option value="Outstanding">Outstanding</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Satisfactory">Satisfactory</option>
                          <option value="Need Improvement">Need Improvement</option>
                          <option value="Poor">Poor</option>
                        </select>
                      ) : (
                        item.rating
                      )}
                    </td>
                    
                    {/* Added On Column */}
                    <td>
                      {editingRowId === item._id ? (
                        <input
                          type="datetime-local"
                          value={inlineEditForm.addedOn || ""}
                          onChange={(e) => handleInlineEditChange("addedOn", e.target.value)}
                          className="form-control form-control-sm"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.addedOn
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
                          onClick={() => shareMail(item)}
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
            <div>Total Records: {employeeData.length}</div>
            <div>Selected: {selectedRows.length}</div>
          </div>
        </>
      )}
    </div>
  );
}