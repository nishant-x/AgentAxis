import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importing Routes
import LoginForm from './Components/LoginForm';
import AdminDashboard from './Admin/AdminDashboard';
import AgentDashboard from './Agent/AgentDashboard';
import SuperAdminDashboard from './SuperAdmin/SuperAdminDashboard';

export default function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
        <Route path="//superadmin-dashboard" element={<SuperAdminDashboard />} />
      </Routes>
    </Router>
  );
}
