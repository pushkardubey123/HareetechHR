import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { BiTrash, BiCalendarPlus, BiCalendar, BiTimeFive, BiToggleLeft, BiToggleRight, BiLoaderAlt } from "react-icons/bi";
import "./LeaveCalendar.css";

const LeaveCalendar = ({ perms }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState({ isSaturdayOff: true });
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isOptional: false });

  // ✅ PERMISSION LOGIC
  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  useEffect(() => { 
    if(token) fetchData(); 
  }, [token]);

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
      toast.error("Failed to update settings");
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if(!canCreate) return toast.warn("No permission to add.");
    if (!form.name || !form.startDate) return toast.warn("Required fields missing");
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/holidays`, form, { headers: { Authorization: `Bearer ${token}` } });
      fetchData(); 
      setForm({ name: "", startDate: "", endDate: "", isOptional: false });
      toast.success("Holiday added successfully!");
    } catch (err) { 
      toast.error(err.response?.data?.message || "Failed to add holiday"); 
    } 
    finally { setBtnLoading(false); }
  };

  const handleDelete = async (id) => {
      if(!canDelete) return toast.warn("No delete permission.");
      
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const confirm = await Swal.fire({
        title: "Delete Holiday?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#f8fafc' : '#0f172a',
        confirmButtonText: "Yes, delete it"
      });

      if(!confirm.isConfirmed) return;

      try {
        await axios.delete(`${API_URL}/api/holidays/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setHolidays(prev => prev.filter(h => h._id !== id));
        toast.success("Holiday Deleted");
      } catch (err) { toast.error("Failed to delete holiday"); }
  };

  return (
    <div className="lc-wrapper animate-fade-in">
      <div className="lc-grid">
        
        {/* LEFT COLUMN: SETTINGS & ADD FORM */}
        {(canCreate || canEdit) && (
          <div className="lc-left-col">
            
            {/* Work Week Settings Card */}
            <div className="lc-card">
              <div className="lc-card-header">
                <div className="lc-header-title">
                  <BiTimeFive className="lc-icon text-primary" />
                  <h3>Work Week Settings</h3>
                </div>
              </div>
              <div className="lc-card-body">
                <div className="lc-toggle-box">
                  <div className="lc-toggle-text">
                    <strong>Saturday Status</strong>
                    <span className="text-muted small d-block">Toggle if Saturday is a weekly off.</span>
                  </div>
                  <button 
                    onClick={handleSettingsUpdate}
                    disabled={!canEdit}
                    className={`lc-toggle-btn ${!canEdit ? 'disabled' : ''} ${settings.isSaturdayOff ? 'active-green' : 'inactive-gray'}`}
                  >
                    {settings.isSaturdayOff ? <BiToggleRight size={44} /> : <BiToggleLeft size={44} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Add Holiday Card */}
            {canCreate && (
              <div className="lc-card mt-4">
                <div className="lc-card-header">
                  <div className="lc-header-title">
                    <BiCalendarPlus className="lc-icon text-indigo" />
                    <h3>Add Holiday</h3>
                  </div>
                </div>
                <form onSubmit={handleAddHoliday} className="lc-card-body">
                  <div className="lc-form-group">
                    <label className="lc-label">Holiday Name</label>
                    <input 
                      type="text" 
                      className="lc-input" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      required 
                      placeholder="e.g., Diwali, Christmas" 
                    />
                  </div>
                  
                  <div className="lc-row">
                    <div className="lc-col-6 lc-form-group">
                      <label className="lc-label">Start Date</label>
                      <input 
                        type="date" 
                        className="lc-input date-input-fix" 
                        value={form.startDate} 
                        onChange={e => setForm({...form, startDate: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="lc-col-6 lc-form-group">
                      <label className="lc-label">End Date</label>
                      <input 
                        type="date" 
                        className="lc-input date-input-fix" 
                        value={form.endDate} 
                        onChange={e => setForm({...form, endDate: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div 
                    className={`lc-optional-box ${form.isOptional ? 'active' : ''}`} 
                    onClick={() => setForm({...form, isOptional: !form.isOptional})}
                  >
                    <div className={`lc-checkbox ${form.isOptional ? 'checked' : ''}`}>
                      {form.isOptional && <BiCalendar className="text-white" size={12}/>}
                    </div>
                    <span className="lc-optional-text">Mark as Optional Holiday</span>
                  </div>

                  <button type="submit" disabled={btnLoading} className="lc-btn-primary w-100 mt-3">
                    {btnLoading ? <BiLoaderAlt className="animate-spin" size={20}/> : "Create Holiday"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: HOLIDAY LIST */}
        <div className={`lc-right-col ${(canCreate || canEdit) ? "" : "full-width"}`}>
          <div className="lc-card h-100 d-flex flex-column">
            <div className="lc-card-header bg-gradient-light">
              <div className="lc-header-title">
                <BiCalendar className="lc-icon text-indigo" />
                <h3>Upcoming Holidays</h3>
              </div>
            </div>
            
            <div className="lc-list-container">
              {loading ? ( 
                <div className="lc-empty-state"><BiLoaderAlt className="animate-spin text-4xl text-primary mb-2"/> Loading...</div> 
              ) : holidays.length === 0 ? ( 
                <div className="lc-empty-state text-muted"><BiCalendar className="text-4xl mb-2 opacity-50"/> No holidays scheduled.</div> 
              ) : (
                <div className="lc-holiday-list">
                  {holidays.map((h) => (
                    <div key={h._id} className="lc-holiday-item">
                      <div className="lc-holiday-info-wrap">
                        <div className="lc-date-badge">
                          <span className="lc-date-day">{moment(h.startDate).format("DD")}</span>
                          <span className="lc-date-month">{moment(h.startDate).format("MMM")}</span>
                        </div>
                        <div className="lc-holiday-details">
                          <h4 className="lc-holiday-name">
                            {h.name} 
                            {h.isOptional && <span className="lc-optional-tag">Optional</span>}
                          </h4>
                          <span className="lc-holiday-duration text-muted small fw-medium">
                            {h.endDate && h.startDate !== h.endDate 
                              ? `${moment(h.startDate).format("DD MMM")} - ${moment(h.endDate).format("DD MMM, YYYY")}` 
                              : moment(h.startDate).format("DD MMM, YYYY")}
                          </span>
                        </div>
                      </div>
                      
                      {canDelete && (
                        <div className="lc-holiday-actions">
                          <button onClick={() => handleDelete(h._id)} className="lc-btn-delete" title="Delete Holiday">
                            <BiTrash size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveCalendar;