// src/components/UserDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RefreshCw, List, Zap, User, Star, Plus, Check, Phone, Save, Edit, 
  X, AlertTriangle, TrendingUp, TrendingDown, Layers, BookOpen, 
  Send, LogOut, Key 
} from 'lucide-react';
import axios from 'axios';

// --- Modal Component for Reminders ---
const ReminderModal = ({ goals, onClose }) => {
  const incompleteGoals = goals.filter(g => !g.completed);

  if (incompleteGoals.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all scale-100">
        <div className="p-6 border-b border-yellow-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-yellow-700 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
            Action Required: {incompleteGoals.length} Active Reminders
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-80 overflow-y-auto">
          <p className="text-gray-600 mb-4">
            You have important goals requiring attention. Keep these top of mind!
          </p>
          <ul className="space-y-3">
            {incompleteGoals.map((goal, index) => (
              <li key={goal.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg text-gray-800 text-sm shadow-sm">
                <span className="font-medium">Goal {index + 1}:</span> {goal.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-yellow-200 text-right">
          <button
            onClick={onClose}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

// The main UserDashboard component
const UserDashboard = ({ onLogout }) => {
  const [employeeData, setEmployeeData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    status: '',
    jobTitle: 'Employee',
  });
  
  const [performanceData, setPerformanceData] = useState(null);
  const [employeeGoals, setEmployeeGoals] = useState([]);
  const [pipData, setPipData] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [contactNumber, setContactNumber] = useState('N/A (Click to Edit)');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showTrainingCatalog, setShowTrainingCatalog] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState(null);
  const [showLogoutButton, setShowLogoutButton] = useState(false);

  // Refs for input fields
  const newGoalInputRef = useRef(null);
  const feedbackTextareaRef = useRef(null);
  const queryTextareaRef = useRef(null);
  const contactInputRef = useRef(null);

  // Local refs to prevent focus loss
  const localGoalInputRef = useRef(null);
  const localFeedbackTextareaRef = useRef(null);
  const localQueryTextareaRef = useRef(null);
  const localContactInputRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

  const getEmployeeToken = () => {
    return localStorage.getItem('employeeToken');
  };

  // Fetch employee data from resignation API
  const fetchEmployeeContactInfo = useCallback(async (employeeId) => {
    try {
      console.log(`Fetching employee contact info for ID: ${employeeId}`);
      
      try {
        const response = await axios.get(`${API_BASE}/employee-resignation/profile/${employeeId}`);
        console.log('Employee resignation profile response:', response.data);
        
        if (response.data.success) {
          return response.data.data.phone || 'N/A';
        }
      } catch (err) {
        console.log('Employee resignation profile endpoint failed:', err.message);
      }
      
      try {
        const response = await axios.get(`${API_BASE}/employee-resignation/employee-id/${employeeId}`);
        console.log('Employee resignation by ID response:', response.data);
        
        if (response.data.success) {
          return response.data.data.phone || 'N/A';
        }
      } catch (err) {
        console.log('Alternative endpoint failed:', err.message);
      }
      
      const storedData = localStorage.getItem('employeeData');
      if (storedData) {
        const data = JSON.parse(storedData);
        return data.phone || data.contactNumber || 'N/A';
      }
      
      return 'N/A';
      
    } catch (error) {
      console.error('Error fetching employee contact info:', error);
      return 'N/A';
    }
  }, [API_BASE]);

  // Fetch performance data from backend
  const fetchPerformanceData = useCallback(async (employeeId) => {
    try {
      console.log(`Fetching performance data for employee ID: ${employeeId}`);
      
      let response;
      
      try {
        response = await axios.get(`${API_BASE}/employee-details/by-employee-id/${employeeId}`);
        console.log('Performance data response:', response.data);
        
        if (response.data.success && response.data.data.length > 0) {
          const latestRecord = response.data.data[0];
          console.log('Latest performance record:', latestRecord);
          
          return {
            rating: latestRecord.rating || 'Not Rated',
            reviewer: latestRecord.reviewer || 'Not Assigned',
            addedOn: latestRecord.addedOn || new Date().toISOString().split('T')[0],
            company: latestRecord.company || 'Shrirang Automation and Controls',
            employeeName: latestRecord.employee || 'Employee',
            employeeId: latestRecord.employeeId || employeeId,
            status: 'Processed'
          };
        }
      } catch (err) {
        console.log('Endpoint 1 failed:', err.message);
      }
      
      try {
        response = await axios.get(`${API_BASE}/employee-details`);
        console.log('All employee details response:', response.data);
        
        if (response.data.success && response.data.data.length > 0) {
          const employeeRecords = response.data.data.filter(record => 
            record.employeeId === employeeId || 
            (employeeData.fullName && record.employee.toLowerCase().includes(employeeData.fullName.toLowerCase()))
          );
          
          if (employeeRecords.length > 0) {
            const latestRecord = employeeRecords[0];
            console.log('Found record via filtering:', latestRecord);
            
            return {
              rating: latestRecord.rating || 'Not Rated',
              reviewer: latestRecord.reviewer || 'Not Assigned',
              addedOn: latestRecord.addedOn || latestRecord.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              company: latestRecord.company || 'Shrirang Automation and Controls',
              employeeName: latestRecord.employee || 'Employee',
              employeeId: latestRecord.employeeId || employeeId,
              status: 'Processed'
            };
          }
        }
      } catch (err) {
        console.log('Endpoint 2 failed:', err.message);
      }
      
      console.log('No performance data found in backend, using fallback');
      return {
        rating: 'Not Rated',
        reviewer: 'Manager',
        addedOn: new Date().toISOString().split('T')[0],
        company: 'Shrirang Automation and Controls',
        employeeName: employeeData.fullName || 'Employee',
        employeeId: employeeId,
        status: 'No Review Found'
      };
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
      return {
        rating: 'Data Unavailable',
        reviewer: 'System',
        addedOn: new Date().toISOString().split('T')[0],
        company: 'Shrirang Automation and Controls',
        employeeName: employeeData.fullName || 'Employee',
        employeeId: employeeId,
        status: 'Error'
      };
    }
  }, [API_BASE, employeeData.fullName]);

  // Fetch goals data from backend
  const fetchGoalsData = useCallback(async (employeeId) => {
    try {
      console.log(`Fetching goals data for employee ID: ${employeeId}`);
      
      try {
        const response = await axios.get(`${API_BASE}/new-goals/employee/${employeeId}`);
        console.log('Goals data response from /new-goals/employee endpoint:', response.data);
        
        if (response.data.success && response.data.data.length > 0) {
          return processGoalsData(response.data.data);
        }
      } catch (err) {
        console.log('Endpoint /new-goals/employee failed:', err.message);
        
        try {
          const allResponse = await axios.get(`${API_BASE}/new-goals`);
          console.log('All goals response for filtering:', allResponse.data);
          
          if (allResponse.data.success && allResponse.data.data.length > 0) {
            const employeeGoals = allResponse.data.data.filter(goal => 
              goal.employeeId === employeeId
            );
            
            if (employeeGoals.length > 0) {
              console.log(`Found ${employeeGoals.length} goals via filtering`);
              return processGoalsData(employeeGoals);
            }
          }
        } catch (filterErr) {
          console.log('Filtering also failed:', filterErr.message);
        }
      }
      
      console.log('No goals found for employee:', employeeId);
      return {
        goals: [],
        completionRate: 0,
        projectScore: '0.0',
        totalGoals: 0,
        completedGoals: 0
      };
      
    } catch (error) {
      console.error('Error fetching goals data:', error);
      return {
        goals: [],
        completionRate: 0,
        projectScore: '0.0',
        totalGoals: 0,
        completedGoals: 0
      };
    }
  }, [API_BASE]);

  // Helper function to process goals data
  const processGoalsData = useCallback((goals) => {
    const completedGoals = goals.filter(goal => 
      goal.status === "Completed" || 
      goal.progress === "100%" || 
      (typeof goal.progress === 'string' && goal.progress.includes('100'))
    );
    
    const completionRate = goals.length > 0 
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0;
    
    let totalScore = 0;
    let scoreCount = 0;
    
    goals.forEach(goal => {
      if (goal.progress && goal.progress.includes('%')) {
        const progress = parseFloat(goal.progress.replace('%', ''));
        const score = progress / 20;
        totalScore += score;
        scoreCount++;
      }
    });
    
    const projectScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '0.0';
    
    return {
      goals: goals,
      completionRate: completionRate,
      projectScore: projectScore,
      totalGoals: goals.length,
      completedGoals: completedGoals.length
    };
  }, []);

  // Fetch PIP data from backend by employee ID
  const fetchPIPData = useCallback(async (employeeId) => {
    try {
      console.log(`Fetching PIP data for employee ID: ${employeeId}`);
      
      try {
        const response = await axios.get(`${API_BASE}/pips/employee/${employeeId}`);
        console.log('PIP data response:', response.data);
        
        if (response.data.success && response.data.data.length > 0) {
          const latestPIP = response.data.data[0];
          console.log('Latest PIP record:', latestPIP);
          
          return {
            targets: latestPIP.targets || 'No specific targets set',
            comments: latestPIP.comments || 'No manager comments available',
            reason: latestPIP.reason || 'No reason specified',
            dateIssued: latestPIP.dateIssued || 'Date not specified',
            hasPIP: true
          };
        } else {
          console.log('No PIP found for this employee');
          return {
            targets: 'No active Performance Improvement Plan',
            comments: 'Your performance is meeting expectations',
            reason: 'No improvement plan needed',
            dateIssued: 'N/A',
            hasPIP: false
          };
        }
      } catch (err) {
        console.log('PIP endpoint failed:', err.message);
        
        try {
          const allResponse = await axios.get(`${API_BASE}/pips`);
          console.log('All PIPs response for filtering:', allResponse.data);
          
          if (allResponse.data.success && allResponse.data.data.length > 0) {
            const employeePIPs = allResponse.data.data.filter(pip => 
              pip.employeeId === employeeId
            );
            
            if (employeePIPs.length > 0) {
              const latestPIP = employeePIPs[0];
              console.log('Found PIP via filtering:', latestPIP);
              
              return {
                targets: latestPIP.targets || 'No specific targets set',
                comments: latestPIP.comments || 'No manager comments available',
                reason: latestPIP.reason || 'No reason specified',
                dateIssued: latestPIP.dateIssued || 'Date not specified',
                hasPIP: true
              };
            }
          }
        } catch (filterErr) {
          console.log('PIP filtering also failed:', filterErr.message);
        }
      }
      
      console.log('No PIP data found for employee:', employeeId);
      return {
        targets: 'No active Performance Improvement Plan',
        comments: 'Your performance is meeting expectations',
        reason: 'No improvement plan needed',
        dateIssued: 'N/A',
        hasPIP: false
      };
      
    } catch (error) {
      console.error('Error fetching PIP data:', error);
      return {
        targets: 'Unable to fetch PIP data',
        comments: 'Please check your connection',
        reason: 'Data unavailable',
        dateIssued: 'N/A',
        hasPIP: false
      };
    }
  }, [API_BASE]);

  // --- 1. FETCH EMPLOYEE DATA AND SYNC OFFLINE DATA ---
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        
        const storedData = localStorage.getItem('employeeData');
        if (!storedData) {
          throw new Error('No employee data found. Please login again.');
        }

        const data = JSON.parse(storedData);
        
        const phoneFromBackend = await fetchEmployeeContactInfo(data.employeeId);
        
        const employeeDataObj = {
          employeeId: data.employeeId || '',
          fullName: data.fullName || 'Employee',
          email: data.email || '',
          phone: phoneFromBackend || data.phone || '',
          status: data.status || 'Active',
          jobTitle: 'Employee',
        };
        
        setEmployeeData(employeeDataObj);
        setContactNumber(phoneFromBackend || 'N/A (Click to Edit)');
        
        try {
          const performanceResponse = await fetchPerformanceData(data.employeeId);
          setPerformanceData(performanceResponse);
          
          const goalsResponse = await fetchGoalsData(data.employeeId);
          
          setEmployeeGoals(goalsResponse.goals.map(goal => ({
            id: goal._id || goal.id,
            text: goal.goal || goal.description || 'No goal description',
            completed: goal.status === "Completed" || goal.progress === "100%",
            progress: goal.progress || "0%",
            status: goal.status || "Pending",
            createdAt: goal.createdAt || new Date().toISOString(),
            isGroup: goal.isGroup || false
          })));
          
          const pipResponse = await fetchPIPData(data.employeeId);
          setPipData(pipResponse);
          
          await syncOfflineData(data.employeeId);
        } catch (apiError) {
          console.log('Offline mode activated:', apiError.message);
          setIsOfflineMode(true);
          
          const savedGoals = localStorage.getItem('offline_goals');
          if (savedGoals) {
            setEmployeeGoals(JSON.parse(savedGoals));
          }
          
          const savedContact = localStorage.getItem('offline_contact');
          if (savedContact) {
            setContactNumber(savedContact);
          }
          
          const savedPerformance = localStorage.getItem('offline_performance');
          if (savedPerformance) {
            setPerformanceData(JSON.parse(savedPerformance));
          }
          
          const savedPIP = localStorage.getItem('offline_pip');
          if (savedPIP) {
            setPipData(JSON.parse(savedPIP));
          }
        }
        
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError(err.message || 'Failed to load employee data');
        
        if (err.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [fetchEmployeeContactInfo, fetchGoalsData, fetchPerformanceData, fetchPIPData]);

  const syncOfflineData = async (employeeId) => {
    try {
      const offlineGoals = JSON.parse(localStorage.getItem('offline_goals') || '[]');
      if (offlineGoals.length > 0) {
        await axios.post(`${API_BASE}/employee/${employeeId}/goals/sync`, { goals: offlineGoals });
        localStorage.removeItem('offline_goals');
      }

      const offlineQueries = JSON.parse(localStorage.getItem('offline_queries') || '[]');
      if (offlineQueries.length > 0) {
        await axios.post(`${API_BASE}/employee/${employeeId}/queries/sync`, { queries: offlineQueries });
        localStorage.removeItem('offline_queries');
      }

      const offlineFeedback = JSON.parse(localStorage.getItem('offline_feedback') || '[]');
      if (offlineFeedback.length > 0) {
        await axios.post(`${API_BASE}/employee/${employeeId}/feedback/sync`, { feedback: offlineFeedback });
        localStorage.removeItem('offline_feedback');
      }
    } catch (syncError) {
      console.log('Sync failed, staying in offline mode:', syncError.message);
    }
  };

  useEffect(() => {
    if (isOfflineMode && employeeGoals.length > 0) {
      localStorage.setItem('offline_goals', JSON.stringify(employeeGoals));
    }
    
    if (isOfflineMode && performanceData) {
      localStorage.setItem('offline_performance', JSON.stringify(performanceData));
    }
    
    if (isOfflineMode && pipData) {
      localStorage.setItem('offline_pip', JSON.stringify(pipData));
    }
  }, [employeeGoals, performanceData, pipData, isOfflineMode]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeData');
      localStorage.removeItem('userType');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const addGoal = useCallback(async () => {
    if (!newGoalText.trim()) return;

    const newGoal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (!isOfflineMode && employeeData.employeeId) {
      try {
        const response = await axios.post(`${API_BASE}/new-goals`, {
          goal: newGoalText.trim(),
          employee: employeeData.fullName,
          employeeId: employeeData.employeeId,
          status: "Pending",
          progress: "0%",
          company: "Shrirang Automation and Controls"
        });
        
        if (response.data.success) {
          const backendGoal = response.data.data;
          setEmployeeGoals(prev => [{
            id: backendGoal._id || backendGoal.id,
            text: backendGoal.goal || newGoalText.trim(),
            completed: false,
            progress: backendGoal.progress || "0%",
            status: backendGoal.status || "Pending",
            createdAt: backendGoal.createdAt || new Date().toISOString(),
            isGroup: backendGoal.isGroup || false
          }, ...prev]);
          
          await fetchGoalsData(employeeData.employeeId);
        }
      } catch (err) {
        console.error('Failed to save goal to backend:', err);
        setIsOfflineMode(true);
        setEmployeeGoals(prev => [newGoal, ...prev]);
      }
    } else {
      setEmployeeGoals(prev => [newGoal, ...prev]);
    }
    
    setNewGoalText('');
    
    // Focus back on input after adding
    setTimeout(() => {
      if (localGoalInputRef.current) {
        localGoalInputRef.current.focus();
      }
    }, 50);
  }, [newGoalText, isOfflineMode, employeeData.employeeId, employeeData.fullName, API_BASE, fetchGoalsData]);

  const toggleGoal = useCallback(async (goal) => {
    const updatedGoal = { 
      ...goal, 
      completed: !goal.completed,
      status: !goal.completed ? "Completed" : "Pending",
      progress: !goal.completed ? "100%" : "0%"
    };
    
    if (!isOfflineMode && employeeData.employeeId) {
      try {
        await axios.put(`${API_BASE}/new-goals/${goal.id}`, {
          status: updatedGoal.status,
          progress: updatedGoal.progress
        });
        
        setEmployeeGoals(prev => prev.map(g => 
          g.id === goal.id ? updatedGoal : g
        ));
        
        await fetchGoalsData(employeeData.employeeId);
      } catch (err) {
        console.error('Failed to update goal in backend:', err);
        setIsOfflineMode(true);
        setEmployeeGoals(prev => prev.map(g => 
          g.id === goal.id ? updatedGoal : g
        ));
      }
    } else {
      setEmployeeGoals(prev => prev.map(g => 
        g.id === goal.id ? updatedGoal : g
      ));
    }
  }, [isOfflineMode, employeeData.employeeId, API_BASE, fetchGoalsData]);

  const deleteGoal = useCallback(async (goalId) => {
    if (!isOfflineMode && employeeData.employeeId) {
      try {
        await axios.delete(`${API_BASE}/new-goals/${goalId}`);
        setEmployeeGoals(prev => prev.filter(g => g.id !== goalId));
        
        await fetchGoalsData(employeeData.employeeId);
      } catch (err) {
        console.error('Failed to delete goal from backend:', err);
        setIsOfflineMode(true);
        setEmployeeGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } else {
      setEmployeeGoals(prev => prev.filter(g => g.id !== goalId));
    }
  }, [isOfflineMode, employeeData.employeeId, API_BASE, fetchGoalsData]);
  
  const handleSaveContactInfo = useCallback(async () => {
    const trimmedContact = contactNumber.trim();
    if (!trimmedContact || trimmedContact === 'N/A (Click to Edit)') {
      setError("Contact number cannot be empty.");
      return;
    }

    localStorage.setItem('offline_contact', trimmedContact);
    
    setEmployeeData(prev => ({
      ...prev,
      phone: trimmedContact
    }));
    
    if (!isOfflineMode && employeeData.employeeId) {
      try {
        await axios.put(`${API_BASE}/employee-resignation/${employeeData.employeeId}`, {
          phone: trimmedContact
        });
        console.log('Contact number updated in backend');
      } catch (err) {
        console.error('Failed to update contact in backend:', err);
        setIsOfflineMode(true);
      }
    }
    
    setIsEditingContact(false);
    setError(null);
  }, [contactNumber, isOfflineMode, employeeData.employeeId, API_BASE]);

  const handleContactChange = useCallback((e) => {
    setContactNumber(e.target.value);
  }, []);

  const submitResourceQuery = useCallback(async () => {
    if (!submissionText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionStatus(null);
    setError(null);

    const queryData = {
      query: submissionText.trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      employeeId: employeeData.employeeId,
    };

    if (!isOfflineMode && employeeData.employeeId) {
      try {
        const response = await axios.post(`${API_BASE}/employee/${employeeData.employeeId}/queries`, {
          queryText: submissionText.trim()
        });
        
        if (response.data.success) {
          setSubmissionStatus('success');
        }
      } catch (err) {
        console.error('Failed to submit query to backend:', err);
        setIsOfflineMode(true);
        
        const offlineQueries = JSON.parse(localStorage.getItem('offline_queries') || '[]');
        offlineQueries.push(queryData);
        localStorage.setItem('offline_queries', JSON.stringify(offlineQueries));
        setSubmissionStatus('success');
      }
    } else {
      const offlineQueries = JSON.parse(localStorage.getItem('offline_queries') || '[]');
      offlineQueries.push(queryData);
      localStorage.setItem('offline_queries', JSON.stringify(offlineQueries));
      setSubmissionStatus('success');
    }
    
    setSubmissionText('');
    setIsSubmitting(false);
    
    setTimeout(() => setSubmissionStatus(null), 4000);
  }, [submissionText, isSubmitting, employeeData.employeeId, isOfflineMode, API_BASE]);

  const submit360Feedback = useCallback(async () => {
    if (!feedbackText.trim() || isFeedbackSubmitting) return;

    setIsFeedbackSubmitting(true);
    setFeedbackSubmissionStatus(null);
    setError(null);

    const feedbackData = {
      feedback: feedbackText.trim(),
      type: '360 Feedback',
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      employeeId: employeeData.employeeId,
    };

    if (!isOfflineMode && employeeData.employeeId) {
      try {
        const response = await axios.post(`${API_BASE}/employee/${employeeData.employeeId}/feedback`, {
          feedbackText: feedbackText.trim()
        });
        
        if (response.data.success) {
          setFeedbackSubmissionStatus('success');
        }
      } catch (err) {
        console.error('Failed to submit feedback to backend:', err);
        setIsOfflineMode(true);
        
        const offlineFeedback = JSON.parse(localStorage.getItem('offline_feedback') || '[]');
        offlineFeedback.push(feedbackData);
        localStorage.setItem('offline_feedback', JSON.stringify(offlineFeedback));
        setFeedbackSubmissionStatus('success');
      }
    } else {
      const offlineFeedback = JSON.parse(localStorage.getItem('offline_feedback') || '[]');
      offlineFeedback.push(feedbackData);
      localStorage.setItem('offline_feedback', JSON.stringify(offlineFeedback));
      setFeedbackSubmissionStatus('success');
    }
    
    setFeedbackText('');
    setIsFeedbackSubmitting(false);
    
    setTimeout(() => setFeedbackSubmissionStatus(null), 4000);
  }, [feedbackText, isFeedbackSubmitting, employeeData.employeeId, isOfflineMode, API_BASE]);

  const handleSyncOfflineData = async () => {
    if (!employeeData.employeeId) return;
    
    try {
      setIsOfflineMode(false);
      await syncOfflineData(employeeData.employeeId);
      
      const performanceResponse = await fetchPerformanceData(employeeData.employeeId);
      setPerformanceData(performanceResponse);
      
      const goalsResponse = await fetchGoalsData(employeeData.employeeId);
      setEmployeeGoals(goalsResponse.goals.map(goal => ({
        id: goal._id || goal.id,
        text: goal.goal || goal.description || 'No goal description',
        completed: goal.status === "Completed" || goal.progress === "100%",
        progress: goal.progress || "0%",
        status: goal.status || "Pending",
        createdAt: goal.createdAt || new Date().toISOString(),
        isGroup: goal.isGroup || false
      })));
      
      const pipResponse = await fetchPIPData(employeeData.employeeId);
      setPipData(pipResponse);
      
      const phoneFromBackend = await fetchEmployeeContactInfo(employeeData.employeeId);
      setContactNumber(phoneFromBackend || employeeData.phone || 'N/A (Click to Edit)');
      setEmployeeData(prev => ({
        ...prev,
        phone: phoneFromBackend || prev.phone
      }));
      
      localStorage.removeItem('offline_performance');
      localStorage.removeItem('offline_pip');
      
      alert('Data synced successfully!');
    } catch (err) {
      setIsOfflineMode(true);
      alert('Sync failed. Please check your connection.');
    }
  };

  const calculateGoalCompletion = useCallback(() => {
    if (employeeGoals.length === 0) return 0;
    const completedGoals = employeeGoals.filter(g => g.completed).length;
    return Math.round((completedGoals / employeeGoals.length) * 100);
  }, [employeeGoals]);

  const calculateProjectScore = useCallback(() => {
    if (employeeGoals.length === 0) return '0.0';
    
    const scores = employeeGoals
      .filter(goal => goal.progress && goal.progress.includes('%'))
      .map(goal => {
        const progress = parseFloat(goal.progress.replace('%', ''));
        return (progress / 20);
      });
    
    if (scores.length === 0) return '0.0';
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return average.toFixed(1);
  }, [employeeGoals]);

  const RenderOverallPerformanceDashboard = useCallback(() => {
    const completionRate = calculateGoalCompletion();
    const projectScore = calculateProjectScore();
    
    const ringColor = completionRate > 80 ? 'border-green-500' : 
                     completionRate > 50 ? 'border-yellow-500' : 'border-red-500';
    const bgColor = completionRate > 80 ? 'bg-green-100' : 
                   completionRate > 50 ? 'bg-yellow-100' : 'bg-red-100';

    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
          Overall Performance Snapshot
          {isOfflineMode && (
            <span className="ml-3 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              Offline Mode
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-2 gap-6 ">
          <div className={`p-5 rounded-xl shadow-md flex flex-col items-center ${bgColor}`}>
            <div className={`relative w-24 h-24 rounded-full border-4 ${ringColor} flex items-center justify-center mb-3`}>
              <div className={`w-20 h-20 rounded-full bg-white flex items-center justify-center font-bold text-xl text-gray-800`}>
                {completionRate}%
              </div>
            </div>
            <span className="text-base font-medium text-gray-700 text-center">Goal Completion</span>
            <span className="text-sm text-gray-500 mt-1">
              {employeeGoals.filter(g => g.completed).length} of {employeeGoals.length} goals
            </span>
          </div>

          <div className="p-5 rounded-xl shadow-md flex flex-col items-center bg-gray-100">
            <Star className="w-10 h-10 text-yellow-500 mb-3" />
            <span className="text-3xl font-bold text-gray-800">{projectScore} / 5.0</span>
            <span className="text-base font-medium text-gray-700 text-center">Avg Project Score</span>
            <span className="text-sm text-gray-500 mt-1">
              Based on goal progress
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Data fetched for Employee ID: {employeeData.employeeId}</p>
          {isOfflineMode && <p className="text-yellow-600">⚠️ Showing cached data</p>}
        </div>
      </div>
    );
  }, [calculateGoalCompletion, calculateProjectScore, employeeGoals.length, employeeData.employeeId, isOfflineMode]);
  
  const RenderImprovementAreasDashboard = useCallback(() => {
    const hasPIP = pipData?.hasPIP || false;
    const targets = pipData?.targets || 'No specific improvement targets set';
    const comments = pipData?.comments || 'No manager comments available';
    const pipReason = pipData?.reason || 'No reason specified';
    const pipDate = pipData?.dateIssued || 'N/A';
    
    const rating = performanceData?.rating || 'Not Rated';
    
    let areas = ['Technical Skills', 'Communication'];
    let tips = ['Complete assigned training modules', 'Participate in team meetings'];
    
    if (hasPIP) {
      areas = ['Specific Improvement Targets & Timeline'];
      tips = ['Manager Review Comments'];
    } else if (rating === 'Need Improvement' || rating === 'Poor') {
      areas = ['Technical Depth', 'Time Management', 'Stakeholder Communication'];
      tips = ['Schedule 1:1 with tech lead weekly', 'Use project management tools', 'Document decisions clearly'];
    } else if (rating === 'Satisfactory' || rating === 'Meets Expectations') {
      areas = ['Advanced Technical Skills', 'Leadership', 'Mentoring'];
      tips = ['Take advanced courses', 'Lead small projects', 'Mentor junior team members'];
    } else if (rating === 'Excellent' || rating === 'Outstanding') {
      areas = ['Strategic Thinking', 'Innovation', 'Cross-functional Collaboration'];
      tips = ['Participate in strategy sessions', 'Propose innovative solutions', 'Collaborate with other departments'];
    }

    return (
      <div className="p-6 ">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <TrendingDown className="w-6 h-6 text-red-600 mr-3" />
          Key Areas for Improvement
          {hasPIP && (
            <span className="ml-3 px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
              Performance Improvement Plan Active
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="font-semibold text-yellow-700 mb-3 flex items-center text-lg">
              <Layers className="w-5 h-5 mr-2"/> 
              {hasPIP ? 'Specific Improvement Targets & Timeline' : 'Focus Areas'}
            </h4>
            {hasPIP ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-yellow-200">
                  <p className="text-gray-700 whitespace-pre-line">{targets}</p>
                </div>
                {pipReason && pipReason !== 'No reason specified' && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {pipReason}
                  </div>
                )}
                {pipDate && pipDate !== 'N/A' && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Issued on:</span> {pipDate}
                  </div>
                )}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-base text-gray-700">
                {areas.map((area, index) => (
                  <li key={index} className="font-medium">{area}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-5 bg-gray-100 rounded-xl">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center text-lg">
              <List className="w-5 h-5 mr-2"/> 
              {hasPIP ? 'Manager Review Comments' : 'Actionable Tips'}
            </h4>
            {hasPIP ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-gray-300">
                  <p className="text-gray-700 whitespace-pre-line">{comments}</p>
                </div>
                <div className="text-sm text-gray-600 italic">
                  These comments are based on your Performance Improvement Plan review.
                </div>
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-base text-gray-700">
                {tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 italic">
          {hasPIP ? (
            <p className="text-red-600">
              ⚠️ You have an active Performance Improvement Plan. Please focus on the above targets.
            </p>
          ) : (
            <p>Recommendations based on your current rating: <span className="font-medium">{rating}</span></p>
          )}
        </div>
      </div>
    );
  }, [pipData, performanceData?.rating]);
  
  const RenderTrainingCatalog = useCallback(() => (
    <div className="mt-4 p-5 bg-yellow-50 border border-yellow-200 rounded-lg ">
      <h4 className="font-bold text-yellow-800 mb-3 flex items-center text-lg">
        <BookOpen className="w-5 h-5 mr-2"/> Available Courses
      </h4>
      <ul className="space-y-3 text-base text-gray-700">
        <li className="p-3 bg-white rounded shadow-sm">Advanced React Patterns <span className="text-sm text-yellow-500 ml-2">(Enroll)</span></li>
        <li className="p-3 bg-white rounded shadow-sm">Effective Time Management for Projects <span className="text-sm text-yellow-500 ml-2">(Enroll)</span></li>
        <li className="p-3 bg-white rounded shadow-sm">Leadership & Mentoring Fundamentals <span className="text-sm text-yellow-500 ml-2">(Enroll)</span></li>
      </ul>
      <p className="text-sm italic text-gray-500 mt-4">This catalog is synced with your performance profile.</p>
    </div>
  ), []);

  const RenderFeedbackForm = useCallback(() => (
    <div className="mt-4 p-5 bg-gray-100 border rounded-lg">
      <h4 className="font-bold text-gray-800 mb-3 text-lg">
        Confidential 360 Feedback
      </h4>
      <textarea
        ref={localFeedbackTextareaRef}
        id="feedback-textarea"
        name="feedback"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-base h-36 resize-none"
        placeholder="Enter feedback for a colleague or manager (it will be anonymous)..."
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
      />
      <button
        onClick={submit360Feedback}
        disabled={!feedbackText.trim() || isFeedbackSubmitting}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all shadow-md active:scale-95 mt-3 flex items-center justify-center space-x-2 text-base
          ${!feedbackText.trim() || isFeedbackSubmitting 
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
            : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`
        }
      >
        {isFeedbackSubmitting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>{isOfflineMode ? 'Submit Feedback (Offline)' : 'Submit Feedback'}</span>
          </>
        )}
      </button>

      {feedbackSubmissionStatus === 'success' && (
        <p className="mt-4 text-base text-green-600 font-medium flex items-center">
          <Check className="w-5 h-5 mr-2"/> 
          {isOfflineMode ? 'Saved for later sync!' : 'Feedback submitted successfully!'}
        </p>
      )}
      {feedbackSubmissionStatus === 'error' && (
        <p className="mt-4 text-base text-red-600 font-medium flex items-center">
          <X className="w-5 h-5 mr-2"/> Submission failed.
        </p>
      )}
    </div>
  ), [feedbackText, isFeedbackSubmitting, isOfflineMode, submit360Feedback, feedbackSubmissionStatus]);

  const RenderResourcesAndSubmission = useCallback(() => {
    const handleQuerySubmit = () => {
      submitResourceQuery();
      setTimeout(() => {
        if (localQueryTextareaRef.current) {
          localQueryTextareaRef.current.focus();
        }
      }, 50);
    };

    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <Zap className="w-6 h-6 text-yellow-600 mr-3" />
          Needful Resources & Support
          {isOfflineMode && (
            <span className="ml-3 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              Working Offline
            </span>
          )}
        </h3>
        
        {isOfflineMode && (
          <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-base text-yellow-700">
                  You're working in offline mode. All changes will be saved locally.
                </p>
                <button
                  onClick={handleSyncOfflineData}
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Sync Data Now
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 mb-6 border-b pb-5">
          <button 
            onClick={() => {setShowTrainingCatalog(!showTrainingCatalog); setShowFeedbackForm(false);}}
            className="w-full text-left p-4 rounded-lg border transition-colors duration-150 flex justify-between items-center text-gray-700 hover:bg-yellow-50 bg-white shadow-sm"
          >
            <span className="font-medium flex items-center text-base">
              <BookOpen className="w-5 h-5 mr-3 text-yellow-600" />
              Training & Development Catalog
            </span>
            <span className="text-sm text-gray-500">{showTrainingCatalog ? 'Hide' : 'Show'}</span>
          </button>
          
          <button 
            onClick={() => {setShowFeedbackForm(!showFeedbackForm); setShowTrainingCatalog(false);}}
            className="w-full text-left p-4 rounded-lg border transition-colors duration-150 flex justify-between items-center text-gray-700 hover:bg-yellow-50 bg-white shadow-sm"
          >
            <span className="font-medium flex items-center text-base">
              <Send className="w-5 h-5 mr-3 text-yellow-600" />
              Submit 360 Feedback
            </span>
            <span className="text-sm text-gray-500">{showFeedbackForm ? 'Hide Form' : 'Show Form'}</span>
          </button>
        </div>

        {showTrainingCatalog && <RenderTrainingCatalog />}
        {showFeedbackForm && <RenderFeedbackForm />}
        
        <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-8 border-t pt-6">
          Submit a General Support Query
        </h4>
        <textarea
          ref={localQueryTextareaRef}
          id="query-textarea"
          name="query"
          className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-base h-32 resize-none"
          placeholder="Need help finding a resource? Submit your question here..."
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
        />
        
        <button
          onClick={handleQuerySubmit}
          disabled={!submissionText.trim() || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all shadow-md active:scale-95 mt-4 flex items-center justify-center space-x-2 text-base
            ${!submissionText.trim() || isSubmitting 
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`
          }
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>{isOfflineMode ? 'Send Query (Offline)' : 'Send Query'}</span>
          )}
        </button>

        {submissionStatus === 'success' && (
          <p className="mt-4 text-base text-green-600 font-medium flex items-center">
            <Check className="w-5 h-5 mr-2"/> 
            {isOfflineMode ? 'Saved for later sync!' : 'Query submitted successfully!'}
          </p>
        )}
        {submissionStatus === 'error' && (
          <p className="mt-4 text-base text-red-600 font-medium flex items-center">
            <X className="w-5 h-5 mr-2"/> Submission failed.
          </p>
        )}
      </div>
    );
  }, [isOfflineMode, showTrainingCatalog, showFeedbackForm, submissionText, isSubmitting, submissionStatus, handleSyncOfflineData, submitResourceQuery]);

  const getRatingColor = useCallback((rating) => {
    switch (rating) {
      case 'Outstanding': return 'bg-green-500';
      case 'Excellent': return 'bg-green-400';
      case 'Satisfactory': return 'bg-blue-500';
      case 'Meets Expectations': return 'bg-blue-500';
      case 'Need Improvement': return 'bg-yellow-500'; 
      case 'Poor': return 'bg-red-500';
      case 'Unsatisfactory': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }, []);

  const RenderReportSummary = useCallback(() => {
    const performance = performanceData;
    
    if (!performance) {
      return (
        <div className="text-center text-gray-500 p-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-yellow-500" />
          <p className="text-lg">Fetching latest performance data...</p>
        </div>
      );
    }

    const rating = performance.rating || 'Not Rated';
    const ratingColor = getRatingColor(rating);
    const reviewDate = performance.addedOn || 'N/A';
    const reviewer = performance.reviewer || 'Manager';
    const company = performance.company || 'Not specified';

    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <Star className="w-6 h-6 text-yellow-500 mr-3" />
          Latest Performance Review
          {isOfflineMode && performanceData && (
            <span className="ml-3 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              Cached Data
            </span>
          )}
        </h3>
        
        <div className="mb-5">
          <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 border">
            <span className={`px-4 py-2 text-base font-bold text-white rounded-full ${ratingColor}`}>
              {rating}
            </span>
            <div className="flex-1">
              <p className="text-base text-gray-600">
                Reviewed by: <span className="font-semibold">{reviewer}</span>
              </p>
              <p className="text-sm text-gray-500">
                Review Date: {reviewDate}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Rating Details:</h4>
            <p className="text-blue-700">
              Your performance has been rated as <span className="font-semibold">"{rating}"</span>
            </p>
            <p className="text-sm text-blue-600 mt-2">
              This rating is based on your recent performance review conducted by {reviewer}.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Additional Information:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-medium">{company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{employeeData.employeeId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-sm text-gray-500">
          <p>*This rating reflects the last saved performance review.</p>
          {isOfflineMode && (
            <p className="text-yellow-600">
              ⚠️ Showing cached data. Connect to sync with latest updates.
            </p>
          )}
        </div>
      </div>
    );
  }, [performanceData, isOfflineMode, getRatingColor, employeeData.employeeId]);

  const RenderPersonalInformation = useCallback(() => {
    const handleEditClick = () => {
      setIsEditingContact(true);
      setTimeout(() => {
        if (localContactInputRef.current) {
          localContactInputRef.current.focus();
          localContactInputRef.current.select();
        }
      }, 100);
    };

    const handleContactSave = () => {
      handleSaveContactInfo();
      setTimeout(() => {
        if (localContactInputRef.current) {
          localContactInputRef.current.blur();
        }
      }, 50);
    };

    const handleContactKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleContactSave();
      }
      if (e.key === 'Escape') {
        setIsEditingContact(false);
        const savedContact = localStorage.getItem('offline_contact');
        if (savedContact) {
          setContactNumber(savedContact);
        } else {
          setContactNumber(employeeData.phone || 'N/A (Click to Edit)');
        }
      }
    };

    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <User className="w-7 h-7 text-yellow-600 mr-3" />
          Personal Information
        </h3>
        
        <div className="space-y-5">
          <div className="flex items-start">
            <dt className="text-lg font-medium text-gray-700 w-36 flex-shrink-0">Name:</dt>
            <dd className="text-lg font-semibold text-gray-900">{employeeData.fullName}</dd>
          </div>
          <div className="flex items-start">
            <dt className="text-lg font-medium text-gray-700 w-36 flex-shrink-0">Email :</dt>
            <dd className="text-lg font-semibold text-gray-900 break-words">{employeeData.email}</dd>
          </div>
          <div className="flex items-start">
            <dt className="text-lg font-medium text-gray-700 w-36 flex-shrink-0">Status:</dt>
            <dd className="text-lg font-semibold">
              <span className={`px-4 py-2 rounded-full text-base font-medium ${
                employeeData.status === 'Processed' ? 'bg-green-100 text-green-800' :
                employeeData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                employeeData.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {employeeData.status}
              </span>
            </dd>
          </div>

          <div className="flex items-start">
            <dt className="text-lg font-medium text-gray-700 w-36 flex-shrink-0">Employee ID :</dt>
            <dd className="text-lg font-semibold text-gray-900 break-words">{employeeData.employeeId}</dd>
          </div>

          <div className="flex items-start">
            <dt className="text-lg font-medium text-gray-700 w-36 flex-shrink-0">Contact No:</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {employeeData.phone && employeeData.phone !== 'N/A' 
                ? employeeData.phone 
                : 'N/A (Click to Edit)'}
            </dd>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <dt className="text-lg font-medium text-gray-700 w-36 flex items-center flex-shrink-0">
                  <Phone className="w-5 h-5 mr-2 text-gray-500"/>
                  Update Contact:
                </dt>
                <dd className="flex-1">
                  {isEditingContact ? (
                    <input
                      ref={localContactInputRef}
                      id="contact-number-input"
                      name="contactNumber"
                      type="text"
                      className="p-3 border-2 border-yellow-300 rounded-lg w-full text-lg focus:ring-yellow-500 focus:border-yellow-500"
                      value={contactNumber}
                      onChange={handleContactChange}
                      onKeyDown={handleContactKeyDown}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-900">
                      {contactNumber !== 'N/A (Click to Edit)' && contactNumber !== 'N/A' 
                        ? contactNumber 
                        : 'N/A (Click to Edit)'}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-end mt-2 space-x-2">
                {isEditingContact ? (
                  <>
                    <button
                      onClick={handleContactSave}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors flex items-center space-x-2 text-lg"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingContact(false);
                        const savedContact = localStorage.getItem('offline_contact');
                        if (savedContact) {
                          setContactNumber(savedContact);
                        } else {
                          setContactNumber(employeeData.phone || 'N/A (Click to Edit)');
                        }
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-colors flex items-center space-x-2 text-lg"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition-colors flex items-center space-x-2 text-lg"
                    title="Edit Contact"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Contact</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [employeeData, isEditingContact, contactNumber, handleContactChange, handleSaveContactInfo]);

  const RenderGoalsList = useCallback(() => {
    const goalsCount = employeeGoals.length;
    const completedCount = employeeGoals.filter(g => g.completed).length;

    const handleAddGoalClick = () => {
      if (!newGoalText.trim()) return;
      addGoal();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleAddGoalClick();
      }
    };

    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <List className="w-6 h-6 text-yellow-600 mr-3" />
          My Current Goals
          {isOfflineMode && (
            <span className="ml-3 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {isOfflineMode ? 'Offline Mode' : 'Connected'}
            </span>
          )}
        </h3>
        
        <div className="mb-5 text-base text-gray-600 font-medium">
          Progress: {completedCount} / {goalsCount} Goals Completed
          {isOfflineMode && (
            <span className="ml-2 text-yellow-600 text-sm">
              (Data will sync when online)
            </span>
          )}
        </div>

        <div className="flex mb-6 space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <input
            ref={localGoalInputRef}
            id="new-goal-input"
            name="newGoal"
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-base"
            placeholder="Add a new goal or reminder..."
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleAddGoalClick}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg transition-colors shadow-md active:scale-95 flex items-center justify-center space-x-2 font-semibold text-base"
          >
            <Plus className="w-6 h-6" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {isOfflineMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-blue-700 text-sm">You have unsynced goals</span>
              </div>
              <button
                onClick={handleSyncOfflineData}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-4 max-h-96 overflow-y-auto pr-3">
          {goalsCount === 0 && <p className="text-gray-500 italic text-base p-4">No goals set yet. Add one above!</p>}
          {employeeGoals.map((goal) => (
            <li 
              key={goal.id} 
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition duration-150 hover:shadow-md"
            >
              <div className="flex-grow mr-4">
                <div 
                  className={`cursor-pointer select-none text-base ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal.text}
                </div>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`text-xs px-2 py-1 rounded ${goal.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {goal.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Progress: {goal.progress || '0%'}
                  </span>
                  {isOfflineMode && (
                    <span className="text-xs text-yellow-600">(Offline)</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => toggleGoal(goal)}
                  className={`p-2 rounded-full text-white transition-colors shadow-inner ${goal.completed ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors"
                  title="Delete Goal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m4 0h-4"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [employeeGoals, isOfflineMode, newGoalText, addGoal, toggleGoal, deleteGoal, handleSyncOfflineData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <RefreshCw className="w-16 h-16 animate-spin text-yellow-500 mb-4" />
        <span className="text-xl font-medium text-gray-700">Loading Employee Dashboard...</span>
        <span className="text-base text-gray-500 mt-3">Fetching your data from backend</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {showReminderModal && <ReminderModal goals={employeeGoals} onClose={() => setShowReminderModal(false)} />}

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 p-6 bg-white rounded-xl shadow-lg border-t-4 border-yellow-500">
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex-1">
				
              <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                
				<img 
  src="data:image/jpeg;base64,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" 
  alt="AITS Logo" 
  style={{
    width: "90px",
    height: "90px",
    objectFit: "contain",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
	marginRight:"10px"
  }}
 
/>
                Employee Performance Portal
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4  ">
                {isOfflineMode && (
                  <div className="flex items-center ">
                    <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                    <span className="text-yellow-600 font-medium text-base">Working in offline mode</span>
                  </div>
                )}
                <div className="text-base text-gray-600 flex items-center m-lg-3">
                  <Key className="w-5 h-5 mr-2 text-gray-400" />
                  <span className="font-mono bg-gray-100 px-3 py-1.5 rounded text-base">
                    ID: {employeeData.employeeId}
                    {isOfflineMode && <span className="ml-2 text-yellow-500">(Offline)</span>}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-6">
              <div className="text-right relative">
                <button 
                  onClick={() => setShowLogoutButton(!showLogoutButton)}
                  className="text-right hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <p className="text-2xl font-semibold text-gray-700 hover:text-yellow-600 transition-colors">
                    Welcome, {employeeData.fullName}!
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Status: <span className={`font-medium text-base ${
                      employeeData.status === 'Processed' ? 'text-green-600' :
                      employeeData.status === 'Pending' ? 'text-yellow-600' :
                      employeeData.status === 'Rejected' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {employeeData.status}
                    </span>
                  </p>
                </button>
                
                {showLogoutButton && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <div className="p-4">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-md"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-5 bg-yellow-50 border border-yellow-300 rounded-xl">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <p className="text-yellow-700 text-base">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-xl m-4">
              <RenderOverallPerformanceDashboard />
            </div>
            
            <div className="bg-white rounded-xl shadow-xl m-4">
              <RenderImprovementAreasDashboard />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
            <div className="bg-white rounded-xl shadow-xl m-4">
              <RenderPersonalInformation />
            </div>
            
            <div className="bg-white rounded-xl shadow-xl m-4">
              <RenderReportSummary />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl m-4">
            <RenderGoalsList />
          </div>

          <div className="bg-white rounded-xl shadow-xl m-4">
            <RenderResourcesAndSubmission />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;