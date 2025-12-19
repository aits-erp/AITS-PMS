import React, { useState, useEffect } from "react";
import { Table, Button, Card, Alert } from "react-bootstrap";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaSync, FaSave, FaTimes } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewEmployeeOnboarding({ onEditEmployee, refreshTrigger }) {
 // const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-onboarding";
  const API_BASE = `${process.env.REACT_APP_API_BASE}api/employee-onboarding`;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({
    fullName: "",
    workEmail: "",
    department: "",
    reportingManager: "",
    hireDate: "",
  });

  // Load data from backend
  useEffect(() => {
    loadEmployees();
  }, [refreshTrigger]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      
      if (res.data && res.data.success) {
        const formattedEmployees = res.data.data.map(emp => ({
          ...emp,
          id: emp._id,
          addedOn: formatDisplayDate(emp.addedOn),
          hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : ""
        }));
        setEmployees(formattedEmployees);
      } else {
        setEmployees([]);
      }
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading employees:", err);
      setEmployees([]);
      alert("Failed to load employee records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${dd}-${mm}-${yy} ${hh}:${mi}:${ss}`;
    } catch {
      return dateString;
    }
  };

  const formatDateForBackend = (displayDate) => {
    if (!displayDate) return new Date().toISOString();
    try {
      // Convert from "DD-MM-YYYY HH:MM:SS" to ISO format
      const match = displayDate.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
      }
      return new Date(displayDate).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee record?")) return;
    
    try {
      const response = await axios.delete(`${API_BASE}/${id}`);
      if (response.data.success) {
        alert("Employee record deleted successfully!");
        loadEmployees();
      } else {
        alert("Error deleting employee: " + response.data.error);
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Error deleting employee record: " + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one employee record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected employee records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} employee record(s) deleted successfully!`);
      loadEmployees();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some employee records could not be deleted");
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
    if (selectedRows.length === employees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(employees.map(item => item._id));
    }
  };

  const startInlineEdit = (employee) => {
    setEditingRowId(employee._id);
    setInlineEditForm({
      fullName: employee.fullName || "",
      workEmail: employee.workEmail || "",
      department: employee.department || "",
      reportingManager: employee.reportingManager || "",
      hireDate: employee.hireDate || "",
    });
  };

  const cancelInlineEdit = () => {
    if (inlineEditForm.fullName || inlineEditForm.workEmail || inlineEditForm.department) {
      if (window.confirm("Discard your changes?")) {
        setEditingRowId(null);
        setInlineEditForm({
          fullName: "",
          workEmail: "",
          department: "",
          reportingManager: "",
          hireDate: "",
        });
      }
    } else {
      setEditingRowId(null);
      setInlineEditForm({
        fullName: "",
        workEmail: "",
        department: "",
        reportingManager: "",
        hireDate: "",
      });
    }
  };

  const handleInlineEditChange = (e) => {
    const { name, value } = e.target;
    setInlineEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditForm.fullName || !inlineEditForm.workEmail) {
      alert("Please fill required fields (Full Name and Work Email)!");
      return;
    }

    try {
      // Create update data with only the fields we're editing
      const updateData = {
        fullName: inlineEditForm.fullName,
        workEmail: inlineEditForm.workEmail,
        department: inlineEditForm.department || "",
        reportingManager: inlineEditForm.reportingManager || "",
        hireDate: inlineEditForm.hireDate || null,
      };

      // Only send the fields that are being updated
      const response = await axios.put(`${API_BASE}/${editingRowId}`, updateData);
      
      if (response.data.success) {
        alert("Employee record updated successfully!");
        loadEmployees();
      } else {
        alert("Error updating employee: " + response.data.error);
      }
    } catch (err) {
      console.error("Error updating employee:", err);
      alert("Error updating employee record: " + (err.response?.data?.error || err.message));
    }
  };

  const shareWhatsapp = (employee) => {
    const msg = `Employee: ${employee.fullName}
Email: ${employee.workEmail}
Department: ${employee.department}
Manager: ${employee.reportingManager}
Hire Date: ${employee.hireDate}
Added On: ${employee.addedOn}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    alert("Sharing employee details on WhatsApp...");
  };

  const shareMail = (employee) => {
    const subject = `Onboarding - ${employee.fullName}`;
    const body = `Employee: ${employee.fullName}
Email: ${employee.workEmail}
Department: ${employee.department}
Manager: ${employee.reportingManager}
Hire Date: ${employee.hireDate}
Added On: ${employee.addedOn}`;
    window.location.href =
      "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    alert("Opening email client to share employee details...");
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(employees.map((item, i) => ({
        "S.No": i + 1,
        "Full Name": item.fullName || "",
        "Work Email": item.workEmail || "",
        "Hire Date": item.hireDate || "",
        "Department": item.department || "",
        "Reporting Manager": item.reportingManager || "",
        "Added On": item.addedOn || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, "employee_onboarding_export.xlsx");
      alert("All employee records exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one employee record to export");
      return;
    }

    try {
      const selectedData = employees.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Full Name": item.fullName || "",
        "Work Email": item.workEmail || "",
        "Hire Date": item.hireDate || "",
        "Department": item.department || "",
        "Reporting Manager": item.reportingManager || "",
        "Added On": item.addedOn || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Employees");
      XLSX.writeFile(wb, "selected_employees_export.xlsx");
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
        <p className="mt-2">Loading employee records...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Employee Records ({employees.length})</h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadEmployees}
                title="Refresh"
              >
                <FaSync />
              </Button>
              {employees.length > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={exportToExcel}
                  title="Export All to Excel"
                >
                  <FaFileExcel className="me-1" />
                  Export All
                </Button>
              )}
            </div>
          </div>

          {selectedRows.length > 0 && (
            <Alert variant="info" className="d-flex justify-content-between align-items-center">
              <span>{selectedRows.length} employee(s) selected</span>
              <div className="d-flex gap-2">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={exportSelectedToExcel}
                >
                  <FaFileExcel className="me-1" />
                  Export Selected
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <FaTrash className="me-1" />
                  Delete Selected
                </Button>
              </div>
            </Alert>
          )}

          {employees.length === 0 ? (
            <Alert variant="info">
              No employees found. Add your first employee using the form above.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover className="mt-3">
                  <thead className="table-light">
                    <tr>
                      <th width="5%">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === employees.length && employees.length > 0}
                          onChange={handleSelectAll}
                          disabled={employees.length === 0}
                        />
                      </th>
                      <th width="5%">#</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Manager</th>
                      <th>Hire Date</th>
                      <th>Added On</th>
                      <th className="text-center" width="300px">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((employee, index) => (
                      <tr key={employee._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(employee._id)}
                            onChange={() => handleSelectRow(employee._id)}
                            disabled={editingRowId === employee._id}
                          />
                        </td>
                        <td>{index + 1}</td>
                        
                        {/* Full Name Column */}
                        <td>
                          {editingRowId === employee._id ? (
                            <input
                              type="text"
                              name="fullName"
                              value={inlineEditForm.fullName || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                            />
                          ) : (
                            <span className="fw-semibold">{employee.fullName}</span>
                          )}
                        </td>
                        
                        {/* Email Column */}
                        <td>
                          {editingRowId === employee._id ? (
                            <input
                              type="email"
                              name="workEmail"
                              value={inlineEditForm.workEmail || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                            />
                          ) : (
                            <a href={`mailto:${employee.workEmail}`} className="text-decoration-none">
                              {employee.workEmail}
                            </a>
                          )}
                        </td>
                        
                        {/* Department Column */}
                        <td>
                          {editingRowId === employee._id ? (
                            <input
                              type="text"
                              name="department"
                              value={inlineEditForm.department || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                            />
                          ) : (
                            employee.department || "-"
                          )}
                        </td>
                        
                        {/* Manager Column */}
                        <td>
                          {editingRowId === employee._id ? (
                            <input
                              type="text"
                              name="reportingManager"
                              value={inlineEditForm.reportingManager || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                            />
                          ) : (
                            employee.reportingManager || "-"
                          )}
                        </td>
                        
                        {/* Hire Date Column */}
                        <td>
                          {editingRowId === employee._id ? (
                            <input
                              type="date"
                              name="hireDate"
                              value={inlineEditForm.hireDate || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                            />
                          ) : (
                            employee.hireDate || "-"
                          )}
                        </td>
                        
                        {/* Added On Column (Read Only) */}
                        <td>
                          <small className="text-muted">{employee.addedOn}</small>
                        </td>
                        
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {editingRowId === employee._id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={saveInlineEdit}
                                  title="Save"
                                >
                                  <FaSave className="me-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={cancelInlineEdit}
                                  title="Cancel"
                                >
                                  <FaTimes className="me-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => startInlineEdit(employee)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleDelete(employee._id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => shareWhatsapp(employee)}
                                  title="Share on WhatsApp"
                                >
                                  <FaWhatsapp />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="info"
                                  onClick={() => shareMail(employee)}
                                  title="Share via Email"
                                >
                                  <FaEnvelope />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="mt-3 text-muted small">
                <div>Total Employees: {employees.length}</div>
                <div>Selected: {selectedRows.length}</div>
                <div>
                  Departments: {[...new Set(employees.map(e => e.department).filter(Boolean))].length} unique
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}