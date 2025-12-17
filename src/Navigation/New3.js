import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import EmployeeDetails from "../components2/EmployeeDetails";

import Feedback1 from "../components2/Feedback1";


export default function New3() {
  const [activePage, setActivePage] = useState("EmployeeDetails");

  const tabs = ["EmployeeDetails", "Feedback1"];

  return (
	<>
	
    <div
      className="container-fluid"
      style={{ backgroundColor: "#f4f5f6", minHeight: "100vh", padding: "20px" }}
    >
      <div className="container bg-white shadow-sm rounded border p-0">

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center border-bottom p-3">
          <div className="d-flex align-items-center gap-3">
            <h5 className="m-0">New Employee Performance</h5>
            
          </div>

         
        </div>

        {/* Tabs */}
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

        {/* Page Content */}
        <div className="p-4">
          {activePage === "EmployeeDetails" && <EmployeeDetails />}
          {activePage === "Feedback1" && <Feedback1 />}
        </div>

      </div>
    </div>
	</>
  );
}
