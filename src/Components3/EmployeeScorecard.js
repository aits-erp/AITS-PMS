import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

 // optional only if you want custom design

export default function EmployeeScorecard() {
  const employeeData = [
	{
	  name: "Alice Johnson",
	  role: "Software Engineer",
	  score: 92,
	  status: "Outstanding"
	},
	{
	  name: "Bob Smith",
	  role: "Product Manager",
	  score: 78,
	  status: "Satisfactory"
	},
	{
	  name: "Charlie Brown",
	  role: "UX Designer",
	  score: 65,
	  status: "Needs Improvement"
	},
	{
	  name: "Diana Prince",
	  role: "VP Operations",
	  score: 98,
	  status: "Outstanding"
	}
  ];

  // ------------------- Excel Download -------------------
  const exportToExcel = () => {
	const worksheet = XLSX.utils.json_to_sheet(employeeData);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
	XLSX.writeFile(workbook, "EmployeeScorecard.xlsx");
  };

  // ------------------- PDF Download -------------------
  const exportToPDF = () => {
	const doc = new jsPDF();
	doc.setFontSize(16);
	doc.text("AITS Performance Annual Report", 14, 20);

	const tableColumn = ["Name", "Role", "Score", "Status"];
	const tableRows = [];

	employeeData.forEach(item => {
	  tableRows.push([item.name, item.role, item.score, item.status]);
	});

	doc.autoTable({
	  startY: 30,
	  head: [tableColumn],
	  body: tableRows,
	});

	doc.save("EmployeeScorecard.pdf");
  };

  // ------------------- UI -------------------
  return (
	<>
	
	<div className="container py-4">

	  <div className="d-flex justify-content-between align-items-center mb-3">
		<h2 className="fw-bold">Employee Scorecard View</h2>

		<div>
		  <button
			className="btn btn-outline-warning me-2 fw-semibold"
			onClick={exportToPDF}
		  >
			⬇ Export to PDF
		  </button>

		  <button
			className="btn btn-warning text-white fw-semibold"
			onClick={exportToExcel}
		  >
			⬇ Export to Excel
		  </button>
		</div>
	  </div>

	  <table className="table table-hover">
		<thead style={{ background: "#FFF8E6" }}>
		  <tr className="fw-bold text-secondary">
			<th>EMPLOYEE NAME</th>
			<th>ROLE</th>
			<th>SCORE</th>
			<th>STATUS</th>
			<th>ACTION</th>
		  </tr>
		</thead>

		<tbody>
		  {employeeData.map((emp, index) => (
			<tr key={index}>
			  <td className="fw-semibold">{emp.name}</td>
			  <td>{emp.role}</td>
			  <td>{emp.score}</td>

			  <td>
				{emp.status === "Outstanding" && (
				  <span className="badge rounded-pill bg-success-subtle text-success">
					Outstanding
				  </span>
				)}
				{emp.status === "Satisfactory" && (
				  <span className="badge rounded-pill bg-warning-subtle text-warning">
					Satisfactory
				  </span>
				)}
				{emp.status === "Needs Improvement" && (
				  <span className="badge rounded-pill bg-danger-subtle text-danger">
					Needs Improvement
				  </span>
				)}
			  </td>

			  <td>
				<button className="btn btn-link">View Detail</button>
			  </td>
			</tr>
		  ))}
		</tbody>
	  </table>
	</div>
	</>
  );
}
