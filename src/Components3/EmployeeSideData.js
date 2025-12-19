import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmployeeSideData.css'; // We'll create this CSS file

//const API_BASE = 'http://localhost:5000/api';
// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
 const API_BASE = `${process.env.REACT_APP_API_BASE}/api`;
const EmployeeSideData = ({ employeeId = 'EMP001' }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [goals, setGoals] = useState([]);
  const [queries, setQueries] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Form states
  const [goalText, setGoalText] = useState('');
  const [queryText, setQueryText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [editGoalData, setEditGoalData] = useState({ id: '', text: '', priority: 'Medium' });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGoals(),
        fetchQueries(),
        fetchFeedback(),
        fetchPerformance(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [employeeId]);

  // ============ GOAL FUNCTIONS ============
  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employee/${employeeId}/goals`);
      if (response.data.success) {
        setGoals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Mock data for testing
      setGoals([
        { id: '1', text: 'Complete project documentation', completed: false, priority: 'High', createdAt: '2024-01-15' },
        { id: '2', text: 'Attend advanced React workshop', completed: true, priority: 'Medium', createdAt: '2024-01-10' },
        { id: '3', text: 'Improve code review efficiency', completed: false, priority: 'Low', createdAt: '2024-01-05' }
      ]);
    }
  };

  const createGoal = async () => {
    if (!goalText.trim()) {
      showMessage('Please enter goal text', 'error');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/employee/${employeeId}/goals`, {
        text: goalText
      });
      
      if (response.data.success) {
        showMessage('Goal created successfully', 'success');
        setGoalText('');
        setShowModal('');
        fetchGoals();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      showMessage('Error creating goal', 'error');
    }
  };

  const updateGoal = async () => {
    try {
      const response = await axios.put(`${API_BASE}/employee/goals/${editGoalData.id}`, {
        text: editGoalData.text,
        priority: editGoalData.priority
      });
      
      if (response.data.success) {
        showMessage('Goal updated successfully', 'success');
        setShowModal('');
        fetchGoals();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      showMessage('Error updating goal', 'error');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await axios.delete(`${API_BASE}/employee/goals/${goalId}`);
      
      if (response.data.success) {
        showMessage('Goal deleted successfully', 'success');
        fetchGoals();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      showMessage('Error deleting goal', 'error');
    }
  };

  const toggleGoalCompletion = async (goalId, currentStatus) => {
    try {
      const response = await axios.patch(`${API_BASE}/employee/goals/${goalId}/toggle`, {
        completed: !currentStatus
      });
      
      if (response.data.success) {
        showMessage(`Goal marked as ${!currentStatus ? 'completed' : 'incomplete'}`, 'success');
        fetchGoals();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
      showMessage('Error updating goal status', 'error');
    }
  };

  const openEditGoal = (goal) => {
    setEditGoalData({
      id: goal.id,
      text: goal.text,
      priority: goal.priority || 'Medium'
    });
    setShowModal('editGoal');
  };

  // ============ QUERY FUNCTIONS ============
  const fetchQueries = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employee/${employeeId}/queries`);
      if (response.data.success) {
        setQueries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      // Mock data
      setQueries([
        { id: '1', queryText: 'How to request additional training?', status: 'Resolved', submittedAt: '2024-01-15' },
        { id: '2', queryText: 'Leave policy clarification needed', status: 'Pending', submittedAt: '2024-01-12' }
      ]);
    }
  };

  const createQuery = async () => {
    if (!queryText.trim()) {
      showMessage('Please enter your query', 'error');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/employee/${employeeId}/queries`, {
        queryText
      });
      
      if (response.data.success) {
        showMessage('Query submitted successfully', 'success');
        setQueryText('');
        setShowModal('');
        fetchQueries();
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      showMessage('Error submitting query', 'error');
    }
  };

  // ============ FEEDBACK FUNCTIONS ============
  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employee/${employeeId}/feedback`);
      if (response.data.success) {
        setFeedback(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Mock data
      setFeedback([
        { id: '1', feedbackText: 'Great teamwork in the last project', type: 'Manager Feedback', status: 'Submitted', submittedAt: '2024-01-18' },
        { id: '2', feedbackText: 'Need improvement in documentation', type: '360 Feedback', status: 'Submitted', submittedAt: '2024-01-10' }
      ]);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      showMessage('Please enter your feedback', 'error');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/employee/${employeeId}/feedback`, {
        feedbackText
      });
      
      if (response.data.success) {
        showMessage('Feedback submitted successfully', 'success');
        setFeedbackText('');
        setShowModal('');
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showMessage('Error submitting feedback', 'error');
    }
  };

  // ============ PERFORMANCE FUNCTIONS ============
  const fetchPerformance = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employee/${employeeId}/performance`);
      if (response.data.success) {
        setPerformance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      // Mock data
      setPerformance({
        overallRating: 'Meets Expectations',
        managerSummary: 'Employee has shown consistent performance throughout the year.',
        goalCompletionRate: 75,
        averageProjectScore: 4.2,
        improvementFocus: ['Technical Depth', 'Stakeholder Communication'],
        improvementTips: ['Schedule regular check-ins.', 'Document decisions clearly.'],
        strengths: ['Reliable', 'Team Player', 'Quick Learner'],
        developmentAreas: ['Public Speaking', 'Advanced Technical Skills']
      });
    }
  };

  // ============ DASHBOARD STATS FUNCTIONS ============
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employee/${employeeId}/dashboard/stats`);
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Mock data
      setDashboardStats({
        goalStats: {
          total: 3,
          completed: 1,
          pending: 2,
          completionRate: 33
        },
        performance: {
          overallRating: 'Meets Expectations',
          averageProjectScore: 4.2,
          lastReviewDate: '2024-01-15'
        }
      });
    }
  };

  // Helper functions for styling
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'status-resolved';
      case 'In Progress': return 'status-progress';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderMessage = () => {
    if (!message.text) return null;
    return (
      <div className={`message ${message.type}`}>
        {message.text}
      </div>
    );
  };

  const renderTabs = () => (
    <div className="tabs">
      <button 
        className={activeTab === 'dashboard' ? 'active' : ''}
        onClick={() => setActiveTab('dashboard')}
      >
        Dashboard
      </button>
      <button 
        className={activeTab === 'goals' ? 'active' : ''}
        onClick={() => setActiveTab('goals')}
      >
        Goals
      </button>
      <button 
        className={activeTab === 'queries' ? 'active' : ''}
        onClick={() => setActiveTab('queries')}
      >
        Queries
      </button>
      <button 
        className={activeTab === 'feedback' ? 'active' : ''}
        onClick={() => setActiveTab('feedback')}
      >
        Feedback
      </button>
      <button 
        className={activeTab === 'performance' ? 'active' : ''}
        onClick={() => setActiveTab('performance')}
      >
        Performance
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Goals Progress</h3>
          {dashboardStats ? (
            <>
              <h2>{dashboardStats.goalStats.completionRate}%</h2>
              <p>{dashboardStats.goalStats.completed} of {dashboardStats.goalStats.total} goals completed</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        <div className="stat-card secondary">
          <h3>Performance</h3>
          {dashboardStats ? (
            <>
              <h2>{dashboardStats.performance.averageProjectScore}/5</h2>
              <p>Average Project Score</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        <div className="stat-card success">
          <h3>Rating</h3>
          {dashboardStats ? (
            <>
              <h2>{dashboardStats.performance.overallRating}</h2>
              <p>Current Performance</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        <div className="stat-card warning">
          <h3>Pending Actions</h3>
          <h2>{goals.filter(g => !g.completed).length}</h2>
          <p>Goals to complete</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => setShowModal('addGoal')}>
            Add Goal
          </button>
          <button className="btn btn-outline" onClick={() => setShowModal('addQuery')}>
            Ask Query
          </button>
          <button className="btn btn-outline" onClick={() => setShowModal('addFeedback')}>
            Give Feedback
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => {
              setSyncing(true);
              setTimeout(() => {
                setSyncing(false);
                showMessage('Data synced successfully', 'success');
              }, 1000);
            }}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-goals">
          <div className="section-header">
            <h3>Recent Goals</h3>
            <button className="btn-text" onClick={() => setActiveTab('goals')}>
              View All
            </button>
          </div>
          {goals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="goal-item">
              <div className="goal-content">
                <div className={`goal-text ${goal.completed ? 'completed' : ''}`}>
                  {goal.text}
                </div>
                <div className="goal-meta">
                  <span className={`priority ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                  <span className="date">
                    Created: {new Date(goal.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="goal-actions">
                <button 
                  className="btn-icon" 
                  onClick={() => toggleGoalCompletion(goal.id, goal.completed)}
                  title={goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
                >
                  ✓
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => openEditGoal(goal)}
                  title="Edit"
                >
                  ✎
                </button>
                <button 
                  className="btn-icon delete" 
                  onClick={() => deleteGoal(goal.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="performance-summary">
          <h3>Performance Summary</h3>
          {performance ? (
            <>
              <p>{performance.managerSummary}</p>
              <div className="strengths">
                <h4>Strengths:</h4>
                <div className="chip-container">
                  {performance.strengths?.map((strength, index) => (
                    <span key={index} className="chip success">{strength}</span>
                  ))}
                </div>
              </div>
              <div className="improvements">
                <h4>Areas for Improvement:</h4>
                <div className="chip-container">
                  {performance.developmentAreas?.map((area, index) => (
                    <span key={index} className="chip warning">{area}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p>Loading performance data...</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="goals-page">
      <div className="page-header">
        <h2>My Goals</h2>
        <button className="btn btn-primary" onClick={() => setShowModal('addGoal')}>
          Add New Goal
        </button>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => (
          <div key={goal.id} className="goal-card">
            <div className="goal-card-header">
              <div className={`goal-title ${goal.completed ? 'completed' : ''}`}>
                {goal.text}
              </div>
            </div>
            <div className="goal-card-body">
              <div className="goal-tags">
                <span className={`tag ${getPriorityColor(goal.priority)}`}>
                  {goal.priority}
                </span>
                <span className={`tag ${goal.completed ? 'completed-tag' : 'inprogress-tag'}`}>
                  {goal.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="goal-date">
                Created: {new Date(goal.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="goal-card-actions">
              <button 
                className={`btn ${goal.completed ? 'btn-success' : 'btn-primary'}`}
                onClick={() => toggleGoalCompletion(goal.id, goal.completed)}
              >
                {goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => openEditGoal(goal)}
              >
                Edit
              </button>
              <button 
                className="btn btn-outline btn-danger"
                onClick={() => deleteGoal(goal.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No goals yet</h3>
            <p>Start by creating your first goal</p>
            <button className="btn btn-primary" onClick={() => setShowModal('addGoal')}>
              Create Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderQueries = () => (
    <div className="queries-page">
      <div className="page-header">
        <h2>My Queries</h2>
        <button className="btn btn-primary" onClick={() => setShowModal('addQuery')}>
          Ask New Query
        </button>
      </div>

      <div className="queries-list">
        {queries.map((query) => (
          <div key={query.id} className="query-card">
            <div className="query-content">
              <p>{query.queryText}</p>
              <div className="query-meta">
                <span className={`status ${getStatusColor(query.status)}`}>
                  {query.status}
                </span>
                <span className="date">
                  Submitted: {new Date(query.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {queries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">❓</div>
            <h3>No queries yet</h3>
            <p>Have a question? Submit your first query</p>
            <button className="btn btn-primary" onClick={() => setShowModal('addQuery')}>
              Ask Query
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="feedback-page">
      <div className="page-header">
        <h2>My Feedback</h2>
        <button className="btn btn-primary" onClick={() => setShowModal('addFeedback')}>
          Submit Feedback
        </button>
      </div>

      <div className="feedback-list">
        {feedback.map((fb) => (
          <div key={fb.id} className="feedback-card">
            <div className="feedback-content">
              <p>{fb.feedbackText}</p>
              <div className="feedback-meta">
                <span className="tag">{fb.type}</span>
                <span className="tag primary">{fb.status}</span>
                <span className="date">
                  Submitted: {new Date(fb.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {feedback.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No feedback submitted yet</h3>
            <p>Share your feedback to help improve the workplace</p>
            <button className="btn btn-primary" onClick={() => setShowModal('addFeedback')}>
              Submit Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="performance-page">
      {performance && (
        <>
          <div className="performance-overview">
            <h2>Performance Overview</h2>
            <div className="overview-cards">
              <div className="overview-card primary">
                <h1>{performance.overallRating}</h1>
                <p>Overall Rating</p>
              </div>
              <div className="overview-card success">
                <h1>{performance.goalCompletionRate}%</h1>
                <p>Goal Completion Rate</p>
              </div>
              <div className="overview-card warning">
                <h1>{performance.averageProjectScore}/5</h1>
                <p>Avg Project Score</p>
              </div>
            </div>
          </div>

          <div className="performance-details">
            <div className="detail-card">
              <h3>Manager Summary</h3>
              <p>{performance.managerSummary}</p>
              
              <h3>Improvement Focus</h3>
              <div className="chip-container">
                {performance.improvementFocus?.map((item, index) => (
                  <span key={index} className="chip warning">{item}</span>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h3>Strengths</h3>
              <div className="chip-container">
                {performance.strengths?.map((strength, index) => (
                  <span key={index} className="chip success">{strength}</span>
                ))}
              </div>

              <h3>Development Areas</h3>
              <div className="chip-container">
                {performance.developmentAreas?.map((area, index) => (
                  <span key={index} className="chip error">{area}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="improvement-tips">
            <h3>Improvement Tips</h3>
            <ul>
              {performance.improvementTips?.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const modals = {
      addGoal: {
        title: 'Add New Goal',
        content: (
          <textarea
            className="form-textarea"
            placeholder="Enter goal description..."
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            rows="4"
          />
        ),
        action: createGoal,
        actionText: 'Create Goal'
      },
      editGoal: {
        title: 'Edit Goal',
        content: (
          <>
            <textarea
              className="form-textarea"
              placeholder="Enter goal description..."
              value={editGoalData.text}
              onChange={(e) => setEditGoalData({...editGoalData, text: e.target.value})}
              rows="4"
            />
            <select
              className="form-select"
              value={editGoalData.priority}
              onChange={(e) => setEditGoalData({...editGoalData, priority: e.target.value})}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </>
        ),
        action: updateGoal,
        actionText: 'Update Goal'
      },
      addQuery: {
        title: 'Ask a Question',
        content: (
          <textarea
            className="form-textarea"
            placeholder="Enter your query..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows="4"
          />
        ),
        action: createQuery,
        actionText: 'Submit Query'
      },
      addFeedback: {
        title: 'Submit Feedback',
        content: (
          <textarea
            className="form-textarea"
            placeholder="Enter your feedback..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows="4"
          />
        ),
        action: submitFeedback,
        actionText: 'Submit Feedback'
      }
    };

    const modal = modals[showModal];
    if (!modal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>{modal.title}</h3>
            <button className="modal-close" onClick={() => setShowModal('')}>×</button>
          </div>
          <div className="modal-body">
            {modal.content}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setShowModal('')}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={modal.action}>
              {modal.actionText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="employee-side-container">
      {/* Header */}
      <div className="header">
        <h1>Employee Dashboard</h1>
        <div className="header-right">
          <span className="employee-id">Employee ID: {employeeId}</span>
          <button 
            className="btn-icon sync-btn"
            onClick={() => {
              setSyncing(true);
              setTimeout(() => {
                setSyncing(false);
                showMessage('Data synced successfully', 'success');
              }, 1000);
            }}
            disabled={syncing}
            title="Sync Data"
          >
            {syncing ? '🔄' : '🔄'}
          </button>
        </div>
      </div>

      {/* Message */}
      {renderMessage()}

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <div className="content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'goals' && renderGoals()}
            {activeTab === 'queries' && renderQueries()}
            {activeTab === 'feedback' && renderFeedback()}
            {activeTab === 'performance' && renderPerformance()}
          </>
        )}
      </div>

      {/* Modals */}
      {renderModal()}
    </div>
  );
};

export default EmployeeSideData;