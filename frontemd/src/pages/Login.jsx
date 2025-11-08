"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"

const Login = ({ setUser }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password })
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      setUser(response.data.user)
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
   <div className="min-h-screen bg-background flex items-center justify-center px-4">
  <div className="w-full max-w-md bg-card-bg border border-border rounded-2xl shadow-xl p-8 sm:p-10">
    <h1 className="text-4xl font-extrabold text-center text-foreground mb-2 tracking-tight">
      CodeRoom
    </h1>
    <p className="text-muted text-center mb-10 text-sm">
      Collaborative Code Editor for Teaching & Interviews
    </p>

    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger text-danger text-sm font-medium text-center">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-muted mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-lg bg-surface text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-lg bg-surface text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>

    <p className="text-center text-muted mt-6 text-sm">
      Don’t have an account?{" "}
      <Link to="/register" className="text-primary hover:text-primary-hover font-medium">
        Register here
      </Link>
    </p>
  </div>
</div>

  )
}

export default Login
