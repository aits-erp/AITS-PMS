import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaWhatsapp, FaEnvelope, FaUpload, FaUser, FaIdCard } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ViewUserView() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/user-views";
  const USER_ID = "ethan-hunt";
  
  // State for contacts with name and employeeId
  const [records, setRecords] = useState([
    {
      name: "Ethan Hunt",
      employeeId: "EMP-001",
      phone: "555-100-2222",
      contact: "John Doe (Friend)",
      address: "10 Wall Street, New York, USA"
    },
    {
      name: "Ethan Hunt",
      employeeId: "EMP-001",
      phone: "777-345-6789",
      contact: "Steve Smith (Brother)",
      address: "55 Silicon Valley, California, USA"
    },
    {
      name: "Ethan Hunt",
      employeeId: "EMP-001",
      phone: "999-555-3333",
      contact: "Martha Wayne (Mother)",
      address: "Gotham City, Wayne Tower USA"
    }
  ]);

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE}/user/${USER_ID}`);
      
      if (response.data.success) {
        const user = response.data.data;
        
        if (user.contacts && user.contacts.length > 0) {
          // Ensure all contacts have name and employeeId fields
          const contactsWithDefaults = user.contacts.map(contactItem => ({
            ...contactItem,
            name: contactItem.name || user.userName || "Unknown",
            employeeId: contactItem.employeeId || user.employeeId || "Unknown"
          }));
          setRecords(contactsWithDefaults);
        }
        
        if (user._id) {
          setUserId(user._id);
        }
        alert("User data loaded successfully!");
      } else {
        alert("User data loaded with default values.");
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      alert("Failed to load user data from server. Using default data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!name || !employeeId || !phone || !contact || !address) {
      alert("Please fill all fields (Name, Employee ID, Phone, Contact, and Address)!");
      return;
    }

    try {
      const contactData = { name, employeeId, phone, contact, address };

      if (editIndex !== null) {
        // Update existing contact
        if (userId) {
          const response = await axios.put(`${API_BASE}/${userId}/contacts/${editIndex}`, contactData);
          if (response.data.success) {
            const updatedRecords = [...records];
            updatedRecords[editIndex] = contactData;
            setRecords(updatedRecords);
            setEditIndex(null);
            alert("Contact updated successfully!");
          } else {
            alert("Error updating contact: " + response.data.error);
          }
        } else {
          // Local update if no userId
          const updatedRecords = [...records];
          updatedRecords[editIndex] = contactData;
          setRecords(updatedRecords);
          setEditIndex(null);
          alert("Contact updated successfully!");
        }
      } else {
        // Add new contact
        if (userId) {
          const response = await axios.post(`${API_BASE}/${userId}/contacts`, contactData);
          if (response.data.success) {
            setRecords([...records, contactData]);
            alert("Contact added successfully!");
          } else {
            alert("Error adding contact: " + response.data.error);
          }
        } else {
          // Local add if no userId
          setRecords([...records, contactData]);
          alert("Contact added successfully!");
        }
      }

      // Clear form
      setName("");
      setEmployeeId("");
      setPhone("");
      setContact("");
      setAddress("");
      
    } catch (err) {
      console.error("Error saving contact:", err);
      alert("Error saving contact: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (index) => {
    const item = records[index];
    setName(item.name || "");
    setEmployeeId(item.employeeId || "");
    setPhone(item.phone);
    setContact(item.contact);
    setAddress(item.address);
    setEditIndex(index);
    alert(`Now editing contact: ${item.name || "Unknown"} (${item.employeeId || "No ID"})`);
  };

  const handleDelete = async (index) => {
    const contactToDelete = records[index].name || records[index].contact;
    if (!window.confirm(`Are you sure you want to delete contact: ${contactToDelete}?`)) return;
    
    try {
      if (userId) {
        const response = await axios.delete(`${API_BASE}/${userId}/contacts/${index}`);
        if (response.data.success) {
          const filtered = records.filter((_, i) => i !== index);
          setRecords(filtered);
          alert("Contact deleted successfully!");
        } else {
          alert("Error deleting contact: " + response.data.error);
        }
      } else {
        // Local delete if no userId
        const filtered = records.filter((_, i) => i !== index);
        setRecords(filtered);
        alert("Contact deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("Error deleting contact: " + (err.response?.data?.error || err.message));
    }
  };

  const sendWhatsApp = (phone, contactName) => {
    // Remove any non-numeric characters from phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert("Invalid phone number format!");
      return;
    }
    alert(`Opening WhatsApp to contact: ${contactName} (${phone})`);
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const sendEmail = (contact, contactName, phone) => {
    // Extract email from contact if it exists, otherwise use contact text
    const emailMatch = contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      alert(`Opening email client to send email to: ${contactName} - ${emailMatch[0]}`);
      window.open(`mailto:${emailMatch[0]}`, "_blank");
    } else {
      alert(`No email found in contact details: ${contactName}\nContact: ${contact}\nPhone: ${phone}\nPlease add an email address to send email.`);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("No file selected!");
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
      alert("Please upload only Excel (.xlsx, .xls) or CSV files!");
      e.target.value = ""; // Clear file input
      return;
    }

    alert("Processing uploaded file...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0 && userId) {
          const contactsToImport = [];
          
          for (const row of jsonData) {
            // Extract data from Excel columns with multiple possible column names
            const extractedName = row["Name"] || row["name"] || row["NAME"] || 
                                row["Employee Name"] || row["employeeName"] || 
                                row["Full Name"] || row["fullName"] || "";
            
            const extractedEmployeeId = row["Employee ID"] || row["employeeId"] || 
                                      row["EmployeeID"] || row["EMPLOYEE_ID"] || 
                                      row["ID"] || row["id"] || "";
            
            const extractedPhone = row["Phone"] || row["phone"] || row["Phone Number"] || 
                                 row["phone_number"] || row["PHONE"] || row["Mobile"] || 
                                 row["mobile"] || "";
            
            const extractedContact = row["Contact"] || row["contact"] || row["Emergency Contact"] || 
                                   row["emergency_contact"] || row["CONTACT"] || 
                                   row["Emergency Name"] || row["emergency_name"] || "";
            
            const extractedAddress = row["Address"] || row["address"] || row["Current Address"] || 
                                    row["current_address"] || row["ADDRESS"] || 
                                    row["Location"] || row["location"] || "";

            if (extractedName && extractedEmployeeId && extractedPhone && extractedContact && extractedAddress) {
              // Format phone number if it's a number
              let formattedPhone = extractedPhone.toString();
              if (typeof extractedPhone === 'number') {
                formattedPhone = extractedPhone.toString();
                if (formattedPhone.length === 10) {
                  formattedPhone = `${formattedPhone.slice(0, 3)}-${formattedPhone.slice(3, 6)}-${formattedPhone.slice(6)}`;
                }
              }

              // Format contact
              let formattedContact = extractedContact.toString();
              if (formattedContact && !formattedContact.includes('(')) {
                const relationship = row["Relationship"] || row["relationship"] || row["RELATIONSHIP"] || "Contact";
                formattedContact = `${formattedContact} (${relationship})`;
              }

              contactsToImport.push({
                name: extractedName.toString(),
                employeeId: extractedEmployeeId.toString(),
                phone: formattedPhone,
                contact: formattedContact,
                address: extractedAddress.toString()
              });
            }
          }

          if (contactsToImport.length > 0) {
            // Import to backend
            const response = await axios.post(`${API_BASE}/${userId}/contacts`, contactsToImport);
            if (response.data.success) {
              // Update local state
              setRecords([...records, ...contactsToImport]);
              alert(`${contactsToImport.length} contact(s) imported successfully!`);
            } else {
              alert("Error importing contacts: " + response.data.error);
            }
          } else {
            alert("No valid contacts found in the file. Please check the file format.\nRequired columns: Name, Employee ID, Phone, Contact, Address");
          }
        } else if (jsonData.length > 0) {
          // Handle single row for form fill (no userId)
          const firstRow = jsonData[0];
          
          const extractedName = firstRow["Name"] || firstRow["name"] || firstRow["NAME"] || 
                              firstRow["Employee Name"] || firstRow["employeeName"] || 
                              firstRow["Full Name"] || firstRow["fullName"] || "";
          
          const extractedEmployeeId = firstRow["Employee ID"] || firstRow["employeeId"] || 
                                    firstRow["EmployeeID"] || firstRow["EMPLOYEE_ID"] || 
                                    firstRow["ID"] || firstRow["id"] || "";
          
          const extractedPhone = firstRow["Phone"] || firstRow["phone"] || firstRow["Phone Number"] || 
                               firstRow["phone_number"] || firstRow["PHONE"] || firstRow["Mobile"] || 
                               firstRow["mobile"] || "";
          
          const extractedContact = firstRow["Contact"] || firstRow["contact"] || firstRow["Emergency Contact"] || 
                                 firstRow["emergency_contact"] || firstRow["CONTACT"] || 
                                 firstRow["Emergency Name"] || firstRow["emergency_name"] || "";
          
          const extractedAddress = firstRow["Address"] || firstRow["address"] || firstRow["Current Address"] || 
                                  firstRow["current_address"] || firstRow["ADDRESS"] || 
                                  firstRow["Location"] || firstRow["location"] || "";

          // Format phone number
          let formattedPhone = extractedPhone.toString();
          if (typeof extractedPhone === 'number') {
            formattedPhone = extractedPhone.toString();
            if (formattedPhone.length === 10) {
              formattedPhone = `${formattedPhone.slice(0, 3)}-${formattedPhone.slice(3, 6)}-${formattedPhone.slice(6)}`;
            }
          }

          // Format contact
          let formattedContact = extractedContact.toString();
          if (formattedContact && !formattedContact.includes('(')) {
            const relationship = firstRow["Relationship"] || firstRow["relationship"] || firstRow["RELATIONSHIP"] || "Contact";
            formattedContact = `${formattedContact} (${relationship})`;
          }

          // Set form fields
          setName(extractedName.toString());
          setEmployeeId(extractedEmployeeId.toString());
          setPhone(formattedPhone);
          setContact(formattedContact);
          setAddress(extractedAddress.toString());
          alert("Form filled from uploaded file!");
        } else {
          alert("No data found in the uploaded file.");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Error reading file. Please make sure it's a valid Excel/CSV file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Clear file input
    e.target.value = "";
  };

  const cancelEdit = () => {
    if (name || employeeId || phone || contact || address) {
      if (window.confirm("Discard your changes?")) {
        setEditIndex(null);
        setName("");
        setEmployeeId("");
        setPhone("");
        setContact("");
        setAddress("");
        alert("Edit cancelled.");
      }
    } else {
      setEditIndex(null);
      setName("");
      setEmployeeId("");
      setPhone("");
      setContact("");
      setAddress("");
    }
  };

  return (
    <>
      <div className="container py-4">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading user data...</p>
          </div>
        )}

        {/* TITLE */}
        <h3 className="fw-bold mb-4">
          View User Contacts
        </h3>

        {/* CONTACT DETAILS FORM */}
        <div className="p-4 rounded mb-4 bg-white border">
          <h5 className="fw-bold mb-3" style={{ color:"#8b4500" }}>
            Contact Details
          </h5>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                <FaUser className="me-2" /> Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                <FaIdCard className="me-2" /> Employee ID <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID (e.g., EMP-001)"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
              <input
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Emergency Contact <span className="text-danger">*</span></label>
              <input
                className="form-control"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Jane Hunt (Spouse)"
              />
            </div>

            <div className="col-12 mb-3">
              <label className="form-label fw-semibold">Current Address <span className="text-danger">*</span></label>
              <textarea
                className="form-control"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Tech Lane, San Jose, CA"
              />
            </div>
          </div>

          {/* UPLOAD SECTION */}
          <div className="mb-4 border rounded p-3 bg-light">
            <h6 className="fw-semibold mb-2">Upload Contact Data</h6>
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <input
                  type="file"
                  id="fileUpload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="d-none"
                />
                <label
                  htmlFor="fileUpload"
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  title="Upload Excel/CSV File"
                >
                  <FaUpload /> Upload File
                </label>
              </div>
              <small className="text-muted flex-grow-1">
                Upload Excel/CSV file to auto-fill contact details. Required columns: Name, Employee ID, Phone, Contact, Address
              </small>
            </div>
            <div className="mt-2">
              <small className="text-muted">
                <strong>Format example:</strong> Name: "John Doe", Employee ID: "EMP-001", Phone: "555-123-4567", Contact: "Jane Smith (Spouse)", Address: "123 Street, City"
              </small>
            </div>
          </div>

          <div className="d-flex gap-3">
            <button className="btn btn-warning fw-semibold px-4" onClick={handleSubmit}>
              {editIndex !== null ? "Update Contact" : "Save Contact Updates"}
            </button>
            
            {editIndex !== null && (
              <button className="btn btn-secondary fw-semibold px-4" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="mb-4">
          <h5 className="fw-bold mb-3">Saved Contact Details ({records.length})</h5>

          <div className="table-responsive">
            <table className="table table-bordered text-center">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Phone</th>
                  <th>Emergency Contact</th>
                  <th>Address</th>
                  <th width="260">Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No contacts found. Add your first contact above.
                    </td>
                  </tr>
                ) : (
                  records.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>
                        <span className="badge bg-info text-dark">{item.employeeId}</span>
                      </td>
                      <td>{item.phone}</td>
                      <td>{item.contact}</td>
                      <td>{item.address}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-primary d-flex align-items-center"
                            onClick={() => handleEdit(index)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="btn btn-sm btn-danger d-flex align-items-center"
                            onClick={() => handleDelete(index)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>

                          <button
                            className="btn btn-sm btn-success d-flex align-items-center"
                            onClick={() => sendWhatsApp(item.phone, item.name || item.contact)}
                            title="Send WhatsApp"
                          >
                            <FaWhatsapp />
                          </button>

                          <button
                            className="btn btn-sm btn-info d-flex align-items-center"
                            onClick={() => sendEmail(item.contact, item.name || item.contact, item.phone)}
                            title="Send Email"
                          >
                            <FaEnvelope />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}