import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";

// ... Common Components ...
import Home from "./Components/Home/Home";
import Register from "./Components/Common/Register";
import Login from "./Components/Common/Login";
import ForgotPassword from "./Components/Common/ForgotPassword";
import VerifyOtp from "./Components/Common/VerifyOtp";
import ResetPassword from "./Components/Common/ResetPassword";

// ... Admin Components ...
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AdminApproveEmployees from "./Components/Admin/AdminApproveEmployees";
import EmployeeProfile from "./Components/Admin/EmployeeProfile";
import PayrollReport from "./Components/Admin/PayrollReport";
import Department from "./Components/Admin/Department";
import AdminExit from "./Components/Admin/AdminExit";
import Timesheet from "./Components/Admin/Attendence/Timesheet";
import DesignationManagement from "./Components/Admin/Designation";
import ShiftManagement from "./Components/Admin/ShiftManagement";
import LeaveManagementLayout from "./Components/Admin/LeaveManagement/LeaveManagementLayout"; 
import OfficeTiming from "./Components/Admin/OfficeTimmings";
import AdminWFHList from "./Components/Admin/AdminWFHList";
import MonthlyAttendance from "./Components/Admin/MonthlyAttendance";
import FullAndFinalSalary from "./Components/Admin/FullAndFinalSalary";
import SendNotification from "./Components/Admin/SendNotification";
import NotificationHistory from "./Components/Admin/NotificationHistory";
import EventManagement from "./Components/Admin/EventManagement";
import CreateMeetingForm from "./Components/Admin/CreateMeetingForm";
import MeetingCalendar from "./Components/Admin/MeetingCalendar";
import BirthdayAndAnniversary from "./Components/Admin/BirthdayAndAnniversary";
import CreateJob from "./Components/Recruitment/CreateJob";
import JobList from "./Components/Recruitment/JobList";
import AdminApplications from "./Components/Recruitment/AdminApplications";
import InterviewCalendar from "./Components/Recruitment/InterviewCalendar";
import AdminSettings from "./Components/Admin/AdminSettings";
import LeadManagement from "./Components/Admin/LeadManagement";
import AdminAttendancePanel from "./Components/Admin/AdminAttendencePanel";
import PayrollManagement from "./Components/Admin/PayrollManagement";
import AdminEmployeeManagement from "./Components/Admin/AdminEmployeeManagement";
import ProjectManagement from "./Components/Admin/ProjectManagement";
import Document from "./Components/Admin/Document";
import AddBranch from "./Components/Admin/AddBranch";
import BulkAttendancePanel from "./Components/Admin/BulkAttendance";

// ... Employee Components ...
import EmployeeDashboard from "./Components/Employee/EmployeeDashboard";
import ApplyLeave from "./Components/Employee/ApplyLeave";
import MyLeaveList from "./Components/Employee/MyLeaveList";
import MarkAttendance from "./Components/Employee/MarkAttendance";
import MyAttendanceList from "./Components/Employee/MyAttendanceList";
import EmployeeDocument from "./Components/Employee/EmployeeDocument";
import MySalarySlips from "./Components/Employee/MySalarySlip";
import EmployeeExit from "./Components/Employee/EmployeeExit";
import EmployeeNotifications from "./Components/Employee/EmployeeNotifications";
import EmployeePanel from "./Components/Employee/EmployeePanel";
import EmployeeTimesheet from "./Components/Employee/Attendence/TimeSheetEmployee";
import EmployeeEvents from "./Components/Employee/EmployeeEvents";
import ApplyWFHForm from "./Components/Employee/ApplyWFHForm";
import MyWFHRequests from "./Components/Employee/MyWFHRequests";

// ... Recruitment Components ...
import UserJobLists from "./Components/Recruitment/UserJobLists";
import JobDetail from "./Components/Recruitment/JobDetail";
import ApplyJob from "./Components/Recruitment/ApplyJob";

// ✅ NEW MAIL MODULE IMPORTS
import MailLayout from "./Components/Mail_Module/MailLayout";
import ComposeMail from "./Components/Mail_Module/ComposeMail";
import MailList from "./Components/Mail_Module/MailList"; // The smart list component we made

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* ================= MAIL ROUTES ================= */}
          <Route path="/mail" element={<MailLayout />}>
             {/* Default redirect to Inbox */}
             <Route index element={<Navigate to="inbox" replace />} />
             
             <Route path="compose" element={<ComposeMail />} />
             
             {/* Using the Universal MailList for all folders */}
             <Route path="inbox" element={<MailList />} />
             <Route path="sent" element={<MailList />} />
             <Route path="drafts" element={<MailList />} />
             <Route path="starred" element={<MailList />} />
             <Route path="spam" element={<MailList />} />
             <Route path="trash" element={<MailList />} />
             
             {/* If you have a specific View Page, add it here:
             <Route path="view/:id" element={<MailDetails />} /> 
             */}
          </Route>
          {/* ============================================== */}


          {/* ADMIN ROUTES */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/pending-employee" element={<AdminApproveEmployees />} />
          <Route path="/admin/employee/:id" element={<EmployeeProfile />} />
          
          <Route path="admin/payroll-report" element={<PayrollReport />} />
          <Route path="/admin/department" element={<Department />} />
          <Route path="/admin/department/:id" element={<Department />} />
          <Route path="/admin/employee-exit-lists" element={<AdminExit />} />
          <Route path="/admin/time-sheets" element={<Timesheet />} />
          <Route path="/admin/designations" element={<DesignationManagement />} />
          <Route path="/admin/shifts" element={<ShiftManagement />} />

          {/* New Leave Layout */}
          <Route path="/admin/leaves" element={<LeaveManagementLayout />} />

          <Route path="/admin/office-timming" element={<OfficeTiming />} />
          <Route path="/admin/wfh/requests" element={<AdminWFHList />} />
          <Route path="/admin/MonthlyAttendance" element={<MonthlyAttendance />} />
          <Route path="/admin/fullandfinal" element={<FullAndFinalSalary />} />
          <Route path="/admin/send-notification" element={<SendNotification />} />
          <Route path="/admin/notification-history" element={<NotificationHistory />} />
          <Route path="/admin/events" element={<EventManagement />} />
          <Route path="/admin/meeting-form" element={<CreateMeetingForm />} />
          <Route path="/admin/meeting-calender" element={<MeetingCalendar />} />
          <Route path="/admin/bday-anniversary" element={<BirthdayAndAnniversary />} />
          <Route path="/admin/jobcreate" element={<CreateJob />} />
          <Route path="/admin/joblist" element={<JobList />} />
          <Route path="/admin/branchs" element={<AddBranch />} />
          <Route path="/jobs/candidates" element={<AdminApplications />} />
          <Route path="/jobs/interview" element={<InterviewCalendar />} />
          <Route path="/admin/setting" element={<AdminSettings />} />
          <Route path="/admin/lms" element={<LeadManagement />} />
          <Route path="/admin/employee-attendence-lists" element={<AdminAttendancePanel />} />
          <Route path="/admin/payroll" element={<PayrollManagement />} />
          <Route path="/admin/employee-management" element={<AdminEmployeeManagement />} />
          <Route path="/admin/project-management" element={<ProjectManagement />} />
          <Route path="/admin/documents" element={<Document />} />
          <Route path="/admin/bulk-attendance" element={<BulkAttendancePanel />} />


          {/* EMPLOYEE ROUTES */}
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/apply-leave" element={<ApplyLeave />} />
          <Route path="/employee/my-leaves" element={<MyLeaveList />} />
          <Route path="/employee/mark-attendence" element={<MarkAttendance />} />
          <Route path="/employee/my-attendence-list" element={<MyAttendanceList />} />
          <Route path="/employee/my-documents" element={<EmployeeDocument />} />
          <Route path="/employee/salary-slips" element={<MySalarySlips />} />
          <Route path="/employee/exit-request" element={<EmployeeExit />} />
          <Route path="/employee/notification" element={<EmployeeNotifications />} />
          <Route path="/employee/tasks" element={<EmployeePanel />} />
          <Route path="/employee/timesheet" element={<EmployeeTimesheet />} />
          <Route path="/employee/events" element={<EmployeeEvents />} />
          <Route path="/wfh/apply" element={<ApplyWFHForm />} />
          <Route path="/wfh/mine" element={<MyWFHRequests />} />


          {/* RECRUITMENT & COMMON ROUTES */}
          <Route path="/jobs" element={<UserJobLists />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/apply" element={<ApplyJob />} />
          
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;