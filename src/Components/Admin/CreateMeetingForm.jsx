import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { 
  FaCalendarAlt, FaClock, FaUserFriends, FaHeading, FaAlignLeft, FaPaperPlane 
} from "react-icons/fa";
import "./CreateMeetingForm.css";

// Schema Validation
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  date: yup.date().nullable().required("Date is required"),
  startTime: yup.date().nullable().required("Start Time is required"),
  endTime: yup.date().nullable().required("End Time is required"),
  participants: yup.array().min(1, "Select at least one participant"),
});

const CreateMeetingForm = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  
  // Logic to detect if we are in Dark Mode for React-Select styling
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const theme = document.body.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkTheme();

    // Optional: MutationObserver to watch for theme changes instantly
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // React Select Custom Styles (Dynamic based on Theme)
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#818cf8' : (isDarkMode ? '#334155' : '#cbd5e1'),
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      borderRadius: '10px',
      paddingLeft: '35px', // Space for icon
      minHeight: '48px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
      '&:hover': { borderColor: '#818cf8' }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#6366f1' 
        : state.isFocused 
          ? (isDarkMode ? '#334155' : '#e0e7ff') 
          : 'transparent',
      color: state.isSelected ? 'white' : (isDarkMode ? '#f8fafc' : '#334155'),
      cursor: 'pointer',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? '#f8fafc' : '#1e293b',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#334155' : '#e0e7ff',
      borderRadius: '5px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDarkMode ? '#f8fafc' : '#3730a3',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: isDarkMode ? '#f8fafc' : '#3730a3',
      ':hover': { backgroundColor: '#6366f1', color: 'white' },
    }),
  };

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/user`, getHeaders())
      .then((res) => {
        if (res.data.success) {
          setUsers(res.data.data.map(u => ({ value: u._id, label: u.name })));
        }
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        date: moment(data.date).format("YYYY-MM-DD"),
        startTime: moment(data.startTime).format("HH:mm"),
        endTime: moment(data.endTime).format("HH:mm"),
        participants: data.participants.map((p) => p.value),
        sendEmail: data.sendEmail || false,
        sendReminder: data.sendReminder || false,
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/meeting/create`, payload, getHeaders());
      if (res.data.success) {
        Swal.fire({
          title: 'Scheduled!',
          text: 'Meeting Created Successfully',
          icon: 'success',
          confirmButtonColor: '#6366f1'
        });
        reset();
        navigate("/admin/meeting-calender");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  return (
<AdminLayout>
      <div className="page-container">
        <div className="main-card">
          <div className="form-section">
            <div className="form-header">
              <h2>Schedule Meeting</h2>
              <p>Fill the details to send invites.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              
              {/* Title */}
              <div className="input-group-custom">
                <input {...register("title")} className="form-input-styled" placeholder="Meeting Title" />
                <FaHeading className="input-icon" />
                <p className="text-danger small ms-2">{errors.title?.message}</p>
              </div>

              {/* Date & Time Row */}
              <div className="row">
                <div className="col-md-4">
                  <div className="input-group-custom">
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholderText="Date"
                          className="form-input-styled"
                          dateFormat="yyyy-MM-dd"
                          minDate={new Date()}
                          autoComplete="off"
                        />
                      )}
                    />
                    <FaCalendarAlt className="input-icon" />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="input-group-custom">
                    <Controller
                      control={control}
                      name="startTime"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect showTimeSelectOnly
                          timeIntervals={15}
                          dateFormat="h:mm aa"
                          placeholderText="Start"
                          className="form-input-styled"
                          autoComplete="off"
                        />
                      )}
                    />
                    <FaClock className="input-icon" />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="input-group-custom">
                    <Controller
                      control={control}
                      name="endTime"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect showTimeSelectOnly
                          timeIntervals={15}
                          dateFormat="h:mm aa"
                          placeholderText="End"
                          className="form-input-styled"
                          autoComplete="off"
                        />
                      )}
                    />
                    <FaClock className="input-icon" />
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="input-group-custom">
                <Controller
                  name="participants"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      isMulti 
                      options={users} 
                      styles={customSelectStyles}
                      placeholder="Select Participants..." 
                      className="custom-select-container"
                    />
                  )}
                />
                <FaUserFriends className="input-icon" />
              </div>

              {/* Agenda / Description */}
              <div className="input-group-custom">
                <textarea 
                  {...register("description")} 
                  className="form-input-styled" 
                  rows={3} 
                  placeholder="Meeting Agenda..." 
                  style={{ paddingLeft: '45px' }}
                />
                <FaAlignLeft className="input-icon textarea-icon" />
                <p className="text-danger small ms-2">{errors.description?.message}</p>
              </div>

              {/* Toggles & Button same rahenge... */}
              <div className="d-flex gap-4 mb-3">
                <label className="d-flex align-items-center gap-2" style={{color: 'var(--text-muted)', cursor:'pointer'}}>
                  <input type="checkbox" {...register("sendEmail")} /> Email Notify
                </label>
                <label className="d-flex align-items-center gap-2" style={{color: 'var(--text-muted)', cursor:'pointer'}}>
                  <input type="checkbox" {...register("sendReminder")} /> Set Reminder
                </label>
              </div>
              <button type="submit" className="submit-btn-animated d-flex align-items-center justify-content-center w-100">
  <FaPaperPlane className="me-2" />
  <span>Schedule Meeting</span>
</button>
            </form>
          </div>

          {/* Right Visual Section same rahega... */}
          <div className="visual-section">
             <img 
              src="https://img.freepik.com/free-vector/business-team-brainstorming-discussing-startup-project_74855-6909.jpg" 
              className="hero-image"
              alt="Illustration"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateMeetingForm;