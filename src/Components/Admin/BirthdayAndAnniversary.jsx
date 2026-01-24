import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  FaBirthdayCake,
  FaBriefcase,
  FaDownload,
  FaFilePdf,
} from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./EmployeeDates.css";
import AdminLayout from "./AdminLayout";

const EmployeeReminders = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/employee-dates`,
        headers
      );
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Error fetching employee dates:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const isToday = (date) => {
    const today = moment();
    return (
      today.isSame(moment(date), "day") &&
      today.isSame(moment(date), "month")
    );
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.branchId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredEmployees.map((e) => ({
        Name: e.name,
        Branch: e.branchId?.name || "-",
        DOB: moment(e.dob).format("DD-MM-YYYY"),
        DOJ: moment(e.doj).format("DD-MM-YYYY"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EmployeeDates");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "Employee_Dates.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const columns = ["Name", "Branch", "DOB", "DOJ"];
    const rows = filteredEmployees.map((e) => [
      e.name,
      e.branchId?.name || "-",
      moment(e.dob).format("DD-MM-YYYY"),
      moment(e.doj).format("DD-MM-YYYY"),
    ]);

    doc.text("Employee DOB / DOJ Report", 14, 15);
    doc.autoTable(columns, rows, { startY: 22 });
    doc.save("Employee_Dates.pdf");
  };

  return (
    <AdminLayout>
      <div className="payroll-page">
        <div className="payroll-card">
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <h4 className="payroll-title">
              Employee DOB & DOJ
            </h4>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm d-flex align-item-center"
                onClick={exportToExcel}
              >
                <FaDownload className="me-1" /> Excel
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-item-center"
                onClick={exportToPDF}
              >
                <FaFilePdf className="me-1" /> PDF
              </button>
            </div>
          </div>

          <input
            type="text"
            className="form-control payroll-search mb-3"
            placeholder="Search by employee or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="table-responsive">
            <table className="table payroll-table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>DOB</th>
                  <th>DOJ</th>
                  <th>Today</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{emp.name}</td>
                      <td>{emp.branchId?.name || "-"}</td>
                      <td>
                        {moment(emp.dob).format("DD-MM-YYYY")}
                        {isToday(emp.dob) && (
                          <span className="badge bg-warning ms-2">
                            <FaBirthdayCake className="me-1" />
                            Birthday
                          </span>
                        )}
                      </td>
                      <td>
                        {moment(emp.doj).format("DD-MM-YYYY")}
                        {isToday(emp.doj) && (
                          <span className="badge bg-info text-dark ms-2">
                            <FaBriefcase className="me-1" />
                            Anniversary
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {isToday(emp.dob) || isToday(emp.doj) ? "🎉" : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeReminders;
