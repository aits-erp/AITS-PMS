import React, { useState, useEffect } from "react";
import { Table, Button, Card, Alert, Badge, Modal, Dropdown, DropdownButton } from "react-bootstrap";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaSync, FaSave, FaTimes, FaEye, FaCheck, FaTimesCircle, FaEllipsisV } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewEmployeeResignation({ onEditEmployee, refreshTrigger }) {
//  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
   const API_BASE = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [viewModal, setViewModal] = useState({ show: false, data: null });
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  
  const [inlineEditForm, setInlineEditForm] = useState({
    fullName: "",
    birthDate: "",
    email: "",
    workEmail: "",
    phone: "",
    emergencyContact: "",
    hireDate: "",
    department: "",
    reportingManager: "",
    addedOn: "",
    address: "",
    currentAddress: "",
    pincode: "",
    state: "",
    city: "",
    panNo: "",
    status: "Pending",
    resignationReason: "",
    lastWorkingDay: "",
  });

  // Load data from backend
  useEffect(() => {
    loadResignations();
    loadStats();
  }, [refreshTrigger]);

  const loadResignations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      
      if (res.data && res.data.success) {
        const formattedResignations = res.data.data.map(item => ({
          ...item,
          id: item._id,
          addedOn: formatDisplayDate(item.addedOn),
          birthDate: item.birthDate ? new Date(item.birthDate).toISOString().split('T')[0] : "",
          hireDate: item.hireDate ? new Date(item.hireDate).toISOString().split('T')[0] : "",
          lastWorkingDay: item.lastWorkingDay ? new Date(item.lastWorkingDay).toISOString().split('T')[0] : "",
        }));
        setResignations(formattedResignations);
      } else {
        setResignations([]);
      }
      setSelectedRows([]);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error loading resignations:", err);
      setResignations([]);
      alert("Failed to load resignation records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
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
      return `${dd}-${mm}-${yy} ${hh}:${mi}`;
    } catch {
      return dateString;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resignation record?")) return;
    
    try {
      const response = await axios.delete(`${API_BASE}/${id}`);
      if (response.data.success) {
        alert("Resignation record deleted successfully!");
        loadResignations();
        loadStats();
      } else {
        alert("Error deleting resignation: " + response.data.error);
      }
    } catch (err) {
      console.error("Error deleting resignation:", err);
      alert("Error deleting resignation record: " + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one resignation record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected resignation records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        axios.delete(`${API_BASE}/${id}`)
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedRows.length} resignation record(s) deleted successfully!`);
      loadResignations();
      loadStats();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some resignation records could not be deleted");
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
    if (selectedRows.length === resignations.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(resignations.map(item => item._id));
    }
  };

  const startInlineEdit = (resignation) => {
    setEditingRowId(resignation._id);
    setInlineEditForm({
      fullName: resignation.fullName || "",
      birthDate: resignation.birthDate || "",
      email: resignation.email || "",
      workEmail: resignation.workEmail || "",
      phone: resignation.phone || "",
      emergencyContact: resignation.emergencyContact || "",
      hireDate: resignation.hireDate || "",
      department: resignation.department || "",
      reportingManager: resignation.reportingManager || "",
      addedOn: resignation.addedOn ? new Date(resignation.addedOn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      address: resignation.address || "",
      currentAddress: resignation.currentAddress || "",
      pincode: resignation.pincode || "",
      state: resignation.state || "",
      city: resignation.city || "",
      panNo: resignation.panNo || "",
      status: resignation.status || "Pending",
      resignationReason: resignation.resignationReason || "",
      lastWorkingDay: resignation.lastWorkingDay || "",
    });
  };

  const cancelInlineEdit = () => {
    if (window.confirm("Discard your changes?")) {
      setEditingRowId(null);
      setInlineEditForm({
        fullName: "",
        birthDate: "",
        email: "",
        workEmail: "",
        phone: "",
        emergencyContact: "",
        hireDate: "",
        department: "",
        reportingManager: "",
        addedOn: "",
        address: "",
        currentAddress: "",
        pincode: "",
        state: "",
        city: "",
        panNo: "",
        status: "Pending",
        resignationReason: "",
        lastWorkingDay: "",
      });
    }
  };

  const handleInlineEditChange = (e) => {
    const { name, value } = e.target;
    setInlineEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveInlineEdit = async () => {
    // Validate required fields
    if (!inlineEditForm.fullName || !inlineEditForm.email || !inlineEditForm.workEmail || !inlineEditForm.phone || !inlineEditForm.emergencyContact || !inlineEditForm.hireDate || !inlineEditForm.department || !inlineEditForm.reportingManager || !inlineEditForm.address || !inlineEditForm.currentAddress || !inlineEditForm.pincode || !inlineEditForm.state || !inlineEditForm.city || !inlineEditForm.panNo) {
      alert("Please fill all required fields!");
      return;
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inlineEditForm.email)) {
      alert("Please enter a valid personal email address!");
      return;
    }
    
    if (!emailRegex.test(inlineEditForm.workEmail)) {
      alert("Please enter a valid work email address!");
      return;
    }

    // Validate phone (10 digits)
    if (!/^[0-9]{10}$/.test(inlineEditForm.phone)) {
      alert("Please enter a valid 10-digit phone number!");
      return;
    }

    // Validate emergency contact (10 digits)
    if (!/^[0-9]{10}$/.test(inlineEditForm.emergencyContact)) {
      alert("Please enter a valid 10-digit emergency contact number!");
      return;
    }

    // Validate PAN format
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(inlineEditForm.panNo.toUpperCase())) {
      alert("Please enter a valid PAN number (Format: ABCDE1234F)!");
      return;
    }

    // Validate pincode (6 digits)
    if (!/^[0-9]{6}$/.test(inlineEditForm.pincode)) {
      alert("Please enter a valid 6-digit pincode!");
      return;
    }

    try {
      const updateData = {
        fullName: inlineEditForm.fullName,
        birthDate: inlineEditForm.birthDate || null,
        email: inlineEditForm.email,
        workEmail: inlineEditForm.workEmail,
        phone: inlineEditForm.phone,
        emergencyContact: inlineEditForm.emergencyContact,
        hireDate: inlineEditForm.hireDate || null,
        department: inlineEditForm.department,
        reportingManager: inlineEditForm.reportingManager,
        addedOn: inlineEditForm.addedOn || new Date().toISOString(),
        address: inlineEditForm.address,
        currentAddress: inlineEditForm.currentAddress,
        pincode: inlineEditForm.pincode,
        state: inlineEditForm.state,
        city: inlineEditForm.city,
        panNo: inlineEditForm.panNo.toUpperCase(),
        status: inlineEditForm.status,
        resignationReason: inlineEditForm.resignationReason || "",
        lastWorkingDay: inlineEditForm.lastWorkingDay || null,
      };

      const response = await axios.put(`${API_BASE}/${editingRowId}`, updateData);
      
      if (response.data.success) {
        alert("Resignation record updated successfully!");
        loadResignations();
        loadStats();
      } else {
        alert("Error updating resignation: " + response.data.error);
      }
    } catch (err) {
      console.error("Error updating resignation:", err);
      alert("Error updating resignation record: " + (err.response?.data?.error || err.message));
    }
  };

  const viewDetails = (resignation) => {
    setViewModal({
      show: true,
      data: resignation
    });
  };

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    
    try {
      const response = await axios.put(`${API_BASE}/${id}`, { status: newStatus });
      if (response.data.success) {
        alert(`Status updated to ${newStatus} successfully!`);
        loadResignations();
        loadStats();
      }
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.error || err.message));
    }
  };

  const shareWhatsapp = (resignation) => {
    const msg = `Employee Resignation Details:
    
Name: ${resignation.fullName}
Personal Email: ${resignation.email}
Work Email: ${resignation.workEmail}
Phone: ${resignation.phone}
Emergency Contact: ${resignation.emergencyContact}
Department: ${resignation.department}
Reporting Manager: ${resignation.reportingManager}
Hire Date: ${resignation.hireDate}
Address: ${resignation.address}
Current Address: ${resignation.currentAddress}
City: ${resignation.city}, ${resignation.state} - ${resignation.pincode}
PAN: ${resignation.panNo}
Status: ${resignation.status}
Birth Date: ${resignation.birthDate}
Added On: ${resignation.addedOn}
${resignation.resignationReason ? `Resignation Reason: ${resignation.resignationReason}` : ''}
${resignation.lastWorkingDay ? `Last Working Day: ${resignation.lastWorkingDay}` : ''}`;
    
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const shareMail = (resignation) => {
    const subject = `Resignation - ${resignation.fullName}`;
    const body = `Employee Resignation Details:

Name: ${resignation.fullName}
Personal Email: ${resignation.email}
Work Email: ${resignation.workEmail}
Phone: ${resignation.phone}
Emergency Contact: ${resignation.emergencyContact}
Department: ${resignation.department}
Reporting Manager: ${resignation.reportingManager}
Hire Date: ${resignation.hireDate}
Address: ${resignation.address}
Current Address: ${resignation.currentAddress}
City: ${resignation.city}, ${resignation.state} - ${resignation.pincode}
PAN: ${resignation.panNo}
Status: ${resignation.status}
Birth Date: ${resignation.birthDate}
Added On: ${resignation.addedOn}
${resignation.resignationReason ? `Resignation Reason: ${resignation.resignationReason}` : ''}
${resignation.lastWorkingDay ? `Last Working Day: ${resignation.lastWorkingDay}` : ''}`;
    
    window.location.href =
      "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(resignations.map((item, i) => ({
        "S.No": i + 1,
        "Employee ID": item.employeeId || "",
        "Full Name": item.fullName || "",
        "Personal Email": item.email || "",
        "Work Email": item.workEmail || "",
        "Phone": item.phone || "",
        "Emergency Contact": item.emergencyContact || "",
        "Department": item.department || "",
        "Reporting Manager": item.reportingManager || "",
        "Hire Date": item.hireDate || "",
        "Address": item.address || "",
        "Current Address": item.currentAddress || "",
        "City": item.city || "",
        "State": item.state || "",
        "Pincode": item.pincode || "",
        "PAN Number": item.panNo || "",
        "Status": item.status || "",
        "Added On": item.addedOn || "",
        "Birth Date": item.birthDate || "",
        "Resignation Reason": item.resignationReason || "",
        "Last Working Day": item.lastWorkingDay || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resignations");
      XLSX.writeFile(wb, "employee_resignation_export.xlsx");
      alert("All resignation records exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one resignation record to export");
      return;
    }

    try {
      const selectedData = resignations.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Employee ID": item.employeeId || "",
        "Full Name": item.fullName || "",
        "Personal Email": item.email || "",
        "Work Email": item.workEmail || "",
        "Phone": item.phone || "",
        "Emergency Contact": item.emergencyContact || "",
        "Department": item.department || "",
        "Reporting Manager": item.reportingManager || "",
        "Hire Date": item.hireDate || "",
        "Address": item.address || "",
        "Current Address": item.currentAddress || "",
        "City": item.city || "",
        "State": item.state || "",
        "Pincode": item.pincode || "",
        "PAN Number": item.panNo || "",
        "Status": item.status || "",
        "Added On": item.addedOn || "",
        "Birth Date": item.birthDate || "",
        "Resignation Reason": item.resignationReason || "",
        "Last Working Day": item.lastWorkingDay || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Resignations");
      XLSX.writeFile(wb, "selected_resignations_export.xlsx");
      alert(`${selectedRows.length} resignation record(s) exported to Excel successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Processed':
        return <Badge bg="success">{status}</Badge>;
      case 'Rejected':
        return <Badge bg="danger">{status}</Badge>;
      default:
        return <Badge bg="warning" text="dark">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading resignation records...</p>
      </div>
    );
  }

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Stats Overview */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-muted">Total</h5>
              <h2 className="fw-bold">{stats.total}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-warning bg-opacity-10">
            <Card.Body>
              <h5 className="text-muted">Pending</h5>
              <h2 className="fw-bold text-warning">{stats.byStatus.Pending || 0}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-success bg-opacity-10">
            <Card.Body>
              <h5 className="text-muted">Processed</h5>
              <h2 className="fw-bold text-success">{stats.byStatus.Processed || 0}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-danger bg-opacity-10">
            <Card.Body>
              <h5 className="text-muted">Rejected</h5>
              <h2 className="fw-bold text-danger">{stats.byStatus.Rejected || 0}</h2>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Resignation Records ({resignations.length})</h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadResignations}
                title="Refresh"
              >
                <FaSync />
              </Button>
              {resignations.length > 0 && (
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
              <span>{selectedRows.length} resignation(s) selected</span>
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

          {resignations.length === 0 ? (
            <Alert variant="info">
              No resignation records found. Add your first resignation using the form above.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover className="mt-3">
                  <thead className="table-light">
                    <tr>
                      <th width="3%">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === resignations.length && resignations.length > 0}
                          onChange={handleSelectAll}
                          disabled={resignations.length === 0}
                        />
                      </th>
                      <th width="3%">#</th>
                      <th width="8%">Emp ID</th>
                      <th width="8%">Full Name</th>
                      <th width="8%">Personal Email</th>
                      <th width="8%">Work Email</th>
                      <th width="6%">Phone</th>
                      <th width="6%">Emergency</th>
                      <th width="8%">Department</th>
                      <th width="8%">Manager</th>
                      <th width="6%">Status</th>
                      <th width="7%">Added On</th>
                      <th className="text-center" width="12%">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resignations.map((resignation, index) => (
                      <tr key={resignation._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(resignation._id)}
                            onChange={() => handleSelectRow(resignation._id)}
                            disabled={editingRowId === resignation._id}
                          />
                        </td>
                        <td>{index + 1}</td>
                        
                        {/* Employee ID Column */}
                        <td>
                          <small className="text-muted">{resignation.employeeId}</small>
                        </td>
                        
                        {/* Full Name Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="text"
                              name="fullName"
                              value={inlineEditForm.fullName || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            <span className="fw-semibold">{resignation.fullName}</span>
                          )}
                        </td>
                        
                        {/* Personal Email Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="email"
                              name="email"
                              value={inlineEditForm.email || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            <a href={`mailto:${resignation.email}`} className="text-decoration-none small">
                              {resignation.email}
                            </a>
                          )}
                        </td>
                        
                        {/* Work Email Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="email"
                              name="workEmail"
                              value={inlineEditForm.workEmail || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            <a href={`mailto:${resignation.workEmail}`} className="text-decoration-none small">
                              {resignation.workEmail}
                            </a>
                          )}
                        </td>
                        
                        {/* Phone Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="text"
                              name="phone"
                              value={inlineEditForm.phone || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                              maxLength="10"
                            />
                          ) : (
                            <a href={`tel:${resignation.phone}`} className="text-decoration-none">
                              {resignation.phone || "-"}
                            </a>
                          )}
                        </td>
                        
                        {/* Emergency Contact Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="text"
                              name="emergencyContact"
                              value={inlineEditForm.emergencyContact || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                              maxLength="10"
                            />
                          ) : (
                            <a href={`tel:${resignation.emergencyContact}`} className="text-decoration-none">
                              {resignation.emergencyContact || "-"}
                            </a>
                          )}
                        </td>
                        
                        {/* Department Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="text"
                              name="department"
                              value={inlineEditForm.department || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            resignation.department || "-"
                          )}
                        </td>
                        
                        {/* Reporting Manager Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="text"
                              name="reportingManager"
                              value={inlineEditForm.reportingManager || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            resignation.reportingManager || "-"
                          )}
                        </td>
                        
                        {/* Status Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <select
                              name="status"
                              value={inlineEditForm.status || "Pending"}
                              onChange={handleInlineEditChange}
                              className="form-select form-select-sm"
                              style={{ width: "100%" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processed">Processed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          ) : (
                            getStatusBadge(resignation.status)
                          )}
                        </td>
                        
                        {/* Added On Column */}
                        <td>
                          {editingRowId === resignation._id ? (
                            <input
                              type="date"
                              name="addedOn"
                              value={inlineEditForm.addedOn || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              style={{ width: "100%" }}
                              required
                            />
                          ) : (
                            <small className="text-muted">{resignation.addedOn}</small>
                          )}
                        </td>
                        
                        {/* Actions Column */}
                        <td className="text-center">
                          {editingRowId === resignation._id ? (
                            <div className="d-flex gap-2 justify-content-center">
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
                            </div>
                          ) : (
                            <div className="d-flex gap-2 justify-content-center">
                              {/* Primary Actions */}
                              <Button
                                size="sm"
                                variant="info"
                                onClick={() => viewDetails(resignation)}
                                title="View Details"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaEye />
                              </Button>

                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => startInlineEdit(resignation)}
                                title="Edit"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaEdit />
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(resignation._id)}
                                title="Delete"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaTrash />
                              </Button>

                              {/* Mobile Dropdown for smaller screens */}
                              <DropdownButton
                                size="sm"
                                variant="outline-primary"
                                title={<FaEllipsisV />}
                                className="d-md-none"
                                align="end"
                              >
                                <Dropdown.Item onClick={() => viewDetails(resignation)}>
                                  <FaEye className="me-2" /> View
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => startInlineEdit(resignation)}>
                                  <FaEdit className="me-2" /> Edit
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleDelete(resignation._id)}>
                                  <FaTrash className="me-2" /> Delete
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => updateStatus(resignation._id, "Processed")}>
                                  <FaCheck className="me-2" /> Mark Processed
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => updateStatus(resignation._id, "Rejected")}>
                                  <FaTimesCircle className="me-2" /> Mark Rejected
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => shareWhatsapp(resignation)}>
                                  <FaWhatsapp className="me-2" /> WhatsApp
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => shareMail(resignation)}>
                                  <FaEnvelope className="me-2" /> Email
                                </Dropdown.Item>
                              </DropdownButton>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              
            </>
          )}
        </Card.Body>
      </Card>

      {/* View Details Modal */}
      <Modal show={viewModal.show} onHide={() => setViewModal({ show: false, data: null })} size="xl" className="m-5">
        <Modal.Header closeButton>
          <Modal.Title>Resignation Details - {viewModal.data?.employeeId}</Modal.Title>
        </Modal.Header>
        <Modal.Body >
          {viewModal.data && (
            <div className="row justify-content-center">
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Employee ID:</label>
                <p className="text-primary">{viewModal.data.employeeId}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Full Name:</label>
                <p>{viewModal.data.fullName}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Personal Email:</label>
                <p>{viewModal.data.email}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Work Email:</label>
                <p>{viewModal.data.workEmail}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Phone:</label>
                <p>{viewModal.data.phone || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Emergency Contact:</label>
                <p>{viewModal.data.emergencyContact || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">PAN Number:</label>
                <p>{viewModal.data.panNo || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Status:</label>
                <p>{getStatusBadge(viewModal.data.status)}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Birth Date:</label>
                <p>{viewModal.data.birthDate || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Hire Date:</label>
                <p>{viewModal.data.hireDate || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Department:</label>
                <p>{viewModal.data.department || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Reporting Manager:</label>
                <p>{viewModal.data.reportingManager || "-"}</p>
              </div>
              <div className="col-md-12 mb-3">
                <label className="fw-bold">Address:</label>
                <p>{viewModal.data.address || "-"}</p>
              </div>
              <div className="col-md-12 mb-3">
                <label className="fw-bold">Current Address:</label>
                <p>{viewModal.data.currentAddress || "-"}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="fw-bold">City:</label>
                <p>{viewModal.data.city || "-"}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="fw-bold">State:</label>
                <p>{viewModal.data.state || "-"}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="fw-bold">Pincode:</label>
                <p>{viewModal.data.pincode || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Added On:</label>
                <p>{viewModal.data.addedOn || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Last Working Day:</label>
                <p>{viewModal.data.lastWorkingDay || "-"}</p>
              </div>
              {viewModal.data.resignationReason && (
                <div className="col-md-12 mb-3">
                  <label className="fw-bold">Resignation Reason:</label>
                  <p>{viewModal.data.resignationReason}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              <Button variant="success" onClick={() => shareWhatsapp(viewModal.data)} className="me-2">
                <FaWhatsapp className="me-1" /> Share via WhatsApp
              </Button>
              <Button variant="info" onClick={() => shareMail(viewModal.data)}>
                <FaEnvelope className="me-1" /> Share via Email
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setViewModal({ show: false, data: null })}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal for Larger Screens (Alternative to inline) */}
      <Modal show={editingRowId !== null} onHide={cancelInlineEdit} size="xl" className="m-5">
        <Modal.Header closeButton>
          <Modal.Title>Edit Resignation Record</Modal.Title>
        </Modal.Header>
        <Modal.Body  cl>
          {editingRowId && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={inlineEditForm.fullName || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Personal Email *</label>
                <input
                  type="email"
                  name="email"
                  value={inlineEditForm.email || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Work Email *</label>
                <input
                  type="email"
                  name="workEmail"
                  value={inlineEditForm.workEmail || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={inlineEditForm.phone || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                  maxLength="10"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Emergency Contact *</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={inlineEditForm.emergencyContact || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                  maxLength="10"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">PAN Number *</label>
                <input
                  type="text"
                  name="panNo"
                  value={inlineEditForm.panNo || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                  onBlur={(e) => {
                    if (e.target.value) {
                      setInlineEditForm(prev => ({
                        ...prev,
                        panNo: e.target.value.toUpperCase()
                      }));
                    }
                  }}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={inlineEditForm.hireDate || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={inlineEditForm.department || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Reporting Manager *</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={inlineEditForm.reportingManager || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={inlineEditForm.birthDate || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Added On *</label>
                <input
                  type="date"
                  name="addedOn"
                  value={inlineEditForm.addedOn || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Status</label>
                <select
                  name="status"
                  value={inlineEditForm.status || "Pending"}
                  onChange={handleInlineEditChange}
                  className="form-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Last Working Day</label>
                <input
                  type="date"
                  name="lastWorkingDay"
                  value={inlineEditForm.lastWorkingDay || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Address *</label>
                <textarea
                  name="address"
                  value={inlineEditForm.address || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  rows="2"
                  required
                />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Current Address *</label>
                <textarea
                  name="currentAddress"
                  value={inlineEditForm.currentAddress || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  rows="2"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">City *</label>
                <input
                  type="text"
                  name="city"
                  value={inlineEditForm.city || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">State *</label>
                <input
                  type="text"
                  name="state"
                  value={inlineEditForm.state || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={inlineEditForm.pincode || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  required
                  maxLength="6"
                />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Resignation Reason</label>
                <textarea
                  name="resignationReason"
                  value={inlineEditForm.resignationReason || ""}
                  onChange={handleInlineEditChange}
                  className="form-control"
                  rows="3"
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelInlineEdit}>
            Cancel
          </Button>
          <Button variant="success" onClick={saveInlineEdit}>
            <FaSave className="me-1" /> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}