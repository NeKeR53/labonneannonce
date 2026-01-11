import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/generate', async (req, res) => {
  try {
    const { model, data } = req.body;

    if (!API_KEY) {
      return res.status(500).json({ 
        error: { 
          message: "API Key not configured on server",
          status: 500 
        } 
      });
    }

    if (!model) {
      return res.status(400).json({
        error: {
          message: "Model name is required",
          status: 400
        }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', responseData);
      return res.status(response.status).json(responseData);
    }

    res.json(responseData);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: {
        message: error.message || "Internal Server Error",
        status: 500
      }
    });
  }
});

// Handle React routing, return all requests to React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
