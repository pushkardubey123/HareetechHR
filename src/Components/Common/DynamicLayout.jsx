import React from "react";
import DynamicLayout from "../Admin/AdminLayout";
import EmployeeLayout from "../Employee/EmployeeLayout";

const AdminLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Agar admin hai toh AdminLayout, warna EmployeeLayout
  if (user.role === "admin") {
    return <DynamicLayout>{children}</DynamicLayout>;
  }
  
  return <EmployeeLayout>{children}</EmployeeLayout>;
};

export default AdminLayout;