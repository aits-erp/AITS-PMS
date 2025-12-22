import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { FaEnvelope, FaClock, FaChartLine } from "react-icons/fa";
import axios from "axios";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [pips, setPips] = useState([]);
  const [goals, setGoals] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   //const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
   const API_BASE = `${process.env.REACT_APP_API_BASE}`;

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch employees, PIPs, Goals, and Resignations in parallel
      const [
        employeesResponse,
        pipsResponse,
        goalsResponse,
        resignationsResponse
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/employee-details`),
        axios.get(`${API_BASE}/api/pips`),
        axios.get(`${API_BASE}/api/new-goals`),
        axios.get(`${API_BASE}/api/employee-resignation`)
      ]);
      
      if (employeesResponse.data.success) {
        setEmployees(employeesResponse.data.data);
      } else {
        setError("Failed to fetch employee data");
      }
      
      if (pipsResponse.data.success) {
        setPips(pipsResponse.data.data);
      } else {
        console.warn("Failed to fetch PIP data");
      }
      
      if (goalsResponse.data.success) {
        setGoals(goalsResponse.data.data);
      } else {
        console.warn("Failed to fetch goal data");
      }
      
      if (resignationsResponse.data.success) {
        setResignations(resignationsResponse.data.data);
      } else {
        console.warn("Failed to fetch resignation data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate rating distribution
  const calculateRatingDistribution = () => {
    const ratingCategories = ["Outstanding", "Excellent", "Satisfactory", "Need Improvement", "Poor"];
    
    // Initialize count for each rating
    const ratingCounts = {
      "Outstanding": 0,
      "Excellent": 0,
      "Satisfactory": 0,
      "Need Improvement": 0,
      "Poor": 0,
      "Unrated": 0
    };

    // Count employees by rating
    employees.forEach(employee => {
      const rating = employee.rating;
      if (rating && ratingCategories.includes(rating)) {
        ratingCounts[rating]++;
      } else if (rating === "") {
        ratingCounts["Unrated"]++;
      }
    });

    return ratingCounts;
  };

  // Calculate goal status distribution
  const calculateGoalStatusDistribution = () => {
    const statusCategories = ["Pending", "Preparing", "Completed"];
    
    // Initialize count for each status
    const statusCounts = {
      "Pending": 0,
      "Preparing": 0,
      "Completed": 0
    };

    // Count goals by status
    goals.forEach(goal => {
      const status = goal.status;
      if (status && statusCategories.includes(status)) {
        statusCounts[status]++;
      }
    });

    return statusCounts;
  };

  // Calculate resignation status distribution
  const calculateResignationStatusDistribution = () => {
    const statusCategories = ["Pending", "Processed", "Rejected"];
    
    // Initialize count for each status
    const statusCounts = {
      "Pending": 0,
      "Processed": 0,
      "Rejected": 0
    };

    // Count resignations by status
    resignations.forEach(resignation => {
      const status = resignation.status;
      if (status && statusCategories.includes(status)) {
        statusCounts[status]++;
      }
    });

    return statusCounts;
  };

  // Calculate KPI statistics
  const calculateKPIs = () => {
    const ratingDistribution = calculateRatingDistribution();
    const totalEmployees = employees.length;
    const totalResignations = resignations.length; // Get resignation count
    const totalPIPs = pips.length;
    const totalGoals = goals.length;
    const outstandingCount = ratingDistribution["Outstanding"] || 0;
    
    const outstandingPercent = totalEmployees > 0 
      ? Math.round((outstandingCount / totalEmployees) * 100) 
      : 0;

    // Calculate goal completion rate
    const goalStatusDistribution = calculateGoalStatusDistribution();
    const completedGoals = goalStatusDistribution["Completed"] || 0;
    const goalCompletionRate = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100) 
      : 0;

    // Calculate resignation statistics
    const resignationStatusDistribution = calculateResignationStatusDistribution();
    const pendingResignations = resignationStatusDistribution["Pending"] || 0;

    return {
      totalEmployees: totalEmployees, // Active employees count
      totalResignations: totalResignations, // Total resignation count
      outstandingPercent: outstandingPercent,
      pipCount: totalPIPs,
      totalGoals: totalGoals,
      goalCompletionRate: goalCompletionRate,
      pendingResignations: pendingResignations
    };
  };

  // BAR GRAPH - Rating Distribution
  const getBarChartData = () => {
    const ratingDistribution = calculateRatingDistribution();
    const ratingCategories = ["Outstanding", "Excellent", "Satisfactory", "Need Improvement", "Poor", "Unrated"];
    
    const colors = {
      "Outstanding": "#28a745",    // Green
      "Excellent": "#17a2b8",      // Teal
      "Satisfactory": "#ffc107",   // Yellow
      "Need Improvement": "#fd7e14", // Orange
      "Poor": "#dc3545",           // Red
      "Unrated": "#6c757d"         // Gray
    };

    return {
      labels: ratingCategories,
      datasets: [
        {
          label: "Number of Employees",
          data: ratingCategories.map(category => ratingDistribution[category] || 0),
          backgroundColor: ratingCategories.map(category => colors[category]),
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#ffffff"
        }
      ]
    };
  };

  // DONUT GRAPH - Goal Completion Rate
  const getDonutChartData = () => {
    const statusDistribution = calculateGoalStatusDistribution();
    const statusCategories = ["Pending", "Preparing", "Completed"];
    
    const colors = {
      "Pending": "#ffc107",    // Yellow
      "Preparing": "#17a2b8",  // Teal
      "Completed": "#28a745"   // Green
    };

    return {
      labels: statusCategories,
      datasets: [
        {
          data: statusCategories.map(status => statusDistribution[status] || 0),
          backgroundColor: statusCategories.map(status => colors[status]),
          borderWidth: 1,
          borderColor: "#ffffff"
        }
      ]
    };
  };

  const kpis = calculateKPIs();
  const barChartData = getBarChartData();
  const donutChartData = getDonutChartData();

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchAllData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ background: "#f7f7f7" }}>
      {/* PAGE TITLE */}
      <h2 className="fw-bold mb-1" style={{ fontSize: "40px", color: "#152240" }}>
        AITS Performance Dashboard
      </h2>
      <div
        style={{
          width: "250px",
          height: "4px",
          background: "#EAA012",
          borderRadius: "4px",
          marginBottom: "25px"
        }}
      />

      {/* Alerts */}
      <div
        className="p-4 mb-4 bg-white shadow-sm rounded"
        style={{ borderLeft: "6px solid #EAA012" }}
      >
        <h4 className="fw-bold mb-3" style={{ color: "#152240" }}>
          Reminders & Alerts
        </h4>
        
        <div style={{ marginBottom: "12px" }}>
          <FaEnvelope size={22} color="#EAA012" className="me-2" />
          <span>
            <strong>Action Required:</strong> 3 mid-year reviews are overdue.
            <br />
            Send reminders to managers.
          </span>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <FaClock size={22} color="#EAA012" className="me-2" />
          <span>
            <strong>Goal Deadline:</strong> {kpis.totalGoals} active goals.
            {kpis.totalGoals > 0 && (
              <span className="text-info"> Track progress regularly.</span>
            )}
          </span>
        </div>

        <div>
          <FaChartLine size={22} color="#EAA012" className="me-2" />
          <span>
            <strong>Resignation Alert:</strong> {kpis.pendingResignations} pending resignation requests.
            {kpis.pendingResignations > 0 && (
              <span className="text-danger"> Requires HR attention.</span>
            )}
          </span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white shadow-sm rounded p-3 text-center">
            <h6>Total Employees</h6>
            <h2 style={{ color: "#f28e1c" }}>{kpis.totalResignations}</h2>
           
          </div>
        </div>

        <div className="col-md-3">
          <div className="bg-white shadow-sm rounded p-3 text-center">
            <h6>Average Score</h6>
            <h2 style={{ color: "#f28e1c" }}>81.5</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="bg-white shadow-sm rounded p-3 text-center">
            <h6>Outstanding %</h6>
            <h2 style={{ color: "#28a745" }}>{kpis.outstandingPercent}%</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="bg-white shadow-sm rounded p-3 text-center">
            <h6>PIP Count</h6>
            <h2 style={{ color: "#dc3545" }}>{kpis.pipCount}</h2>
          </div>
        </div>
      </div>

      {/* GRAPHS ROW */}
      <div className="row g-4">
        {/* BAR CHART - Performance Distribution by Rating */}
        <div className="col-md-6">
          <div className="bg-white shadow-sm rounded p-3">
            <h5 className="fw-semibold text-center mb-3">
              Overall Performance Distribution (By Rating)
            </h5>
            {employees.length > 0 ? (
              <Bar 
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.raw} employee(s)`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      },
                      title: {
                        display: true,
                        text: 'Number of Employees'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Performance Rating'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center p-5">
                <p className="text-muted">No employee data available</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={fetchAllData}
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DONUT CHART - Goal Completion Rate */}
        <div className="col-md-6">
          <div className="bg-white shadow-sm rounded p-3">
            <h5 className="fw-semibold text-center mb-3">
              Goal Completion Rate (By Status)
            </h5>
            {goals.length > 0 ? (
              <>
                <Doughnut 
                  data={donutChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} goals (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
                <div
                  className="fw-bold text-center mt-2"
                  style={{ fontSize: "22px", color: "#28a745" }}
                >
                  {kpis.goalCompletionRate}% Completed
                </div>
                <div className="text-center text-muted small mt-1">
                  Total Goals: {kpis.totalGoals}
                </div>
              </>
            ) : (
              <div className="text-center p-5">
                <p className="text-muted">No goal data available</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={fetchAllData}
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional: Display goal status breakdown */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="bg-white shadow-sm rounded p-3">
            <h5 className="fw-semibold mb-3">Goal Status Breakdown</h5>
            <div className="row">
              {Object.entries(calculateGoalStatusDistribution()).map(([status, count]) => {
                let statusColor = "";
                switch(status) {
                  case "Completed": statusColor = "#28a745"; break;
                  case "Preparing": statusColor = "#17a2b8"; break;
                  case "Pending": statusColor = "#ffc107"; break;
                  default: statusColor = "#6c757d";
                }
                
                return (
                  <div key={status} className="col-md-12 mb-2">
                    <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                      <div>
                        <span className="badge" style={{ 
                          backgroundColor: statusColor,
                          color: "white",
                          padding: "5px 10px"
                        }}>
                          {status}
                        </span>
                      </div>
                      <div className="fw-bold" style={{ fontSize: "1.2rem" }}>{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="bg-white shadow-sm rounded p-3">
            <h5 className="fw-semibold mb-3">Employee Statistics</h5>
            <div className="row">
              <div className="col-md-6 col-6 mb-2">
                <div className="text-center p-2 border rounded">
                  <div className="fw-bold" style={{ fontSize: "1.2rem", color: "#f28e1c" }}>{kpis.totalEmployees}</div>
                  <div className="text-muted small">Active Employees</div>
                </div>
              </div>
              <div className="col-md-6 col-6 mb-2">
                <div className="text-center p-2 border rounded">
                  <div className="fw-bold" style={{ fontSize: "1.2rem", color: "#17a2b8" }}>{kpis.totalResignations}</div>
                  <div className="text-muted small">Resignation Records</div>
                </div>
              </div>
              <div className="col-md-6 col-6 mb-2">
                <div className="text-center p-2 border rounded">
                  <div className="fw-bold" style={{ fontSize: "1.2rem", color: "#28a745" }}>{kpis.outstandingPercent}%</div>
                  <div className="text-muted small">Outstanding</div>
                </div>
              </div>
              <div className="col-md-6 col-6 mb-2">
                <div className="text-center p-2 border rounded">
                  <div className="fw-bold" style={{ fontSize: "1.2rem", color: "#dc3545" }}>{kpis.pipCount}</div>
                  <div className="text-muted small">PIP Count</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="bg-white shadow-sm rounded p-3">
            <h5 className="fw-semibold mb-3">Registration Status</h5>
            <div className="row">
              {Object.entries(calculateResignationStatusDistribution()).map(([status, count]) => {
                let statusColor = "";
                switch(status) {
                  case "Processed": statusColor = "#28a745"; break;
                  case "Pending": statusColor = "#ffc107"; break;
                  case "Rejected": statusColor = "#dc3545"; break;
                  default: statusColor = "#6c757d";
                }
                
                return (
                  <div key={status} className="col-md-12 mb-2">
                    <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                      <div>
                        <span className="badge" style={{ 
                          backgroundColor: statusColor,
                          color: "white",
                          padding: "5px 10px"
                        }}>
                          {status}
                        </span>
                      </div>
                      <div className="fw-bold" style={{ fontSize: "1.2rem" }}>{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
