import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Employeeonboarding from "../Components3/Employeeonboarding";
import New from "./New";
import New3 from "./New3";
import NewGoal from "../Components3/NewGoal";
import NewEmployeePromotion from "../Components3/NewEmployeePromotion";
import UserView from "../Components3/Userview";
import Dashboard from "../Components3/Dashboard";
import Annualreport from "../Components3/Annualreport";
import PipManagement from "../Components3/PipManagement";
//import EmployeeScorecard from "../Components3/EmployeeScorecard";
import EmployeeResignation from "../Components3/EmployeeResignation";
import ViewNew from "./ViewNew";
import ViewNew3 from "./ViewNew3";
import ViewNewGoal from "../Components3/ViewNewGoal";
import ViewEmployeePromotion from "../Components3/ViewEmployeePromotion";
import ViewPipManagement from "../Components3/ViewPipManagement";
import ViewAnnualReport from "../Components3/ViewAnnualReport";
//import ViewEmployeeOnboarding from "../Components3/ViewEmployeeOnboarding";
import ViewEmployeeResignation from "../Components3/ViewEmployeeResignation";
//import ViewUserView from "../Components3/ViewUserView";
//import EmployeeSideData from "../Components3/EmployeeSideData";
import AllEmployeesData from "../Components3/AllEmployeesData";
//import UserDashboard from "../UserDashboard";
export default function Mnavigation({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState("Dashboard");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Master Pages (for creating/adding data)
  const masterPages = [
    { id: "Dashboard", name: "Dashboard" },
	 { id: "EmployeeResignation", name: "New Employee registration" },
    { id: "New", name: "New Appraisal" },
    { id: "New3", name: "Employee Performance Review" },
    { id: "NewGoal", name: "New Goal" },
    //{ id: "EmployeeScorecard", name: "Employee Scorecard" },
    { id: "NewEmployeePromotion", name: "New Promotion" },
    { id: "PipManagement", name: "New PIP Management" },
    { id: "Annualreport", name: "New Annual Report" },
    //{ id: "Employeeonboarding", name: "New Employee Onboarding" },
   
    //{ id: "UserView", name: "New User View" },
  ];

  // View Pages (for viewing/editing existing data)
  const viewPages = [
	{ id: "ViewEmployeeResignation", name: "View Employee registration" },
    { id: "ViewNew", name: "View Appraisals" },
	
    { id: "ViewNew3", name: "View Performance Reviews" },
    { id: "ViewNewGoal", name: "View Goals" },
    { id: "ViewEmployeePromotion", name: "View Promotions" },
    { id: "ViewPipManagement", name: "View PIP Management" },
    { id: "ViewAnnualReport", name: "View Annual Reports" },
    //{ id: "ViewEmployeeOnboarding", name: "View Employee Onboarding" },
    
    //{ id: "ViewUserView", name: "View User Views" },
	//{ id: "EmployeeSideData", name: "Employee Side Data" },
	{ id: "AllEmployeesData", name: " AllEmployeesData" },
	//{ id: "UserDashboard", name: "UserDashboard" },
  ];

  // Toggle section expansion
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Handle page click
  const handlePageClick = (pageId) => {
    setActivePage(pageId);
    setMenuOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Render navigation items for desktop
  const renderDesktopNav = () => {
    return (
      <>
        {/* User Info Section */}
      

        {/* Dashboard Section */}
        <div className="mb-3">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "Dashboard" || activePage === "Dashboard" ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("Dashboard")}
          >
            <span>📊 Dashboard</span>
            <span>{expandedSection === "Dashboard" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "Dashboard" && (
            <div className="ps-3">
              <button
                className={`nav-link text-start w-100 px-3 py-2 ${
                  activePage === "Dashboard" ? "fw-bold text-dark" : "text-secondary"
                }`}
                style={{
                  borderRadius: "6px",
                  fontSize: "14px",
                  border: "none",
                  background: "transparent",
                }}
                onClick={() => handlePageClick("Dashboard")}
              >
                Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Master Pages Section */}
        <div className="mb-3">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "Master" || masterPages.some(p => p.id === activePage) ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("Master")}
          >
            <span>📝 Master Pages</span>
            <span>{expandedSection === "Master" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "Master" && (
            <div className="ps-3">
              {masterPages
                .filter(p => p.id !== "Dashboard")
                .map((p) => (
                  <button
                    key={p.id}
                    className={`nav-link text-start w-100 px-3 py-2 ${
                      activePage === p.id ? "fw-bold text-dark" : "text-secondary"
                    }`}
                    style={{
                      borderRadius: "6px",
                      fontSize: "14px",
                      border: "none",
                      background: "transparent",
                    }}
                    onClick={() => handlePageClick(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* View Pages Section */}
        <div className="mb-3">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "View" || viewPages.some(p => p.id === activePage) ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("View")}
          >
            <span>👁️ View Pages</span>
            <span>{expandedSection === "View" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "View" && (
            <div className="ps-3">
              {viewPages.map((p) => (
                <button
                  key={p.id}
                  className={`nav-link text-start w-100 px-3 py-2 ${
                    activePage === p.id ? "fw-bold text-dark" : "text-secondary"
                  }`}
                  style={{
                    borderRadius: "6px",
                    fontSize: "14px",
                    border: "none",
                    background: "transparent",
                  }}
                  onClick={() => handlePageClick(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // Render navigation items for mobile
  const renderMobileNav = () => {
    return (
      <>
        {/* User Info - Mobile */}
        <div className="mb-3 p-2 border-bottom">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
              style={{ width: "40px", height: "40px" }}>
              <span className="text-white fw-bold">
                {user?.companyName?.[0] || user?.email?.[0] || "U"}
              </span>
            </div>
            <div>
              <h6 className="mb-0 fw-bold" style={{ fontSize: "14px" }}>
                {user?.companyName || "Company"}
              </h6>
              <small className="text-muted" style={{ fontSize: "11px" }}>
                {user?.email || "user@example.com"}
              </small>
            </div>
          </div>
        </div>

        {/* Dashboard Section - Mobile */}
        <div className="mb-2">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "Dashboard" || activePage === "Dashboard" ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("Dashboard")}
          >
            <span>📊 Dashboard</span>
            <span>{expandedSection === "Dashboard" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "Dashboard" && (
            <div className="ps-3">
              <button
                className={`nav-link text-start w-100 px-3 py-2 ${
                  activePage === "Dashboard" ? "fw-bold text-dark" : "text-secondary"
                }`}
                style={{
                  borderRadius: "6px",
                  fontSize: "14px",
                  border: "none",
                  background: "transparent",
                }}
                onClick={() => handlePageClick("Dashboard")}
                >
                Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Master Pages Section - Mobile */}
        <div className="mb-2">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "Master" || masterPages.some(p => p.id === activePage) ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("Master")}
          >
            <span>📝 Master Pages</span>
            <span>{expandedSection === "Master" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "Master" && (
            <div className="ps-3">
              {masterPages
                .filter(p => p.id !== "Dashboard")
                .map((p) => (
                  <button
                    key={p.id}
                    className={`nav-link text-start w-100 px-3 py-2 ${
                      activePage === p.id ? "fw-bold text-dark" : "text-secondary"
                    }`}
                    style={{
                      borderRadius: "6px",
                      fontSize: "14px",
                      border: "none",
                      background: "transparent",
                    }}
                    onClick={() => handlePageClick(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* View Pages Section - Mobile */}
        <div className="mb-2">
          <button
            className={`nav-link text-start w-100 px-3 py-2 d-flex justify-content-between align-items-center ${
              expandedSection === "View" || viewPages.some(p => p.id === activePage) ? "fw-bold text-dark" : "text-secondary"
            }`}
            style={{
              borderRadius: "6px",
              fontSize: "15px",
              border: "none",
              background: "transparent",
            }}
            onClick={() => toggleSection("View")}
          >
            <span>👁️ View Pages</span>
            <span>{expandedSection === "View" ? "▼" : "▶"}</span>
          </button>
          {expandedSection === "View" && (
            <div className="ps-3">
              {viewPages.map((p) => (
                <button
                  key={p.id}
                  className={`nav-link text-start w-100 px-3 py-2 ${
                    activePage === p.id ? "fw-bold text-dark" : "text-secondary"
                  }`}
                  style={{
                    borderRadius: "6px",
                    fontSize: "14px",
                    border: "none",
                    background: "transparent",
                  }}
                  onClick={() => handlePageClick(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div
      className="d-flex flex-column flex-md-row"
      style={{ minHeight: "100vh", background: "#f8f9fc" }}
    >
      {/* Top Navigation (Mobile / Tab) */}
      <div className="d-md-none bg-white shadow-sm border-bottom w-100">
        <div className="d-flex justify-content-between align-items-center p-3">
          <div>
			
            <h4 className="text-primary fw-bold mb-0">AITS PMS SYSTEM</h4>
            <small className="text-secondary">Management</small>
          </div>
          <button
            className="btn btn-outline-primary px-3 py-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div
            className="px-3 pb-3"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            {renderMobileNav()}
          </div>
        )}
      </div>

      {/* Sidebar (Desktop) */}
      <div
        className="bg-white shadow-sm border-end d-none d-md-block"
        style={{
          width: "240px",
          position: "sticky",
          top: "0",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div className=" align-items-center border-bottom  ">
		<img 
  src="data:image/jpeg;base64,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" 
  alt="AITS Logo" 
  style={{
              width: "120px",
              height: "120px",
              objectFit: "contain",
              backgroundColor: "white",
              padding: "10px",
              borderRadius: "50%",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              marginLeft: "50px",
			  marginTop:"20px",
			  marginBottom:"-40px",
            }}/>
          <h2 className="text-primary fw-bold "
		 style={{marginLeft:"75px",
			marginTop:"50px"
		 }} 
		  > PMS </h2>
         
        </div>

        <div className="nav flex-column mt-3  px-2">
          {renderDesktopNav()}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow-1 p-3">
        {/* Top Header with Company Name Dropdown */}
        <div className="bg-white rounded shadow-sm mb-3 p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="text-dark mb-0">
                {/* Removed the Welcome message */}
              </h4>
            </div>
            <div className="position-relative">
              {/* Company Name Dropdown */}
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              >
                <span className="me-2 fw-bold">{user?.companyName || "Company"}</span>
                <i className={`bi bi-chevron-${showCompanyDropdown ? "up" : "down"}`}></i>
              </button>
              
              {/* Dropdown Menu */}
              {showCompanyDropdown && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white rounded shadow border"
                  style={{ minWidth: "200px", zIndex: 1000 }}
                >
					
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                        style={{ width: "40px", height: "40px" }}>
                        <span className="text-white fw-bold">
                          {user?.companyName?.[0] || user?.email?.[0] || "U"}
                        </span>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">{user?.companyName || "Company"}</h6>
                        <small className="text-muted">{user?.email || "user@example.com"}</small>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded shadow-sm p-3">
          {activePage === "Dashboard" && <Dashboard />}
          {activePage === "New" && <New />}
          {activePage === "ViewNew" && <ViewNew />}
          {activePage === "New3" && <New3 />}
          {activePage === "ViewNew3" && <ViewNew3 />}
          {/*{activePage === "EmployeeScorecard" && <EmployeeScorecard />}*/}
          {activePage === "NewGoal" && <NewGoal />}
          {activePage === "ViewNewGoal" && <ViewNewGoal />}
          {activePage === "NewEmployeePromotion" && <NewEmployeePromotion />}
          {activePage === "ViewEmployeePromotion" && <ViewEmployeePromotion />}
          {activePage === "PipManagement" && <PipManagement />}
          {activePage === "ViewPipManagement" && <ViewPipManagement />}
          {activePage === "Annualreport" && <Annualreport />}
          {activePage === "ViewAnnualReport" && <ViewAnnualReport />}
          {/*{activePage === "Employeeonboarding" && <Employeeonboarding />}*/}
          {activePage === "EmployeeResignation" && <EmployeeResignation />}
          {activePage === "ViewEmployeeResignation" && <ViewEmployeeResignation />}
          {/*{activePage === "ViewEmployeeOnboarding" && (
            <ViewEmployeeOnboarding />
          )}*/}
          {/*{activePage === "UserView" && <UserView />}*/}
          {/*{activePage === "ViewUserView" && <ViewUserView />}*/}
		  {/*{activePage === "EmployeeSideData" && <EmployeeSideData />}*/}
		  {activePage === "AllEmployeesData" && <AllEmployeesData />}
		  {/*{activePage === "UserDashboard" && <UserDashboard />}*/}
        </div>
      </div>
    </div>
  );
}

//patilavdhut198_db_user

//dBQoGihPNzqMTgkj