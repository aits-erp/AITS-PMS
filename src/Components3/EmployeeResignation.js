import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { FaUpload, FaSave, FaUserPlus, FaFileExcel, FaEye, FaEyeSlash } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";

export default function EmployeeResignation({ editingEmployee, onSaveSuccess, onCancelEdit }) {
//  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/employee-resignation";
  const API_BASE = `${process.env.REACT_APP_API_BASE}/api/employee-resignation`;

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    email: "",
    workEmail: "",
    phone: "",
    emergencyContact: "",
    hireDate: "",
    department: "",
    reportingManager: "",
    addedOn: new Date().toISOString().split('T')[0],
    address: "",
    currentAddress: "",
    pincode: "",
    state: "",
    city: "",
    panNo: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load data if editing
  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        fullName: editingEmployee.fullName || "",
        birthDate: editingEmployee.birthDate ? editingEmployee.birthDate.split('T')[0] : "",
        email: editingEmployee.email || "",
        workEmail: editingEmployee.workEmail || "",
        phone: editingEmployee.phone || "",
        emergencyContact: editingEmployee.emergencyContact || "",
        hireDate: editingEmployee.hireDate ? editingEmployee.hireDate.split('T')[0] : "",
        department: editingEmployee.department || "",
        reportingManager: editingEmployee.reportingManager || "",
        addedOn: editingEmployee.addedOn ? editingEmployee.addedOn.split('T')[0] : new Date().toISOString().split('T')[0],
        address: editingEmployee.address || "",
        currentAddress: editingEmployee.currentAddress || "",
        pincode: editingEmployee.pincode || "",
        state: editingEmployee.state || "",
        city: editingEmployee.city || "",
        panNo: editingEmployee.panNo || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      resetForm();
    }
  }, [editingEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      birthDate: "",
      email: "",
      workEmail: "",
      phone: "",
      emergencyContact: "",
      hireDate: "",
      department: "",
      reportingManager: "",
      addedOn: new Date().toISOString().split('T')[0],
      address: "",
      currentAddress: "",
      pincode: "",
      state: "",
      city: "",
      panNo: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.birthDate) newErrors.birthDate = "Birth Date is required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.workEmail.trim()) {
      newErrors.workEmail = "Work Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = "Please enter a valid work email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "Emergency Contact is required";
    } else if (!/^[0-9]{10}$/.test(formData.emergencyContact)) {
      newErrors.emergencyContact = "Please enter a valid 10-digit emergency contact number";
    }
    
    if (!formData.hireDate) newErrors.hireDate = "Hire Date is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.reportingManager.trim()) newErrors.reportingManager = "Reporting Manager is required";
    if (!formData.addedOn) newErrors.addedOn = "Added On date is required";
    
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.currentAddress.trim()) newErrors.currentAddress = "Current Address is required";
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }
    
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    
    if (!formData.panNo.trim()) {
      newErrors.panNo = "PAN Number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.toUpperCase())) {
      newErrors.panNo = "Please enter a valid PAN number (Format: ABCDE1234F)";
    }
    
    // Password validations (only for new entries, not for editing unless password is provided)
    if (!editingEmployee) {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else if (formData.password.trim() && formData.password.length < 6) {
      // If editing and password is provided, validate it
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // Validate hire date is not after current date
    if (formData.hireDate && new Date(formData.hireDate) > new Date()) {
      newErrors.hireDate = "Hire Date cannot be in the future";
    }
    
    // Validate hire date is after birth date
    if (formData.birthDate && formData.hireDate && new Date(formData.hireDate) <= new Date(formData.birthDate)) {
      newErrors.hireDate = "Hire Date must be after Birth Date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      alert("Please fix all validation errors before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        panNo: formData.panNo.toUpperCase(), // Convert PAN to uppercase
        birthDate: formData.birthDate || null,
        hireDate: formData.hireDate || null,
        addedOn: formData.addedOn || new Date().toISOString(),
      };

      // Only include password if provided (for updates) or for new entries
      if (!formData.password.trim() && editingEmployee) {
        delete submissionData.password;
      }

      // Remove confirmPassword from submission data
      delete submissionData.confirmPassword;

      if (editingEmployee && editingEmployee._id) {
        // Update existing resignation
        response = await axios.put(`${API_BASE}/${editingEmployee._id}`, submissionData, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        alert("Resignation updated successfully!");
      } else {
        // Create new resignation
        response = await axios.post(API_BASE, submissionData, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.token) {
          // Store token for immediate login
          localStorage.setItem('employeeToken', response.data.token);
          localStorage.setItem('employeeData', JSON.stringify(response.data.data));
        }
        
        alert("Resignation submitted successfully! You can now login with your email and password.");
      }

      if (response.data.success) {
        // Only reset form on successful submission
        resetForm();
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        if (editingEmployee && onCancelEdit) {
          onCancelEdit();
        }
      } else {
        // Check for unique constraint errors
        if (response.data.error && response.data.error.includes("email")) {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
          alert("This email is already registered. Please use a different email.");
        } else if (response.data.error && response.data.error.includes("workEmail")) {
          setErrors(prev => ({ ...prev, workEmail: "This work email is already registered" }));
          alert("This work email is already registered. Please use a different work email.");
        } else if (response.data.error && response.data.error.includes("phone")) {
          setErrors(prev => ({ ...prev, phone: "This phone number is already registered" }));
          alert("This phone number is already registered. Please use a different phone number.");
        } else if (response.data.error && response.data.error.includes("pan")) {
          setErrors(prev => ({ ...prev, panNo: "This PAN number is already registered" }));
          alert("This PAN number is already registered. Please use a different PAN number.");
        } else if (response.data.error && response.data.error.includes("Password")) {
          setErrors(prev => ({ ...prev, password: response.data.error }));
          alert(response.data.error);
        } else {
          alert(response.data.error || "Something went wrong");
        }
        // DO NOT reset form on error
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      
      if (err.response) {
        if (err.response.status === 400) {
          const errorMsg = err.response.data.error || "Please check your input";
          
          // Check for duplicate errors from backend
          if (errorMsg.toLowerCase().includes("email")) {
            setErrors(prev => ({ ...prev, email: "This email is already registered" }));
            alert("This email is already registered. Please use a different email.");
          } else if (errorMsg.toLowerCase().includes("workemail")) {
            setErrors(prev => ({ ...prev, workEmail: "This work email is already registered" }));
            alert("This work email is already registered. Please use a different work email.");
          } else if (errorMsg.toLowerCase().includes("phone")) {
            setErrors(prev => ({ ...prev, phone: "This phone number is already registered" }));
            alert("This phone number is already registered. Please use a different phone number.");
          } else if (errorMsg.toLowerCase().includes("pan")) {
            setErrors(prev => ({ ...prev, panNo: "This PAN number is already registered" }));
            alert("This PAN number is already registered. Please use a different PAN number.");
          } else if (errorMsg.toLowerCase().includes("password")) {
            setErrors(prev => ({ ...prev, password: errorMsg }));
            alert(`Validation Error: ${errorMsg}`);
          } else {
            alert(`Validation Error: ${errorMsg}`);
          }
        } else if (err.response.status === 404) {
          alert("Resource not found. Please refresh and try again.");
        } else {
          alert(`Server Error: ${err.response.data.error || err.response.statusText}`);
        }
      } else if (err.request) {
        alert("Network Error: Please check your internet connection or server status.");
      } else {
        alert(`Error: ${err.message}`);
      }
      // DO NOT reset form on error - keep the data so user can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excel Download Template (updated to include new fields)
  const downloadExcelTemplate = () => {
    const emptyData = [
      {
        "Full Name*": "",
        "Birth Date* (YYYY-MM-DD)": "",
        "Email*": "",
        "Work Email*": "",
        "Phone* (10 digits)": "",
        "Emergency Contact* (10 digits)": "",
        "Hire Date* (YYYY-MM-DD)": "",
        "Department*": "",
        "Reporting Manager*": "",
        "Added On* (YYYY-MM-DD)": "",
        "Address*": "",
        "Current Address*": "",
        "Pincode* (6 digits)": "",
        "State*": "",
        "City*": "",
        "PAN No* (ABCDE1234F)": "",
        "Password* (min 6 characters)": "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resignation Template");
    XLSX.writeFile(workbook, "Employee_Resignation_Template.xlsx");
  };

  // Excel Upload (updated to handle new fields)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert("Please upload only Excel or CSV files");
      e.target.value = '';
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const row = jsonData[0];
          const tempErrors = {};
          
          // Map Excel columns to form fields
          const newFormData = {
            fullName: row["Full Name*"] || row["Full Name"] || row["FullName"] || row["fullName"] || "",
            birthDate: row["Birth Date* (YYYY-MM-DD)"] || row["Birth Date"] || row["BirthDate"] || row["birthDate"] || "",
            email: row["Email*"] || row["Email"] || row["email"] || "",
            workEmail: row["Work Email*"] || row["Work Email"] || row["workEmail"] || row["WorkEmail"] || "",
            phone: row["Phone* (10 digits)"] || row["Phone"] || row["phone"] || "",
            emergencyContact: row["Emergency Contact* (10 digits)"] || row["Emergency Contact"] || row["emergencyContact"] || row["EmergencyContact"] || "",
            hireDate: row["Hire Date* (YYYY-MM-DD)"] || row["Hire Date"] || row["HireDate"] || row["hireDate"] || "",
            department: row["Department*"] || row["Department"] || row["department"] || "",
            reportingManager: row["Reporting Manager*"] || row["Reporting Manager"] || row["reportingManager"] || row["ReportingManager"] || "",
            addedOn: row["Added On* (YYYY-MM-DD)"] || new Date().toISOString().split('T')[0],
            address: row["Address*"] || row["Address"] || row["address"] || "",
            currentAddress: row["Current Address*"] || row["Current Address"] || row["currentAddress"] || row["CurrentAddress"] || "",
            pincode: row["Pincode* (6 digits)"] || row["Pincode"] || row["pincode"] || "",
            state: row["State*"] || row["State"] || row["state"] || "",
            city: row["City*"] || row["City"] || row["city"] || "",
            panNo: row["PAN No* (ABCDE1234F)"] || row["PAN No"] || row["PAN"] || row["panNo"] || row["pan"] || "",
            password: row["Password* (min 6 characters)"] || row["Password"] || row["password"] || "",
            confirmPassword: row["Password* (min 6 characters)"] || row["Password"] || row["password"] || "",
          };

          // Validate loaded data
          if (!newFormData.fullName.trim()) tempErrors.fullName = "Full Name is required";
          if (!newFormData.birthDate) tempErrors.birthDate = "Birth Date is required";
          
          if (!newFormData.email.trim()) {
            tempErrors.email = "Email is required";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFormData.email)) {
            tempErrors.email = "Please enter a valid email address";
          }
          
          if (!newFormData.workEmail.trim()) {
            tempErrors.workEmail = "Work Email is required";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFormData.workEmail)) {
            tempErrors.workEmail = "Please enter a valid work email address";
          }
          
          if (!newFormData.phone.trim()) {
            tempErrors.phone = "Phone number is required";
          } else if (!/^[0-9]{10}$/.test(newFormData.phone)) {
            tempErrors.phone = "Please enter a valid 10-digit phone number";
          }
          
          if (!newFormData.emergencyContact.trim()) {
            tempErrors.emergencyContact = "Emergency Contact is required";
          } else if (!/^[0-9]{10}$/.test(newFormData.emergencyContact)) {
            tempErrors.emergencyContact = "Please enter a valid 10-digit emergency contact number";
          }
          
          if (!newFormData.hireDate) tempErrors.hireDate = "Hire Date is required";
          if (!newFormData.department.trim()) tempErrors.department = "Department is required";
          if (!newFormData.reportingManager.trim()) tempErrors.reportingManager = "Reporting Manager is required";
          if (!newFormData.addedOn) tempErrors.addedOn = "Added On date is required";
          
          if (!newFormData.address.trim()) tempErrors.address = "Address is required";
          if (!newFormData.currentAddress.trim()) tempErrors.currentAddress = "Current Address is required";
          
          if (!newFormData.pincode.trim()) {
            tempErrors.pincode = "Pincode is required";
          } else if (!/^[0-9]{6}$/.test(newFormData.pincode)) {
            tempErrors.pincode = "Please enter a valid 6-digit pincode";
          }
          
          if (!newFormData.state.trim()) tempErrors.state = "State is required";
          if (!newFormData.city.trim()) tempErrors.city = "City is required";
          
          if (!newFormData.panNo.trim()) {
            tempErrors.panNo = "PAN Number is required";
          } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(newFormData.panNo.toUpperCase())) {
            tempErrors.panNo = "Please enter a valid PAN number (Format: ABCDE1234F)";
          }
          
          // Validate password
          if (!newFormData.password.trim()) {
            tempErrors.password = "Password is required";
          } else if (newFormData.password.length < 6) {
            tempErrors.password = "Password must be at least 6 characters";
          }

          if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors);
            alert("Some fields in the Excel file have validation errors. Please check the form.");
          } else {
            setErrors({});
            alert("Data loaded from Excel successfully!");
          }
          
          setFormData(newFormData);
        } else {
          alert("No data found in the Excel file.");
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the format.");
      }
    };
    
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };
    
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const getInputStyle = (fieldName) => ({
    borderRadius: "10px",
    padding: "12px",
    background: "#f8f9fa",
    border: errors[fieldName] ? "1px solid #dc3545" : "1px solid #dfe1e5",
  });

  return (
    <div className="container p-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <h5 className="fw-bold mb-4">Employee Resignation Management</h5>

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3">
            {editingEmployee ? "Edit Resignation" : "New Employee Resignation"}
          </h6>
          
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">

              {/* Personal Information Section */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  style={getInputStyle('fullName')}
                  required
                  disabled={isSubmitting}
                />
                {errors.fullName && <div className="text-danger small mt-1">{errors.fullName}</div>}
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Birth Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  style={getInputStyle('birthDate')}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthDate && <div className="text-danger small mt-1">{errors.birthDate}</div>}
              </Col>

              {/* Email and Work Email in one row */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  style={getInputStyle('email')}
                  required
                  disabled={isSubmitting}
                />
                {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                <small className="text-muted">Must be unique</small>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Work Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  placeholder="Enter work email"
                  style={getInputStyle('workEmail')}
                  required
                  disabled={isSubmitting}
                />
                {errors.workEmail && <div className="text-danger small mt-1">{errors.workEmail}</div>}
                <small className="text-muted">Must be unique</small>
              </Col>

              {/* Phone and Emergency Contact in one row */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Phone *</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  style={getInputStyle('phone')}
                  maxLength="10"
                  disabled={isSubmitting}
                />
                {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                <small className="text-muted">Must be unique (10 digits only)</small>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Emergency Contact *</Form.Label>
                <Form.Control
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Enter 10-digit emergency contact"
                  style={getInputStyle('emergencyContact')}
                  maxLength="10"
                  required
                  disabled={isSubmitting}
                />
                {errors.emergencyContact && <div className="text-danger small mt-1">{errors.emergencyContact}</div>}
              </Col>

              {/* Employment Information */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Hire Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  style={getInputStyle('hireDate')}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.hireDate && <div className="text-danger small mt-1">{errors.hireDate}</div>}
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Department *</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                  style={getInputStyle('department')}
                  required
                  disabled={isSubmitting}
                />
                {errors.department && <div className="text-danger small mt-1">{errors.department}</div>}
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Reporting Manager *</Form.Label>
                <Form.Control
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleChange}
                  placeholder="Enter reporting manager name"
                  style={getInputStyle('reportingManager')}
                  required
                  disabled={isSubmitting}
                />
                {errors.reportingManager && <div className="text-danger small mt-1">{errors.reportingManager}</div>}
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">Added On *</Form.Label>
                <Form.Control
                  type="date"
                  name="addedOn"
                  value={formData.addedOn}
                  onChange={handleChange}
                  style={getInputStyle('addedOn')}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.addedOn && <div className="text-danger small mt-1">{errors.addedOn}</div>}
              </Col>

              {/* Address Section */}
              <Col md={12}>
                <Form.Label className="fw-semibold">Address *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  style={getInputStyle('address')}
                  disabled={isSubmitting}
                />
                {errors.address && <div className="text-danger small mt-1">{errors.address}</div>}
              </Col>

              <Col md={12}>
                <Form.Label className="fw-semibold">Current Address *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleChange}
                  placeholder="Enter current address"
                  style={getInputStyle('currentAddress')}
                  required
                  disabled={isSubmitting}
                />
                {errors.currentAddress && <div className="text-danger small mt-1">{errors.currentAddress}</div>}
              </Col>

              <Col md={4}>
                <Form.Label className="fw-semibold">Pincode *</Form.Label>
                <Form.Control
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit pincode"
                  style={getInputStyle('pincode')}
                  maxLength="6"
                  disabled={isSubmitting}
                />
                {errors.pincode && <div className="text-danger small mt-1">{errors.pincode}</div>}
              </Col>

              <Col md={4}>
                <Form.Label className="fw-semibold">State *</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  style={getInputStyle('state')}
                  disabled={isSubmitting}
                />
                {errors.state && <div className="text-danger small mt-1">{errors.state}</div>}
              </Col>

              <Col md={4}>
                <Form.Label className="fw-semibold">City *</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  style={getInputStyle('city')}
                  disabled={isSubmitting}
                />
                {errors.city && <div className="text-danger small mt-1">{errors.city}</div>}
              </Col>

              {/* PAN Number */}
              <Col md={6}>
                <Form.Label className="fw-semibold">PAN Number *</Form.Label>
                <Form.Control
                  type="text"
                  name="panNo"
                  value={formData.panNo}
                  onChange={handleChange}
                  placeholder="Enter PAN number (Format: ABCDE1234F)"
                  style={getInputStyle('panNo')}
                  disabled={isSubmitting}
                  onBlur={(e) => {
                    if (e.target.value) {
                      setFormData(prev => ({
                        ...prev,
                        panNo: e.target.value.toUpperCase()
                      }));
                    }
                  }}
                />
                {errors.panNo && <div className="text-danger small mt-1">{errors.panNo}</div>}
                <small className="text-muted">Must be unique (Format: ABCDE1234F)</small>
              </Col>

              {/* Password Fields in one row */}
              {!editingEmployee ? (
                <>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Password *</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password (min 6 characters)"
                        style={getInputStyle('password')}
                        disabled={isSubmitting}
                      />
                      <Button
                        variant="link"
                        className="position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                    {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                    <small className="text-muted">Minimum 6 characters required</small>
                  </Col>

                  <Col md={6}>
                    <Form.Label className="fw-semibold">Confirm Password *</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        style={getInputStyle('confirmPassword')}
                        disabled={isSubmitting}
                      />
                      <Button
                        variant="link"
                        className="position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                  </Col>
                </>
              ) : (
                <Col md={6}>
                  <Form.Label className="fw-semibold">New Password (Optional)</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave empty to keep current password"
                      style={getInputStyle('password')}
                      disabled={isSubmitting}
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                  {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                  <small className="text-muted">Leave empty to keep current password</small>
                </Col>
              )}

              {/* Excel Buttons */}
              <Col md={12}>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={downloadExcelTemplate}
                      disabled={isSubmitting}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaFileExcel /> Download Template
                    </Button>

                    <div className="position-relative">
                      <input
                        type="file"
                        id="fileUpload"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="d-none"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="fileUpload"
                        className="btn btn-primary d-flex align-items-center gap-2"
                      >
                        <FaUpload /> Upload Excel
                      </label>
                    </div>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Note: Download template for required format. All fields are mandatory including password.
                  </small>
                </div>
              </Col>

              {/* Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <Col md={12}>
                  <div className="alert alert-danger">
                    <strong>Please fix the following errors:</strong>
                    <ul className="mb-0 mt-2">
                      {Object.entries(errors).map(([field, error]) => (
                        error && <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </Col>
              )}

              {/* Submit Button */}
              <Col md={12}>
                <div className="d-flex justify-content-end gap-2">
                  {editingEmployee && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        resetForm();
                        if (onCancelEdit) onCancelEdit();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    variant="success" 
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                    className="d-flex align-items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : editingEmployee ? (
                      <>
                        <FaSave /> Update Resignation
                      </>
                    ) : (
                      <>
                        <FaUserPlus /> Submit Resignation
                      </>
                    )}
                  </Button>
                </div>
              </Col>

            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}