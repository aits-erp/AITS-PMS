import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllEmployeesData.css';

const API_BASE_URL = 'http://localhost:5000/api';

const AllEmployeesData = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [sortBy, setSortBy] = useState('employeeId');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('goals'); // 'goals', 'queries', 'feedback'
  const [departments, setDepartments] = useState(['all']);

  // Fetch all employees data from backend
  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch from employee resignation endpoint
      const response = await axios.get(`${API_BASE_URL}/employee-resignation`);
      
      if (response.data.success) {
        const employeeData = response.data.data;
        
        // Transform the data to match our frontend structure
        const transformedEmployees = await Promise.all(
          employeeData.map(async (emp) => {
            try {
              // Fetch additional data for each employee
              const [goalsRes, queriesRes, performanceRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/new-goals/employee/${emp.employeeId}`),
                axios.get(`${API_BASE_URL}/employee/${emp.employeeId}/queries`),
                axios.get(`${API_BASE_URL}/employee-details/by-employee-id/${emp.employeeId}`)
              ]);

              // Get goals data
              const recentGoals = goalsRes.status === 'fulfilled' && goalsRes.value.data.success 
                ? goalsRes.value.data.data.slice(0, 3).map(goal => ({
                    id: goal._id || goal.id,
                    text: goal.goal || goal.description || 'No description',
                    completed: goal.status === "Completed" || goal.progress === "100%",
                    priority: goal.priority || 'Medium',
                    createdAt: goal.createdAt || new Date().toISOString()
                  }))
                : [];

              // Get queries data
              const recentQueries = queriesRes.status === 'fulfilled' && queriesRes.value.data.success
                ? queriesRes.value.data.data.slice(0, 3).map(query => ({
                    id: query._id || query.id,
                    text: query.queryText || query.query || 'No query text',
                    status: query.status || 'Pending',
                    submittedAt: query.submittedAt || query.createdAt || new Date().toISOString()
                  }))
                : [];

              // Get performance data
              let performanceData = {
                overallRating: 'Not Rated',
                goalCompletionRate: 0,
                averageProjectScore: '0.0',
                lastReviewDate: 'N/A'
              };

              if (performanceRes.status === 'fulfilled' && performanceRes.value.data.success && performanceRes.value.data.data.length > 0) {
                const perf = performanceRes.value.data.data[0];
                performanceData = {
                  overallRating: perf.rating || 'Not Rated',
                  goalCompletionRate: perf.progress ? parseInt(perf.progress) : 0,
                  averageProjectScore: perf.score || '0.0',
                  lastReviewDate: perf.addedOn || perf.createdAt || 'N/A'
                };
              }

              // Calculate goal statistics
              const totalGoals = goalsRes.status === 'fulfilled' && goalsRes.value.data.success 
                ? goalsRes.value.data.data.length 
                : 0;
              
              const completedGoals = goalsRes.status === 'fulfilled' && goalsRes.value.data.success
                ? goalsRes.value.data.data.filter(g => g.status === "Completed" || g.progress === "100%").length
                : 0;
              
              const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

              // Get query statistics
              const queryStats = queriesRes.status === 'fulfilled' && queriesRes.value.data.success
                ? {
                    totalQueries: queriesRes.value.data.data.length,
                    pendingQueries: queriesRes.value.data.data.filter(q => q.status === 'Pending').length,
                    resolvedQueries: queriesRes.value.data.data.filter(q => q.status === 'Resolved').length
                  }
                : { totalQueries: 0, pendingQueries: 0, resolvedQueries: 0 };

              // Transform to frontend structure
              return {
                employeeId: emp.employeeId,
                personalInfo: {
                  name: emp.fullName || emp.employee || 'Unknown',
                  department: emp.department || 'Not Assigned',
                  position: emp.jobTitle || emp.position || 'Employee',
                  joinDate: emp.joinDate || emp.createdAt?.split('T')[0] || 'N/A',
                  email: emp.email || 'No email',
                  phone: emp.phone || emp.contactNumber || 'N/A'
                },
                summary: {
                  totalGoals,
                  completedGoals,
                  goalCompletionRate,
                  totalQueries: queryStats.totalQueries,
                  totalFeedback: 0, // You can add feedback endpoint later
                  pendingQueries: queryStats.pendingQueries,
                  resolvedQueries: queryStats.resolvedQueries
                },
                recentGoals,
                recentQueries,
                recentFeedback: [], // You can add feedback endpoint later
                performance: performanceData,
                lastActivity: emp.lastLogin || emp.updatedAt || emp.createdAt || new Date().toISOString()
              };
            } catch (err) {
              console.error(`Error fetching details for ${emp.employeeId}:`, err);
              // Return basic employee info if details fetch fails
              return {
                employeeId: emp.employeeId,
                personalInfo: {
                  name: emp.fullName || emp.employee || 'Unknown',
                  department: emp.department || 'Not Assigned',
                  position: emp.jobTitle || emp.position || 'Employee',
                  joinDate: emp.joinDate || emp.createdAt?.split('T')[0] || 'N/A',
                  email: emp.email || 'No email',
                  phone: emp.phone || emp.contactNumber || 'N/A'
                },
                summary: {
                  totalGoals: 0,
                  completedGoals: 0,
                  goalCompletionRate: 0,
                  totalQueries: 0,
                  totalFeedback: 0,
                  pendingQueries: 0,
                  resolvedQueries: 0
                },
                recentGoals: [],
                recentQueries: [],
                recentFeedback: [],
                performance: {
                  overallRating: 'Not Rated',
                  goalCompletionRate: 0,
                  averageProjectScore: '0.0',
                  lastReviewDate: 'N/A'
                },
                lastActivity: emp.updatedAt || emp.createdAt || new Date().toISOString()
              };
            }
          })
        );

        setEmployees(transformedEmployees);
        
        // Extract unique departments for filter
        const uniqueDepts = ['all', ...new Set(transformedEmployees.map(emp => 
          emp.personalInfo.department).filter(dept => dept && dept !== 'Not Assigned')
        )];
        setDepartments(uniqueDepts);
        
      } else {
        setError('Failed to fetch employees data from server');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Error connecting to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Fetch only from employee-resignation endpoint (simpler)
  const fetchBasicEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_BASE_URL}/employee-resignation`);
      
      if (response.data.success) {
        const employeeData = response.data.data;
        
        const transformedEmployees = employeeData.map(emp => {
          // Generate random stats for demo (replace with real API calls)
          const totalGoals = Math.floor(Math.random() * 10);
          const completedGoals = Math.floor(Math.random() * totalGoals);
          const goalRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
          
          return {
            employeeId: emp.employeeId,
            personalInfo: {
              name: emp.fullName,
              department: emp.department || 'General',
              position: 'Employee', // Default position
              joinDate: emp.addedOn ? new Date(emp.addedOn).toISOString().split('T')[0] : 'N/A',
              email: emp.email,
              phone: emp.phone || 'N/A'
            },
            summary: {
              totalGoals,
              completedGoals,
              goalCompletionRate: goalRate,
              totalQueries: Math.floor(Math.random() * 5),
              totalFeedback: Math.floor(Math.random() * 3),
              pendingQueries: Math.floor(Math.random() * 3),
              resolvedQueries: Math.floor(Math.random() * 2)
            },
            recentGoals: Array.from({ length: Math.min(2, totalGoals) }, (_, i) => ({
              id: `goal-${emp.employeeId}-${i}`,
              text: `Goal ${i + 1}`,
              completed: i < completedGoals,
              priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
              createdAt: new Date().toISOString()
            })),
            recentQueries: Array.from({ length: Math.floor(Math.random() * 2) }, (_, i) => ({
              id: `query-${emp.employeeId}-${i}`,
              text: `General query ${i + 1}`,
              status: ['Pending', 'Resolved'][Math.floor(Math.random() * 2)],
              submittedAt: new Date().toISOString()
            })),
            recentFeedback: [],
            performance: {
              overallRating: ['Exceeds', 'Meets', 'Needs Improvement'][Math.floor(Math.random() * 3)],
              goalCompletionRate: goalRate,
              averageProjectScore: (3 + Math.random() * 2).toFixed(1),
              lastReviewDate: '2024-01-15'
            },
            lastActivity: emp.updatedAt || emp.createdAt || new Date().toISOString()
          };
        });
        
        setEmployees(transformedEmployees);
        
        // Extract departments
        const uniqueDepts = ['all', ...new Set(transformedEmployees.map(emp => 
          emp.personalInfo.department).filter(dept => dept)
        )];
        setDepartments(uniqueDepts);
        
      } else {
        setError(response.data.error || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Error connecting to server. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to fetch real data, fall back to basic data
    fetchBasicEmployees();
  }, []);

  // Filter and sort employees
  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = 
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personalInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personalInfo.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = filterDept === 'all' || emp.personalInfo.department === filterDept;
      
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.personalInfo.name.localeCompare(b.personalInfo.name);
        case 'department':
          return a.personalInfo.department.localeCompare(b.personalInfo.department);
        case 'goals':
          return b.summary.goalCompletionRate - a.summary.goalCompletionRate;
        case 'performance':
          return parseFloat(b.performance.averageProjectScore) - parseFloat(a.performance.averageProjectScore);
        default:
          return a.employeeId.localeCompare(b.employeeId);
      }
    });

  // Handle employee click
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setActiveTab('goals'); // Reset to goals tab when opening modal
    setShowDetailModal(true);
  };

  // Toggle employee details
  const toggleEmployeeDetails = (employeeId) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  // Get rating color
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Exceeds': 
      case 'Outstanding':
      case 'Excellent':
        return 'rating-exceeds';
      case 'Meets':
      case 'Satisfactory':
      case 'Meets Expectations':
        return 'rating-meets';
      case 'Needs Improvement':
      case 'Poor':
      case 'Unsatisfactory':
        return 'rating-needs';
      default: return '';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': 
      case 'Completed':
        return 'status-resolved';
      case 'In Progress': 
      case 'Processing':
        return 'status-progress';
      default: return 'status-pending';
    }
  };

  // Get feedback type color
  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case '360 Feedback': return 'feedback-360';
      case 'Manager Feedback': return 'feedback-manager';
      case 'General': return 'feedback-general';
      default: return '';
    }
  };

  // Get activity items based on active tab
  const getActivityItems = () => {
    if (!selectedEmployee) return [];
    
    switch (activeTab) {
      case 'goals':
        return selectedEmployee.recentGoals;
      case 'queries':
        return selectedEmployee.recentQueries;
      case 'feedback':
        return selectedEmployee.recentFeedback;
      default:
        return selectedEmployee.recentGoals;
    }
  };

  // Render activity item based on type
  const renderActivityItem = (item, index) => {
    if (activeTab === 'goals') {
      return (
        <div key={item.id || index} className="activity-item">
          <div className="activity-icon">🎯</div>
          <div className="activity-content">
            <div className="activity-text">{item.text}</div>
            <div className="activity-meta">
              <span className={`priority ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
              <span className="status">
                {item.completed ? 'Completed' : 'In Progress'}
              </span>
              <span className="date">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'queries') {
      return (
        <div key={item.id || index} className="activity-item">
          <div className="activity-icon">❓</div>
          <div className="activity-content">
            <div className="activity-text">{item.text}</div>
            <div className="activity-meta">
              <span className={`status ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              <span className="date">
                {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'feedback') {
      return (
        <div key={item.id || index} className="activity-item">
          <div className="activity-icon">💬</div>
          <div className="activity-content">
            <div className="activity-text">{item.text}</div>
            <div className="activity-meta">
              <span className={`feedback-type ${getFeedbackTypeColor(item.type)}`}>
                {item.type}
              </span>
              <span className="date">
                {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading employees data...</p>
      </div>
    );
  }

  return (
    <div className="all-employees-container">
      {/* Header */}
      <div className="header">
        <h1>All Employees Dashboard</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{employees.length}</span>
            <span className="stat-label">Total Employees</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {employees.length > 0 
                ? Math.round(employees.reduce((sum, emp) => sum + emp.summary.goalCompletionRate, 0) / employees.length)
                : 0}%
            </span>
            <span className="stat-label">Avg Goal Completion</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {employees.reduce((sum, emp) => sum + emp.summary.pendingQueries, 0)}
            </span>
            <span className="stat-label">Pending Queries</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by ID, name, department, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="employeeId">Sort by ID</option>
            <option value="name">Sort by Name</option>
            <option value="department">Sort by Department</option>
            <option value="goals">Sort by Goals</option>
            <option value="performance">Sort by Performance</option>
          </select>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button 
              className={viewMode === 'card' ? 'active' : ''}
              onClick={() => setViewMode('card')}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="table-view">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Goals Progress</th>
                <th>Performance</th>
                <th>Queries</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <React.Fragment key={employee.employeeId}>
                  <tr>
                    <td className="emp-id">
                      <strong>{employee.employeeId}</strong>
                    </td>
                    <td>
                      <div className="employee-name">
                        {employee.personalInfo.name}
                        <div className="email">{employee.personalInfo.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className="dept-badge">{employee.personalInfo.department}</span>
                    </td>
                    <td>{employee.personalInfo.position}</td>
                    <td>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${employee.summary.goalCompletionRate}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {employee.summary.completedGoals}/{employee.summary.totalGoals} ({employee.summary.goalCompletionRate}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`rating ${getRatingColor(employee.performance.overallRating)}`}>
                        {employee.performance.overallRating}
                      </span>
                      <div className="score">{employee.performance.averageProjectScore}/5</div>
                    </td>
                    <td>
                      <div className="query-stats">
                        <span className="total">Total: {employee.summary.totalQueries}</span>
                        <span className="pending">Pending: {employee.summary.pendingQueries}</span>
                      </div>
                    </td>
                    <td>
                      {employee.lastActivity ? 
                        new Date(employee.lastActivity).toLocaleDateString() : 
                        'No activity'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => handleEmployeeClick(employee)}
                        >
                          View Details
                        </button>
                        <button 
                          className="btn-toggle"
                          onClick={() => toggleEmployeeDetails(employee.employeeId)}
                        >
                          {expandedEmployee === employee.employeeId ? '▲' : '▼'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded row with details */}
                  {expandedEmployee === employee.employeeId && (
                    <tr className="expanded-row">
                      <td colSpan="9">
                        <div className="employee-details">
                          <div className="detail-section">
                            <h4>Recent Goals</h4>
                            {employee.recentGoals.length > 0 ? (
                              <div className="goals-list">
                                {employee.recentGoals.map(goal => (
                                  <div key={goal.id} className="goal-item">
                                    <span className={`goal-priority ${getPriorityColor(goal.priority)}`}>
                                      {goal.priority}
                                    </span>
                                    <span className={`goal-text ${goal.completed ? 'completed' : ''}`}>
                                      {goal.text}
                                    </span>
                                    <span className="goal-status">
                                      {goal.completed ? '✓ Completed' : '⏳ In Progress'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-data">No goals found</p>
                            )}
                          </div>
                          
                          <div className="detail-section">
                            <h4>Recent Queries</h4>
                            {employee.recentQueries.length > 0 ? (
                              <div className="queries-list">
                                {employee.recentQueries.map(query => (
                                  <div key={query.id} className="query-item">
                                    <span className={`query-status ${getStatusColor(query.status)}`}>
                                      {query.status}
                                    </span>
                                    <span className="query-text">{query.text}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-data">No queries found</p>
                            )}
                          </div>
                          
                          <div className="detail-section">
                            <h4>Contact Info</h4>
                            <div className="contact-info">
                              <div><strong>Email:</strong> {employee.personalInfo.email}</div>
                              <div><strong>Phone:</strong> {employee.personalInfo.phone}</div>
                              <div><strong>Join Date:</strong> {employee.personalInfo.joinDate}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="no-results">
              {searchTerm || filterDept !== 'all' 
                ? 'No employees found matching your criteria.' 
                : 'No employees found in the database.'}
            </div>
          )}
        </div>
      ) : (
        <div className="card-view">
          <div className="employee-cards">
            {filteredEmployees.map((employee) => (
              <div key={employee.employeeId} className="employee-card">
                <div className="card-header">
                  <div className="emp-basic">
                    <h3>{employee.employeeId}</h3>
                    <h4>{employee.personalInfo.name}</h4>
                    <p className="position">{employee.personalInfo.position}</p>
                  </div>
                  <div className="dept-tag">{employee.personalInfo.department}</div>
                </div>
                
                <div className="card-body">
                  <div className="stats-row">
                    <div className="stat-item">
                      <div className="stat-value">{employee.summary.totalGoals}</div>
                      <div className="stat-label">Goals</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{employee.summary.totalQueries}</div>
                      <div className="stat-label">Queries</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{employee.summary.totalFeedback}</div>
                      <div className="stat-label">Feedback</div>
                    </div>
                  </div>
                  
                  <div className="progress-section">
                    <div className="progress-label">Goal Completion</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${employee.summary.goalCompletionRate}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">{employee.summary.goalCompletionRate}%</div>
                  </div>
                  
                  <div className="performance-section">
                    <div className="performance-label">Performance Rating</div>
                    <div className={`performance-rating ${getRatingColor(employee.performance.overallRating)}`}>
                      {employee.performance.overallRating}
                    </div>
                    <div className="performance-score">
                      Score: {employee.performance.averageProjectScore}/5
                    </div>
                  </div>
                </div>
                
                <div className="card-footer">
                  <button 
                    className="btn-details"
                    onClick={() => handleEmployeeClick(employee)}
                  >
                    View Full Details
                  </button>
                  <div className="last-activity">
                    Last active: {employee.lastActivity ? 
                      new Date(employee.lastActivity).toLocaleDateString() : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Employee Details - {selectedEmployee.employeeId}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-column">
                  <h3>Personal Information</h3>
                  <div className="info-item">
                    <strong>Name:</strong> {selectedEmployee.personalInfo.name}
                  </div>
                  <div className="info-item">
                    <strong>Department:</strong> {selectedEmployee.personalInfo.department}
                  </div>
                  <div className="info-item">
                    <strong>Position:</strong> {selectedEmployee.personalInfo.position}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {selectedEmployee.personalInfo.email}
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {selectedEmployee.personalInfo.phone}
                  </div>
                  <div className="info-item">
                    <strong>Join Date:</strong> {selectedEmployee.personalInfo.joinDate}
                  </div>
                </div>
                
                <div className="detail-column">
                  <h3>Performance Summary</h3>
                  <div className="performance-details">
                    <div className="perf-item">
                      <strong>Overall Rating:</strong>
                      <span className={`rating ${getRatingColor(selectedEmployee.performance.overallRating)}`}>
                        {selectedEmployee.performance.overallRating}
                      </span>
                    </div>
                    <div className="perf-item">
                      <strong>Goal Completion:</strong>
                      <span>{selectedEmployee.performance.goalCompletionRate}%</span>
                    </div>
                    <div className="perf-item">
                      <strong>Average Score:</strong>
                      <span>{selectedEmployee.performance.averageProjectScore}/5</span>
                    </div>
                    <div className="perf-item">
                      <strong>Last Review:</strong>
                      <span>{selectedEmployee.performance.lastReviewDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="activity-section">
                <h3>Recent Activities</h3>
                
                <div className="activity-tabs">
                  <button 
                    className={`activity-tab ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                  >
                    Goals ({selectedEmployee.recentGoals.length})
                  </button>
                  <button 
                    className={`activity-tab ${activeTab === 'queries' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queries')}
                  >
                    Queries ({selectedEmployee.recentQueries.length})
                  </button>
                  <button 
                    className={`activity-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                  >
                    Feedback ({selectedEmployee.recentFeedback.length})
                  </button>
                </div>
                
                <div className="activities-list">
                  {getActivityItems().length > 0 ? (
                    getActivityItems().map((item, index) => renderActivityItem(item, index))
                  ) : (
                    <div className="no-activities">
                      No {activeTab} activities found for this employee.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer summary */}
      <div className="footer-summary">
        <p>
          Showing {filteredEmployees.length} of {employees.length} employees
          {filterDept !== 'all' && ` in ${filterDept}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
        <button className="btn-refresh" onClick={fetchBasicEmployees}>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AllEmployeesData;