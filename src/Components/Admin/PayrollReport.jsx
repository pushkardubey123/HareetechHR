import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";
import { useContext } from "react";
import { SettingsContext } from "../Redux/SettingsContext";

const PayrollReport = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const { settings } = useContext(SettingsContext);

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payrolls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPayrolls(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch payroll data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const employeeList = Array.from(
    new Set(
      payrolls
        .map((p) => p.employeeId)
        .filter((emp) => emp && emp._id)
        .map((emp) => JSON.stringify(emp))
    )
  ).map((str) => JSON.parse(str));

  const filteredPayrolls = payrolls.filter((p) => {
    const matchMonth = selectedMonth ? p.month === selectedMonth : true;
    const matchEmployee = selectedEmployee
      ? p.employeeId?._id === selectedEmployee
      : true;
    const matchStatus = selectedStatus ? p.status === selectedStatus : true;
    return matchMonth && matchEmployee && matchStatus;
  });

  const totalBasic = filteredPayrolls.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalAllowances = filteredPayrolls.reduce(
    (sum, p) => sum + (p.allowances?.reduce((a, x) => a + x.amount, 0) || 0),
    0
  );
  const totalDeductions = filteredPayrolls.reduce(
    (sum, p) => sum + (p.deductions?.reduce((a, x) => a + x.amount, 0) || 0),
    0
  );

  const exportToPDF = async() => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    await addCommonHeaderFooter(doc, settings);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PAYROLL REPORT", pageWidth / 2, 42, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Month: ${selectedMonth || "All"}`, 14, 50);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 55);
    doc.text(`Reported By: Admin Panel`, pageWidth - 14, 50, { align: "right" });

    const rows = filteredPayrolls.map((p, i) => [
      i + 1,
      p.employeeId?.name || "-",
      p.employeeId?.email || "-",
      p.month || "-",
      `Rs.${p.basicSalary}`,
      `Rs.${p.allowances?.reduce((s, a) => s + a.amount, 0) || 0}`,
      `Rs.${p.deductions?.reduce((s, d) => s + d.amount, 0) || 0}`,
      `Rs.${p.netSalary}`,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [
        [
          "#",
          "Employee",
          "Email",
          "Month",
          "Basic",
          "Allowances",
          "Deductions",
          "Net Salary",
          "Status",
        ],
      ],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        halign: "center",
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const finalY = doc.lastAutoTable.finalY + 25;
    const rightX = pageWidth - 20;

    doc.setDrawColor(0);
    doc.line(rightX - 60, finalY, rightX, finalY);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signature", rightX, finalY + 5, { align: "right" });
    doc.setFont("helvetica", "normal");
    addCommonFooter(doc, settings);
    doc.save("Payroll_Report.pdf");
  };

  const exportToCSV = () => {
    const csvData = filteredPayrolls.map((p, i) => ({
      S_No: i + 1,
      Employee: p.employeeId?.name,
      Email: p.employeeId?.email,
      Month: p.month,
      Basic: p.basicSalary,
      Allowances: p.allowances?.reduce((s, a) => s + a.amount, 0) || 0,
      Deductions: p.deductions?.reduce((s, d) => s + d.amount, 0) || 0,
      NetSalary: p.netSalary,
      Status: p.status,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Payroll_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="container mt-4">
        <h3 className="text-center mb-4 fw-bold text-primary">
          💼 Payroll Report
        </h3>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Month</label>
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Employee</label>
            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employeeList.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                onClick={exportToCSV}
              >
                Export CSV
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={exportToPDF}
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="row text-center mb-4">
          <div className="col-md-3">
            <div className="bg-light rounded shadow-sm py-3">
              <h6 className="mb-1 text-muted">Total Basic</h6>
              <h5 className="text-primary fw-bold">₹{totalBasic}</h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-light rounded shadow-sm py-3">
              <h6 className="mb-1 text-muted">Allowances</h6>
              <h5 className="text-success fw-bold">₹{totalAllowances}</h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-light rounded shadow-sm py-3">
              <h6 className="mb-1 text-muted">Deductions</h6>
              <h5 className="text-danger fw-bold">₹{totalDeductions}</h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-light rounded shadow-sm py-3">
              <h6 className="mb-1 text-muted">Total Net</h6>
              <h5 className="text-success fw-bold">₹{totalNet}</h5>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover text-center shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Email</th>
                <th>Month</th>
                <th>Basic</th>
                <th>Allowance</th>
                <th>Deduction</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">
                    <Loader />
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-muted">
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p, i) => (
                  <tr key={p._id}>
                    <td>{i + 1}</td>
                    <td>{p.employeeId?.name}</td>
                    <td>{p.employeeId?.email}</td>
                    <td>{p.month}</td>
                    <td>₹{p.basicSalary}</td>
                    <td>₹{p.allowances.reduce((s, a) => s + a.amount, 0)}</td>
                    <td>₹{p.deductions.reduce((s, d) => s + d.amount, 0)}</td>
                    <td className="fw-bold">₹{p.netSalary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PayrollReport;
