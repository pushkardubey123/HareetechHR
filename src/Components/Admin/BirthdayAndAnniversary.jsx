import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  FaBirthdayCake, FaBriefcase, FaDownload, FaFilePdf, FaSearch, FaGift, FaMedal
} from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./EmployeeDates.css"; 
import DynamicLayout from "../Common/DynamicLayout";

const EmployeeReminders = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, headers);
        if (res.data.detailed?.bday) {
          setPerms(res.data.detailed.bday);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchEmployees();
  }, [token, isAdmin]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/employee-dates`, headers);
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (date) => {
    const today = moment();
    return today.isSame(moment(date), "day") && today.isSame(moment(date), "month");
  };

  const isUpcoming = (date) => {
    const today = moment();
    const eventDate = moment(date).year(today.year());
    if (eventDate.isBefore(today)) eventDate.add(1, 'year');
    return eventDate.diff(today, 'days') <= 7 && eventDate.diff(today, 'days') > 0;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.branchId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const todaysBirthdays = employees.filter(e => isToday(e.dob));
  const todaysAnniversaries = employees.filter(e => isToday(e.doj));

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredEmployees.map((e) => ({
        Name: e.name, Branch: e.branchId?.name || "-",
        DOB: moment(e.dob).format("DD-MM-YYYY"), DOJ: moment(e.doj).format("DD-MM-YYYY"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dates");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "Employee_Dates.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Employee Birthday & Anniversary Report", 14, 15);
    const rows = filteredEmployees.map((e) => [
      e.name, e.branchId?.name || "-",
      moment(e.dob).format("DD-MM-YYYY"), moment(e.doj).format("DD-MM-YYYY"),
    ]);
    doc.autoTable(["Name", "Branch", "DOB", "DOJ"], rows, { startY: 22 });
    doc.save("Employee_Dates.pdf");
  };

  return (
    <DynamicLayout>
      <div className="dates-container">
        <div className="dates-header">
          <div className="title-section">
            <h3><FaGift className="text-danger" /> Celebrations & Dates</h3>
            <p className="subtitle">Track birthdays and work anniversaries of your team.</p>
          </div>
          <div className="action-buttons">
            <button className="btn-export" onClick={exportToExcel}><FaDownload /> Excel</button>
            <button className="btn-export" onClick={exportToPDF}><FaFilePdf /> PDF</button>
          </div>
        </div>

        {(todaysBirthdays.length > 0 || todaysAnniversaries.length > 0) && (
          <div className="celebration-grid">
            {todaysBirthdays.map(emp => (
              <div key={emp._id} className="celeb-card birthday">
                <div className="celeb-icon"><FaBirthdayCake /></div>
                <div className="celeb-info">
                  <h5>Happy Birthday, {emp.name.split(' ')[0]}!</h5>
                  <p>{emp.branchId?.name}</p>
                </div>
              </div>
            ))}
            {todaysAnniversaries.map(emp => (
              <div key={emp._id} className="celeb-card anniversary">
                <div className="celeb-icon"><FaMedal /></div>
                <div className="celeb-info">
                  <h5>Work Anniversary: {emp.name.split(' ')[0]}</h5>
                  <p>{moment().diff(moment(emp.doj), 'years')} Years Completed</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dates-card">
          <div className="toolbar">
            <h5 className="mb-0 fw-bold" style={{color: 'var(--ed-text-main)'}}>All Employees List</h5>
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input 
                type="text" className="search-input" 
                placeholder="Search employee..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Branch</th>
                  <th>Birthday (DOB)</th>
                  <th>Work Anniversary (DOJ)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-5">Loading dates...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No records found.</td></tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const bdayToday = isToday(emp.dob);
                    const annivToday = isToday(emp.doj);
                    const bdaySoon = isUpcoming(emp.dob);
                    
                    return (
                      <tr key={emp._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="fw-semibold">{emp.name}</div>
                            {bdayToday && <span className="today-tag">B-Day</span>}
                            {annivToday && <span className="today-tag anniv">Anniv</span>}
                          </div>
                        </td>
                        <td>{emp.branchId?.name || "-"}</td>
                        <td>
                          <div className="date-badge">
                            <FaBirthdayCake className={bdayToday ? "text-danger" : "text-muted"} /> 
                            {moment(emp.dob).format("DD MMM")} 
                            <span className="text-muted small">({moment(emp.dob).format("YYYY")})</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-badge">
                            <FaBriefcase className={annivToday ? "text-warning" : "text-muted"} /> 
                            {moment(emp.doj).format("DD MMM")} 
                            <span className="text-muted small">({moment(emp.doj).format("YYYY")})</span>
                          </div>
                        </td>
                        <td>
                          {bdayToday ? <span className="text-danger fw-bold">🎉 Today!</span> : 
                           annivToday ? <span className="text-warning fw-bold">🏆 Today!</span> : 
                           bdaySoon ? <span className="text-primary small">Coming Soon</span> : 
                           <span className="text-muted small">-</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default EmployeeReminders;