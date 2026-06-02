import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  FaBirthdayCake, FaBriefcase, FaDownload, FaFilePdf, FaSearch, FaGift, FaMedal, FaLock
} from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./EmployeeDates.css"; 
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";

const EmployeeReminders = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ PERMISSION LOGIC (Strict Check)
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  
  const [isModuleActive, setIsModuleActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      if (!token) return;

      try {
        // 1. Check if Company has this module in their Plan
        const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/my-subscription`, headers);
        const allowedModules = subRes.data?.data?.planId?.allowedModules || [];
        
        // ✅ EXPLICIT CHECK FOR BIRTHDAYS
        const hasModuleInPlan = allowedModules.includes("Birthdays & Anniversaries"); 
        setIsModuleActive(hasModuleInPlan);

        // 2. Check Employee Permissions
        if (isAdmin) {
          setHasPermission(true);
        } else {
          const permRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, headers);
          // ✅ EXPLICIT CHECK FOR BDAY
          if (permRes.data.detailed?.bday?.view || permRes.data.modules?.includes("bday")) {
            setHasPermission(true);
          }
        }
      } catch (e) {
        console.error("Access check failed", e);
      }
    };
    checkAccess();
  }, [token, isAdmin]);

  // Fetch only if access is granted
  useEffect(() => {
    if (isModuleActive && hasPermission) {
      fetchEmployees();
    } else if (!isModuleActive || !hasPermission) {
      setLoading(false);
    }
  }, [isModuleActive, hasPermission]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/employee-dates`, headers);
      setEmployees(res.data.data || []);
    } catch (err) { console.error("Error fetching data:", err); } 
    finally { setLoading(false); }
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

  const exportToExcel = () => { /* Same as before */ };
  const exportToPDF = () => { /* Same as before */ };

  if (loading) return <DynamicLayout><Loader /></DynamicLayout>;

  // ✅ ACCESS DENIED UI
  if (!isModuleActive || !hasPermission) {
    return (
      <DynamicLayout>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
          <FaLock size={60} className="text-muted mb-3" />
          <h3 className="fw-bold text-dark">Feature Locked</h3>
          <p className="text-muted text-center" style={{maxWidth: "400px"}}>
            {!isModuleActive 
              ? "Your company's current subscription plan does not include the Birthdays & Anniversaries module. Please upgrade."
              : "You do not have the required permissions to view upcoming celebrations. Contact your HR administrator."}
          </p>
        </div>
      </DynamicLayout>
    );
  }

  // ✅ RENDER THE PAGE (Keep your original JSX here)
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
                {filteredEmployees.length === 0 ? (
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