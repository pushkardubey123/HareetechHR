import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import moment from "moment";
import Swal from "sweetalert2";

const MonthlyAttendanceChart = () => {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));

  // ✅ PERMISSION LOGIC (Optional here, just for uniformity)
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.attendance) {
          setPerms(res.data.detailed.attendance);
        }
      } catch (e) {}
    };
    fetchPerms();
  }, [token, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/monthly?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const records = res.data.data;
        const summary = { Present: 0, Late: 0, Absent: 0 };
        records.forEach((r) => {
          if (summary[r.status] !== undefined) {
            summary[r.status]++;
          } else {
            summary[r.status] = 1;
          }
        });
        const formattedData = Object.keys(summary).map((key) => ({
          name: key,
          count: summary[key],
        }));
        setData(formattedData);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch monthly attendance", "error");
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">📊 Monthly Attendance</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm"
        />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={60} />
        </BarChart>
      </ResponsiveContainer>

      <div className="text-sm text-gray-500 text-center mt-3">
        Showing attendance summary for <strong>{moment(month).format("MMMM YYYY")}</strong>
      </div>
    </div>
  );
};

export default MonthlyAttendanceChart;