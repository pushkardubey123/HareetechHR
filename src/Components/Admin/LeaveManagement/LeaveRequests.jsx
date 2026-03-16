import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; 
import { 
  BiCheck, BiX, BiSearch, BiWallet, BiPlus, BiCalendar, BiFilterAlt, BiLoaderAlt
} from "react-icons/bi";

const LeaveRequests = ({ perms }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;
  const isAdmin = user?.role === "admin";

  const canView = isAdmin || perms?.view;
  const canEdit = isAdmin || perms?.edit;
  const canCreate = isAdmin || perms?.create;

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null); 

  const [adjustForm, setAdjustForm] = useState({
    employeeId: "", leaveTypeId: "", adjustmentType: "add", days: "", reason: ""
  });
  const [accrualLeaveType, setAccrualLeaveType] = useState("");
  const [cfYear, setCfYear] = useState({
    oldYear: new Date().getFullYear() - 1,
    newYear: new Date().getFullYear()
  });

  useEffect(() => {
    if (token) {
      fetchLeaves();
      if(canView) {
          fetchEmployees();
          fetchLeaveTypes();
      }
    }
  }, [token, canView]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const endpoint = canView ? `${API_URL}/api/leaves` : `${API_URL}/api/leaves/employee/${user.id}`;
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data.data || []);
    } catch (err) { toast.error("Failed to load leaves"); } 
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } });
      const emps = res.data.data.filter(u => u.role === 'employee'); 
      setEmployees(emps);
    } catch (err) { }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/leave-types`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaveTypes(res.data.data || []);
    } catch (err) { }
  };

  const updateStatus = async (id, status) => {
    if (!canEdit) return toast.error("Permission denied");
    try {
      await axios.put(`${API_URL}/api/leaves/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Leave ${status} successfully`);
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return toast.error("Permission denied");
    setBtnLoading(true);
    try {
      await axios.put(`${API_URL}/api/leaves/balance/adjust`, adjustForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Balance Adjusted Successfully!");
      setActiveModal(null);
      setAdjustForm({ ...adjustForm, days: "", reason: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Adjustment Failed"); }
    finally { setBtnLoading(false); }
  };

  const handleRunAccrual = async () => {
    if (!canCreate) return toast.error("Permission denied");
    if(!window.confirm("Run monthly accrual? This credits leaves to all eligible employees.")) return;
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/leaves/apply-monthly-accrual`, 
        { leaveTypeId: accrualLeaveType }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Accrual Process Completed!");
      setActiveModal(null);
    } catch (err) { toast.error(err.response?.data?.message || "Accrual Failed"); }
    finally { setBtnLoading(false); }
  };

  const handleCarryForward = async (e) => {
    e.preventDefault();
    if (!canEdit) return toast.error("Permission denied");
    if(!window.confirm(`Transfer balances from ${cfYear.oldYear} to ${cfYear.newYear}?`)) return;
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/leaves/carry-forward`, cfYear, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Carry Forward Processed!");
      setActiveModal(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setBtnLoading(false); }
  };

  const filteredLeaves = leaves.filter(l => 
    l.status === filter &&
    (l.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) || 
     l.leaveType?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-color)] shadow-sm">
          {["Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === status 
                  ? "bg-[var(--primary)] text-white shadow" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
          {(canEdit || canCreate) && (
             <div className="flex gap-2">
                {canEdit && (
                  <button onClick={() => setActiveModal('adjust')} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded shadow transition">
                      <BiWallet /> Adjust
                  </button>
                )}
                {canCreate && (
                    <button onClick={() => setActiveModal('accrual')} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow transition">
                        <BiPlus /> Credit
                    </button>
                )}
                {canEdit && (
                  <button onClick={() => setActiveModal('carryForward')} className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded shadow transition">
                      <BiCalendar /> Carry Fwd
                  </button>
                )}
             </div>
          )}

          <div className="relative flex-1 md:flex-none">
            <BiSearch className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              className="pl-9 pr-4 py-2 w-full md:w-64 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-page)] text-[var(--text-secondary)] text-xs uppercase font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap">Employee</th>
                <th className="p-4 whitespace-nowrap">Leave Type</th>
                <th className="p-4 whitespace-nowrap">Duration</th>
                <th className="p-4 whitespace-nowrap">Days</th>
                <th className="p-4 whitespace-nowrap">Reason</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                {canEdit && <th className="p-4 whitespace-nowrap text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-[var(--text-secondary)]">Loading requests...</td></tr>
              ) : filteredLeaves.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-[var(--text-secondary)]">No {filter.toLowerCase()} requests found.</td></tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-[var(--bg-page)] transition">
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)] text-sm">{leave.employeeId?.name || "Self"}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{leave.employeeId?.email}</div>
                    </td>
                    <td className="p-4">
                        <span className="px-2 py-1 rounded bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--primary)] text-xs font-bold">
                            {leave.leaveType}
                        </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-[var(--text-primary)] text-sm">{leave.days}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1
                        ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                          leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'}`}>
                        {leave.status === 'Approved' && <BiCheck/>}
                        {leave.status === 'Rejected' && <BiX/>}
                        {leave.status}
                      </span>
                    </td>
                    
                    {canEdit && (
                        <td className="p-4 text-right">
                          {leave.status === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => updateStatus(leave._id, "Approved")} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Approve">
                                  <BiCheck size={18}/>
                              </button>
                              <button onClick={() => updateStatus(leave._id, "Rejected")} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Reject">
                                  <BiX size={18}/>
                              </button>
                            </div>
                          )}
                        </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'adjust' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
             <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-page)]">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><BiWallet className="text-purple-500"/> Adjust Balance</h3>
                <button onClick={() => setActiveModal(null)} className="text-[var(--text-secondary)] hover:text-red-500"><BiX size={24}/></button>
             </div>
             <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
                <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={adjustForm.employeeId} onChange={e => setAdjustForm({...adjustForm, employeeId: e.target.value})} required>
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
                </select>

                <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={adjustForm.leaveTypeId} onChange={e => setAdjustForm({...adjustForm, leaveTypeId: e.target.value})} required>
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>

                <div className="flex gap-4 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)]">
                    <label className="flex items-center cursor-pointer gap-2">
                        <input type="radio" name="adj" value="add" checked={adjustForm.adjustmentType === 'add'} onChange={() => setAdjustForm({...adjustForm, adjustmentType: 'add'})} className="accent-green-500"/>
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm">Credit (+)</span>
                    </label>
                    <label className="flex items-center cursor-pointer gap-2">
                        <input type="radio" name="adj" value="deduct" checked={adjustForm.adjustmentType === 'deduct'} onChange={() => setAdjustForm({...adjustForm, adjustmentType: 'deduct'})} className="accent-red-500"/>
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">Debit (-)</span>
                    </label>
                </div>

                <input type="number" step="0.5" placeholder="Days (e.g. 1.5)" className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] outline-none focus:border-purple-500 text-sm"
                    value={adjustForm.days} onChange={e => setAdjustForm({...adjustForm, days: e.target.value})} required />
                
                <input type="text" placeholder="Reason for adjustment" className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] outline-none focus:border-purple-500 text-sm"
                    value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} required />

                <button type="submit" disabled={btnLoading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition shadow-md flex justify-center items-center gap-2">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Update Balance"}
                </button>
             </form>
          </div>
        </div>
      )}

      {activeModal === 'accrual' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
             <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-page)]">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><BiPlus className="text-indigo-500"/> Run Monthly Accrual</h3>
                <button onClick={() => setActiveModal(null)} className="text-[var(--text-secondary)] hover:text-red-500"><BiX size={24}/></button>
             </div>
             <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                    This action will calculate and credit leaves for the current month based on defined policies. It checks joining dates and duplication.
                </p>
                <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={accrualLeaveType} onChange={(e) => setAccrualLeaveType(e.target.value)}>
                    <option value="">-- All Monthly Policies --</option>
                    {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <button onClick={handleRunAccrual} disabled={btnLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-md flex justify-center items-center gap-2">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Execute Accrual"}
                </button>
             </div>
          </div>
        </div>
      )}

      {activeModal === 'carryForward' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
             <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-page)]">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><BiCalendar className="text-orange-500"/> Year-End Carry Forward</h3>
                <button onClick={() => setActiveModal(null)} className="text-[var(--text-secondary)] hover:text-red-500"><BiX size={24}/></button>
             </div>
             <form onSubmit={handleCarryForward} className="p-5 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">Transfer lapsable leaves to the new year based on policy limits.</p>
                <div className="flex gap-4 items-center">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">From Year</label>
                        <input type="number" className="w-full mt-1 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] font-bold text-center"
                            value={cfYear.oldYear} onChange={e => setCfYear({...cfYear, oldYear: e.target.value})} />
                    </div>
                    <span className="text-[var(--text-secondary)]">➜</span>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">To Year</label>
                        <input type="number" className="w-full mt-1 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] font-bold text-center"
                            value={cfYear.newYear} onChange={e => setCfYear({...cfYear, newYear: e.target.value})} />
                    </div>
                </div>
                <button type="submit" disabled={btnLoading} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition shadow-md flex justify-center items-center gap-2">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Process Transfer"}
                </button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveRequests;