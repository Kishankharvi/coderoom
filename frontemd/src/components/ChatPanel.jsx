"use client"

import { useState, useEffect, useRef } from "react"

const ChatPanel = ({ roomId, socket, user }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState(new Set())
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!socket) return

    socket.on("chat-history", (history) => {
      setMessages(history)
    })

    socket.on("new-message", (message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on("feedback-added", (feedback) => {
      setMessages((prev) => [...prev, feedback])
    })

    socket.on("typing-indicator", (data) => {
      setTypingUsers((prev) => new Set([...prev, data.userId]))
    })

    socket.on("typing-stopped", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    })

    return () => {
      socket.off("chat-history")
      socket.off("new-message")
      socket.off("feedback-added")
      socket.off("typing-indicator")
      socket.off("typing-stopped")
    }
  }, [socket])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("send-message", roomId, user.id, newMessage)
      setNewMessage("")
      socket.emit("stop-typing", roomId, user.id)
    }
  }

  const handleTyping = () => {
    socket.emit("user-typing", roomId, user.id)
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-96">
      <h3 className="font-semibold mb-4 text-foreground">Chat</h3>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`p-2 rounded ${
                msg.type === "feedback"
                  ? "bg-amber-600/20 border border-amber-600/50"
                  : msg.userId === user.id
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-border/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-white">
                  {getInitials(msg.userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {msg.userName}
                    {msg.type === "feedback" && <span className="ml-2 text-amber-400">Feedback</span>}
                  </p>
                  {msg.line && <p className="text-xs text-gray-400">Line {msg.line}</p>}
                  <p className="text-sm text-gray-300 break-words">
                    {msg.type === "feedback" ? msg.feedback : msg.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {typingUsers.size > 0 && (
          <div className="text-xs text-gray-500 italic">{Array.from(typingUsers).join(", ")} is typing...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value)
            handleTyping()
          }}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
        />
        <button
          onClick={handleSendMessage}
          className="px-3 py-2 rounded bg-primary text-white hover:bg-primary-light transition font-semibold text-sm"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatPanel
