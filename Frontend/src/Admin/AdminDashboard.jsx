import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// component for lead details
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
  // State variables 
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

  const BACKEND = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
 
  // Fetch all agents 
  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to fetch agents");
      setAgents(data.agents || []);
    } catch {
      toast.error("Network error while fetching agents");
    } finally {
      setLoadingAgents(false);
    }
  };
 
  // Fetch all uploads 
  const fetchUploads = async () => {
    setLoadingUploads(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/uploads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to fetch uploads");
      setUploads(data.uploads || []);
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
 
  // Agent form input change 
  const handleAgentChange = (e) => setNewAgent({ ...newAgent, [e.target.name]: e.target.value });
 
  // Add or update agent 
  const saveAgent = async () => {
  const { name, email, mobile, password } = newAgent;

  // VALIDATION 
  if (!name || name.trim().length < 3) 
    return toast.error("Name must be at least 3 characters");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) 
    return toast.error("Enter a valid email");

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobile || !mobileRegex.test(mobile)) 
    return toast.error("Enter a valid 10-digit mobile number");

  if (!editAgentId) { 
    if (!password || password.length < 6) 
      return toast.error("Password must be at least 6 characters");
  }

  //API CALL
  const url = editAgentId
    ? `${BACKEND}/api/admin/agents/${editAgentId}`
    : `${BACKEND}/api/admin/newagent`;
  const method = editAgentId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newAgent),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to save agent");

    toast.success(editAgentId ? "Agent updated ✅" : "Agent added ✅");
    setNewAgent({ name: "", email: "", mobile: "", password: "" });
    setEditAgentId(null);
    fetchAgents();
  } catch {
    toast.error("Network error while saving agent");
  }
  };

 
  // Edit agent 
  const editAgent = (agent) => {
    setEditAgentId(agent._id);
    setNewAgent({ name: agent.name, email: agent.email, mobile: agent.mobile, password: "" });
  };
 
  // Delete agent 
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
    } catch {
      toast.error("Network error while deleting agent");
    }
  };
 
  // CSV upload 
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }
    setFile(selectedFile);
  };

  const uploadCSV = async () => {
    if (!file) return toast.error("Please select a CSV file");
    setUploadingCSV(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
      {
          return toast.error(data.message || "Failed to upload CSV");
      } 
      toast.success("CSV uploaded & distributed ✅");
      setFile(null);
      fetchUploads();
    } catch {
      toast.error("Network error while uploading CSV");
    } finally {
      
      setUploadingCSV(false);
    }
  };
 
  // Delete lead 
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
 
  // Toggle lead status 
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
 
  // Logout 
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully ✅");
    navigate("/");
  };
 
  // Group uploads by agent 
  const uploadsByAgent = uploads.reduce((acc, item) => {
    const agentName = item.agent?.name || "Unassigned";
    if (!acc[agentName]) acc[agentName] = [];
    acc[agentName].push(item);
    return acc;
  }, {});
 
  // Download CSV for agent 
  const downloadCSV = (agentName, entries) => {
    const csvContent = [
      ["First Name", "Phone", "Email", "Notes", "Status"],
      ...entries.map((e) => [e.firstName, e.phone, e.email || "", e.notes || "", e.status]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${agentName}_leads.csv`;
    link.click();
  };
 
  // Filter & Sort 
  const filteredAgents = agents
    .filter((a) => a.name.toLowerCase().includes(searchAgent.toLowerCase()))
    .sort((a, b) => sortAgentAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const filteredUploadsByAgent = Object.fromEntries(
    Object.entries(uploadsByAgent).map(([agentName, entries]) => [
      agentName,
      entries.filter((l) => l.firstName.toLowerCase().includes(searchLead.toLowerCase())),
    ])
  );
 
  // JSX 
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

      {/* Main content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, Admin!</h1>

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

          {/* Search & Sort */}
          <div className="mt-6 flex justify-between items-center">
            <input type="text" placeholder="Search agents..." value={searchAgent} onChange={(e) => setSearchAgent(e.target.value)} className="p-2 border rounded" />
            <button onClick={() => setSortAgentAsc(!sortAgentAsc)} className="py-2 px-4 bg-gray-300 rounded">{sortAgentAsc ? "Sort Desc" : "Sort Asc"}</button>
          </div>

          {/* Agents List */}
          {loadingAgents ? <p className="mt-4">Loading agents...</p> :
          <ul className="space-y-2 mt-4">
            {filteredAgents.map(agent => (
              <li key={agent._id} className="p-2 border rounded flex justify-between items-center">
                <span>{agent.name} ({agent.email}) - {agent.mobile}</span>
                <div className="space-x-2">
                  <button onClick={() => editAgent(agent)} className="py-1 px-3 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={() => deleteAgent(agent._id)} className="py-1 px-3 bg-red-500 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>}
        </div>

        {/* CSV Upload & Leads */}
        <div id="uploads-section" className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload CSV & Manage Leads</h2>
          <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
          <button onClick={uploadCSV} className="py-2 px-4 bg-indigo-600 text-white rounded">{uploadingCSV ? "Uploading..." : "Upload CSV"}</button>

          <input type="text" placeholder="Search leads..." value={searchLead} onChange={(e) => setSearchLead(e.target.value)} className="mt-4 p-2 border rounded w-full" />

          <h3 className="text-lg font-semibold mt-6">Distributed Leads by Agent</h3>
          {loadingUploads ? <p className="text-gray-500 mt-2">Loading leads...</p> :
          Object.keys(filteredUploadsByAgent).length === 0 ? (
            <p className="text-gray-500 mt-2">No leads uploaded yet.</p>
          ) : (
            Object.entries(filteredUploadsByAgent).map(([agentName, entries]) => (
              <div key={agentName} className="mb-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{agentName}</h4>
                  <button onClick={() => downloadCSV(agentName, entries)} className="py-1 px-3 bg-green-500 text-white rounded">Download CSV</button>
                </div>
                <ul className="ml-4 mt-2 space-y-1">
                  {entries.map(entry => (
                    <li key={entry._id} className="p-2 border rounded flex justify-between items-center">
                      <div onClick={() => setLeadModal(entry)} className="cursor-pointer">
                        <strong>{entry.firstName}</strong> ({entry.phone}) - Status: 
                        <span className={`ml-2 px-2 py-1 rounded ${entry.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="space-x-2">
                        <button onClick={() => toggleStatus(entry._id, entry.status)} className="py-1 px-3 bg-blue-500 text-white rounded">Toggle Status</button>
                        <button onClick={() => deleteUpload(entry._id)} className="py-1 px-3 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <LeadModal lead={leadModal} onClose={() => setLeadModal(null)} />
      </div>
    </div>
  );
}
