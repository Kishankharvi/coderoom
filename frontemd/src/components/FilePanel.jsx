"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const FilePanel = ({ roomId, user, socket }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()

    if (socket) {
      socket.on("new-file", (data) => {
        setFiles((prev) => [data.file, ...prev])
      })

      socket.on("file-removed", (data) => {
        setFiles((prev) => prev.filter((f) => f._id !== data.fileId))
      })
    }

    return () => {
      if (socket) {
        socket.off("new-file")
        socket.off("file-removed")
      }
    }
  }, [roomId, socket])

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`/api/files/room/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setFiles(response.data)
    } catch (error) {
      console.error("Failed to fetch files:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const fileData = event.target.result.split(",")[1]

        const response = await axios.post(
          "/api/files/upload",
          {
            filename: file.name,
            mimeType: file.type,
            fileData,
            room: roomId,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          },
        )

        setFiles([response.data.file, ...files])

        if (socket) {
          socket.emit("file-uploaded", roomId, response.data.file._id)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (fileId, fileName) => {
    window.location.href = `/api/files/download/${fileId}`
  }

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      setFiles(files.filter((f) => f._id !== fileId))

      if (socket) {
        socket.emit("file-deleted", roomId, fileId)
      }
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <h3 className="font-semibold mb-4 text-foreground">📁 Shared Files</h3>

      <div className="mb-4">
        <label className="flex items-center justify-center px-4 py-2 rounded bg-primary/20 border-2 border-dashed border-primary text-primary cursor-pointer hover:bg-primary/30 transition">
          <span className="text-sm font-semibold">{uploading ? "Uploading..." : "+ Upload File"}</span>
          <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No files yet</p>
        ) : (
          files.map((file) => (
            <div key={file._id} className="p-3 rounded bg-border/50 hover:bg-border transition">
              <div className="flex items-start gap-3">
                <span className="text-xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)} • {file.uploader?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(file.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleDownload(file._id, file.originalName)}
                  className="flex-1 px-2 py-1 rounded text-xs bg-primary/20 text-primary hover:bg-primary/30 transition font-semibold"
                >
                  Download
                </button>

                {file.uploader._id === user.id && (
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="px-2 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition font-semibold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FilePanel
