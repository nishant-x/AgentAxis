// src/components/LoginForm.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Please fill all fields.");

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        toast.error(data.message || "Login failed ❌");
      } else {
        // Save user and token
        login(data.user, data.token);
        toast.success("Login successful ✅");

        // Redirect based on role
        if (data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (data.user.role === "agent") {
          navigate("/agent-dashboard");
        } else {
          navigate("/"); // fallback
        }
      }
    } catch (err) {
      setError("Network error — try again.");
      toast.error("Network error — try again ⚠️");
    } finally {
      setLoading(false);
    }
  };

  // Prefill functions
  const fillAdmin = () =>
    setForm({ email: "admin@example.com", password: "Admin@123" });

  const fillUser = () =>
    setForm({ email: "jhadenishant@gmail.com", password: "Nishant@123" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left: Brand / Illustration */}
        <div className="p-8 bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AgentAxis Login</h1>
            <p className="mt-2 text-sky-100">Agent management & list distribution</p>
          </div>

          <div className="mt-6">
            <p className="text-sm">Quick tips</p>
            <ul className="mt-3 text-sm space-y-2 list-disc ml-5 text-sky-100">
              <li>Use admin credentials to manage agents</li>
              <li>Upload CSV under "Lists" to distribute tasks</li>
              <li>JWT-secured APIs</li>
            </ul>
          </div>

          <div className="mt-6 text-xs text-sky-100/80"></div>
        </div>

        {/* Right: Form */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to access dashboard</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <label htmlFor="email" className="text-xs text-gray-600">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="text-xs text-gray-600">Password</label>
              <div className="mt-1 flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="px-3 border rounded-r-lg bg-gray-50 hover:bg-gray-100"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a className="text-indigo-600 hover:underline" href="#">
                Forgot password?
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={fillAdmin}
                className="w-full py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Prefill demo admin
              </button>

              <button
                type="button"
                onClick={fillUser}
                className="w-full py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Prefill demo user
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs text-gray-400">
            By signing in you agree to the project terms.
          </p>
        </div>
      </div>
    </div>
  );
}
