import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import EmployeeLayout from "./EmployeeLayout";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaExclamationCircle } from "react-icons/fa"; 
import "./ApplyLeave.css"; 

const schema = yup.object().shape({
  leaveType: yup.string().required("Please select a leave type"),
  startDate: yup.date().required("Start date is required").typeError("Invalid Date"),
  endDate: yup
    .date()
    .required("End date is required")
    .min(yup.ref("startDate"), "End date cannot be before start date")
    .typeError("Invalid Date"),
  reason: yup.string().required("Reason is required").min(10, "Reason must be at least 10 characters"),
});

const ApplyLeave = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      const payload = { ...data, employeeId: user?.id };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/leaves`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Application Sent!',
          text: 'Your leave request has been submitted successfully.',
          confirmButtonColor: '#4f46e5'
        });
        reset();
        navigate("/employee/my-leaves");
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.message || 'Something went wrong.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <EmployeeLayout>
      <div className="apply-leave-wrapper">
        
        {/* --- STICKER AB BOTTOM-RIGHT ME HAI --- */}
        <FaPaperPlane className="al-bg-sticker" />

        <div className="al-card animate__animated animate__fadeInUp">
          <div className="al-header">
            <h3>Apply For Leave</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="al-form-grid">
              
              <div className="al-form-group full-width">
                <label className="al-label">Leave Type</label>
                <select className="al-select" {...register("leaveType")}>
                  <option value="">Select Type</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Earned">Earned / Privilege Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
                {errors.leaveType && <p className="error-msg"><FaExclamationCircle/> {errors.leaveType.message}</p>}
              </div>

              <div className="al-form-group">
                <label className="al-label">From Date</label>
                <input type="date" className="al-input" {...register("startDate")} />
                {errors.startDate && <p className="error-msg"><FaExclamationCircle/> {errors.startDate.message}</p>}
              </div>

              <div className="al-form-group">
                <label className="al-label">To Date</label>
                <input type="date" className="al-input" {...register("endDate")} />
                {errors.endDate && <p className="error-msg"><FaExclamationCircle/> {errors.endDate.message}</p>}
              </div>

              <div className="al-form-group full-width">
                <label className="al-label">Reason for Leave</label>
                <textarea 
                  className="al-textarea" 
                  placeholder="Please describe why you need this leave..."
                  {...register("reason")}
                ></textarea>
                {errors.reason && <p className="error-msg"><FaExclamationCircle/> {errors.reason.message}</p>}
              </div>

            </div>

            <button type="submit" className="al-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : <><FaPaperPlane /> Submit Request</>}
            </button>
          </form>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default ApplyLeave;