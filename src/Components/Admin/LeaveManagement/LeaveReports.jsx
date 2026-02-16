import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { 
  BiBarChartSquare, BiCloudDownload, BiSearch, BiFilterAlt, 
  BiUserCheck, BiTimeFive, BiPieChartAlt, BiLoaderAlt,
  BiChevronLeft, BiChevronRight
} from "react-icons/bi";

const LeaveReports = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Ek page par kitne dikhenge

  // Filters state
  const [filters, setFilters] = useState({
    type: "Monthly",
    month: moment().format("YYYY-MM"),
    year: moment().format("YYYY"),
    search: ""
  });

  // --- AUTOMATIC FETCH ON FILTER CHANGE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.type, filters.month, filters.year]);

  // Reset Page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.month, filters.year, filters.type]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: filters.type,
        ...(filters.type === "Monthly" ? { month: filters.month } : { year: filters.year })
      };

      const res = await axios.get(`${API_URL}/api/leaves/report`, { 
        params,
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING & PAGINATION LOGIC ---
  
  // 1. Filter Data (Search Logic)
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.employeeId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.leaveType?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [data, filters.search]);

  // 2. Paginate Data (Slicing)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- SUMMARY STATISTICS ---
  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      approved: filteredData.filter(d => d.status === 'Approved').length,
      pending: filteredData.filter(d => d.status === 'Pending').length,
      rejected: filteredData.filter(d => d.status === 'Rejected').length,
    };
  }, [filteredData]);

  // Handle Export
  const handleExport = () => {
    toast.info("Exporting data to CSV...");
    // Add CSV export logic here
  };

  // Pagination Handlers
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* --- HEADER & CONTROLS GLASS BOX --- */}
      <div className="glass-box p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Title Area */}
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
              <span className="text-indigo-500 bg-indigo-500/10 p-2 rounded-lg"><BiPieChartAlt /></span>
              Leave Analytics
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Real-time insights on employee time-off patterns.
            </p>
          </div>

          {/* Filters Area */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* Report Type Toggle */}
            <div className="bg-[var(--bg-page)] p-1 rounded-xl border border-[var(--border-color)] flex">
               <button 
                 onClick={() => setFilters({...filters, type: "Monthly"})}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filters.type === "Monthly" ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
               >
                 Monthly
               </button>
               <button 
                 onClick={() => setFilters({...filters, type: "Yearly"})}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filters.type === "Yearly" ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
               >
                 Yearly
               </button>
            </div>

            {/* Date Picker */}
            <div className="relative">
              {filters.type === "Monthly" ? (
                <input 
                  type="month" 
                  className="input-glass px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none"
                  value={filters.month} 
                  onChange={e => setFilters({...filters, month: e.target.value})} 
                />
              ) : (
                <input 
                  type="number" 
                  className="input-glass px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none w-28"
                  value={filters.year} 
                  onChange={e => setFilters({...filters, year: e.target.value})} 
                  placeholder="Year"
                />
              )}
            </div>

            {/* Export Button */}
            <button onClick={handleExport} className="btn-gradient px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
               <BiCloudDownload size={20} /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard label="Total Requests" value={stats.total} icon={<BiBarChartSquare />} color="text-blue-500" bg="bg-blue-500/10" />
            <StatCard label="Approved" value={stats.approved} icon={<BiUserCheck />} color="text-green-500" bg="bg-green-500/10" />
            <StatCard label="Pending" value={stats.pending} icon={<BiTimeFive />} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatCard label="Rejected" value={stats.rejected} icon={<BiFilterAlt />} color="text-red-500" bg="bg-red-500/10" />
        </div>
      </div>

      {/* --- SEARCH & TABLE GLASS BOX --- */}
      <div className="glass-box overflow-hidden min-h-[500px] flex flex-col justify-between">
        
        {/* Search Bar Row */}
        <div>
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-page)]/30 flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-primary)]">Detailed Logs</h3>
                <div className="relative w-full max-w-xs">
                    <BiSearch className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                    <input 
                        type="text" 
                        placeholder="Search employee or leave type..." 
                        className="input-glass pl-9 pr-4 py-2 rounded-lg text-sm w-full outline-none"
                        value={filters.search}
                        onChange={e => setFilters({...filters, search: e.target.value})}
                    />
                </div>
            </div>

            {/* Table */}
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
                    <tr>
                        <td colSpan="5" className="p-10 text-center text-[var(--text-secondary)]">
                            <div className="flex flex-col items-center gap-2">
                                <BiLoaderAlt className="animate-spin text-3xl text-[var(--primary)]"/>
                                <span>Fetching report data...</span>
                            </div>
                        </td>
                    </tr>
                ) : currentItems.length > 0 ? (
                    currentItems.map((row) => (
                    <tr key={row._id} className="hover:bg-[var(--bg-page)]/60 transition duration-200">
                        <td className="p-5">
                            <div className="font-bold text-[var(--text-primary)]">{row.employeeId?.name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{row.employeeId?.employeeId}</div>
                        </td>
                        <td className="p-5">
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                {row.leaveType}
                            </span>
                        </td>
                        <td className="p-5">
                            <div className="text-sm text-[var(--text-primary)] font-medium">
                                {moment(row.startDate).format("MMM DD")} - {moment(row.endDate).format("MMM DD")}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
                                {row.days} Days
                            </div>
                        </td>
                        <td className="p-5 text-sm text-[var(--text-secondary)]">
                            {moment(row.appliedDate).format("MMM DD, YYYY")}
                        </td>
                        <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1
                            ${row.status === 'Approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                row.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                row.status === 'Approved' ? 'bg-green-500' : 
                                row.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            {row.status}
                            </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="p-10 text-center text-[var(--text-secondary)] opacity-70">
                            <BiFilterAlt className="mx-auto text-3xl mb-2"/>
                            No records found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {filteredData.length > 0 && !loading && (
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                
                {/* Info Text */}
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                    Showing <span className="text-[var(--text-primary)] font-bold">{indexOfFirstItem + 1}</span> to <span className="text-[var(--text-primary)] font-bold">{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="text-[var(--text-primary)] font-bold">{filteredData.length}</span> entries
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                            currentPage === 1 
                            ? "border-[var(--border-color)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed" 
                            : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm"
                        }`}
                    >
                        <BiChevronLeft size={20} />
                    </button>

                    {/* Page Numbers (Simple) */}
                    <div className="px-3 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)]">
                        Page {currentPage} of {totalPages}
                    </div>

                    <button 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                            currentPage === totalPages 
                            ? "border-[var(--border-color)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed" 
                            : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm"
                        }`}
                    >
                        <BiChevronRight size={20} />
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-[var(--bg-page)]/50 border border-[var(--border-color)] p-4 rounded-xl flex items-center gap-4 hover:border-[var(--primary)] transition-colors">
        <div className={`p-3 rounded-lg ${bg} ${color} text-xl`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

export default LeaveReports;