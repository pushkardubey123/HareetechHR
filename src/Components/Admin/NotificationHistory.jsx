import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEye, FaBell } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import moment from "moment";
import Loader from "./Loader/Loader";

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(res.data || []);
      console.log(res.data)
    } catch (err) {
      Swal.fire("Error", "Failed to fetch notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/notifications/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        Swal.fire("Deleted!", "Notification has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete notification", "error");
      }
    }
  };

  const getFileUrl = (file) => {
    if (!file) return null;
    const cleanPath = file.startsWith("uploads/")
      ? file.replace("uploads/", "")
      : file;
    return `${import.meta.env.VITE_API_URL}/static/${cleanPath}`;
  };
  

  const handlePreview = (notif) => {
    let content = `<p><strong>Message:</strong> ${notif.message}</p>
                   <p><strong>Recipient:</strong> ${
                     notif.recipient === "all"
                       ? "All Staff"
                       : typeof notif.recipient === "object"
                       ? notif.recipient?.name || "Unnamed"
                       : notif.recipient
                   }</p>
                   <p><strong>Date:</strong> ${moment(notif.createdAt).format(
                     "DD MMM YYYY, hh:mm A"
                   )}</p>`;

    if (notif.image) {
      const url = getFileUrl(notif.image);
      console.log("Notification image URL:", url);

      if (url.endsWith(".pdf")) {
        content =
          `<a href="${url}" target="_blank" style="display:block; margin-bottom:10px;">View PDF</a>` +
          content;
      } else {
        content =
          `<img src="${url}" alt="image" style="max-width:100%; max-height:200px; object-fit:cover; border-radius:8px; display:block; margin:auto 0 10px 0;" />` +
          content;
      }
    }

    Swal.fire({
      title: notif.title,
      html: content,
      icon: notif.type || "info",
      width: "600px",
    });
  };

  return (
    <AdminLayout>
      <div className="container py-4">
        <div className="card shadow border-0 rounded-4">
          <div className="card-header bg-dark text-white fs-5 fw-bold py-3 d-flex align-items-center">
            <FaBell className="me-2" /> Notification History herfbeijrhoirogj
          </div>
          <div className="card-body table-responsive">
            {loading ? (
              <Loader />
            ) : Array.isArray(notifications) && notifications.length > 0 ? (
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif, idx) => (
                    <tr key={notif._id}>
                      <td>{idx + 1}</td>
                      <td>{notif.title}</td>
                      <td style={{ maxWidth: 250 }}>{notif.message}</td>
                      <td>
                        {notif.recipient === "all"
                          ? "All Staff"
                          : typeof notif.recipient === "object"
                          ? notif.recipient?.name || "Unnamed"
                          : notif.recipient}
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            notif.type === "success"
                              ? "success"
                              : notif.type === "warning"
                              ? "warning text-dark"
                              : "info"
                          }`}
                        >
                          {notif.type}
                        </span>
                      </td>
                      <td>
                        {moment(notif.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </td>
                      <td>
                        {notif.image ? (
                          notif.image.endsWith(".pdf") ? (
                            <a
                              href={getFileUrl(notif.image)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              View PDF
                            </a>
                          ) : (
                            <img
                              src={getFileUrl(notif.image)}
                              alt="notif"
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #ccc",
                              }}
                            />
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => handleDelete(notif._id)}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handlePreview(notif)}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted text-center">No notifications found.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationHistory;
