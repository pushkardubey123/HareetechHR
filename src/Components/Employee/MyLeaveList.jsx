import React, { useEffect, useState, useMemo } from "react";
import axios from "../Admin/LeaveManagement/axiosInstance";
import moment from "moment";
import { jwtDecode } from "jwt-decode";
import EmployeeLayout from "../Common/DynamicLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import "./MyLeaveList.css"; 

// Icons
import { 
  FaFilePdf, FaFileCsv, FaSearch, FaHistory, 
  FaCalendarAlt, FaHourglassHalf, FaCheckCircle, FaTimesCircle 
} from "react-icons/fa";
import { BiLoaderAlt, BiFilterAlt } from "react-icons/bi";

const MyLeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (token) {
        const decoded = jwtDecode(token);
        fetchMyLeaves(decoded.id);
    }
  }, []);

  const fetchMyLeaves = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/leaves/employee/${id}`);
      if (res.data.success) {
        const sortedData = res.data.data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setLeaves(sortedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start, end) => {
      const s = moment(start);
      const e = moment(end);
      return e.diff(s, 'days') + 1; 
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => 
        l.leaveType.toLowerCase().includes(search.toLowerCase()) || 
        l.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [leaves, search]);

  const stats = useMemo(() => {
      return {
          total: leaves.length,
          approved: leaves.filter(l => l.status === 'Approved').length,
          pending: leaves.filter(l => l.status === 'Pending').length,
          rejected: leaves.filter(l => l.status === 'Rejected').length
      };
  }, [leaves]);

  const exportToCSV = () => {
    if(filteredLeaves.length === 0) return alert("No data");
    const csvData = filteredLeaves.map(l => ({
        "Type": l.leaveType,
        "Start": moment(l.startDate).format("DD-MM-YYYY"),
        "End": moment(l.endDate).format("DD-MM-YYYY"),
        "Days": calculateDays(l.startDate, l.endDate),
        "Status": l.status,
        "Reason": l.reason || "-"
    }));
    const csv = Papa.unparse(csvData);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `Leaves_${moment().format("YYYYMMDD")}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if(filteredLeaves.length === 0) return alert("No data");
    const doc = new jsPDF();
    doc.text("My Leave History", 14, 22);
    autoTable(doc, {
        startY: 30,
        head: [["Type", "Dates", "Days", "Status", "Reason"]],
        body: filteredLeaves.map(l => [
            l.leaveType,
            `${moment(l.startDate).format("DD MMM")} - ${moment(l.endDate).format("DD MMM")}`,
            calculateDays(l.startDate, l.endDate),
            l.status,
            l.reason || ""
        ]),
    });
    doc.save(`Leaves_${moment().format("YYYYMMDD")}.pdf`);
  };

  return (
    <EmployeeLayout>
      <div className="ml-container">
        
        {/* Header */}
        <div className="ml-header">
            <div className="ml-title">
                <h2><FaHistory className="text-indigo-500"/> Leave History</h2>
                <p>Overview of your leave applications</p>
            </div>
            <div className="ml-actions">
                <div style={{position: 'relative'}}>
                    <FaSearch style={{position: 'absolute', top: 12, left: 12, color: 'var(--ml-text-muted)'}}/>
                    <input 
                      type="text" 
                      className="ml-search-input" 
                      placeholder="Search leaves..." 
                      value={search} 
                      onChange={e=>setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-export" onClick={exportToCSV}>
                  <FaFileCsv className="text-green-500"/> CSV
                </button>
                <button className="btn-export" onClick={exportToPDF}>
                  <FaFilePdf className="text-red-500"/> PDF
                </button>
            </div>
        </div>

        {/* Stats */}
        <div className="ml-stats-grid">
            <div className="ml-stat-card">
                <div className="stat-icon bg-blue-soft"><FaCalendarAlt/></div>
                <div>
                  <div className="fs-4 fw-bold text-main">{stats.total}</div>
                  <div className="text-sub">Total</div>
                </div>
            </div>
            <div className="ml-stat-card">
                <div className="stat-icon bg-yellow-soft"><FaHourglassHalf/></div>
                <div>
                  <div className="fs-4 fw-bold text-main">{stats.pending}</div>
                  <div className="text-sub">Pending</div>
                </div>
            </div>
            <div className="ml-stat-card">
                <div className="stat-icon bg-green-soft"><FaCheckCircle/></div>
                <div>
                  <div className="fs-4 fw-bold text-main">{stats.approved}</div>
                  <div className="text-sub">Approved</div>
                </div>
            </div>
            <div className="ml-stat-card">
                <div className="stat-icon bg-red-soft"><FaTimesCircle/></div>
                <div>
                  <div className="fs-4 fw-bold text-main">{stats.rejected}</div>
                  <div className="text-sub">Rejected</div>
                </div>
            </div>
        </div>

        {/* Table */}
        <div className="ml-card">
            <div className="ml-table-wrapper">
                <table className="ml-table">
                    <thead>
                        <tr>
                            <th style={{width: '20%'}}>Leave Type</th>
                            <th style={{width: '25%'}}>Duration</th>
                            <th style={{width: '10%'}}>Days</th>
                            <th style={{width: '15%'}}>Status</th>
                            <th style={{width: '30%'}}>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}><BiLoaderAlt className="animate-spin text-main" size={24}/></td></tr>
                        ) : filteredLeaves.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--ml-text-muted)'}}>No records found.</td></tr>
                        ) : (
                            filteredLeaves.map((l) => (
                                <tr key={l._id}>
                                    <td className="text-main">{l.leaveType}</td>
                                    <td>
                                        <div className="text-sub">
                                            {moment(l.startDate).format("DD MMM YYYY")} 
                                            <span style={{margin: '0 6px', opacity: 0.5}}>➜</span> 
                                            {moment(l.endDate).format("DD MMM YYYY")}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="day-badge">
                                            {calculateDays(l.startDate, l.endDate)} Days
                                        </span>
                                    </td>
                                    <td>
                                        {/* Status Pill with Dot */}
                                        <span className={`status-pill ${
                                            l.status === 'Approved' ? 'status-approved' : 
                                            l.status === 'Rejected' ? 'status-rejected' : 'status-pending'
                                        }`}>
                                            <span className="status-dot"></span>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} className="text-sub" title={l.reason}>
                                            {l.reason || "-"}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default MyLeaveList;