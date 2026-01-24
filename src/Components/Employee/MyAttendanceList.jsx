import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import { FcCalendar } from "react-icons/fc"; 
import { FaFilePdf, FaFileCsv, FaSearch, FaHistory, FaClock } from "react-icons/fa";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { SettingsContext } from "../Redux/SettingsContext";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";
import "./MyAttendanceList.css"; 

const MyAttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [originalAttendance, setOriginalAttendance] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    const fetchAttendance = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      const employeeId = user?.id;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/attendance/employee/${employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          const reversed = res.data.data.reverse();
          setAttendances(reversed);
          setOriginalAttendance(reversed);
        }
      } catch (error) {
        Swal.fire("Error", "Failed to fetch attendance", "error");
      }
    };
    fetchAttendance();
  }, []);

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      return Swal.fire("Warning", "Please select both dates", "warning");
    }
    const filtered = originalAttendance.filter((att) => {
      const attDate = new Date(att.date).toISOString().split("T")[0];
      return attDate >= fromDate && attDate <= toDate;
    });
    setAttendances(filtered);
  };

  // --- UPDATED PDF EXPORT (No Mode, No Time if Absent) ---
  const exportToPDF = async () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    await addCommonHeaderFooter(doc, settings);
    
    doc.setFontSize(14); doc.setTextColor(0,0,0); doc.setFont("helvetica", "bold");
    doc.text("ATTENDANCE REPORT", 14, 45);

    const tableData = attendances.map((att, i) => {
        const isAbsent = att.status === 'Absent';
        return [
            i + 1,
            new Date(att.date).toLocaleDateString(),
            isAbsent ? "-" : (att.inTime || "-"),
            isAbsent ? "-" : (att.outTime || "-"),
            att.status || "-",
        ]
    });

    autoTable(doc, {
      startY: 50,
      head: [["#", "Date", "In Time", "Out Time", "Status"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    addCommonFooter(doc, settings);
    doc.save("Attendance_Report.pdf");
  };

  // --- UPDATED CSV EXPORT (No Mode) ---
  const exportToCSV = () => {
    const csvData = attendances.map((attend, index) => {
        const isAbsent = attend.status === 'Absent';
        return {
            S_No: index + 1,
            Date: new Date(attend.date).toLocaleDateString(),
            In_Time: isAbsent ? "-" : (attend.inTime || "-"),
            Out_Time: isAbsent ? "-" : (attend.outTime || "-"),
            Status: attend.status,
        }
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Attendance_Log.csv";
    link.click();
  };

  return (
    <EmployeeLayout>
      <div className="att-list-wrapper">
        
        {/* --- BACKGROUND STICKER --- */}
        <div className="bg-sticker"><FaClock /></div>

        {/* --- HEADER --- */}
        <div className="al-header animate__animated animate__fadeInDown">
          <div className="al-title">
            <h3><FaHistory className="text-primary"/> Attendance History</h3>
            <p>Track your daily logs and status.</p>
          </div>
          <div className="al-actions">
            <button className="btn-export" onClick={exportToPDF}>
              <FaFilePdf className="text-danger"/> PDF
            </button>
            <button className="btn-export" onClick={exportToCSV}>
              <FaFileCsv className="text-success"/> CSV
            </button>
          </div>
        </div>

        {/* --- FILTERS (New UI) --- */}
        <div className="al-filter-card animate__animated animate__fadeInUp">
          <div className="filter-grid">
            <div className="input-group">
              <label>From Date</label>
              <input type="date" className="custom-date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label>To Date</label>
              <input type="date" className="custom-date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="btn-filter d-flex align-item-center" onClick={handleFilter}>
              <FaSearch  className="me-2 mt-1"/> Filter Logs
            </button>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="al-table-container animate__animated animate__fadeInUp">
          <div className="table-responsive">
            <table className="al-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length > 0 ? (
                  attendances.map((att, index) => {
                    const isAbsent = att.status === 'Absent';
                    return (
                        <tr key={att._id}>
                        <td className="text-muted fw-bold">#{index + 1}</td>
                        <td className="fw-bold">{new Date(att.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</td>
                        
                        {/* ABSENT LOGIC APPLIED HERE */}
                        <td className={isAbsent ? "text-muted" : "text-success fw-bold"}>
                            {isAbsent ? "-" : (att.inTime || "--:--")}
                        </td>
                        <td className={isAbsent ? "text-muted" : "text-danger fw-bold"}>
                            {isAbsent ? "-" : (att.outTime || "--:--")}
                        </td>

                        <td>
                            <span className={`status-pill sp-${att.status.toLowerCase().replace(' ', '')}`}>
                            {att.status}
                            </span>
                        </td>
                        </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-5 text-muted">
                      <FcCalendar size={40} className="mb-2"/>
                      <p>No attendance records found for this period.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default MyAttendanceList;