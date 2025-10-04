import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", mobile: "", password: "" });
  const [counts, setCounts] = useState({ admins: 0, agents: 0, leads: 0 });
  const [loading, setLoading] = useState(false);

  const BACKEND = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch counts
  const fetchCounts = async () => {
    if (!token) {
      toast.error("Unauthorized! Please login.");
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/superadmin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch counts");
        // If unauthorized, logout
        if (res.status === 401 || res.status === 403) handleLogout();
        return;
      }

      setCounts({
        admins: data.totalAdmins,
        agents: data.totalAgents,
        leads: data.totalLeads,
      });
    } catch {
      toast.error("Network error while fetching counts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Input change
  const handleChange = (e) => setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });

  // Create new admin
  const createAdmin = async () => {
    const { name, email, mobile, password } = newAdmin;

    if (!name || name.trim().length < 3) return toast.error("Name must be at least 3 characters");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return toast.error("Enter a valid email");
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobile || !mobileRegex.test(mobile)) return toast.error("Enter a valid 10-digit mobile number");
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      const res = await fetch(`${BACKEND}/api/superadmin/newadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create admin");
        // If unauthorized, logout
        if (res.status === 401 || res.status === 403) handleLogout();
        return;
      }

      toast.success("Admin created ✅");
      setNewAdmin({ name: "", email: "", mobile: "", password: "" });
      fetchCounts(); // refresh counts
    } catch {
      toast.error("Network error while creating admin");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully ✅");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-br from-sky-600 to-indigo-600 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">SuperAdmin Panel</h2>
        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="py-2 px-4 bg-white/20 rounded"
          >
            Dashboard
          </button>
          <button onClick={handleLogout} className="mt-4 py-2 px-4 bg-red-500 rounded">
            Logout
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, SuperAdmin!</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <h3 className="text-lg font-semibold">Total Admins</h3>
            <p className="text-3xl font-bold mt-2">{loading ? "..." : counts.admins}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <h3 className="text-lg font-semibold">Total Agents</h3>
            <p className="text-3xl font-bold mt-2">{loading ? "..." : counts.agents}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <h3 className="text-lg font-semibold">Total Leads</h3>
            <p className="text-3xl font-bold mt-2">{loading ? "..." : counts.leads}</p>
          </div>
        </div>

        {/* Create new admin */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={newAdmin.name}
              onChange={handleChange}
              placeholder="Name"
              className="p-2 border rounded"
            />
            <input
              name="email"
              value={newAdmin.email}
              onChange={handleChange}
              placeholder="Email"
              className="p-2 border rounded"
            />
            <input
              name="mobile"
              value={newAdmin.mobile}
              onChange={handleChange}
              placeholder="Mobile"
              className="p-2 border rounded"
            />
            <input
              name="password"
              type="password"
              value={newAdmin.password}
              onChange={handleChange}
              placeholder="Password"
              className="p-2 border rounded"
            />
          </div>
          <button
            onClick={createAdmin}
            className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded"
          >
            Create Admin
          </button>
        </div>
      </div>
    </div>
  );
}
