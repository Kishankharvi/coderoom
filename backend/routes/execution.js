// routes/execution.js
import express from "express";
import axios from "axios";
import { verifyToken } from "./auth.js";

const router = express.Router();
const PISTON_API = "https://emkc.org/api/v2/piston";

/**
 * @route   POST /api/execute/execute
 * @desc    Execute user code using the Piston API
 * @access  Private
 */
router.post("/execute", verifyToken, async (req, res) => {
  try {
    const { code, language, input = "", roomId } = req.body;
    if (!code || !language) return res.status(400).json({ error: "Code and language are required" });

    // Map to valid Piston runtime names
    const languageMap = {
      javascript: "javascript",
      python: "python3",
      java: "java",
      cpp: "cpp",
      c: "c",
      php: "php",
      ruby: "ruby",
      go: "go",
      rust: "rust",
    };

    const pistonLanguage = languageMap[language.toLowerCase()];
    if (!pistonLanguage) return res.status(400).json({ error: `Unsupported language: ${language}` });

    const startTime = Date.now();

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
    });

    const executionTime = Date.now() - startTime;

    const output = {
      stdout: response.data.run?.stdout || "",
      stderr: response.data.run?.stderr || response.data.compile?.stderr || "",
      exitCode: response.data.run?.code || 0,
      language,
      executionTime,
      timestamp: new Date(),
    };

    res.json(output);
  } catch (error) {
    res.status(500).json({
      error: "Code execution failed",
      stdout: "",
      stderr: error.message,
      exitCode: 1,
    });
  }
});

/**
 * @route   GET /api/execute/languages
 * @desc    Retrieve all supported languages from Piston API
 * @access  Public
 */
router.get("/languages", async (req, res) => {
  try {
    const response = await axios.get(`${PISTON_API}/runtimes`);
    const languages = response.data.map((runtime) => ({
      name: runtime.language,
      version: runtime.version,
    }));
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch languages" });
  }
});

// Helper function for file extensions
function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python3: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    php: "php",
    ruby: "rb",
    go: "go",
    rust: "rs",
  };
  return extensions[language] || "txt";
}

export default router;
