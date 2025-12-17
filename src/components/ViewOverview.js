import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaWhatsapp, FaEnvelope, FaEdit, FaTrash, FaFileExcel, FaSave, FaTimes } from "react-icons/fa";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/overview";

export default function OverviewComplete() {
  // State for form
  const [formData, setFormData] = useState({
    series: '',
    employee: '',
    company: '',
    appraisalCycle: ''
  });
  
  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for table data
  const [savedData, setSavedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // Fetch data on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  // Fetch all records
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const data = await res.json();
      setSavedData(data);
    } catch (err) {
      console.error("Failed to fetch saved data", err);
      alert("Failed to load data. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.series || !formData.employee || !formData.company || !formData.appraisalCycle) {
      alert("Please fill all fields!");
      return;
    }

    try {
      if (isEditing && editingId) {
        // UPDATE existing record
        const response = await fetch(`${API_BASE}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Update failed");
        
        alert("Record updated successfully!");
      } else {
        // CREATE new record
        const response = await fetch(API_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Create failed");
        
        alert("Record created successfully!");
      }

      // Reset form and refresh data
      resetForm();
      setRefreshTrigger(!refreshTrigger);
      
    } catch (error) {
      console.error("Error saving data:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle edit button click
  const handleEdit = (item) => {
    console.log("Editing item:", item);
    
    // Fill form with item data
    setFormData({
      series: item.series || '',
      employee: item.employee || '',
      company: item.company || '',
      appraisalCycle: item.appraisalCycle || ''
    });
    
    // Set editing state
    setEditingId(item._id);
    setIsEditing(true);
    
    // Scroll to form
    setTimeout(() => {
      document.getElementById('overview-form')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Delete failed");
      }
      
      // Refresh data
      setRefreshTrigger(!refreshTrigger);
      alert("Record deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed: " + err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      series: '',
      employee: '',
      company: '',
      appraisalCycle: ''
    });
    setEditingId(null);
    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    resetForm();
  };

  // Handle select row for bulk operations
  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectedRows.length === savedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(savedData.map(item => item._id));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected records?`)) return;

    try {
      const deletePromises = selectedRows.map(id =>
        fetch(`${API_BASE}/${id}`, { method: "DELETE" })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh data and clear selection
      setRefreshTrigger(!refreshTrigger);
      setSelectedRows([]);
      alert(`${selectedRows.length} records deleted successfully!`);
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some records could not be deleted");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(savedData.map((item, i) => ({
        "S.No": i + 1,
        "Series": item.series || "",
        "Employee": item.employee || "",
        "Company": item.company || "",
        "Appraisal Cycle": item.appraisalCycle || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overview");
      XLSX.writeFile(wb, "overview_export.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  // Export selected to Excel
  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record to export");
      return;
    }

    try {
      const selectedData = savedData.filter(item => selectedRows.includes(item._id));
      const ws = XLSX.utils.json_to_sheet(selectedData.map((item, i) => ({
        "S.No": i + 1,
        "Series": item.series || "",
        "Employee": item.employee || "",
        "Company": item.company || "",
        "Appraisal Cycle": item.appraisalCycle || ""
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Overview");
      XLSX.writeFile(wb, "selected_overview_export.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel");
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = (item) => {
    const message = `
Employee Appraisal Details:
Series: ${item.series}
Employee: ${item.employee}
Company: ${item.company}
Appraisal Cycle: ${item.appraisalCycle}
    `;
    const url = `https://wa.me/?text=${encodeURIComponent(message.trim())}`;
    window.open(url, "_blank");
  };

  // Share via Email
  const handleEmailShare = (item) => {
    const subject = `Employee Appraisal - ${item.employee}`;
    const body = `
Series: ${item.series}
Employee: ${item.employee}
Company: ${item.company}
Appraisal Cycle: ${item.appraisalCycle}
    `;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
    window.location.href = url;
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading overview data...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4 text-primary">Employee Appraisal Overview</h2>
      
      {/* FORM SECTION */}
      <div id="overview-form" className="card shadow-sm mb-5 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            {isEditing ? (
              <span className="text-warning">
                <FaEdit className="me-2" />
                Edit Record
              </span>
            ) : (
              <span className="text-success">
                Add New Record
              </span>
            )}
          </h4>
          
          {isEditing && (
            <button 
              className="btn btn-outline-secondary"
              onClick={handleCancelEdit}
            >
              <FaTimes className="me-1" />
              Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-bold">Series *</label>
              <input
                type="text"
                className="form-control"
                name="series"
                value={formData.series}
                onChange={handleFormChange}
                required
                placeholder="Enter series"
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-bold">Employee *</label>
              <input
                type="text"
                className="form-control"
                name="employee"
                value={formData.employee}
                onChange={handleFormChange}
                required
                placeholder="Enter employee name"
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-bold">Company *</label>
              <input
                type="text"
                className="form-control"
                name="company"
                value={formData.company}
                onChange={handleFormChange}
                required
                placeholder="Enter company"
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-bold">Appraisal Cycle *</label>
              <input
                type="text"
                className="form-control"
                name="appraisalCycle"
                value={formData.appraisalCycle}
                onChange={handleFormChange}
                required
                placeholder="Enter appraisal cycle"
              />
            </div>
          </div>
          
          <div className="d-flex gap-2 mt-4">
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {isEditing ? (
                <>
                  <FaSave className="me-2" />
                  Update Record
                </>
              ) : (
                "Submit Record"
              )}
            </button>
            
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
          
          {isEditing && (
            <div className="mt-3">
              <small className="text-muted">
                <strong>Editing Mode:</strong> Record ID: {editingId}
              </small>
            </div>
          )}
        </form>
      </div>
      
      {/* TABLE SECTION */}
      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            <span className="text-primary">Records Overview</span>
            <span className="badge bg-primary ms-2">{savedData.length}</span>
          </h4>
          
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={fetchAll}
              title="Refresh"
            >
              Refresh
            </button>
            
            {savedData.length > 0 && (
              <>
                <button
                  className="btn btn-sm btn-success"
                  onClick={exportToExcel}
                  title="Export All to Excel"
                >
                  <FaFileExcel className="me-1" />
                  Export All
                </button>
              </>
            )}
          </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
            <span>
              <strong>{selectedRows.length}</strong> record(s) selected
            </span>
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

        {savedData.length === 0 ? (
          <div className="alert alert-warning text-center py-4">
            <h5>No records found</h5>
            <p className="mb-0">Use the form above to add your first record.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th width="5%">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === savedData.length && savedData.length > 0}
                      onChange={handleSelectAll}
                      disabled={savedData.length === 0}
                    />
                  </th>
                  <th>#</th>
                  <th>Series</th>
                  <th>Employee</th>
                  <th>Company</th>
                  <th>Appraisal Cycle</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {savedData.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={() => handleSelectRow(item._id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>{item.series}</td>
                    <td>{item.employee}</td>
                    <td>{item.company}</td>
                    <td>{item.appraisalCycle}</td>

                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {/* EDIT BUTTON - This will work now */}
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEdit(item)}
                          title="Edit"
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

                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleWhatsAppShare(item)}
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>

                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleEmailShare(item)}
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
        )}
      </div>
    </div>
  );
}