import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  BiCog, BiCheckCircle, BiTrash, BiEdit, BiReset, BiLoaderAlt, BiDetail 
} from "react-icons/bi";

const LeavePolicies = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // States
  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const initialForm = {
    leaveTypeId: "", applicableAfterDays: 0, accrualType: "Monthly",
    accrualRate: 1, maxPerYear: 12, maxPerRequest: 5, allowHalfDay: false
  };
  const [form, setForm] = useState(initialForm);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const [pRes, tRes] = await Promise.all([
            axios.get(`${API_URL}/api/leave-policies`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/leave-types`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (pRes.data.success) setPolicies(pRes.data.data);
        if (tRes.data.success) setLeaveTypes(tRes.data.data);
    } catch(e) { 
        toast.error("Failed to load data"); 
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { if(token) fetchData(); }, [token]);

  // Handlers
  const handleEdit = (policy) => {
      setIsEditing(true);
      setEditId(policy._id);
      setForm({
          leaveTypeId: policy.leaveTypeId?._id,
          applicableAfterDays: policy.applicableAfterDays,
          accrualType: policy.accrualType,
          accrualRate: policy.accrualRate,
          maxPerYear: policy.maxPerYear,
          maxPerRequest: policy.maxPerRequest,
          allowHalfDay: policy.allowHalfDay
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
      setIsEditing(false);
      setEditId(null);
      setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      if(isEditing) {
          await axios.put(`${API_URL}/api/leave-policies/${editId}`, form, { headers: { Authorization: `Bearer ${token}` } });
          toast.success("Policy Updated");
      } else {
          // Logic: Creating new will automatically deactivate old in backend
          await axios.post(`${API_URL}/api/leave-policies`, form, { headers: { Authorization: `Bearer ${token}` } });
          toast.success("New Policy Active (Old replaced)");
      }
      handleCancel();
      fetchData();
    } catch (err) { 
        toast.error(err.response?.data?.message || "Error"); 
    } finally {
        setBtnLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Deactivate this policy?")) return;
      try {
          await axios.delete(`${API_URL}/api/leave-policies/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          toast.success("Policy Deactivated");
          setPolicies(prev => prev.filter(p => p._id !== id));
      } catch(err) { toast.error("Delete Failed"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* --- FORM COLUMN --- */}
        <div className="lg:col-span-1">
            <div className={`glass-box p-6 sticky top-6 ${isEditing ? "border-indigo-500 shadow-indigo-500/20" : ""}`}>
                <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
                    <div className={`p-2 rounded-lg text-white shadow-lg ${isEditing ? "bg-orange-500" : "bg-indigo-600"}`}>
                        <BiCog size={20}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{isEditing ? "Edit Rule" : "Accrual Rules"}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Set earning logic.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Leave Type</label>
                        <select className="input-glass w-full p-2.5 rounded-lg mt-1 text-sm text-[var(--text-primary)] outline-none"
                            value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} 
                            required disabled={isEditing}>
                            <option value="">-- Select --</option>
                            {leaveTypes.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Mode</label>
                            <select className="input-glass w-full p-2.5 rounded-lg mt-1 text-sm text-[var(--text-primary)] outline-none"
                                value={form.accrualType} onChange={(e) => setForm({ ...form, accrualType: e.target.value })}>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Rate</label>
                            <input type="number" step="0.5" className="input-glass w-full p-2.5 rounded-lg mt-1 text-sm text-[var(--text-primary)] outline-none"
                                value={form.accrualRate} onChange={(e) => setForm({ ...form, accrualRate: e.target.value })} required />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Max Per Year</label>
                        <input type="number" className="input-glass w-full p-2.5 rounded-lg mt-1 text-sm text-[var(--text-primary)] outline-none"
                            value={form.maxPerYear} onChange={(e) => setForm({ ...form, maxPerYear: e.target.value })} required />
                    </div>
                    
                    <div>
                         <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Wait Period (Days)</label>
                         <input type="number" className="input-glass w-full p-2.5 rounded-lg mt-1 text-sm text-[var(--text-primary)] outline-none"
                            value={form.applicableAfterDays} onChange={(e) => setForm({ ...form, applicableAfterDays: e.target.value })} placeholder="0" />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {isEditing && (
                            <button type="button" onClick={handleCancel} className="flex-1 py-3 bg-gray-500/10 text-[var(--text-secondary)] rounded-xl font-bold flex justify-center items-center gap-2">
                                <BiReset/> Cancel
                            </button>
                        )}
                        <button type="submit" disabled={btnLoading} className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 ${isEditing ? "bg-orange-600" : "btn-gradient"}`}>
                            {btnLoading ? <BiLoaderAlt className="animate-spin"/> : (isEditing ? "Update" : "Save Rule")}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* --- TABLE COLUMN --- */}
        <div className="lg:col-span-2">
            <div className="glass-box overflow-hidden min-h-[400px]">
                <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-page)]/30">
                    <h3 className="font-bold text-[var(--text-primary)]">Defined Policies</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-page)]/60 text-[var(--text-secondary)] text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-5">Leave Type</th>
                                <th className="p-5">Accrual</th>
                                <th className="p-5">Limits</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {policies.map((p) => (
                                <tr key={p._id} className="hover:bg-[var(--bg-page)]/50 transition">
                                    <td className="p-5 font-bold text-[var(--text-primary)]">{p.leaveTypeId?.name}</td>
                                    <td className="p-5 text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[var(--primary)]">{p.accrualRate} Days</span>
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase">{p.accrualType}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm text-[var(--text-secondary)]">
                                        Max {p.maxPerYear}/Year
                                        <br/>
                                        Wait: {p.applicableAfterDays}d
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(p)} className="p-2.5 rounded-xl text-indigo-500 bg-[var(--bg-page)] border border-indigo-200 hover:bg-indigo-500 hover:text-white transition"><BiEdit size={18}/></button>
                                            <button onClick={() => handleDelete(p._id)} className="p-2.5 rounded-xl text-red-500 bg-[var(--bg-page)] border border-red-200 hover:bg-red-500 hover:text-white transition"><BiTrash size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LeavePolicies;