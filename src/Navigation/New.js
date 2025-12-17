import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// Import your actual components here
import Overview from "../components/Overview";
import KRAs from "../components/KRAs";
import Feedback from "../components/Feedback";
import SelfAppraisal from "../components/SelfAppraisal";


export default function New() {
  const [activePage, setActivePage] = useState("Overview");

  // Navbar component integrated directly
  const Navbar = () => {
    const tabs = ["Overview", "KRAs", "Feedback", "Self Appraisal"];

    return (
      <>
        {/* Title Row */}
        <div className="d-flex justify-content-between align-items-center border-bottom p-3">
          <div className="d-flex align-items-center gap-3">
            <h5 className="m-0">New Appraisal</h5>
            
          </div>

          
        </div>

        {/* ERPNext Style Tabs */}
        <ul
          className="nav px-3"
          style={{
            borderBottom: "1px solid #dee2e6",
            backgroundColor: "#ffffff",
            marginTop: "5px",
          }}
        >
          {tabs.map((tab) => (
            <li className="nav-item" key={tab}>
              <button
                className="nav-link"
                style={{
                  color: activePage === tab ? "#000" : "#6c757d",
                  borderBottom: activePage === tab ? "2px solid #000" : "2px solid transparent",
                  fontWeight: activePage === tab ? "500" : "400",
                }}
                onClick={() => setActivePage(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
	<>
	
    <div
      className="container-fluid"
      style={{ backgroundColor: "#f4f5f6", minHeight: "100vh", padding: "20px" }}
    >
      <div className="container bg-white shadow-sm rounded border p-0">
        {/* Navigation (Top Header) */}
        <Navbar />

        {/* Page Content - Using imported components */}
        <div className="p-4">
          {activePage === "Overview" && <Overview />}
          {activePage === "KRAs" && <KRAs />}
          {activePage === "Feedback" && <Feedback />}
          {activePage === "Self Appraisal" && <SelfAppraisal />}
        </div>
      </div>
    </div>
	</>
  );
}