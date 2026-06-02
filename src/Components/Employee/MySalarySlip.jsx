import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import EmployeeLayout from "../Common/DynamicLayout";
import { generateSalarySlipPDF } from "../Admin/generateSalarySlipPDF";
import { FcDownload } from "react-icons/fc";

const MySalarySlips = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payrolls/my`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

  
      setPayrolls(res.data.data.reverse());
    } catch (error) {
      Swal.fire("Error", "Failed to fetch salary slips", "error");
    } finally {
      setLoading(false);
    }
  };

  fetchPayrolls();
}, []);


  const filtered = selectedMonth
    ? payrolls.filter((p) => p.month === selectedMonth)
    : payrolls;

  return (
    <EmployeeLayout>
      <div className="container mt-5">
        <h3 className="text-center fw-bold mb-4">💰 My Salary Slips</h3>

        <div className="mb-3 text-center">
          <label className="fw-semibold me-2">Select Month:</label>
          <select
            className="form-select w-auto d-inline-block"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All</option>
            {[...new Set(payrolls.map((p) => p.month))].map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive shadow-sm rounded-3">
          <table className="table table-bordered text-center align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Month</th>
                <th>Basic Salary</th>
                <th>Net Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-4 text-muted">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.month}</td>
                    <td>₹{item.basicSalary}</td>
                    <td className="fw-bold text-success">₹{item.netSalary}</td>
                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1 mx-auto"
                        onClick={() => generateSalarySlipPDF(item)}
                      >
                        <FcDownload />
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-muted">
                    No salary slips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default MySalarySlips;
