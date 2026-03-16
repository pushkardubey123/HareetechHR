import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { 
  BiBarChartSquare, BiCloudDownload, BiSearch, BiFilterAlt, 
  BiUserCheck, BiTimeFive, BiPieChartAlt, BiLoaderAlt,
  BiChevronLeft, BiChevronRight
} from "react-icons/bi";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

const LeaveReports = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 

  const [filters, setFilters] = useState({
    type: "Monthly",
    month: moment().format("YYYY-MM"),
    year: moment().format("YYYY"),
    search: ""
  });

  // ✅ PERMISSION LOGIC (Mapped to 'leave_requests')
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.leave_requests) {
          setPerms(res.data.detailed.leave_requests);
        }
      } catch (e) {}
    };
    fetchPerms();
  }, [token, isAdmin, API_URL]);

  useEffect(() => {
    if(!token) return;
    const timer = setTimeout(() => { fetchReport(); }, 500);
    return () => clearTimeout(timer);
  }, [filters.type, filters.month, filters.year, token]);

  useEffect(() => { setCurrentPage(1); }, [filters.search, filters.month, filters.year, filters.type]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: filters.type,
        ...(filters.type === "Monthly" ? { month: filters.month } : { year: filters.year })
      };

      const res = await axios.get(`${API_URL}/api/leaves/report`, { 
        params, headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data && res.data.success) setData(res.data.data || []);
      else setData([]);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message || "Failed to load report"}`);
      setData([]); 
    } finally { setLoading(false); }
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      const empName = item?.employeeId?.name || "Unknown";
      const lType = item?.leaveType || "";
      const searchStr = filters.search.toLowerCase();
      return empName.toLowerCase().includes(searchStr) || lType.toLowerCase().includes(searchStr);
    });
  }, [data, filters.search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      approved: filteredData.filter(d => d.status === 'Approved').length,
      pending: filteredData.filter(d => d.status === 'Pending').length,
      rejected: filteredData.filter(d => d.status === 'Rejected').length,
    };
  }, [filteredData]);

  const handleExport = () => toast.info("Exporting data to CSV...");

  const getStatusPill = (status) => {
    switch(status) {
      case "Approved": return <span className="status-pill status-approved"><FaCheckCircle className="me-1"/> Approved</span>;
      case "Rejected": return <span className="status-pill status-rejected"><FaTimesCircle className="me-1"/> Rejected</span>;
      default: return <span className="status-pill status-pending"><FaClock className="me-1"/> Pending</span>;
    }
  };

  // NO <DynamicLayout> HERE, purely inner component!
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="glass-box p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
              <span className="text-indigo-500 bg-indigo-500/10 p-2 rounded-lg"><BiPieChartAlt /></span> Leave Analytics
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Real-time insights on employee time-off patterns.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-[var(--bg-page)] p-1 rounded-xl border border-[var(--border-color)] flex">
               <button onClick={() => setFilters({...filters, type: "Monthly"})} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filters.type === "Monthly" ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Monthly</button>
               <button onClick={() => setFilters({...filters, type: "Yearly"})} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filters.type === "Yearly" ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Yearly</button>
            </div>
            <div className="relative">
              {filters.type === "Monthly" ? (
                <input type="month" className="input-glass px-4 py-2.5 rounded-xl text-sm font-medium outline-none" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} />
              ) : (
                <input type="number" className="input-glass px-4 py-2.5 rounded-xl text-sm font-medium outline-none w-28" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} placeholder="Year" />
              )}
            </div>
            <button onClick={handleExport} className="btn-gradient px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
               <BiCloudDownload size={20} /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard label="Total Requests" value={stats.total} icon={<BiBarChartSquare />} color="text-blue-500" bg="bg-blue-500/10" />
            <StatCard label="Approved" value={stats.approved} icon={<BiUserCheck />} color="text-green-500" bg="bg-green-500/10" />
            <StatCard label="Pending" value={stats.pending} icon={<BiTimeFive />} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatCard label="Rejected" value={stats.rejected} icon={<BiFilterAlt />} color="text-red-500" bg="bg-red-500/10" />
        </div>
      </div>

      <div className="glass-box overflow-hidden min-h-[500px] flex flex-col justify-between">
        <div>
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-page)]/30 flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-primary)]">Detailed Logs</h3>
                <div className="relative w-full max-w-xs">
                    <BiSearch className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                    <input type="text" placeholder="Search employee or leave type..." className="input-glass pl-9 pr-4 py-2 rounded-lg text-sm w-full outline-none" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-page)]/60 text-[var(--text-secondary)] text-xs uppercase font-bold tracking-wider">
                <tr>
                    <th className="p-5">Employee</th>
                    <th className="p-5">Leave Type</th>
                    <th className="p-5">Duration</th>
                    <th className="p-5">Applied On</th>
                    <th className="p-5">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                    <tr><td colSpan="5" className="p-10 text-center"><BiLoaderAlt className="animate-spin text-3xl text-[var(--primary)]"/></td></tr>
                ) : currentItems.length > 0 ? (
                    currentItems.map((row) => (
                    <tr key={row._id} className="hover:bg-[var(--bg-page)]/60 transition duration-200">
                        <td className="p-5">
                            <div className="font-bold text-[var(--text-primary)]">{row.employeeId?.name || "Unknown"}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{row.employeeId?.employeeId || "N/A"}</div>
                        </td>
                        <td className="p-5"><span className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)]">{row.leaveType || "--"}</span></td>
                        <td className="p-5">
                            <div className="text-sm text-[var(--text-primary)] font-medium">{row.startDate ? moment(row.startDate).format("MMM DD") : ""} - {row.endDate ? moment(row.endDate).format("MMM DD") : ""}</div>
                            <div className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">{row.days || 0} Days</div>
                        </td>
                        <td className="p-5 text-sm text-[var(--text-secondary)]">{row.appliedDate ? moment(row.appliedDate).format("MMM DD, YYYY") : (row.createdAt ? moment(row.createdAt).format("MMM DD, YYYY") : "--")}</td>
                        <td className="p-5">{getStatusPill(row.status)}</td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="5" className="p-10 text-center text-[var(--text-secondary)] opacity-70"><BiFilterAlt className="mx-auto text-3xl mb-2"/>No records found.</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {filteredData.length > 0 && !loading && (
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                    Showing <span className="text-[var(--text-primary)] font-bold">{indexOfFirstItem + 1}</span> to <span className="text-[var(--text-primary)] font-bold">{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="text-[var(--text-primary)] font-bold">{filteredData.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded-lg border flex items-center justify-center transition-all ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-page)]"}`}><BiChevronLeft size={20} /></button>
                    <div className="px-3 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-xs font-bold">Page {currentPage} of {totalPages}</div>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2 rounded-lg border flex items-center justify-center transition-all ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-page)]"}`}><BiChevronRight size={20} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-[var(--bg-page)]/50 border border-[var(--border-color)] p-4 rounded-xl flex items-center gap-4 hover:border-[var(--primary)] transition-colors">
        <div className={`p-3 rounded-lg ${bg} ${color} text-xl`}>{icon}</div>
        <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

export default LeaveReports;