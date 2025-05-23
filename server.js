// server.js
const express = require('express');
const path = require('path');
const cors = require('cors'); // Import the cors middleware
const axios = require('axios'); // For making HTTP requests to OpenAI
// require('dotenv').config(); // Only needed for local development, Render handles env vars automatically.

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins. In a production environment, you might want to restrict this
// to only your frontend's domain for enhanced security.
app.use(cors());

// Enable parsing of JSON request bodies. This is crucial for receiving messages from your frontend.
app.use(express.json());

// Serve static files from the current directory. This will serve your graxybot.html
// and any other static assets (like graxybot.png, CSS, etc.)
app.use(express.static(path.join(__dirname)));

// Route to explicitly serve your main HTML file.
// If your HTML file is named 'index.html', Express's static middleware handles it automatically.
// If it's 'graxybot.html', this route ensures it's served when someone accesses the root URL.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'graxybot.html'));
});

// NEW: OpenAI Chat Proxy Endpoint
// This endpoint receives requests from your frontend, adds the API key,
// and forwards them to OpenAI, then streams the response back.
app.post('/openai/chat', async (req, res) => {
  // Get the OpenAI API Key from Render's environment variables.
  // This is secure as it's never exposed in client-side code.
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  // You can also define the model here, or pass it from the frontend if you need flexibility.
  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  // Basic validation to ensure the API key is set
  if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set on the server.');
    return res.status(500).json({ error: 'Server configuration error: OpenAI API key is missing.' });
  }

  try {
    // Extract messages from the frontend's request body
    const messages = req.body.messages;

    // Validate that messages were provided
    if (!messages) {
      return res.status(400).json({ error: 'No messages provided in the request body for OpenAI chat.' });
    }

    // Prepare headers for the request to the actual OpenAI API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}` // Use the securely accessed API key
    };

    // Prepare the payload for the OpenAI API
    const payload = {
      model: OPENAI_MODEL,
      messages: messages,
      stream: true // Enable streaming from OpenAI to pipe directly back to the client
    };

    // Make the streaming request to OpenAI using axios
    const openaiResponse = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      data: payload,
      headers: headers,
      responseType: 'stream' // Crucial for handling the response as a stream
    });

    // Set appropriate headers for the client to receive a server-sent event (SSE) stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the raw stream data from OpenAI directly to the client's response.
    // This is efficient as the server doesn't buffer the entire response.
    openaiResponse.data.pipe(res);

    // Log when the OpenAI stream ends or encounters an error
    openaiResponse.data.on('end', () => {
      console.log('OpenAI stream to client ended successfully.');
    });

    openaiResponse.data.on('error', (err) => {
      console.error('Error during OpenAI stream to client:', err);
      // If headers haven't been sent, send an error status. Otherwise, just end the response.
      if (!res.headersSent) {
          res.status(500).send('Error streaming response from OpenAI.');
      } else {
          res.end(); // Close the connection gracefully
      }
    });

  } catch (error) {
    // Handle errors from axios (e.g., network issues, OpenAI API errors)
    console.error('Error proxying OpenAI request:', error.response?.data || error.message);
    if (!res.headersSent) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to communicate with OpenAI API',
            details: error.response?.data || error.message
        });
    } else {
        res.end(); // Close the connection gracefully
    }
  }
});


// 404 handler for any other requests that don't match defined routes
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

// Start the Express server on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
