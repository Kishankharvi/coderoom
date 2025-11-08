"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import Editor from "@monaco-editor/react"
import Sidebar from "../components/Sidebar"
import ParticipantsList from "../components/ParticipantsList"
import ChatPanel from "../components/ChatPanel"
import FilePanel from "../components/FilePanel"
import OutputPanel from "../components/OutputPanel"
import FeedbackPanel from "../components/FeedbackPanel"

const CodeEditor = ({ user }) => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const editorRef = useRef(null)

  const [code, setCode] = useState("// Start coding here...")
  const [language, setLanguage] = useState("javascript")
  const [mode, setMode] = useState("teaching")
  const [participants, setParticipants] = useState([])
  const [mentor, setMentor] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const [showOutput, setShowOutput] = useState(true)
  const [isModeToggling, setIsModeToggling] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [modeMessage, setModeMessage] = useState("")

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    })

    socketRef.current.emit("join-room", roomId, user.id)

    socketRef.current.on("room-data", (data) => {
      setCode(data.code)
      setLanguage(data.language)
      setMode(data.mode)
      setParticipants(data.participants)
      setMentor(data.mentor)
      setCanEdit(data.canEdit)
      setUserRole(data.userRole)
    })

    socketRef.current.on("code-update", (data) => {
      setCode(data.code)
      setLanguage(data.language)
    })

    socketRef.current.on("mode-changed", (data) => {
      setMode(data.mode)
      setModeMessage(data.message)
      setIsModeToggling(false)
      setTimeout(() => setModeMessage(""), 3000)
    })

    socketRef.current.on("user-joined", (data) => {
      setParticipants(data.participants)
    })

    socketRef.current.on("user-left", (data) => {
      setParticipants(data.participants)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", roomId, user.id)
        socketRef.current.disconnect()
      }
    }
  }, [roomId, user.id])

  const handleEditorChange = (newCode) => {
    if (!canEdit) {
      alert(`You cannot edit in ${mode} mode as a student.`)
      return
    }
    setCode(newCode)
    socketRef.current.emit("code-change", roomId, user.id, newCode, language)
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    socketRef.current.emit("code-change", roomId, user.id, code, newLanguage)
  }

  const handleModeToggle = () => {
    if (userRole !== "mentor") return
    setIsModeToggling(true)
    const newMode = mode === "teaching" ? "interview" : "teaching"
    socketRef.current.emit("toggle-mode", roomId, user.id, newMode)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar showChat={showChat} setShowChat={setShowChat} showFiles={showFiles} setShowFiles={setShowFiles} />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-bg">
          <div>
            <h1 className="text-xl font-bold text-foreground">CodeRoom</h1>
            <p className="text-sm text-gray-400">Room: {roomId}</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 rounded bg-border text-foreground border border-border text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
            </select>

            {userRole === "mentor" && (
              <button
                onClick={handleModeToggle}
                disabled={isModeToggling}
                className="px-4 py-2 rounded font-semibold transition bg-primary text-white text-sm"
              >
                {mode === "teaching" ? "Teaching" : "Interview"}
              </button>
            )}
          </div>
        </div>

        {modeMessage && (
          <div className="px-6 py-3 bg-primary/20 border-b border-primary text-primary font-semibold text-sm">
            {modeMessage}
          </div>
        )}

        <div className="flex-1 flex gap-4 p-4">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 rounded border border-border bg-card-bg overflow-hidden">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor
                }}
                options={{
                  readOnly: !canEdit,
                  theme: "vs-dark",
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </div>

            {showOutput && <OutputPanel code={code} language={language} socket={socketRef.current} roomId={roomId} />}
          </div>

          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            <ParticipantsList participants={participants} mentor={mentor} userRole={userRole} />

            {userRole === "mentor" && <FeedbackPanel socket={socketRef.current} roomId={roomId} user={user} />}

            {showFiles && <FilePanel roomId={roomId} user={user} socket={socketRef.current} />}

            {showChat && <ChatPanel roomId={roomId} socket={socketRef.current} user={user} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
