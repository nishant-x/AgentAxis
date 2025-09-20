import React, { useEffect, useState } from "react";
import axios from "axios";
import { LogOut } from "lucide-react";

// Modal to show lead details
function LeadModal({ lead, onClose }) {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">Lead Details</h2>
        <p><strong>Name:</strong> {lead.firstName}</p>
        <p><strong>Phone:</strong> {lead.phone}</p>
        <p><strong>Email:</strong> {lead.email || "-"}</p>
        <p><strong>Address:</strong> {lead.address || "-"}</p>
        <p><strong>Notes:</strong> {lead.notes || "-"}</p>
        <p><strong>Status:</strong> {lead.status}</p>
        <button onClick={onClose} className="mt-4 py-2 px-4 bg-red-500 text-white rounded">Close</button>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const [leads, setLeads] = useState([]);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(5);
  const [selectedLead, setSelectedLead] = useState(null);

  const token = localStorage.getItem("token");
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/agents/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentName(res.data.agent);
        setLeads(res.data.leads);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await axios.patch(
        `${BACKEND}/api/agents/lead/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads((prev) => prev.map((l) => (l._id === id ? res.data.lead : l)));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // ====================== Filter, Search & Sort ======================
  const filteredLeads = leads
    .filter((l) => {
      const matchesSearch =
        l.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        l.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ? true : l.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) =>
      sortAsc
        ? a.firstName?.localeCompare(b.firstName)
        : b.firstName?.localeCompare(a.firstName)
    );

  // ====================== Pagination ======================
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  // ====================== CSV Export ======================
  const downloadCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Name", "Phone", "Email", "Address", "Notes", "Status"];
    const rows = leads.map((l) => [
      l.firstName || "-",
      l.phone || "-",
      l.email || "-",
      l.address || "-",
      l.notes || "-",
      l.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "my_leads.csv";
    link.click();
  };

  if (loading)
    return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-600 to-purple-600 text-white p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8">AgentAxis</h2>
          <nav className="flex flex-col gap-3">
            <button className="py-2 px-4 bg-white/20 rounded text-left">Dashboard</button>
            <button className="py-2 px-4 bg-white/20 rounded text-left">My Leads</button>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 py-2 px-4 bg-red-500 rounded hover:bg-red-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {agentName}</h1>
          <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            Agent Dashboard
          </span>
        </div>

        {/* Search, Filter & Sort */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 py-2 bg-gray-300 rounded"
          >
            Sort {sortAsc ? "Desc" : "Asc"}
          </button>
          <button
            onClick={downloadCSV}
            className="px-3 py-2 bg-green-500 text-white rounded"
          >
            Download CSV
          </button>
        </div>

        {/* Leads Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Assigned Leads</h2>
          {currentLeads.length === 0 ? (
            <p className="text-gray-500">No leads assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">#</th>
                    <th className="border p-3 text-left">Name</th>
                    <th className="border p-3 text-left">Phone</th>
                    <th className="border p-3 text-left">Email</th>
                    <th className="border p-3 text-left">Address</th>
                    <th className="border p-3 text-left">Notes</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeads.map((lead, i) => (
                    <tr key={lead._id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="border p-3">{indexOfFirstLead + i + 1}</td>
                      <td onClick={() => setSelectedLead(lead)} className="border p-3">{lead.firstName || "-"}</td>
                      <td className="border p-3">{lead.phone || "-"}</td>
                      <td className="border p-3">{lead.email || "-"}</td>
                      <td className="border p-3">{lead.address || "-"}</td>
                      <td className="border p-3">{lead.notes || "-"}</td>
                      <td className="border p-3">{lead.status}</td>
                      <td className="border p-3 space-x-2">
                        <button
                          onClick={() => handleStatusChange(lead._id, "active")}
                          className={`py-1 px-3 rounded text-white ${
                            lead.status === "active" ? "bg-green-700" : "bg-green-500"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead._id, "inactive")}
                          className={`py-1 px-3 rounded text-white ${
                            lead.status === "inactive" ? "bg-gray-700" : "bg-gray-500"
                          }`}
                        >
                          Inactive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      </div>
    </div>
  );
}
