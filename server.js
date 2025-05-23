const express = require('express');
const path = require('path');
const cors = require('cors'); // Import the cors middleware
const axios = require('axios'); // For making HTTP requests to OpenAI and ElevenLabs
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

// OpenAI Chat Proxy Endpoint
// This endpoint receives requests from your frontend, adds the API key,
// and forwards them to OpenAI, then streams the response back.
app.post('/openai/chat', async (req, res) => {
  // Get the OpenAI API Key from Render's environment variables.
  // This is secure as it's never exposed in client-side code.
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  // Get the model from the request body, or default to gpt-4.1-mini
  const model = req.body.model || "gpt-4.1-mini";

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
      model: model, // Use the dynamically selected model
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

// NEW: ElevenLabs Text-to-Speech Proxy Endpoint
app.post('/elevenlabs-tts', async (req, res) => {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    // Default voice ID for ElevenLabs. You can change this to any voice ID you prefer.
    // Find voice IDs in your ElevenLabs dashboard or API documentation.
    const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default to 'Rachel'

    if (!ELEVENLABS_API_KEY) {
        console.error('Error: ELEVENLABS_API_KEY environment variable not set on the server.');
        return res.status(500).json({ error: 'Server configuration error: ElevenLabs API key is missing.' });
    }

    const textToSpeak = req.body.text;

    if (!textToSpeak) {
        return res.status(400).json({ error: 'No text provided for ElevenLabs TTS.' });
    }

    try {
        const elevenLabsResponse = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
            headers: {
                'Accept': 'audio/mpeg', // Request MP3 audio
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            data: {
                text: textToSpeak,
                model_id: "eleven_multilingual_v2", // Or "eleven_monolingual_v1" depending on your needs
                voice_settings: {
                    stability: 0.75, // Adjust for more stable or varied output
                    similarity_boost: 0.75 // Adjust for more or less similarity to the original voice
                }
            },
            responseType: 'stream', // Crucial for streaming audio directly
            decompress: true // ADDED: Tell axios to decompress the response automatically
        });

        // Set headers for audio playback
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the audio stream directly to the client
        elevenLabsResponse.data.pipe(res);

        elevenLabsResponse.data.on('end', () => {
            console.log('ElevenLabs audio stream to client ended successfully.');
        });

        elevenLabsResponse.data.on('error', (err) => {
            console.error('Error during ElevenLabs audio stream to client:', err);
            if (!res.headersSent) {
                res.status(500).send('Error streaming audio from ElevenLabs.');
            } else {
                res.end();
            }
        });

    } catch (error) {
        console.error('Error proxying ElevenLabs TTS request:', error.response?.data || error.message);
        if (!res.headersSent) {
            res.status(error.response?.status || 500).json({
                error: 'Failed to communicate with ElevenLabs API',
                details: error.response?.data || error.message
            });
        } else {
            res.end();
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
