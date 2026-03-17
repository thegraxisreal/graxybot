const { chromium } = require('playwright');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SYSTEM_PROMPT = require('./system_prompt');

class DeltaMathController {
    constructor(io) {
        this.io = io;
        this.browser = null;
        this.context = null;
        this.activePage = null; // Track the currently focused page/popup
        this.page = null; // The main original page
        this.isRunning = false;
        this.isAgentActive = false;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.viewport = { width: 1024, height: 640 };
        this.creds = null;
        this.lastAssistantMessage = null;
    }

    async startAgent(creds = {}) {
        if (this.isAgentActive) return;
        this.isAgentActive = true;
        this.creds = creds;
        this.lastAssistantMessage = null;

        console.log("🚀 Launching Agent Browser...");
        this.browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox']
        });

        this.context = await this.browser.newContext({ viewport: this.viewport });

        // Listen for new popups (like Google Login)
        this.context.on('page', async (newPage) => {
            console.log("⚠️ New Popup Window Detected! Switching focus...");
            await newPage.waitForLoadState('domcontentloaded');
            this.activePage = newPage;
            try { await newPage.bringToFront(); } catch(e){}
        });

        this.page = await this.context.newPage();
        this.activePage = this.page; // Start with main page active

        this.startStream();

        try {
            console.log("🌐 Navigating to DeltaMath...");
            await this.page.goto('https://www.deltamath.com/');
            this.io.emit('status', 'Browser ready — log in, then hand off to Graxybot');
            console.log("⏳ Waiting for user to log in...");

        } catch (e) {
            console.error("Navigation Error:", e);
        }
    }

    async stopAgent() {
        this.isRunning = false;
        this.isAgentActive = false;
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.activePage = null;
            this.context = null;
        }
        console.log("🛑 Agent Stopped.");
    }

    async pauseAgent() {
        this.isRunning = false;
        console.log("⏸️ Agent Paused (AI Loop Stopped)");
        this.io.emit('agent-thought', "AI Paused by User.");
    }

    async handleUserClick(x, y) {
        if (!this.activePage) return;
        try {
            await this.activePage.mouse.click(x, y);
        } catch (e) {
            console.error("Click error:", e);
        }
    }

    async handleUserType(text) {
        if (!this.activePage) return;
        try {
            await this.activePage.keyboard.type(text);
        } catch (e) {
            console.error("Type error:", e);
        }
    }

    async handleUserKey(key) {
        if (!this.activePage) return;
        try {
            await this.activePage.keyboard.press(key);
        } catch (e) {
            console.error("Keypress error:", e);
        }
    }

    async startStream() {
        const streamLoop = async () => {
            if (!this.isAgentActive || !this.activePage) return;
            try {
                if (this.activePage.isClosed()) {
                    console.log("Active page closed, reverting to main page.");
                    this.activePage = this.page;
                }

                const buffer = await this.activePage.screenshot({ type: 'jpeg', quality: 50, scale: "css" });
                this.io.emit('agent-frame', buffer.toString('base64'));
            } catch (e) {
                // Page might be closing or navigating
            }

            if (this.isAgentActive) {
                setTimeout(streamLoop, 500);
            }
        };
        streamLoop();
    }

    async startAutonomousLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🤖 AI Autonomous Mode Activated");
        this.io.emit('agent-thought', "AI Activated. Analyzing screen...");

        while (this.isRunning && this.isAgentActive) {
            try {
                if (this.activePage.isClosed()) this.activePage = this.page;
                try { await this.activePage.waitForLoadState('domcontentloaded', { timeout: 3000 }); } catch (e) {}

                const screenshotBuffer = await this.activePage.screenshot({ type: 'jpeg', quality: 70, scale: 'css' });
                const screenshotBase64 = screenshotBuffer.toString('base64');

                const aiResponse = await this.getAiAction(screenshotBase64);

                if (!this.isRunning) break;

                if (aiResponse && aiResponse.code) {
                    this.io.emit('agent-thought', aiResponse.thought || "Executing action...");
                    console.log(`💡 Thought: ${aiResponse.thought}`);
                    console.log(`🧩 Code: ${aiResponse.code}`);
                    await this.executeCode(aiResponse.code);
                } else {
                    await new Promise(r => setTimeout(r, 2000));
                }
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.error("AI Loop Error:", error);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    async getAiAction(screenshotBase64) {
        try {
            const assignment = this.creds && this.creds.assignment ? this.creds.assignment : 'the assigned work';
            const dynamicContext = `The user has already logged in. Your goal is to find and solve the assignment: "${assignment}".\n\n**INSTRUCTIONS:**\n1. **SELECT CLASS:** If a class selector appears on the left sidebar, click the correct class.\n2. **FIND ASSIGNMENT:** Look for "${assignment}" in 'Upcoming' or 'Past Due' sections.\n3. **SOLVE:** Click into the assignment and solve only Multiple Choice or simple text-answer questions.\n4. **TYPE ANSWER FIRST:** Before clicking any submit button, you MUST click the answer input and type the answer. NEVER submit a blank field.\n5. **SUBMIT:** Only after the answer is typed/selected, click submit.`;

            const messages = [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "system", content: dynamicContext },
            ];

            if (this.lastAssistantMessage) {
                messages.push({ role: "assistant", content: this.lastAssistantMessage });
            }

            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Analyze the screenshot of the ACTIVE window. What is the next step?" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: "high" } }
                ]
            });

            const response = await this.openai.chat.completions.create({
                model: "o4-mini",
                messages,
                reasoning_effort: "medium",
                max_completion_tokens: 10000,
                response_format: { type: "json_object" }
            });

            let content = response.choices[0].message.content;
            if (content.includes('```')) {
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            this.lastAssistantMessage = content;
            return JSON.parse(content);
        } catch (e) {
            console.error("OpenAI API Error:", e.message);
            return null;
        }
    }

    async executeCode(code) {
        try {
            const asyncFunction = new Function('page', 'clickAt', `
                return (async () => {
                    const clickAt = async (x, y) => {
                        await page.mouse.move(x, y);
                        await page.waitForTimeout(100);
                        await page.mouse.down();
                        await page.waitForTimeout(50);
                        await page.mouse.up();
                    };
                    try {
                        ${code}
                    } catch(e) {
                        console.error("❌ Code execution error:", e.message);
                    }
                })();
            `);
            // Execute on the ACTIVE page (popup or main)
            await asyncFunction(this.activePage, null);
        } catch (e) {
            console.error("Execution Error:", e);
        }
    }
}

module.exports = DeltaMathController;
