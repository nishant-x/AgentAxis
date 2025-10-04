import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Component for viewing lead details
function LeadModal({ lead, onClose }) {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">Lead Details</h2>
        <p><strong>First Name:</strong> {lead.firstName}</p>
        <p><strong>Phone:</strong> {lead.phone}</p>
        <p><strong>Email:</strong> {lead.email || "-"}</p>
        <p><strong>Notes:</strong> {lead.notes || "-"}</p>
        <p><strong>Status:</strong> {lead.status}</p>
        <button onClick={onClose} className="mt-4 py-2 px-4 bg-red-500 text-white rounded">Close</button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: "", email: "", mobile: "", password: "" });
  const [editAgentId, setEditAgentId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [searchAgent, setSearchAgent] = useState("");
  const [searchLead, setSearchLead] = useState("");
  const [sortAgentAsc, setSortAgentAsc] = useState(true);
  const [leadModal, setLeadModal] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [stats, setStats] = useState({ agentCount: 0, leadCount: 0 }); // ✅ stats state

  const BACKEND = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch agents
  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const admin = JSON.parse(localStorage.getItem("user"));
      const adminId = admin?.id;

      if (!adminId) {
        toast.error("Admin ID not found. Please log in again.");
        setLoadingAgents(false);
        return;
      }

      const res = await fetch(`${BACKEND}/api/admin/agents`, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to fetch agents");

      setAgents(data.agents || []);
      setStats(prev => ({ ...prev, agentCount: data.agents.length || 0 }));
    } catch (err) {
      console.error("Error fetching agents:", err);
      toast.error("Network error while fetching agents");
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch uploads and total leads
  const fetchUploads = async () => {
    setLoadingUploads(true);
    try {
      const adminId = JSON.parse(localStorage.getItem("user"))?.id; 
      if (!adminId) return toast.error("Admin ID not found");

      const res = await fetch(`${BACKEND}/api/admin/uploads?adminId=${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to fetch uploads");

      setUploads(data.uploads || []);
      setStats(prev => ({ ...prev, leadCount: data.counts?.totalLeads || 0 }));
    } catch {
      toast.error("Network error while fetching uploads");
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchUploads();
  }, []);

  const handleAgentChange = (e) => setNewAgent({ ...newAgent, [e.target.name]: e.target.value });

  // Add or update agent
  const saveAgent = async () => {
    const { name, email, mobile, password } = newAgent;

    if (!name || name.trim().length < 3) return toast.error("Name must be at least 3 characters");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return toast.error("Enter a valid email");
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobile || !mobileRegex.test(mobile)) return toast.error("Enter a valid 10-digit mobile number");
    if (!editAgentId && (!password || password.length < 6)) return toast.error("Password must be at least 6 characters");

    const admin = JSON.parse(localStorage.getItem("user")); 
    const adminId = admin?.id;
    if (!adminId) return toast.error("Admin ID missing. Please log in again.");

    const url = editAgentId
      ? `${BACKEND}/api/admin/agents/${editAgentId}`
      : `${BACKEND}/api/admin/newagent`;

    const method = editAgentId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newAgent, adminId }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to save agent");

      toast.success(editAgentId ? "Agent updated ✅" : "Agent added ✅");
      setNewAgent({ name: "", email: "", mobile: "", password: "" });
      setEditAgentId(null);
      fetchAgents();
    } catch (err) {
      console.error("Error saving agent:", err);
      toast.error("Network error while saving agent");
    }
  };

  const editAgent = (agent) => {
    setEditAgentId(agent._id);
    setNewAgent({ name: agent.name, email: agent.email, mobile: agent.mobile, password: "" });
  };

  const deleteAgent = async (id) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/admin/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to delete agent");
      toast.success("Agent deleted ✅");
      fetchAgents();
      fetchUploads(); // Refresh uploads & lead count
    } catch {
      toast.error("Network error while deleting agent");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return setFile(null);

    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const isValid = allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      toast.error("Please upload a valid file (.csv, .xlsx, .xls only)");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const uploadCSV = async () => {
    if (!file) return toast.error("Please select a file");
    setUploadingCSV(true);

    try {
      const adminId = JSON.parse(localStorage.getItem("user"))?.id;
      if (!adminId) return toast.error("Admin ID not found");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("adminId", adminId); 

      const res = await fetch(`${BACKEND}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to upload file");

      toast.success("File uploaded & distributed ✅");
      setFile(null);
      fetchUploads();
    } catch (err) {
      console.error("CSV upload error:", err);
      toast.error("Network error while uploading file");
    } finally {
      setUploadingCSV(false);
    }
  };

  const deleteUpload = async (id) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/admin/uploads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to delete lead");
      toast.success("Lead deleted ✅");
      fetchUploads();
    } catch {
      toast.error("Network error while deleting lead");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await fetch(`${BACKEND}/api/admin/uploads/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUploads();
    } catch {
      toast.error("Network error while updating status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully ✅");
    navigate("/");
  };

  const uploadsByAgent = uploads.reduce((acc, item) => {
    const agentName = item.agent?.name || "Unassigned";
    if (!acc[agentName]) acc[agentName] = [];
    acc[agentName].push(item);
    return acc;
  }, {});

  const downloadCSV = (agentName, entries) => {
    const csvContent = [
      ["First Name", "Phone", "Email", "Notes", "Status"],
      ...entries.map((e) => [e.firstName, e.phone, e.email || "", e.notes || "", e.status]),
    ].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${agentName}_leads.csv`;
    link.click();
  };

  const filteredAgents = agents
    .filter((a) => a.name.toLowerCase().includes(searchAgent.toLowerCase()))
    .sort((a, b) => (sortAgentAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const filteredUploadsByAgent = Object.fromEntries(
    Object.entries(uploadsByAgent).map(([agentName, entries]) => [
      agentName,
      entries.filter((l) => l.firstName.toLowerCase().includes(searchLead.toLowerCase())),
    ])
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-br from-sky-600 to-indigo-600 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">AgentAxis Admin</h2>
        <nav className="flex flex-col gap-3 mt-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="py-2 px-4 bg-white/20 rounded">Dashboard</button>
          <button onClick={() => document.getElementById("agents-section").scrollIntoView({ behavior: "smooth" })} className="py-2 px-4 bg-white/20 rounded">Agents</button>
          <button onClick={() => document.getElementById("uploads-section").scrollIntoView({ behavior: "smooth" })} className="py-2 px-4 bg-white/20 rounded">Uploads</button>
          <button onClick={handleLogout} className="mt-4 py-2 px-4 bg-red-500 rounded">Logout</button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, Admin!</h1>

        {/* Stats Section ✅ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-gray-500">Total Agents</h3>
            <p className="text-2xl font-bold">{stats.agentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-gray-500">Total Leads</h3>
            <p className="text-2xl font-bold">{stats.leadCount}</p>
          </div>
        </div>

        {/* Add/Edit Agent */}
        <div id="agents-section" className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">{editAgentId ? "Edit Agent" : "Add New Agent"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={newAgent.name} onChange={handleAgentChange} placeholder="Name" className="p-2 border rounded" />
            <input name="email" value={newAgent.email} onChange={handleAgentChange} placeholder="Email" className="p-2 border rounded" />
            <input name="mobile" value={newAgent.mobile} onChange={handleAgentChange} placeholder="Mobile" className="p-2 border rounded" />
            <input name="password" type="password" value={newAgent.password} onChange={handleAgentChange} placeholder="Password" className="p-2 border rounded" />
          </div>
          <button onClick={saveAgent} className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded">{editAgentId ? "Update Agent" : "Add Agent"}</button>
          {editAgentId && <button onClick={() => { setEditAgentId(null); setNewAgent({ name: "", email: "", mobile: "", password: "" }); }} className="ml-2 mt-4 py-2 px-4 bg-gray-400 text-white rounded">Cancel</button>}

          <div className="mt-6 flex justify-between items-center">
            <input type="text" placeholder="Search agents..." value={searchAgent} onChange={(e) => setSearchAgent(e.target.value)} className="p-2 border rounded" />
            <button onClick={() => setSortAgentAsc(!sortAgentAsc)} className="py-2 px-4 bg-gray-300 rounded">{sortAgentAsc ? "Sort Desc" : "Sort Asc"}</button>
          </div>

          {/* Agents Table */}
          {loadingAgents ? (
            <p className="mt-4">Loading agents...</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-gray-200 text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2">#</th>
                    <th className="border px-3 py-2">Name</th>
                    <th className="border px-3 py-2">Email</th>
                    <th className="border px-3 py-2">Mobile</th>
                    <th className="border px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, index) => (
                    <tr key={agent._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{index + 1}</td>
                      <td className="border px-3 py-2">{agent.name}</td>
                      <td className="border px-3 py-2">{agent.email}</td>
                      <td className="border px-3 py-2">{agent.mobile}</td>
                      <td className="border px-3 py-2 text-center space-x-2">
                        <button onClick={() => editAgent(agent)} className="py-1 px-3 bg-yellow-500 text-white rounded">Edit</button>
                        <button onClick={() => deleteAgent(agent._id)} className="py-1 px-3 bg-red-500 text-white rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Uploads Section */}
        <div id="uploads-section" className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload File & Manage Leads</h2>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="mb-4" />
          <button onClick={uploadCSV} className="py-2 px-4 bg-indigo-600 text-white rounded">{uploadingCSV ? "Uploading..." : "Upload File"}</button>

          <input type="text" placeholder="Search leads..." value={searchLead} onChange={(e) => setSearchLead(e.target.value)} className="mt-4 p-2 border rounded w-full" />

          <h3 className="text-lg font-semibold mt-6">Distributed Leads by Agent</h3>
          {loadingUploads ? (
            <p className="text-gray-500 mt-2">Loading leads...</p>
          ) : Object.keys(filteredUploadsByAgent).length === 0 ? (
            <p className="text-gray-500 mt-2">No leads uploaded yet.</p>
          ) : (
            Object.entries(filteredUploadsByAgent).map(([agentName, entries]) => (
              <div key={agentName} className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{agentName}</h3>
                  <button
                    onClick={() => downloadCSV(agentName, entries)}
                    className="py-1 px-3 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Download CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2">#</th>
                        <th className="border px-3 py-2">First Name</th>
                        <th className="border px-3 py-2">Phone</th>
                        <th className="border px-3 py-2">Email</th>
                        <th className="border px-3 py-2">Notes</th>
                        <th className="border px-3 py-2">Status</th>
                        <th className="border px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, index) => (
                        <tr key={entry._id} className="hover:bg-gray-50">
                          <td className="border px-3 py-2">{index + 1}</td>
                          <td
                            className="border px-3 py-2 cursor-pointer text-indigo-600"
                            onClick={() => setLeadModal(entry)}
                          >
                            {entry.firstName}
                          </td>
                          <td className="border px-3 py-2">{entry.phone}</td>
                          <td className="border px-3 py-2">{entry.email || "-"}</td>
                          <td className="border px-3 py-2">{entry.notes || "-"}</td>
                          <td className="border px-3 py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="border px-3 py-2 text-center space-x-2">
                            <button
                              onClick={() => toggleStatus(entry._id, entry.status)}
                              className="py-1 px-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => deleteUpload(entry._id)}
                              className="py-1 px-3 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {leadModal && <LeadModal lead={leadModal} onClose={() => setLeadModal(null)} />}
    </div>
  );
}
