// src/components/ChatPanel.jsx
"use client";

import { useState, useEffect, useRef } from "react";

const ChatPanel = ({ socket, roomId, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket) return;

    // Load previous messages
    socket.emit("fetch-messages", roomId);

    const handlePreviousMessages = (data) => {
      setMessages(data.messages || []);
      scrollToBottom();
    };

    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user.id) {
        setTypingUser(data.username);
        setTimeout(() => setTypingUser(""), 2000);
      }
    };

    socket.on("previous-messages", handlePreviousMessages);
    socket.on("chat-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);

    return () => {
      socket.off("previous-messages", handlePreviousMessages);
      socket.off("chat-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
    };
  }, [socket, roomId, user.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const msgData = {
      roomId,
      userId: user.id,
      username: user.name,
      message: message.trim(),
      timestamp: new Date(),
    };
    socket.emit("chat-message", msgData);
    setMessage("");
  };

  const handleTyping = () => {
    socket.emit("user-typing", { roomId, userId: user.id, username: user.name });
  };

  return (
    <div className="bg-card-bg border border-border rounded-lg flex flex-col h-[400px] p-4">
      <h3 className="font-semibold mb-3 text-foreground text-sm">💬 Chat</h3>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.userId === user.id ? "bg-primary/20 self-end" : "bg-border/50"
            }`}
          >
            <p className="font-semibold text-xs text-foreground mb-1">{msg.username}</p>
            <p className="text-gray-300 whitespace-pre-wrap break-words">{msg.message}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {typingUser && (
        <p className="text-xs text-gray-400 italic mb-1">{typingUser} is typing...</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleTyping}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
