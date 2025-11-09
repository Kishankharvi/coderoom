// src/pages/EnhancedCodeEditor.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

import Sidebar from "../components/Sidebar";
import ParticipantsList from "../components/ParticipantsList";
import ChatPanel from "../components/ChatPanel";
import FilePanel from "../components/FilePanel";
import FeedbackPanel from "../components/FeedbackPanel";
import EnhancedOutputPanel from "../components/EnhancedOutputPanel";
import ComplexityPanel from "../components/ComplexityPanel";
import TestCasesPanel from "../components/TestCasesPanel";
import ProblemStatement from "../components/ProblemStatement";

const EnhancedCodeEditor = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  const [code, setCode] = useState("// Start coding here...");
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState("teaching");
  const [participants, setParticipants] = useState([]);
  const [owner, setOwner] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [modeMessage, setModeMessage] = useState("");
  const [activeTab, setActiveTab] = useState("output"); // output, complexity, tests, problem
  const [problemData, setProblemData] = useState(null);
  const [testCases, setTestCases] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // join room
    socket.emit("join-room", roomId, user.id);

    const onRoomData = (data) => {
      setCode(data.code ?? "");
      setLanguage(data.language ?? "javascript");
      setMode(data.mode ?? "teaching");
      setParticipants(data.participants ?? []);
      setOwner(data.owner ?? null);
      setCanEdit(Boolean(data.canEdit));
      setUserRole(data.userRole ?? null);

      // problem metadata
      setProblemData({
        title: data.problemTitle ?? "",
        description: data.problemDescription ?? "",
        constraints: data.constraints ?? "",
        examples: data.examples ?? "",
        timeComplexity: data.timeComplexity ?? "",
        spaceComplexity: data.spaceComplexity ?? "",
      });

      setTestCases(data.testCases ?? []);
    };

    socket.on("room-data", onRoomData);

    socket.on("code-update", (d) => {
      setCode(d.code ?? "");
      setLanguage(d.language ?? language);
    });

    socket.on("mode-changed", (d) => {
      setMode(d.mode ?? mode);
      setModeMessage(d.message ?? "");
      setTimeout(() => setModeMessage(""), 3000);
    });

    socket.on("user-joined", (d) => setParticipants(d.participants ?? []));
    socket.on("user-left", (d) => setParticipants(d.participants ?? []));

    // safe cleanup
    return () => {
      socket.emit("leave-room", roomId, user.id);
      socket.off("room-data", onRoomData);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  const handleEditorChange = (newCode) => {
    if (!canEdit) {
      alert(`You cannot edit in ${mode} mode`);
      return;
    }
    setCode(newCode);
    socketRef.current?.emit("code-change", roomId, user.id, newCode, language);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    socketRef.current?.emit("code-change", roomId, user.id, code, newLanguage);
  };

  const handleModeToggle = () => {
    // owner toggles mode
    const isOwner = owner?._id === user?.id || userRole === "owner";
    if (!isOwner) return;
    const newMode = mode === "teaching" ? "interview" : "teaching";
    socketRef.current?.emit("toggle-mode", roomId, user.id, newMode);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar showChat={showChat} setShowChat={setShowChat} showFiles={showFiles} setShowFiles={setShowFiles} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-bg">
          <div>
            <h1 className="text-xl font-bold">LeetCode-Style Playground</h1>
            <p className="text-xs text-gray-400">
              Room: {roomId} • Mode: {mode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 rounded bg-border text-foreground border border-border text-sm font-mono"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            {(owner?._id === user?.id || userRole === "owner") && (
              <button onClick={handleModeToggle} className="px-4 py-2 rounded font-semibold transition bg-primary text-white text-sm">
                {mode === "teaching" ? "Teaching" : "Interview"}
              </button>
            )}
          </div>
        </div>

        {modeMessage && (
          <div className="px-6 py-2 bg-blue-500/10 border-b border-blue-500/30 text-blue-300 font-semibold text-sm">
            {modeMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 rounded border border-border bg-card-bg overflow-hidden">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={{
                  readOnly: !canEdit,
                  theme: "vs-dark",
                  minimap: { enabled: true },
                  fontSize: 13,
                  lineNumbers: "on",
                  formatOnPaste: true,
                }}
              />
            </div>
          </div>

          {/* Right Panel - Tabbed Interface */}
          <div className="w-96 flex flex-col min-w-0">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-2 bg-card-bg border border-border rounded p-1">
              <button
                onClick={() => setActiveTab("problem")}
                className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === "problem" ? "bg-primary text-white" : "bg-border text-gray-400 hover:text-foreground"
                }`}
              >
                Problem
              </button>
              <button
                onClick={() => setActiveTab("output")}
                className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === "output" ? "bg-primary text-white" : "bg-border text-gray-400 hover:text-foreground"
                }`}
              >
                Output
              </button>
              <button
                onClick={() => setActiveTab("complexity")}
                className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === "complexity" ? "bg-primary text-white" : "bg-border text-gray-400 hover:text-foreground"
                }`}
              >
                Complexity
              </button>
              <button
                onClick={() => setActiveTab("tests")}
                className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === "tests" ? "bg-primary text-white" : "bg-border text-gray-400 hover:text-foreground"
                }`}
              >
                Tests
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "problem" && <ProblemStatement problem={problemData} />}
              {activeTab === "output" && <EnhancedOutputPanel code={code} language={language} socket={socketRef.current} roomId={roomId} />}
              {activeTab === "complexity" && <ComplexityPanel code={code} language={language} />}
              {activeTab === "tests" && <TestCasesPanel testCases={testCases} />}
            </div>

            {/* Participants List Below Tabs */}
            <div className="mt-3 border-t border-border pt-3">
              <ParticipantsList participants={participants} owner={owner} userRole={userRole} />
            </div>

            {/* Chat and Files */}
            {showChat && <ChatPanel roomId={roomId} socket={socketRef.current} user={user} />}
            {userRole === "owner" && <FeedbackPanel socket={socketRef.current} roomId={roomId} user={user} />}
            {showFiles && <FilePanel roomId={roomId} user={user} socket={socketRef.current} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCodeEditor;
