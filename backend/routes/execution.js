import express from "express"
import axios from "axios"
import { verifyToken } from "./auth.js"

const router = express.Router()
const PISTON_API = "https://emkc.org/api/v2/piston"

// Execute code
router.post("/execute", verifyToken, async (req, res) => {
  try {
    const { code, language, input = "" } = req.body

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language required" })
    }

    // Map language names to Piston language identifiers
    const languageMap = {
      javascript: "javascript",
      python: "python3",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      php: "php",
      ruby: "ruby",
      go: "go",
      rust: "rust",
    }

    const pistonLanguage = languageMap[language.toLowerCase()]

    if (!pistonLanguage) {
      return res.status(400).json({ error: `Language ${language} is not supported` })
    }

    // Execute code via Piston API
    const response = await axios.post(`${PISTON_API}/execute`, {
      language: pistonLanguage,
      version: "*",
      files: [
        {
          name: `main.${getFileExtension(pistonLanguage)}`,
          content: code,
        },
      ],
      stdin: input,
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    })

    const output = {
      stdout: response.data.run?.stdout || "",
      stderr: response.data.run?.stderr || response.data.compile?.stderr || "",
      exitCode: response.data.run?.code || 0,
      language: language,
      executionTime: response.data.run?.signal || 0,
    }

    res.json(output)
  } catch (error) {
    console.error("Execution error:", error.message)
    res.status(500).json({
      error: "Code execution failed",
      stdout: "",
      stderr: error.message,
      exitCode: 1,
    })
  }
})

// Get supported languages
router.get("/languages", async (req, res) => {
  try {
    const response = await axios.get(`${PISTON_API}/runtimes`)
    const languages = response.data.map((runtime) => ({
      name: runtime.language,
      version: runtime.version,
    }))
    res.json(languages)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch languages" })
  }
})

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python3: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    html: "html",
    css: "css",
    php: "php",
    ruby: "rb",
    go: "go",
    rust: "rs",
  }
  return extensions[language] || "txt"
}

export default router
