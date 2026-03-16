import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { BiTrash, BiCalendarPlus, BiCalendar, BiTimeFive, BiToggleLeft, BiToggleRight, BiLoaderAlt } from "react-icons/bi";

const LeaveCalendar = ({ perms }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState({ isSaturdayOff: true });
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isOptional: false });

  // ✅ PERMISSION LOGIC VIA PROPS OR VIP
  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/holidays`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setHolidays(res.data.data.holidays || []);
        setSettings(res.data.data.settings || { isSaturdayOff: true });
      }
    } catch (err) { toast.error("Failed to load calendar"); } 
    finally { setLoading(false); }
  };

  const handleSettingsUpdate = async () => {
    if(!canEdit) return toast.warn("You don't have edit permission.");
    try {
      const newStatus = !settings.isSaturdayOff;
      setSettings((prev) => ({ ...prev, isSaturdayOff: newStatus }));
      await axios.put(`${API_URL}/api/holidays/settings`, { isSaturdayOff: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Saturdays are now ${newStatus ? "OFF" : "WORKING"}`);
    } catch (err) {
      setSettings((prev) => ({ ...prev, isSaturdayOff: !prev.isSaturdayOff }));
      toast.error("Failed to update");
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if(!canCreate) return toast.warn("No permission to add.");
    if (!form.name || !form.startDate) return toast.warn("Required");
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/holidays`, form, { headers: { Authorization: `Bearer ${token}` } });
      fetchData(); setForm({ name: "", startDate: "", endDate: "", isOptional: false });
      toast.success("Holiday added!");
    } catch (err) { toast.error("Error"); } 
    finally { setBtnLoading(false); }
  };

  const handleDelete = async (id) => {
      if(!canDelete) return toast.warn("No delete permission.");
      if(!window.confirm('Delete this holiday?')) return;
      try {
        await axios.delete(`${API_URL}/api/holidays/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setHolidays(prev => prev.filter(h => h._id !== id));
        toast.success("Deleted");
      } catch (err) { }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
      
      {(canCreate || canEdit) && (
        <div className="flex flex-col gap-6 xl:col-span-1 order-2 xl:order-1">
          
          <div className="glass-box p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-4 text-[var(--primary)]">
                  <BiTimeFive size={24} />
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">Work Week</h3>
              </div>
              <div className="flex justify-between items-center bg-[var(--bg-page)]/50 p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Saturday Status</span>
                  </div>
                  <button 
                      onClick={handleSettingsUpdate}
                      disabled={!canEdit}
                      className={`relative flex items-center transition-all duration-300 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''} ${settings.isSaturdayOff ? "text-green-500" : "text-[var(--text-secondary)]"}`}
                  >
                      {settings.isSaturdayOff ? <BiToggleRight size={44} /> : <BiToggleLeft size={44} />}
                  </button>
              </div>
          </div>

          {canCreate && (
              <div className="glass-box p-6">
                  <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-color)] pb-3">
                      <BiCalendarPlus className="text-[var(--secondary)]" size={24}/>
                      <h3 className="font-bold text-lg text-[var(--text-primary)]">Add Event</h3>
                  </div>
                  <form onSubmit={handleAddHoliday} className="space-y-4">
                      <input type="text" className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required placeholder="Holiday Name" />
                      <input type="date" className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium" value={form.startDate} onChange={e=>setForm({...form, startDate:e.target.value})} required />
                      <input type="date" className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium" value={form.endDate} onChange={e=>setForm({...form, endDate:e.target.value})} />
                      
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-page)]/50 border cursor-pointer" onClick={() => setForm({...form, isOptional: !form.isOptional})}>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${form.isOptional ? "bg-[var(--primary)]" : ""}`}>
                              {form.isOptional && <BiCalendar className="text-white text-xs"/>}
                          </div>
                          <label className="text-sm font-semibold">Mark as Optional</label>
                      </div>

                      <button disabled={btnLoading} className="btn-gradient w-full py-3 rounded-xl font-bold flex justify-center text-white">
                          {btnLoading ? <BiLoaderAlt className="animate-spin" /> : "Create Holiday"}
                      </button>
                  </form>
              </div>
          )}
        </div>
      )}

      <div className={(canCreate || canEdit) ? "xl:col-span-2 order-1 xl:order-2" : "xl:col-span-3"}>
        <div className="glass-box h-full flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-page)]/30">
                <h3 className="font-bold text-xl text-[var(--text-primary)] flex items-center gap-2"><BiCalendar className="text-indigo-500"/> Upcoming Holidays</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? ( <div className="p-10 text-center"><BiLoaderAlt className="animate-spin text-4xl mx-auto"/></div> ) : 
                 holidays.length === 0 ? ( <div className="p-10 text-center">No holidays.</div> ) : (
                    holidays.map((h) => (
                        <div key={h._id} className="group flex justify-between items-center p-4 rounded-xl bg-[var(--bg-page)]/40 border hover:border-[var(--primary)]">
                            <div className="flex items-center gap-4">
                               <div className="text-center p-2 border rounded-xl"><span className="text-2xl font-black">{moment(h.startDate).format("DD")}</span></div>
                               <div>
                                  <h4 className="font-bold text-lg">{h.name} {h.isOptional && <span className="text-[10px] text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">Optional</span>}</h4>
                               </div>
                            </div>
                            
                            {canDelete && (
                                <button onClick={() => handleDelete(h._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition">
                                    <BiTrash size={20} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;