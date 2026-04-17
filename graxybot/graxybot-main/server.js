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

// Enable parsing of JSON request bodies with a larger limit to handle images encoded in base64.
app.use(express.json({ limit: '15mb' }));

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
  const model = req.body.model || "gpt-5-mini";

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

// ElevenLabs Text-to-Speech Proxy Endpoint
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
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75
                }
            },
            // CHANGE: Request as ArrayBuffer instead of stream and remove decompress
            responseType: 'arraybuffer' // Get the full response as a binary buffer
        });

        // Set headers for audio playback
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send the entire audio buffer
        res.end(elevenLabsResponse.data); // This sends the binary data and closes the response

        console.log('ElevenLabs audio response sent to client successfully.');

    } catch (error) {
        // Axios errors for non-streaming responses contain error.response.data
        console.error('Error proxying ElevenLabs TTS request:', error.response?.data ? error.response.data.toString() : error.message);
        if (!res.headersSent) {
            // Check if error.response exists and has a data buffer
            if (error.response && error.response.data) {
                // Attempt to parse error message if it's JSON from ElevenLabs
                try {
                    const errorDetails = JSON.parse(error.response.data.toString('utf8'));
                    res.status(error.response.status || 500).json({
                        error: 'Failed to communicate with ElevenLabs API',
                        details: errorDetails.detail || errorDetails.message || 'Unknown error'
                    });
                } catch (parseError) {
                    // If not JSON, send raw error data
                    res.status(error.response.status || 500).send(error.response.data);
                }
            } else {
                res.status(error.response?.status || 500).json({
                    error: 'Failed to communicate with ElevenLabs API',
                    details: error.message
                });
            }
        } else {
            res.end();
        }
    }
});

async function evaluateAndOptimizeImagePrompt(prompt, apiKey) {
    const moderationUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const payload = {
        model: 'gpt-4.1-mini',
        messages: [
            {
                role: 'system',
                content: `You are Graxybot's safety filter and prompt polisher. Analyse the user's request for disallowed content (nudity, sexual content, minors, gore, hate, violence, self-harm, explicit body descriptions, sexual contexts, fetish content, or any other unsafe or policy-breaking material).
Return a JSON object with this exact structure:
{"status":"safe"|"unsafe","optimized_prompt":"string","response":"string"}
- If the prompt is unsafe, set status to "unsafe", leave optimized_prompt empty, and craft a short, laid-back, all-lowercase, lightly funny response in the "response" field explaining (without repeating the explicit request) why you're refusing, in Graxybot's informal tone. Keep it under 25 words.
- If the prompt is allowed, set status to "safe", produce an upgraded concise art-generation prompt in optimized_prompt (max 40 words, descriptive, no first-person language), and set response to an empty string.
Respond with JSON only.`
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 300
    };

    const moderationResponse = await axios.post(moderationUrl, payload, { headers });
    const content = moderationResponse.data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Invalid moderation response');
    }

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (err) {
        throw new Error('Failed to parse moderation response JSON');
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.status) {
        throw new Error('Moderation response missing required fields');
    }

    return parsed;
}

function formatMessagesForGemini(messages = []) {
    if (!Array.isArray(messages)) return { contents: [] };
    let systemInstruction = null;
    const contents = [];

    messages.forEach((msg) => {
        if (!msg || typeof msg !== 'object' || typeof msg.content !== 'string') {
            return;
        }
        const text = msg.content.trim();
        if (!text) return;

        if (msg.role === 'system') {
            if (!systemInstruction) {
                systemInstruction = { parts: [{ text }] };
            } else {
                // append additional system text
                systemInstruction.parts.push({ text });
            }
            return;
        }

        let role = 'user';
        if (msg.role === 'assistant' || msg.role === 'model') {
            role = 'model';
        }

        contents.push({
            role,
            parts: [{ text }]
        });
    });

    return { contents, systemInstruction };
}

// Gemini Image Generation Proxy Endpoint
app.post('/gemini/image', async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable not set on the server.');
        return res.status(500).json({ error: 'Server configuration error: Gemini API key is missing.' });
    }

    const prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
        return res.status(400).json({ error: 'No prompt provided for image generation.' });
    }

    try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        let finalPrompt = prompt;

        if (OPENAI_API_KEY) {
            try {
                const moderationResult = await evaluateAndOptimizeImagePrompt(prompt, OPENAI_API_KEY);
                if (moderationResult.status !== 'safe') {
                    const message = moderationResult.response || "whoa, let's keep it PG.";
                    return res.status(400).json({ error: 'unsafe_prompt', message });
                }
                finalPrompt = moderationResult.optimized_prompt || prompt;
            } catch (modErr) {
                console.warn('Prompt moderation failed, proceeding with original prompt:', modErr.message);
            }
        } else {
            console.warn('OPENAI_API_KEY not set; skipping prompt moderation for image generation.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`;
        const referenceImage = req.body.referenceImage;
        const parts = [];

        if (referenceImage && referenceImage.data) {
            parts.push({
                inlineData: {
                    data: referenceImage.data,
                    mimeType: referenceImage.mimeType || 'image/png'
                }
            });
        }

        parts.push({
            text: finalPrompt
        });

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts
                }
            ],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT']
            }
        };

        const geminiResponse = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const candidates = geminiResponse.data?.candidates || [];
        const responseParts = candidates[0]?.content?.parts || [];
        const inlinePart = responseParts.find((part) => part.inlineData && part.inlineData.data);

        if (!inlinePart) {
            console.error('Gemini image response missing inline data:', geminiResponse.data);
            return res.status(502).json({
                error: 'Gemini did not return image data.',
                details: geminiResponse.data
            });
        }

        const { data, mimeType } = inlinePart.inlineData;
        return res.json({
            image: data,
            mimeType: mimeType || 'image/png'
        });
    } catch (error) {
        const details = error.response?.data || error.message;
        console.error('Error proxying Gemini image request:', details);
        const status = error.response?.status || 500;
        return res.status(status).json({
            error: 'Failed to communicate with Gemini image API',
            details
        });
    }
});

// Gemini Chat Proxy Endpoint (nano banana)
app.post('/gemini/chat', async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable not set on the server.');
        return res.status(500).json({ error: 'Server configuration error: Gemini API key is missing.' });
    }

    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'No messages provided for Gemini chat.' });
    }

    const { contents, systemInstruction } = formatMessagesForGemini(messages);
    if (contents.length === 0) {
        return res.status(400).json({ error: 'No valid messages to send to Gemini.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
        contents
    };
    if (systemInstruction) {
        payload.systemInstruction = systemInstruction;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const geminiResponse = await axios.post(url, payload);
        const candidates = geminiResponse.data?.candidates || [];
        const primaryCandidate = candidates[0];
        const parts = primaryCandidate?.content?.parts || [];
        const text = parts
            .map((part) => {
                if (typeof part.text === 'string') return part.text;
                return '';
            })
            .join('');

        const eventPayload = {
            choices: [
                {
                    delta: {
                        content: text
                    }
                }
            ]
        };
        res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        console.error('Error proxying Gemini chat request:', details);
        if (!res.headersSent) {
            res.status(status).json({
                error: 'Failed to communicate with Gemini chat API',
                details
            });
        } else {
            res.write(
                `data: ${JSON.stringify({
                    error: 'Failed to communicate with Gemini chat API',
                    details
                })}\n\n`
            );
            res.write('data: [DONE]\n\n');
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
