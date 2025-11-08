"use client"
import { useNavigate } from "react-router-dom"

const Sidebar = ({ showChat, setShowChat, showFiles, setShowFiles }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (
    <div className="w-20 bg-card-bg border-r border-border flex flex-col items-center py-6 gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
        CR
      </div>

      <button
        onClick={() => setShowChat(!showChat)}
        title="Chat"
        className="w-12 h-12 rounded-lg bg-border hover:bg-primary transition flex items-center justify-center text-xl"
      >
        💬
      </button>

      <button
        onClick={() => setShowFiles(!showFiles)}
        title="Files"
        className="w-12 h-12 rounded-lg bg-border hover:bg-primary transition flex items-center justify-center text-xl"
      >
        📁
      </button>

      <div className="flex-1"></div>

      <button
        onClick={handleLogout}
        title="Logout"
        className="w-12 h-12 rounded-lg bg-border hover:bg-red-600 transition flex items-center justify-center text-xl"
      >
        🚪
      </button>
    </div>
  )
}

export default Sidebar
