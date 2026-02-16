import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { 
  BiTrash, BiCalendarPlus, BiCalendar, BiTimeFive, BiToggleLeft, BiToggleRight, BiLoaderAlt 
} from "react-icons/bi";

const LeaveCalendar = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // --- STATE ---
  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState({ isSaturdayOff: true });
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({ 
    name: "", startDate: "", endDate: "", isOptional: false 
  });

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Backend returns data: { holidays: [], settings: {} }
        setHolidays(res.data.data.holidays || []);
        setSettings(res.data.data.settings || { isSaturdayOff: true });
      }
    } catch (err) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  // 1. Toggle Saturday Off
  const handleSettingsUpdate = async () => {
    try {
      const newStatus = !settings.isSaturdayOff;
      // Optimistic Update (UI pehle update karo fast feel ke liye)
      setSettings((prev) => ({ ...prev, isSaturdayOff: newStatus }));
      
      await axios.put(`${API_URL}/api/holidays/settings`, 
        { isSaturdayOff: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Saturdays are now ${newStatus ? "OFF" : "WORKING"}`);
    } catch (err) {
      setSettings((prev) => ({ ...prev, isSaturdayOff: !prev.isSaturdayOff })); // Revert on error
      toast.error("Failed to update settings");
    }
  };

  // 2. Add Holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate) return toast.warn("Name and Start Date are required");
    
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/holidays`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); // Refresh list
      setForm({ name: "", startDate: "", endDate: "", isOptional: false });
      toast.success("Holiday added successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding holiday");
    } finally {
      setBtnLoading(false);
    }
  };

  // 3. Delete Holiday
  const handleDelete = async (id) => {
      if(!window.confirm('Are you sure you want to delete this holiday?')) return;
      try {
        await axios.delete(`${API_URL}/api/holidays/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setHolidays(prev => prev.filter(h => h._id !== id));
        toast.success("Holiday deleted");
      } catch (err) { 
        toast.error("Failed to delete"); 
      }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
      
      {/* --- LEFT COLUMN: CONTROLS (Settings + Add Form) --- */}
      {/* Responsive: Full width on Mobile, 1/3 on Large Screens */}
      <div className="flex flex-col gap-6 xl:col-span-1 order-2 xl:order-1">
        
        {/* 1. Settings Glass Box */}
        <div className="glass-box p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
            {/* Background Glow Effect */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>

            <div className="flex items-center gap-3 mb-4 text-[var(--primary)]">
                <BiTimeFive size={24} />
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Work Week</h3>
            </div>
            
            <div className="flex justify-between items-center bg-[var(--bg-page)]/50 p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Saturday Status</span>
                    <span className="text-xs text-[var(--text-secondary)]">Weekly Off Policy</span>
                </div>
                
                <button 
                    onClick={handleSettingsUpdate}
                    className={`relative flex items-center transition-all duration-300 focus:outline-none transform active:scale-95 ${settings.isSaturdayOff ? "text-green-500" : "text-[var(--text-secondary)]"}`}
                >
                    {settings.isSaturdayOff 
                        ? <BiToggleRight size={44} className="drop-shadow-md" /> 
                        : <BiToggleLeft size={44} />
                    }
                </button>
            </div>
            <p className="text-center mt-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {settings.isSaturdayOff ? "Weekends: Sat & Sun" : "Weekends: Sunday Only"}
            </p>
        </div>

        {/* 2. Add Form Glass Box */}
        <div className="glass-box p-6">
            <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-color)] pb-3">
                <BiCalendarPlus className="text-[var(--secondary)]" size={24}/>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Add Event</h3>
            </div>
            
            <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1">Holiday Name</label>
                    <input type="text" 
                        className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all" 
                        value={form.name} onChange={e=>setForm({...form, name:e.target.value})} 
                        required placeholder="e.g. Independence Day" 
                    />
                </div>
                
                {/* Date Inputs: Stack on mobile, Side-by-side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1">Start Date</label>
                        <input type="date" 
                            className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all" 
                            value={form.startDate} onChange={e=>setForm({...form, startDate:e.target.value})} 
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1">End Date</label>
                        <input type="date" 
                            className="input-glass w-full p-3 rounded-xl mt-1 text-sm font-medium text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all" 
                            value={form.endDate} onChange={e=>setForm({...form, endDate:e.target.value})} 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                     onClick={() => setForm({...form, isOptional: !form.isOptional})}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${form.isOptional ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--text-secondary)]"}`}>
                        {form.isOptional && <BiCalendar className="text-white text-xs"/>}
                    </div>
                    <label className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer select-none">Mark as Optional Holiday</label>
                </div>

                <button disabled={btnLoading} className="btn-gradient w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-white shadow-lg active:scale-95 transition-transform">
                    {btnLoading ? <BiLoaderAlt className="animate-spin" /> : <>Create Holiday</>}
                </button>
            </form>
        </div>
      </div>

      {/* --- RIGHT COLUMN: LIST --- */}
      {/* Responsive: Full width on Mobile, 2/3 on Large Screens */}
      <div className="xl:col-span-2 order-1 xl:order-2">
        <div className="glass-box h-full flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--bg-page)]/30">
                <h3 className="font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                    <BiCalendar className="text-indigo-500"/> Upcoming Holidays
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)] self-start sm:self-auto">
                    {holidays.length} Events Scheduled
                </span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] py-10">
                        <BiLoaderAlt className="animate-spin text-4xl mb-3 text-[var(--primary)]"/>
                        <p>Loading Calendar...</p>
                    </div>
                ) : holidays.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-60 py-10">
                        <BiCalendar size={64} className="mb-4 text-gray-300 dark:text-gray-700"/>
                        <p>No holidays scheduled yet.</p>
                    </div>
                ) : (
                    holidays.map((h) => (
                        <div key={h._id} className="group flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-xl bg-[var(--bg-page)]/40 border border-transparent hover:border-[var(--primary)] hover:bg-[var(--bg-page)] transition-all duration-300 shadow-sm hover:shadow-md">
                            
                            {/* Date Badge */}
                            <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-4 flex sm:block items-center gap-3 sm:gap-0 w-full sm:w-auto">
                                <div className="text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-2 min-w-[70px]">
                                    <div className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-wider">
                                        {moment(h.startDate).format("MMM")}
                                    </div>
                                    <div className="text-2xl font-black text-[var(--text-primary)] leading-none my-0.5">
                                        {moment(h.startDate).format("DD")}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-secondary)]">
                                        {moment(h.startDate).format("ddd")}
                                    </div>
                                </div>
                                {/* Mobile-only Title view (if you prefer title next to date on mobile) */}
                                <div className="sm:hidden flex-1">
                                     <h4 className="font-bold text-[var(--text-primary)] text-lg line-clamp-1">{h.name}</h4>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full">
                                <div className="hidden sm:flex items-center gap-2">
                                    <h4 className="font-bold text-[var(--text-primary)] text-lg">{h.name}</h4>
                                    {h.isOptional && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 uppercase whitespace-nowrap">
                                            Optional
                                        </span>
                                    )}
                                </div>
                                {/* Mobile Optional Tag */}
                                <div className="sm:hidden mb-1">
                                     {h.isOptional && <span className="text-[10px] font-bold text-yellow-600 uppercase">Optional Holiday</span>}
                                </div>

                                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                                    <BiTimeFive size={14} className="flex-shrink-0"/>
                                    <span className="truncate">
                                        {h.endDate && h.endDate !== h.startDate 
                                            ? `${moment(h.startDate).format("MMMM Do")} - ${moment(h.endDate).format("MMMM Do, YYYY")}`
                                            : moment(h.startDate).format("MMMM Do, YYYY")
                                        }
                                    </span>
                                </p>
                            </div>

                            {/* Actions */}
                            <button 
                                onClick={() => handleDelete(h._id)} 
                                className="w-full sm:w-auto mt-3 sm:mt-0 p-2 sm:p-3 rounded-xl text-red-500 bg-red-500/10 sm:bg-transparent sm:text-[var(--text-secondary)] sm:hover:bg-red-500/10 sm:hover:text-red-500 transition-all sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-x-2 sm:group-hover:translate-x-0 flex items-center justify-center gap-2"
                                title="Delete Event"
                            >
                                <BiTrash size={20} />
                                <span className="sm:hidden text-sm font-bold">Delete Event</span>
                            </button>
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