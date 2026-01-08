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
      "Confirm Password* (min 6 characters)": "", // ADDED confirmPassword column
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(emptyData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resignation Template");
  XLSX.writeFile(workbook, "Employee_Resignation_Template.xlsx");
};

  // Excel Upload (updated to handle new fields)
// Excel Upload (updated to handle new fields)
// Excel Upload - FIXED version
// Excel Upload - FIXED with better validation
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
  
  reader.onload = async (event) => {
    try {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("No data found in the Excel file.");
        return;
      }

      console.log(`Found ${jsonData.length} rows in Excel file`);
      console.log("First row sample:", jsonData[0]);

      // 🔧 IMPROVED: Better field extraction with fallbacks
      const extractField = (row, possibleKeys) => {
        for (const key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      // Helper function to parse dates - MORE FLEXIBLE
      const parseDate = (dateStr) => {
        if (!dateStr) return '';
        
        const dateStrTrimmed = String(dateStr).trim();
        if (!dateStrTrimmed) return '';
        
        console.log(`Parsing date: "${dateStrTrimmed}"`);
        
        // Try different date formats
        try {
          // 1. Already in YYYY-MM-DD format
          if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStrTrimmed)) {
            const [year, month, day] = dateStrTrimmed.split('-');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          // 2. DD-MMM-YYYY format (07-Jan-2000)
          const mmmMatch = dateStrTrimmed.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{4})/i);
          if (mmmMatch) {
            const monthNames = {
              'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
              'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
              'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            
            const day = mmmMatch[1].padStart(2, '0');
            const month = monthNames[mmmMatch[2].toLowerCase().substring(0, 3)] || '01';
            const year = mmmMatch[3];
            return `${year}-${month}-${day}`;
          }
          
          // 3. Excel serial number (like 44197)
          if (/^\d+$/.test(dateStrTrimmed)) {
            const excelSerial = parseInt(dateStrTrimmed, 10);
            if (excelSerial > 0) {
              const excelEpoch = new Date(1899, 11, 30); // Excel epoch
              const date = new Date(excelEpoch.getTime() + (excelSerial - 1) * 24 * 60 * 60 * 1000);
              return date.toISOString().split('T')[0];
            }
          }
          
          // 4. Try JavaScript Date parsing
          const parsedDate = new Date(dateStrTrimmed);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
          
          // 5. Try removing time part if present
          const dateOnly = dateStrTrimmed.split(' ')[0];
          const dateParts = dateOnly.split(/[-/\s]/);
          if (dateParts.length === 3) {
            let year, month, day;
            
            // Try to determine format
            if (dateParts[0].length === 4) {
              // YYYY-MM-DD
              year = dateParts[0];
              month = dateParts[1].padStart(2, '0');
              day = dateParts[2].padStart(2, '0');
            } else {
              // DD-MM-YYYY or MM-DD-YYYY
              if (parseInt(dateParts[0]) > 12) {
                // DD-MM-YYYY
                day = dateParts[0].padStart(2, '0');
                month = dateParts[1].padStart(2, '0');
                year = dateParts[2];
              } else {
                // MM-DD-YYYY
                month = dateParts[0].padStart(2, '0');
                day = dateParts[1].padStart(2, '0');
                year = dateParts[2];
              }
            }
            
            if (year && month && day) {
              return `${year}-${month}-${day}`;
            }
          }
        } catch (e) {
          console.warn("Date parsing error:", e);
        }
        
        console.warn("Could not parse date:", dateStrTrimmed);
        return '';
      };

      // Helper function to format phone numbers
      const formatPhone = (phone) => {
        if (!phone) return '';
        const phoneStr = String(phone).replace(/\D/g, '');
        return phoneStr.slice(0, 10);
      };

      // 🔧 IMPROVED: Process each row with better error reporting
      const validResignations = [];
      const validationErrors = [];
      const duplicateChecks = {
        emails: new Set(),
        phones: new Set(),
        panNos: new Set(),
        workEmails: new Set()
      };

      // Track which columns exist in the file
      const firstRow = jsonData[0];
      const columnNames = Object.keys(firstRow);
      console.log("Detected columns:", columnNames);

      // Get column mapping
      const getColumnMap = () => {
        const map = {};
        
        // Common column name variations
        const possibleNames = {
          fullName: ['Full Name*', 'Full Name', 'FullName', 'fullName', 'Name', 'Employee Name'],
          birthDate: ['Birth Date* (YYYY-MM-DD)', 'Birth Date', 'BirthDate', 'birthDate', 'DOB', 'Date of Birth'],
          email: ['Email*', 'Email', 'email', 'Personal Email', 'personalEmail'],
          workEmail: ['Work Email*', 'Work Email', 'workEmail', 'WorkEmail', 'Company Email'],
          phone: ['Phone* (10 digits)', 'Phone', 'phone', 'Phone Number', 'Mobile', 'Contact Number'],
          emergencyContact: ['Emergency Contact* (10 digits)', 'Emergency Contact', 'emergencyContact', 'EmergencyContact', 'Emergency Phone'],
          hireDate: ['Hire Date* (YYYY-MM-DD)', 'Hire Date', 'HireDate', 'hireDate', 'Joining Date', 'Start Date'],
          department: ['Department*', 'Department', 'department', 'Dept'],
          reportingManager: ['Reporting Manager*', 'Reporting Manager', 'reportingManager', 'ReportingManager', 'Manager'],
          addedOn: ['Added On* (YYYY-MM-DD)', 'Added On', 'addedOn', 'AddedOn', 'Created Date'],
          address: ['Address*', 'Address', 'address', 'Permanent Address'],
          currentAddress: ['Current Address*', 'Current Address', 'currentAddress', 'CurrentAddress', 'Residential Address'],
          pincode: ['Pincode* (6 digits)', 'Pincode', 'pincode', 'Pin Code', 'Postal Code'],
          state: ['State*', 'State', 'state', 'Province'],
          city: ['City*', 'City', 'city', 'Town'],
          panNo: ['PAN No* (ABCDE1234F)', 'PAN No', 'PAN', 'panNo', 'pan', 'PAN Number'],
          password: ['Password* (min 6 characters)', 'Password', 'password', 'Pass'],
          confirmPassword: ['Confirm Password* (min 6 characters)', 'Confirm Password', 'confirmPassword', 'ConfirmPassword']
        };
        
        // Find actual column names
        Object.keys(possibleNames).forEach(key => {
          for (const possibleName of possibleNames[key]) {
            if (columnNames.some(col => col.toLowerCase() === possibleName.toLowerCase())) {
              map[key] = possibleName;
              break;
            }
          }
        });
        
        return map;
      };

      const columnMap = getColumnMap();
      console.log("Column mapping:", columnMap);

      // Today's date for validation
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and header is row 1
        const rowErrors = [];
        
        // 🔧 IMPROVED: Extract data with column mapping
        const extractValue = (field) => {
          if (columnMap[field] && row[columnMap[field]] !== undefined) {
            return String(row[columnMap[field]]).trim();
          }
          // Try direct field names
          return String(row[field] || '').trim();
        };

        const fullName = extractValue('fullName');
        const birthDate = parseDate(extractValue('birthDate'));
        const email = extractValue('email').toLowerCase();
        const workEmail = extractValue('workEmail').toLowerCase();
        const phone = formatPhone(extractValue('phone'));
        const emergencyContact = formatPhone(extractValue('emergencyContact'));
        const hireDate = parseDate(extractValue('hireDate'));
        const department = extractValue('department');
        const reportingManager = extractValue('reportingManager');
        const addedOn = parseDate(extractValue('addedOn')) || new Date().toISOString().split('T')[0];
        const address = extractValue('address');
        const currentAddress = extractValue('currentAddress');
        const pincode = extractValue('pincode').replace(/\D/g, '').slice(0, 6);
        const state = extractValue('state');
        const city = extractValue('city');
        const panNo = extractValue('panNo').toUpperCase().replace(/\s/g, '');
        const password = extractValue('password');
        const confirmPassword = extractValue('confirmPassword');

        // 🔧 IMPROVED: Skip empty rows
        if (!fullName && !email && !phone) {
          console.log(`Skipping row ${rowNumber}: All key fields are empty`);
          return; // Skip this row entirely
        }

        // Validate required fields
        if (!fullName) rowErrors.push("Full Name is required");
        if (!email) rowErrors.push("Email is required");
        if (!workEmail) rowErrors.push("Work Email is required");
        if (!phone) rowErrors.push("Phone number is required");
        if (!password) rowErrors.push("Password is required");

        // Only validate other fields if basic ones are present
        if (fullName && email && workEmail && phone && password) {
          if (!birthDate) rowErrors.push("Birth Date is required");
          if (!emergencyContact) rowErrors.push("Emergency Contact is required");
          if (!hireDate) rowErrors.push("Hire Date is required");
          if (!department) rowErrors.push("Department is required");
          if (!reportingManager) rowErrors.push("Reporting Manager is required");
          if (!address) rowErrors.push("Address is required");
          if (!currentAddress) rowErrors.push("Current Address is required");
          if (!pincode) rowErrors.push("Pincode is required");
          if (!state) rowErrors.push("State is required");
          if (!city) rowErrors.push("City is required");
          if (!panNo) rowErrors.push("PAN Number is required");
          if (!confirmPassword) rowErrors.push("Confirm Password is required");
        }

        // Validate formats (only if field exists)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          rowErrors.push("Invalid email format");
        }

        if (workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
          rowErrors.push("Invalid work email format");
        }

        if (phone && !/^[0-9]{10}$/.test(phone)) {
          rowErrors.push("Phone must be exactly 10 digits");
        }

        if (emergencyContact && !/^[0-9]{10}$/.test(emergencyContact)) {
          rowErrors.push("Emergency Contact must be exactly 10 digits");
        }

        if (pincode && !/^[0-9]{6}$/.test(pincode)) {
          rowErrors.push("Pincode must be exactly 6 digits");
        }

        if (panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNo)) {
          rowErrors.push("Invalid PAN number format (should be ABCDE1234F)");
        }

        // Password validations
        if (password && password.length < 6) {
          rowErrors.push("Password must be at least 6 characters");
        }

        // Validate passwords match
        if (password && confirmPassword && password !== confirmPassword) {
          rowErrors.push("Password and Confirm Password do not match");
        }

        // Check for duplicates within the file
        if (email && duplicateChecks.emails.has(email)) {
          rowErrors.push("Duplicate email in file");
        }
        
        if (phone && duplicateChecks.phones.has(phone)) {
          rowErrors.push("Duplicate phone number in file");
        }
        
        if (panNo && duplicateChecks.panNos.has(panNo)) {
          rowErrors.push("Duplicate PAN number in file");
        }
        
        if (workEmail && duplicateChecks.workEmails.has(workEmail)) {
          rowErrors.push("Duplicate work email in file");
        }

        // Validate dates
        const birthDateObj = birthDate ? new Date(birthDate) : null;
        const hireDateObj = hireDate ? new Date(hireDate) : null;
        const addedOnObj = addedOn ? new Date(addedOn) : null;

        if (hireDate && isNaN(hireDateObj.getTime())) {
          rowErrors.push("Invalid Hire Date format");
        } else if (hireDate && hireDateObj > today) {
          rowErrors.push("Hire Date cannot be in the future");
        }

        if (addedOn && isNaN(addedOnObj.getTime())) {
          rowErrors.push("Invalid Added On date format");
        } else if (addedOn && addedOnObj > today) {
          rowErrors.push("Added On date cannot be in the future");
        }

        // Validate hire date is after birth date
        if (birthDate && hireDate && hireDateObj <= birthDateObj) {
          rowErrors.push("Hire Date must be after Birth Date");
        }

        // Validate age at hire (minimum 18 years)
        if (birthDate && hireDate) {
          const ageAtHire = hireDateObj.getFullYear() - birthDateObj.getFullYear();
          if (ageAtHire < 18) {
            rowErrors.push("Employee must be at least 18 years old at hire");
          }
        }

        // 🔧 IMPROVED: Show what data was extracted
        if (rowErrors.length > 0) {
          console.log(`Row ${rowNumber} errors:`, rowErrors);
          console.log(`Row ${rowNumber} data:`, {
            fullName, email, workEmail, phone, password,
            birthDate, hireDate, panNo
          });
        }

        // If no errors, add to valid records
        if (rowErrors.length === 0) {
          const resignationData = {
            fullName,
            birthDate: birthDate || null,
            email,
            workEmail,
            phone: phone || "",
            emergencyContact: emergencyContact || "",
            hireDate: hireDate || null,
            department: department || "",
            reportingManager: reportingManager || "",
            addedOn: addedOn || new Date().toISOString().split('T')[0],
            address: address || "",
            currentAddress: currentAddress || "",
            pincode: pincode || "",
            state: state || "",
            city: city || "",
            panNo: panNo ? panNo.toUpperCase() : "",
            password,
            resignationDate: new Date().toISOString().split('T')[0],
            lastWorkingDay: null,
            resignationReason: "",
            status: "Pending",
          };

          validResignations.push(resignationData);

          // Add to duplicate checks
          duplicateChecks.emails.add(email);
          duplicateChecks.phones.add(phone);
          duplicateChecks.panNos.add(panNo);
          duplicateChecks.workEmails.add(workEmail);
          
          console.log(`✅ Row ${rowNumber} added: ${fullName} (${email})`);
        } else {
          validationErrors.push({
            row: rowNumber,
            employee: fullName || email || `Row ${rowNumber}`,
            errors: rowErrors
          });
          
          console.log(`❌ Row ${rowNumber} failed:`, rowErrors);
        }
      });

      // Show detailed summary
      console.log(`=== VALIDATION SUMMARY ===`);
      console.log(`Total rows: ${jsonData.length}`);
      console.log(`Valid records: ${validResignations.length}`);
      console.log(`Invalid records: ${validationErrors.length}`);
      console.log(`First valid record:`, validResignations[0]);

      let summaryMessage = `Processed ${jsonData.length} rows:\n`;
      summaryMessage += `• Valid records: ${validResignations.length}\n`;
      summaryMessage += `• Records with errors: ${validationErrors.length}\n\n`;

      if (validationErrors.length > 0) {
        summaryMessage += "First 5 records with errors:\n";
        validationErrors.slice(0, 5).forEach(error => {
          summaryMessage += `Row ${error.row} (${error.employee}): ${error.errors[0]}\n`;
        });
        
        if (validationErrors.length > 5) {
          summaryMessage += `... and ${validationErrors.length - 5} more errors\n`;
        }
        
        // Show sample of errors for debugging
        console.log("Sample errors:", validationErrors.slice(0, 3));
      }

      console.log('Valid resignations to upload:', validResignations.length);
      console.log('Sample data structure:', validResignations[0]);

      // If no valid records, show more detailed error
      if (validResignations.length === 0) {
        alert(
          `❌ No valid records found!\n\n` +
          `Possible issues:\n` +
          `1. Check if you're using the correct Excel template\n` +
          `2. Verify all required columns are present\n` +
          `3. Check date formats (YYYY-MM-DD)\n` +
          `4. Ensure no empty rows\n\n` +
          `First error: ${validationErrors[0]?.errors[0] || 'Unknown error'}`
        );
        return;
      }

      // Ask user what to do
      if (validResignations.length > 0) {
        const userChoice = window.confirm(
          `${summaryMessage}\n\n` +
          `Do you want to upload ${validResignations.length} valid records?\n` +
          `(Click Cancel to only load first valid record into form)`
        );

        if (userChoice && validResignations.length > 0) {
          // Bulk upload to backend
          try {
            setIsSubmitting(true);
            
            console.log('=== SENDING BULK UPLOAD DATA ===');
            console.log('Count:', validResignations.length);
            console.log('First record sample:', {
              fullName: validResignations[0].fullName,
              email: validResignations[0].email,
              passwordLength: validResignations[0].password?.length
            });

            // Send to backend
           const response = await axios.post(`${API_BASE}/bulk-upload`, {
  resignations: validResignations
}, {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000
});

           console.log('=== BULK UPLOAD RESPONSE ===');
console.log('Response:', response.data);
            
            // Handle response (keep your existing success/error handling)
            // ... (your existing response handling code) ...
// Handle response
if (response.data.success) {
  alert(`✅ ${response.data.message}\n\n` +
    `• Total processed: ${response.data.summary?.totalRecords || response.data.count}\n` +
    `• Successfully uploaded: ${response.data.count}\n` +
    `• Failed: ${response.data.summary?.failedRecords || 0}\n` +
    `• Tokens generated: ${response.data.data?.employees?.length || 0}`);
  
  // Store tokens if needed
  if (response.data.data?.employees) {
    // You can store tokens for each employee
    const employeesWithTokens = response.data.data.employees.filter(emp => emp.token);
    console.log(`Employees with tokens: ${employeesWithTokens.length}`);
    
    // Optionally store the first token
    if (response.data.data.firstEmployeeToken) {
      localStorage.setItem('bulkUploadToken', response.data.data.firstEmployeeToken);
    }
  }
  
  // Refresh data or perform other actions
  if (onSaveSuccess) {
    onSaveSuccess();
  }
} else {
  alert(`❌ Upload failed: ${response.data.error || 'Unknown error'}`);
}
          } catch (error) {
            console.error("Error in bulk upload:", error);
            // ... (your existing error handling) ...
          } finally {
            setIsSubmitting(false);
          }
        } else if (validResignations.length > 0) {
          // Load first valid record into form
          // ... (your existing form loading code) ...
        }
      }

    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert(
        `❌ Error reading Excel file\n\n` +
        `Error: ${error.message}\n\n` +
        `Please check:\n` +
        `1. File is not corrupted\n` +
        `2. File format is .xlsx, .xls, or .csv\n` +
        `3. File follows the template format`
      );
    }
  };
  
  reader.onerror = () => {
    alert("❌ Error reading file. Please try again.");
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
      <h5 className="fw-bold mb-4">Employee registration Management</h5>

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3">
            {editingEmployee ? "Edit registration" : "New Employee registration"}
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
