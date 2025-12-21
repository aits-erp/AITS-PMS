import React, { useState, useEffect } from "react";
import { Table, Button, Card, Alert, Badge, Modal, Dropdown, DropdownButton } from "react-bootstrap";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaSync, FaSave, FaTimes, FaEye, FaCheck, FaTimesCircle, FaEllipsisV } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewEmployeeResignation({ onEditEmployee, refreshTrigger }) {
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [viewModal, setViewModal] = useState({ show: false, data: null });
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [showCompactView, setShowCompactView] = useState(false);
  
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
      
      // Handle different API response structures
      let data = [];
      if (res.data) {
        if (res.data.success && Array.isArray(res.data.data)) {
          data = res.data.data;
        } else if (Array.isArray(res.data)) {
          data = res.data;
        }
      }
      
      const formattedResignations = data.map(item => ({
        ...item,
        id: item._id || item.id,
        employeeId: item.employeeId || "",
        fullName: item.fullName || "",
        email: item.email || "",
        workEmail: item.workEmail || "",
        phone: item.phone || "",
        emergencyContact: item.emergencyContact || "",
        department: item.department || "",
        reportingManager: item.reportingManager || "",
        address: item.address || "",
        currentAddress: item.currentAddress || "",
        city: item.city || "",
        state: item.state || "",
        pincode: item.pincode || "",
        panNo: item.panNo || "",
        status: item.status || "Pending",
        resignationReason: item.resignationReason || "",
        addedOn: formatDisplayDate(item.addedOn || item.createdAt || new Date().toISOString()),
        birthDate: item.birthDate ? new Date(item.birthDate).toISOString().split('T')[0] : "",
        hireDate: item.hireDate ? new Date(item.hireDate).toISOString().split('T')[0] : "",
        lastWorkingDay: item.lastWorkingDay ? new Date(item.lastWorkingDay).toISOString().split('T')[0] : "",
      }));
      
      setResignations(formattedResignations);
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
        setStats(res.data.data || { total: 0, byStatus: {} });
      } else {
        // Calculate stats from local data if API doesn't provide
        const total = resignations.length || 0;
        const byStatus = {};
        (resignations || []).forEach(item => {
          const status = item.status || "Pending";
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        setStats({ total, byStatus });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      // Calculate stats from local data
      const total = resignations.length || 0;
      const byStatus = {};
      (resignations || []).forEach(item => {
        const status = item.status || "Pending";
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      setStats({ total, byStatus });
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
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
      if (response.data && response.data.success) {
        alert("Resignation record deleted successfully!");
        loadResignations();
        loadStats();
      } else {
        alert("Error deleting resignation: " + (response.data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting resignation:", err);
      alert("Error deleting resignation record: " + (err.response?.data?.error || err.message || "Unknown error"));
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
    if (selectedRows.length === (resignations || []).length) {
      setSelectedRows([]);
    } else {
      setSelectedRows((resignations || []).map(item => item._id || item.id));
    }
  };

  const startInlineEdit = (resignation) => {
    setEditingRowId(resignation._id || resignation.id);
    
    // Helper function to safely format date for input field
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      
      // If it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If it's in DD-MM-YYYY format (display format)
      if (/^\d{2}-\d{2}-\d{4}/.test(dateString)) {
        const parts = dateString.split(/[-/ ]/);
        if (parts.length >= 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      
      // Try to parse as Date
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn("Date parsing error:", error);
      }
      
      return "";
    };
    
    setInlineEditForm({
      fullName: resignation.fullName || "",
      birthDate: formatDateForInput(resignation.birthDate),
      email: resignation.email || "",
      workEmail: resignation.workEmail || "",
      phone: resignation.phone || "",
      emergencyContact: resignation.emergencyContact || "",
      hireDate: formatDateForInput(resignation.hireDate),
      department: resignation.department || "",
      reportingManager: resignation.reportingManager || "",
      addedOn: formatDateForInput(resignation.addedOn) || new Date().toISOString().split('T')[0],
      address: resignation.address || "",
      currentAddress: resignation.currentAddress || "",
      pincode: resignation.pincode || "",
      state: resignation.state || "",
      city: resignation.city || "",
      panNo: resignation.panNo || "",
      status: resignation.status || "Pending",
      resignationReason: resignation.resignationReason || "",
      lastWorkingDay: formatDateForInput(resignation.lastWorkingDay),
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
      
      if (response.data && response.data.success) {
        alert("Resignation record updated successfully!");
        loadResignations();
        loadStats();
      } else {
        alert("Error updating resignation: " + (response.data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error updating resignation:", err);
      alert("Error updating resignation record: " + (err.response?.data?.error || err.message || "Unknown error"));
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
      if (response.data && response.data.success) {
        alert(`Status updated to ${newStatus} successfully!`);
        loadResignations();
        loadStats();
      }
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.error || err.message || "Unknown error"));
    }
  };

  const shareWhatsapp = (resignation) => {
    const msg = `Employee Resignation Details:
    
Name: ${resignation.fullName || ""}
Personal Email: ${resignation.email || ""}
Work Email: ${resignation.workEmail || ""}
Phone: ${resignation.phone || ""}
Emergency Contact: ${resignation.emergencyContact || ""}
Department: ${resignation.department || ""}
Reporting Manager: ${resignation.reportingManager || ""}
Hire Date: ${resignation.hireDate || ""}
Address: ${resignation.address || ""}
Current Address: ${resignation.currentAddress || ""}
City: ${resignation.city || ""}, ${resignation.state || ""} - ${resignation.pincode || ""}
PAN: ${resignation.panNo || ""}
Status: ${resignation.status || ""}
Birth Date: ${resignation.birthDate || ""}
Added On: ${resignation.addedOn || ""}
${resignation.resignationReason ? `Resignation Reason: ${resignation.resignationReason}` : ''}
${resignation.lastWorkingDay ? `Last Working Day: ${resignation.lastWorkingDay}` : ''}`;
    
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const shareMail = (resignation) => {
    const subject = `Resignation - ${resignation.fullName || "Employee"}`;
    const body = `Employee Resignation Details:

Name: ${resignation.fullName || ""}
Personal Email: ${resignation.email || ""}
Work Email: ${resignation.workEmail || ""}
Phone: ${resignation.phone || ""}
Emergency Contact: ${resignation.emergencyContact || ""}
Department: ${resignation.department || ""}
Reporting Manager: ${resignation.reportingManager || ""}
Hire Date: ${resignation.hireDate || ""}
Address: ${resignation.address || ""}
Current Address: ${resignation.currentAddress || ""}
City: ${resignation.city || ""}, ${resignation.state || ""} - ${resignation.pincode || ""}
PAN: ${resignation.panNo || ""}
Status: ${resignation.status || ""}
Birth Date: ${resignation.birthDate || ""}
Added On: ${resignation.addedOn || ""}
${resignation.resignationReason ? `Resignation Reason: ${resignation.resignationReason}` : ''}
${resignation.lastWorkingDay ? `Last Working Day: ${resignation.lastWorkingDay}` : ''}`;
    
    window.location.href =
      "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

  const exportToExcel = () => {
    try {
      const dataToExport = (resignations || []).map((item, i) => ({
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
      }));
      
      const ws = XLSX.utils.json_to_sheet(dataToExport);
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
      const selectedData = (resignations || []).filter(item => selectedRows.includes(item._id || item.id));
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

  const resignationData = resignations || [];
  const resignationCount = resignationData.length;

  return (
    <div className="p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Stats Overview */}
      <div className="row mb-3 g-2">
        <div className="col-md-3">
          <Card className="text-center shadow-sm py-2">
            <Card.Body className="p-2">
              <h6 className="text-muted mb-1">Total</h6>
              <h4 className="fw-bold mb-0">{stats.total || 0}</h4>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-warning bg-opacity-10 py-2">
            <Card.Body className="p-2">
              <h6 className="text-muted mb-1">Pending</h6>
              <h4 className="fw-bold text-warning mb-0">{stats.byStatus?.Pending || 0}</h4>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-success bg-opacity-10 py-2">
            <Card.Body className="p-2">
              <h6 className="text-muted mb-1">Processed</h6>
              <h4 className="fw-bold text-success mb-0">{stats.byStatus?.Processed || 0}</h4>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center shadow-sm bg-danger bg-opacity-10 py-2">
            <Card.Body className="p-2">
              <h6 className="text-muted mb-1">Rejected</h6>
              <h4 className="fw-bold text-danger mb-0">{stats.byStatus?.Rejected || 0}</h4>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Resignation Records ({resignationCount})</h6>
            <div className="d-flex gap-2">
              <Button
                variant={showCompactView ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setShowCompactView(!showCompactView)}
                title={showCompactView ? "Show All Columns" : "Show Compact View"}
              >
                {showCompactView ? "Full View" : "Compact"}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadResignations}
                title="Refresh"
              >
                <FaSync />
              </Button>
              {resignationCount > 0 && (
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
            <Alert variant="info" className="d-flex justify-content-between align-items-center py-2 mb-3">
              <span className="small">{selectedRows.length} resignation(s) selected</span>
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

          {resignationCount === 0 ? (
            <Alert variant="info" className="py-2">
              No resignation records found.
            </Alert>
          ) : (
            <>
              <div className="table-responsive" style={{ maxHeight: "70vh", overflow: "auto" }}>
                <Table bordered hover className="mt-2 mb-0" size="sm">
                  <thead className="table-light">
                    <tr>
                      <th width="30px" className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === resignationCount && resignationCount > 0}
                          onChange={handleSelectAll}
                          disabled={resignationCount === 0}
                          className="form-check-input"
                        />
                      </th>
                      <th width="40px" className="text-center">#</th>
                      {!showCompactView && <th width="80px">Emp ID</th>}
                      <th width={showCompactView ? "120px" : "100px"}>Full Name</th>
                      {!showCompactView && <th width="120px">Personal Email</th>}
                      {!showCompactView && <th width="120px">Work Email</th>}
                      <th width="90px">Phone</th>
                      {!showCompactView && <th width="90px">Emergency</th>}
                      <th width="100px">Department</th>
                      {!showCompactView && <th width="100px">Manager</th>}
                      <th width="90px">Status</th>
                      {!showCompactView && <th width="100px">Added On</th>}
                      <th className="text-center" width={showCompactView ? "180px" : "220px"}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resignationData.map((resignation, index) => (
                      <tr key={resignation._id || resignation.id || index}>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(resignation._id || resignation.id)}
                            onChange={() => handleSelectRow(resignation._id || resignation.id)}
                            disabled={editingRowId === (resignation._id || resignation.id)}
                          />
                        </td>
                        <td className="text-center">{index + 1}</td>
                        
                        {/* Employee ID Column */}
                        {!showCompactView && (
                          <td>
                            <small className="text-muted">{resignation.employeeId || "-"}</small>
                          </td>
                        )}
                        
                        {/* Full Name Column */}
                        <td>
                          {editingRowId === (resignation._id || resignation.id) ? (
                            <input
                              type="text"
                              name="fullName"
                              value={inlineEditForm.fullName || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              size="10"
                              required
                            />
                          ) : (
                            <span className="fw-semibold" title={resignation.fullName}>
                              {resignation.fullName && resignation.fullName.length > 15 ? 
                                resignation.fullName.substring(0, 12) + "..." : 
                                resignation.fullName || "-"}
                            </span>
                          )}
                        </td>
                        
                        {/* Personal Email Column */}
                        {!showCompactView && (
                          <td>
                            {editingRowId === (resignation._id || resignation.id) ? (
                              <input
                                type="email"
                                name="email"
                                value={inlineEditForm.email || ""}
                                onChange={handleInlineEditChange}
                                className="form-control form-control-sm"
                                size="10"
                                required
                              />
                            ) : (
                              <a href={`mailto:${resignation.email}`} className="text-decoration-none small" title={resignation.email}>
                                {resignation.email && resignation.email.length > 15 ? 
                                  resignation.email.substring(0, 12) + "..." : 
                                  resignation.email || "-"}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {/* Work Email Column */}
                        {!showCompactView && (
                          <td>
                            {editingRowId === (resignation._id || resignation.id) ? (
                              <input
                                type="email"
                                name="workEmail"
                                value={inlineEditForm.workEmail || ""}
                                onChange={handleInlineEditChange}
                                className="form-control form-control-sm"
                                size="10"
                                required
                              />
                            ) : (
                              <a href={`mailto:${resignation.workEmail}`} className="text-decoration-none small" title={resignation.workEmail}>
                                {resignation.workEmail && resignation.workEmail.length > 15 ? 
                                  resignation.workEmail.substring(0, 12) + "..." : 
                                  resignation.workEmail || "-"}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {/* Phone Column */}
                        <td>
                          {editingRowId === (resignation._id || resignation.id) ? (
                            <input
                              type="text"
                              name="phone"
                              value={inlineEditForm.phone || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              size="8"
                              required
                              maxLength="10"
                            />
                          ) : (
                            <a href={`tel:${resignation.phone}`} className="text-decoration-none small">
                              {resignation.phone || "-"}
                            </a>
                          )}
                        </td>
                        
                        {/* Emergency Contact Column */}
                        {!showCompactView && (
                          <td>
                            {editingRowId === (resignation._id || resignation.id) ? (
                              <input
                                type="text"
                                name="emergencyContact"
                                value={inlineEditForm.emergencyContact || ""}
                                onChange={handleInlineEditChange}
                                className="form-control form-control-sm"
                                size="8"
                                required
                                maxLength="10"
                              />
                            ) : (
                              <a href={`tel:${resignation.emergencyContact}`} className="text-decoration-none small">
                                {resignation.emergencyContact || "-"}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {/* Department Column */}
                        <td>
                          {editingRowId === (resignation._id || resignation.id) ? (
                            <input
                              type="text"
                              name="department"
                              value={inlineEditForm.department || ""}
                              onChange={handleInlineEditChange}
                              className="form-control form-control-sm"
                              size="10"
                              required
                            />
                          ) : (
                            <span title={resignation.department}>
                              {resignation.department && resignation.department.length > 12 ? 
                                resignation.department.substring(0, 10) + "..." : 
                                resignation.department || "-"}
                            </span>
                          )}
                        </td>
                        
                        {/* Reporting Manager Column */}
                        {!showCompactView && (
                          <td>
                            {editingRowId === (resignation._id || resignation.id) ? (
                              <input
                                type="text"
                                name="reportingManager"
                                value={inlineEditForm.reportingManager || ""}
                                onChange={handleInlineEditChange}
                                className="form-control form-control-sm"
                                size="10"
                                required
                              />
                            ) : (
                              <span title={resignation.reportingManager}>
                                {resignation.reportingManager && resignation.reportingManager.length > 12 ? 
                                  resignation.reportingManager.substring(0, 10) + "..." : 
                                  resignation.reportingManager || "-"}
                              </span>
                            )}
                          </td>
                        )}
                        
                        {/* Status Column */}
                        <td>
                          {editingRowId === (resignation._id || resignation.id) ? (
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
                            getStatusBadge(resignation.status || "Pending")
                          )}
                        </td>
                        
                        {/* Added On Column */}
                        {!showCompactView && (
                          <td>
                            {editingRowId === (resignation._id || resignation.id) ? (
                              <input
                                type="date"
                                name="addedOn"
                                value={inlineEditForm.addedOn || ""}
                                onChange={handleInlineEditChange}
                                className="form-control form-control-sm"
                                size="8"
                                required
                              />
                            ) : (
                              <small className="text-muted">{resignation.addedOn || "-"}</small>
                            )}
                          </td>
                        )}
                        
                        {/* Actions Column */}
                        <td className="text-center">
                          {editingRowId === (resignation._id || resignation.id) ? (
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={saveInlineEdit}
                                title="Save"
                              >
                                <FaSave />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={cancelInlineEdit}
                                title="Cancel"
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          ) : (
                            <div className="d-flex gap-1 justify-content-center">
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
                                onClick={() => handleDelete(resignation._id || resignation.id)}
                                title="Delete"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaTrash />
                              </Button>

                              {/* WhatsApp Share Button */}
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => shareWhatsapp(resignation)}
                                title="Share via WhatsApp"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaWhatsapp />
                              </Button>

                              {/* Email Share Button */}
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => shareMail(resignation)}
                                title="Share via Email"
                                className="d-none d-md-inline-flex align-items-center"
                              >
                                <FaEnvelope />
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
                                <Dropdown.Item onClick={() => handleDelete(resignation._id || resignation.id)}>
                                  <FaTrash className="me-2" /> Delete
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

              <div className="mt-3 text-muted small">
                <div>Total Records: {resignationCount} | Selected: {selectedRows.length}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <Modal show={viewModal.show} onHide={() => setViewModal({ show: false, data: null })} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Resignation Details - {viewModal.data?.employeeId || "N/A"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewModal.data && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Employee ID:</label>
                <p className="text-primary">{viewModal.data.employeeId || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Full Name:</label>
                <p>{viewModal.data.fullName || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Personal Email:</label>
                <p>{viewModal.data.email || "-"}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="fw-bold">Work Email:</label>
                <p>{viewModal.data.workEmail || "-"}</p>
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
                <p>{getStatusBadge(viewModal.data.status || "Pending")}</p>
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
              <div className="col-12 mb-3">
                <label className="fw-bold">Address:</label>
                <p>{viewModal.data.address || "-"}</p>
              </div>
              <div className="col-12 mb-3">
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
                <div className="col-12 mb-3">
                  <label className="fw-bold">Resignation Reason:</label>
                  <p>{viewModal.data.resignationReason}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex gap-2">
              <Button variant="success" size="sm" onClick={() => shareWhatsapp(viewModal.data)}>
                <FaWhatsapp className="me-1" /> WhatsApp
              </Button>
              <Button variant="info" size="sm" onClick={() => shareMail(viewModal.data)}>
                <FaEnvelope className="me-1" /> Email
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setViewModal({ show: false, data: null })}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal for Larger Screens (Alternative to inline) */}
      <Modal show={editingRowId !== null} onHide={cancelInlineEdit} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Resignation Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRowId && (
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label fw-bold small">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={inlineEditForm.fullName || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Personal Email *</label>
                <input
                  type="email"
                  name="email"
                  value={inlineEditForm.email || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Work Email *</label>
                <input
                  type="email"
                  name="workEmail"
                  value={inlineEditForm.workEmail || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={inlineEditForm.phone || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                  maxLength="10"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Emergency Contact *</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={inlineEditForm.emergencyContact || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                  maxLength="10"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">PAN Number *</label>
                <input
                  type="text"
                  name="panNo"
                  value={inlineEditForm.panNo || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
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
              <div className="col-md-6">
                <label className="form-label fw-bold small">Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={inlineEditForm.hireDate || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={inlineEditForm.department || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Reporting Manager *</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={inlineEditForm.reportingManager || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={inlineEditForm.birthDate || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Added On *</label>
                <input
                  type="date"
                  name="addedOn"
                  value={inlineEditForm.addedOn || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Status</label>
                <select
                  name="status"
                  value={inlineEditForm.status || "Pending"}
                  onChange={handleInlineEditChange}
                  className="form-select form-select-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Last Working Day</label>
                <input
                  type="date"
                  name="lastWorkingDay"
                  value={inlineEditForm.lastWorkingDay || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold small">Address *</label>
                <textarea
                  name="address"
                  value={inlineEditForm.address || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  rows="2"
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold small">Current Address *</label>
                <textarea
                  name="currentAddress"
                  value={inlineEditForm.currentAddress || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  rows="2"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">City *</label>
                <input
                  type="text"
                  name="city"
                  value={inlineEditForm.city || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">State *</label>
                <input
                  type="text"
                  name="state"
                  value={inlineEditForm.state || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={inlineEditForm.pincode || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  required
                  maxLength="6"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold small">Resignation Reason</label>
                <textarea
                  name="resignationReason"
                  value={inlineEditForm.resignationReason || ""}
                  onChange={handleInlineEditChange}
                  className="form-control form-control-sm"
                  rows="2"
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="secondary" size="sm" onClick={cancelInlineEdit}>
            Cancel
          </Button>
          <Button variant="success" size="sm" onClick={saveInlineEdit}>
            <FaSave className="me-1" /> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}