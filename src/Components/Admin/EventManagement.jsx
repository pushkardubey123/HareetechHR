import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import moment from "moment";
import AdminLayout from "./AdminLayout";
import "./EventManagement.css";
import { BiCalendarEvent } from "react-icons/bi";
import { BsPinAngleFill } from "react-icons/bs";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const fetchBranches = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/branch`,
      headers
    );
    setBranches(res.data.data || []);
  };

  const fetchDepartmentsByBranch = async (branchId) => {
    if (!branchId) return [];
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/departments?branchId=${branchId}`,
      headers
    );
    return res.data.data || [];
  };

  const fetchEvents = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/events`,
      headers
    );
    setEvents(res.data.data || []);
  };

  useEffect(() => {
    fetchBranches();
    fetchEvents();
  }, []);

  /* ================= ADD EVENT ================= */
  const handleAddEvent = async () => {
    Swal.fire({
      title: "📅 Add Event",
      width: 700,
      html: `
        <label>Branch <span style="color:red"></span></label>
        <select id="branch" class="swal2-select">
          <option value="">Select Branch</option>
          ${branches
            .map((b) => `<option value="${b._id}">${b.name}</option>`)
            .join("")}
        </select>
        </br>
        <label style="margin-top:10px;">Departments</label>
        <select id="department" class="swal2-select"></select>
        </br>
        <label>Title <span style="color:red"></span></label>
        <input id="title" class="swal2-input"/>
</br>
        <label>Start Date <span style="color:red"></span></label>
        <input type="date" id="start" class="swal2-input"/>
</br>
        <label>End Date <span style="color:red"></span></label>
        <input type="date" id="end" class="swal2-input"/>
      `,
      didOpen: () => {
        document
          .getElementById("branch")
          .addEventListener("change", async (e) => {
            const deptSelect = document.getElementById("department");
            deptSelect.innerHTML = "";

            const depts = await fetchDepartmentsByBranch(e.target.value);
            deptSelect.innerHTML =
              `<option value="">Select Department</option>` +
              depts
                .map(
                  (d) => `<option value="${d._id}">${d.name}</option>`
                )
                .join("");
          });
      },
      preConfirm: () => {
        const branchId = document.getElementById("branch").value;
        const departmentId = document.getElementById("department").value;
        const title = document.getElementById("title").value.trim();
        const startDate = document.getElementById("start").value;
        const endDate = document.getElementById("end").value;

        if (!branchId || !title || !startDate || !endDate) {
          Swal.showValidationMessage("All required fields are mandatory");
          return false;
        }

        return { branchId, departmentId, title, startDate, endDate };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/events/create`,
          result.value,
          headers
        );
        fetchEvents();
        Swal.fire("Success", "Event created successfully", "success");
      }
    });
  };

  /* ================= CALENDAR ================= */
  const renderCalendar = () => {
    const start = currentMonth.clone().startOf("month").startOf("week");
    const end = currentMonth.clone().endOf("month").endOf("week");
    const day = start.clone();
    const rows = [];

    while (day.isBefore(end)) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = day.clone();
        const dayEvents = events.filter((e) =>
          currentDay.isBetween(
            moment(e.startDate),
            moment(e.endDate),
            "day",
            "[]"
          )
        );

        week.push(
          <td key={currentDay.format()}>
            <div className="date-number">{currentDay.date()}</div>
            {dayEvents.map((e) => (
              <div
                key={e._id}
                className="event-chip"
                onClick={() => handleEditDelete(e)}
              >
                {e.title}
              </div>
            ))}
          </td>
        );
        day.add(1, "day");
      }
      rows.push(<tr key={day.format()}>{week}</tr>);
    }
    return rows;
  };

  /* ================= EDIT / DELETE ================= */
  const handleEditDelete = (e) => {
    Swal.fire({
      title: "Event",
      html: `
        <input id="title" class="swal2-input" value="${e.title}">
        <input type="date" id="start" class="swal2-input" value="${moment(
          e.startDate
        ).format("YYYY-MM-DD")}">
        <input type="date" id="end" class="swal2-input" value="${moment(
          e.endDate
        ).format("YYYY-MM-DD")}">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Update",
      denyButtonText: "Delete",
      preConfirm: () => ({
        title: document.getElementById("title").value,
        startDate: document.getElementById("start").value,
        endDate: document.getElementById("end").value,
      }),
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/events/${e._id}`,
          result.value,
          headers
        );
        fetchEvents();
        Swal.fire("Updated", "Event updated", "success");
      }

      if (result.isDenied) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/events/${e._id}`,
          headers
        );
        fetchEvents();
        Swal.fire("Deleted", "Event deleted", "success");
      }
    });
  };

  return (
    <AdminLayout>
      <div className="calendar-container">
        <div className="calendar-top">
          <h2 className="d-flex align-item-center justify-content-center">
            <BiCalendarEvent className="me-1"/> {currentMonth.format("MMMM YYYY")}
          </h2>
          <div className="calendar-buttons">
            <button
              onClick={() =>
                setCurrentMonth(currentMonth.clone().subtract(1, "month"))
              }
            >
              ←
            </button>
            <button
              onClick={() =>
                setCurrentMonth(currentMonth.clone().add(1, "month"))
              }
            >
              →
            </button>
            <button onClick={handleAddEvent}>+ Add Event</button>
          </div>
        </div>

        <div className="calendar-layout">
          <div className="calendar-main">
            <table className="calendar-table">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <th key={d}>{d}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>{renderCalendar()}</tbody>
            </table>
          </div>

          <div className="calendar-sidebar">
            <h3 className="upcoming-title d-flex align-item-center">
              <BsPinAngleFill className="upcoming-icon me-1" />
              <span>Upcoming Events</span>
            </h3>

            {events
              .filter((e) =>
                moment(e.startDate).isSameOrAfter(moment(), "day")
              )
              .map((e) => (
                <div key={e._id} className="upcoming-card">
                  <b>{e.title}</b>
                  <p>
                    {moment(e.startDate).format("MMM D")} -{" "}
                    {moment(e.endDate).format("MMM D")}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EventManagement;
