import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  BiTrash, BiPlus, BiLayer, BiCoinStack, BiRefresh, 
  BiCheckCircle, BiXCircle, BiLoaderAlt, BiEdit, BiReset 
} from "react-icons/bi";

const LeaveTypes = ({ perms }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // ✅ VIP LOGIC
  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const initialFormState = {
    name: "", description: "", daysAllowed: 0, isPaid: false, allowCarryForward: false, maxCarryForwardDays: 0,
  };
  const [form, setForm] = useState(initialFormState);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leave-types`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setTypes(res.data.data);
    } catch (err) { toast.error("Failed to load types"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if(token) fetchTypes(); }, [token]);

  const handleEdit = (type) => {
    setIsEditing(true); setEditId(type._id);
    setForm({ ...type }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelEdit = () => { setIsEditing(false); setEditId(null); setForm(initialFormState); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name) return toast.warning("Please enter a name");
    
    setBtnLoading(true);
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/leave-types/${editId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Policy Updated Successfully!");
      } else {
        await axios.post(`${API_URL}/api/leave-types`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Leave Type Created!");
      }
      handleCancelEdit(); fetchTypes();
    } catch (err) { toast.error("Operation failed"); } 
    finally { setBtnLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this leave type?")) return;
    try {
      await axios.delete(`${API_URL}/api/leave-types/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Type deleted successfully");
      setTypes(prev => prev.filter(t => t._id !== id));
    } catch (err) { toast.error("Failed to delete"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      
      {(canCreate || canEdit) && (
        <div className="lg:col-span-1">
          <div className={`glass-box p-6 sticky top-6 transition-all duration-300 ${isEditing ? "border-indigo-500 shadow-indigo-500/20" : ""}`}>
            
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className={`p-2 rounded-lg text-white shadow-lg ${isEditing ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                 {isEditing ? <BiEdit size={20}/> : <BiLayer size={20}/>}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{isEditing ? "Edit Policy" : "Configure Policy"}</h3>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1">Policy Name</label>
                  <input type="text" className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium text-[var(--text-primary)] outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                 <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1">Annual Quota (Days)</label>
                 <input type="number" className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium text-[var(--text-primary)] outline-none" value={form.daysAllowed} onChange={(e) => setForm({ ...form, daysAllowed: e.target.value })} required />
              </div>

              <div className="space-y-3">
                 <div className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${form.isPaid ? "bg-green-500/10 border-green-500/50" : "bg-[var(--bg-page)]/50 border-[var(--border-color)]"}`} onClick={() => setForm({ ...form, isPaid: !form.isPaid })}>
                    <div className="flex items-center gap-3">
                       <div className={`p-1.5 rounded-full ${form.isPaid ? "bg-green-500 text-white" : "bg-gray-400/20 text-gray-400"}`}><BiCoinStack /></div>
                       <span className={`text-sm font-semibold ${form.isPaid ? "text-green-600" : "text-[var(--text-secondary)]"}`}>{form.isPaid ? "Paid Leave" : "Unpaid Leave"}</span>
                    </div>
                    {form.isPaid ? <BiCheckCircle className="text-green-500"/> : <BiXCircle className="text-gray-400"/>}
                 </div>

                 <div className={`p-3 rounded-xl border cursor-pointer flex flex-col ${form.allowCarryForward ? "bg-indigo-500/10 border-indigo-500/50" : "bg-[var(--bg-page)]/50 border-[var(--border-color)]"}`}>
                    <div className="flex items-center justify-between w-full" onClick={() => setForm({ ...form, allowCarryForward: !form.allowCarryForward })}>
                       <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${form.allowCarryForward ? "bg-indigo-500 text-white" : "bg-gray-400/20 text-gray-400"}`}><BiRefresh /></div>
                          <span className={`text-sm font-semibold ${form.allowCarryForward ? "text-indigo-600" : "text-[var(--text-secondary)]"}`}>Carry Forward</span>
                       </div>
                       {form.allowCarryForward ? <BiCheckCircle className="text-indigo-500"/> : <BiXCircle className="text-gray-400"/>}
                    </div>

                    {form.allowCarryForward && (
                       <div className="mt-3 pt-3 border-t border-indigo-200">
                          <label className="text-[10px] font-bold text-indigo-500 uppercase">Max Carry Forward Days</label>
                          <input type="number" placeholder="0" className="w-full mt-1 bg-[var(--bg-surface)] border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={form.maxCarryForwardDays} onChange={(e) => setForm({ ...form, maxCarryForwardDays: e.target.value })} />
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex gap-2 pt-2">
                  {isEditing && <button type="button" onClick={handleCancelEdit} className="flex-1 py-3 bg-gray-500/10 text-[var(--text-secondary)] rounded-xl font-bold flex justify-center items-center gap-2"><BiReset size={20}/> Cancel</button>}
                  <button type="submit" disabled={btnLoading} className={`flex-[2] py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 ${isEditing ? "bg-gradient-to-r from-orange-500 to-red-600" : "btn-gradient"}`}>
                      {btnLoading ? <BiLoaderAlt className="animate-spin"/> : (isEditing ? <><BiEdit size={20}/> Update</> : <><BiPlus size={20}/> Create</>)}
                  </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <div className={(canCreate || canEdit) ? "lg:col-span-2" : "lg:col-span-3"}>
         <div className="glass-box overflow-hidden min-h-[500px]">
            <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-page)]/30 flex justify-between items-center">
               <h3 className="font-bold text-[var(--text-primary)]">Active Leave Policies</h3>
               <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)]">{types.length} Types</span>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--bg-page)]/60 text-[var(--text-secondary)] text-xs uppercase font-bold tracking-wider">
                     <tr>
                        <th className="p-5">Policy Name</th>
                        <th className="p-5">Quota</th>
                        <th className="p-5">Settings</th>
                        {(canEdit || canDelete) && <th className="p-5 text-right">Action</th>}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                     {loading ? <tr><td colSpan="4" className="p-10 text-center"><BiLoaderAlt className="animate-spin mx-auto text-2xl"/></td></tr> : 
                     types.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-[var(--text-secondary)]">No leave policies defined.</td></tr> : 
                     types.map((type) => (
                        <tr key={type._id} className="hover:bg-[var(--bg-page)]/50 transition">
                           <td className="p-5">
                              <div className="font-bold text-[var(--text-primary)] text-base">{type.name}</div>
                           </td>
                           <td className="p-5">
                              <div className="flex flex-col items-start gap-1">
                                 <span className="text-xl font-black text-[var(--text-primary)]">{type.daysAllowed}</span>
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Days / Year</span>
                              </div>
                           </td>
                           <td className="p-5">
                              <div className="flex gap-2">
                                 <span className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${type.isPaid ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                    {type.isPaid ? "Paid" : "Unpaid"}
                                 </span>
                                 {type.allowCarryForward && <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">CF: {type.maxCarryForwardDays}</span>}
                              </div>
                           </td>
                           
                           {(canEdit || canDelete) && (
                              <td className="p-5 text-right">
                                 <div className="flex justify-end gap-2">
                                    {canEdit && <button onClick={() => handleEdit(type)} className="p-2.5 rounded-xl text-indigo-500 bg-[var(--bg-page)] border border-indigo-200 hover:bg-indigo-500 hover:text-white"><BiEdit size={18}/></button>}
                                    {canDelete && <button onClick={() => handleDelete(type._id)} className="p-2.5 rounded-xl text-red-500 bg-[var(--bg-page)] border border-red-200 hover:bg-red-500 hover:text-white"><BiTrash size={18} /></button>}
                                 </div>
                              </td>
                           )}
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

export default LeaveTypes;