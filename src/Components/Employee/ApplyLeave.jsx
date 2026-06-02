import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EmployeeLayout from "../Common/DynamicLayout"; // Adjust path
import "./ApplyLeave.css"; // Ensure CSS is imported
import { 
  BiCalendar, BiCheckCircle, BiErrorCircle, 
  BiPaperPlane, BiWallet, BiInfoCircle 
} from "react-icons/bi";

const ApplyLeave = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // --- STATE ---
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  
  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Derived State
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [duration, setDuration] = useState(0);

  // --- INITIAL FETCH ---
  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leaves/balance/my-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setBalances(res.data.data);
    } catch (err) {
      toast.error("Failed to load leave balances");
    } finally {
      setLoading(false);
    }
  };

  // --- LIVE CALCULATIONS ---
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = moment(form.startDate);
      const end = moment(form.endDate);
      
      if (end.isBefore(start)) {
        setDuration(0);
      } else {
        // Simple Diff + 1 (Backend handles holiday logic)
        const days = end.diff(start, 'days') + 1;
        setDuration(days);
      }
    } else {
      setDuration(0);
    }
  }, [form.startDate, form.endDate]);

  // --- HANDLERS ---
  const handleTypeSelect = (balance) => {
    if (balance.available <= 0) {
        toast.warning(`You have 0 balance for ${balance.leaveTypeName}. Select Loss of Pay if urgent.`);
        return;
    }
    setForm({ ...form, leaveTypeId: balance.leaveTypeId });
    setSelectedBalance(balance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (duration <= 0) return toast.error("Invalid Date Range");
    if (!form.leaveTypeId) return toast.error("Please select a leave type");

    if (selectedBalance && duration > selectedBalance.available) {
        // Optional: Allow user to proceed with warning if backend supports partial paid/unpaid
        if(!window.confirm(`Warning: You only have ${selectedBalance.available} days balance, but applying for ${duration}. Proceed?`)) return;
    }

    setBtnLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/leaves`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success(`Request Sent! System Calculated: ${res.data.data.days} Days`);
        setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
        setDuration(0);
        setSelectedBalance(null);
        fetchBalances(); // Refresh limits
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Application Failed");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <EmployeeLayout>
      <div className="al-container">
        <ToastContainer position="top-right" theme="colored" />
        
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold flex items-center gap-3">
                    <span className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-500">
                        <BiPaperPlane size={32} />
                    </span>
                    <span>Apply for Leave</span>
                </h1>
                <p className="text-[var(--al-text-muted)] mt-2 ml-1">
                    Plan your time off. Check your balances below before applying.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: FORM SECTION (8 Columns) */}
                <div className="lg:col-span-8">
                    <div className="al-glass-card p-8">
                        <form onSubmit={handleSubmit}>
                            
                            {/* Leave Type Grid Selection (Visual) */}
                            <div className="mb-6">
                                <label className="al-label">Select Leave Type</label>
                                {loading ? (
                                    <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {balances.map((b) => (
                                            <div 
                                                key={b.leaveTypeId}
                                                onClick={() => handleTypeSelect(b)}
                                                className={`balance-card p-4 rounded-2xl border-2 text-center relative overflow-hidden ${
                                                    form.leaveTypeId === b.leaveTypeId 
                                                        ? 'border-indigo-500 bg-indigo-500/5' 
                                                        : 'border-transparent bg-[var(--al-bg)]'
                                                } ${b.available <= 0 ? 'disabled opacity-50' : ''}`}
                                            >
                                                <h4 className="font-bold text-sm mb-1">{b.leaveTypeName}</h4>
                                                <div className={`text-2xl font-black ${b.available > 0 ? 'text-indigo-500' : 'text-red-400'}`}>
                                                    {b.available}
                                                </div>
                                                <span className="text-[10px] uppercase text-[var(--al-text-muted)] font-bold tracking-wider">Available</span>
                                                
                                                {/* Selected Checkmark */}
                                                {form.leaveTypeId === b.leaveTypeId && (
                                                    <div className="absolute top-2 right-2 text-indigo-600">
                                                        <BiCheckCircle size={20}/>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Date Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="al-input-group">
                                    <label className="al-label">From Date</label>
                                    <input 
                                        type="date" 
                                        className="al-input"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="al-input-group">
                                    <label className="al-label">To Date</label>
                                    <input 
                                        type="date" 
                                        className="al-input"
                                        min={form.startDate}
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="al-input-group">
                                <label className="al-label">Reason for Leave</label>
                                <textarea 
                                    className="al-input" 
                                    rows="4" 
                                    placeholder="Briefly explain the reason..."
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={btnLoading || !form.leaveTypeId} 
                                className="btn-submit flex items-center justify-center gap-2"
                            >
                                {btnLoading ? (
                                    <span>Processing...</span>
                                ) : (
                                    <>
                                        Submit Application <BiPaperPlane size={20} />
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                </div>

                {/* RIGHT: SUMMARY & INFO (4 Columns) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Summary Widget */}
                    <div className="al-glass-card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <BiWallet /> Request Summary
                            </h3>
                            
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b border-white/20 pb-2">
                                    <span className="opacity-80">Leave Type</span>
                                    <span className="font-bold">{selectedBalance?.leaveTypeName || "--"}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/20 pb-2">
                                    <span className="opacity-80">Start Date</span>
                                    <span>{form.startDate ? moment(form.startDate).format("DD MMM YYYY") : "--"}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/20 pb-2">
                                    <span className="opacity-80">End Date</span>
                                    <span>{form.endDate ? moment(form.endDate).format("DD MMM YYYY") : "--"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="opacity-80">Total Duration</span>
                                    <span className="text-3xl font-black">{duration} <span className="text-sm font-normal">Days</span></span>
                                </div>
                            </div>

                            {/* Warning if exceeds balance */}
                            {selectedBalance && duration > selectedBalance.available && (
                                <div className="mt-4 p-3 bg-red-500/20 border border-red-200/30 rounded-xl flex items-start gap-2 text-xs">
                                    <BiErrorCircle size={24} className="shrink-0"/>
                                    <span>Warning: Duration exceeds your available balance ({selectedBalance.available}). This may be treated as Loss of Pay.</span>
                                </div>
                            )}
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                    </div>

                    {/* Policy Tip Widget */}
                    <div className="al-glass-card p-6">
                        <h4 className="font-bold text-[var(--al-text)] flex items-center gap-2 mb-3">
                            <BiInfoCircle className="text-indigo-500"/> Policy Quick Note
                        </h4>
                        <ul className="text-sm text-[var(--al-text-muted)] space-y-2 list-disc pl-4">
                            <li>Requests for more than 3 days require approval 48hrs in advance.</li>
                            <li>Sick leaves may require a medical certificate upon return.</li>
                            <li>Weekends are automatically excluded from the calculation based on company policy.</li>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default ApplyLeave;