const { chromium } = require('playwright');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const COOKIES_PATH = path.join(__dirname, '../cookies.json');

const SYSTEM_PROMPT = `You are an agent solving 10th grade geometry problems on DeltaMath. Answers are always simple — whole numbers, simple fractions, or short expressions. Never overthink it.

SUBJECT MATTER — 10th grade geometry topics you will encounter:
- Angle relationships: complementary (sum 90°), supplementary (sum 180°), vertical angles (equal), linear pairs
- Parallel lines cut by a transversal: alternate interior, alternate exterior, co-interior (same-side), corresponding angles
- Triangle properties: angle sum = 180°, exterior angle theorem, isosceles triangles, congruence (SSS, SAS, ASA, AAS)
- Quadrilaterals: parallelograms, rectangles, rhombuses, trapezoids — side and angle rules
- Circle theorems: central angles, inscribed angles, arc measures, chords, tangents
- Coordinate geometry: distance formula, midpoint formula, slope, parallel/perpendicular lines
- Similarity and proportions: similar triangles, scale factor, proportional sides
- Basic trig: SOH-CAH-TOA, finding missing sides/angles in right triangles

When solving: look at the diagram, read the labels, set up a simple equation, and type the numeric answer.

INTERACTING WITH THE PAGE:
- Click the answer input field before typing. If it's a MathQuill field (editable span, not a standard input), click it and type normally.
- If there are multiple answer boxes, fill them in order (left to right, top to bottom).
- After filling all inputs, click the Submit Answer button.
- For multiple choice, just click the correct option.

AFTER SUBMITTING — what to do next:
- CORRECT (green checkmark): IMMEDIATELY click the "Next Problem" or "Next" button. Do not wait, do not scroll, do not take a screenshot. Just click Next Problem right away.
- FIRST ATTEMPT WRONG ("Your answer is not correct"): You have one more try. Say "WRONG_ANSWER" in your reasoning. Re-read the problem, fix your answer, and resubmit.
- SECOND ATTEMPT WRONG (red X, "Incorrect" on a new page): Question is over. Click "Next Problem" immediately and move on. Say "QUESTION_DONE" in your reasoning.

YOUR FLOW FOR EVERY QUESTION: Read → Solve → Type answer → Submit → Click Next Problem → Repeat. Never stop between questions.`;

const MAX_STEPS = 100;
const MODEL_MINI = 'gpt-5.4-mini';
const MODEL_FULL = 'gpt-5.4';
const TOOLS = [{ type: 'computer' }];

// Model signals wrong answer on first attempt — escalate
const ESCALATION_PATTERNS = /WRONG_ANSWER|your answer is not correct|not correct/i;

// Model signals question is over (correct, or failed twice) — de-escalate
const QUESTION_DONE_PATTERNS = /QUESTION_DONE/i;

class DeltaMathAgent {
    constructor(apiKey, browser) {
        this.openai = new OpenAI({ apiKey });
        this.browser = browser;
        this.currentModel = MODEL_MINI;
        this.escalated = false;
    }

    async captureScreenshot(page) {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 75 });
        return buffer.toString('base64');
    }

    async executeAction(page, action) {
        switch (action.type) {
            case 'click':
                await page.mouse.click(action.x, action.y, {
                    button: action.button ?? 'left',
                });
                break;
            case 'double_click':
                await page.mouse.dblclick(action.x, action.y);
                break;
            case 'type':
                await page.keyboard.type(action.text);
                break;
            case 'key':
            case 'keypress':
                const keyVal = action.key || action.value || action.text;
                if (keyVal) {
                    await page.keyboard.press(keyVal);
                } else {
                    console.warn(`[Agent] keypress with no key value:`, JSON.stringify(action));
                }
                break;
            case 'scroll':
                await page.mouse.move(action.x ?? 640, action.y ?? 400);
                await page.mouse.wheel(action.scroll_x ?? 0, action.scroll_y ?? 0);
                break;
            case 'drag':
                await page.mouse.move(action.startX ?? action.x, action.startY ?? action.y);
                await page.mouse.down();
                await page.mouse.move(action.endX ?? action.toX, action.endY ?? action.toY);
                await page.mouse.up();
                break;
            case 'move':
                await page.mouse.move(action.x, action.y);
                break;
            case 'wait':
                await page.waitForTimeout(action.duration ?? 1000);
                break;
            case 'screenshot':
                break; // handled by the loop
            default:
                console.warn(`[Agent] Unknown action type: ${action.type}`);
        }
    }

    async startFreshChain(page, model, promptText) {
        const screenshotBase64 = await this.captureScreenshot(page);
        return this.openai.responses.create({
            model,
            tools: TOOLS,
            reasoning: { effort: 'high' },
            instructions: SYSTEM_PROMPT,
            input: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_image',
                            image_url: `data:image/jpeg;base64,${screenshotBase64}`,
                            detail: 'auto',
                        },
                        {
                            type: 'input_text',
                            text: promptText || 'Solve the math problem shown in this screenshot.',
                        },
                    ],
                },
            ],
        });
    }

    // Check the page DOM for DeltaMath wrong-answer or incorrect states
    async checkPageState(page) {
        try {
            return await page.evaluate(() => {
                const body = document.body.innerText || '';
                if (/your answer is not correct/i.test(body)) return 'wrong_first';
                if (/incorrect/i.test(body) && document.querySelector('.fa-times, .fa-xmark, [class*="incorrect"], [class*="wrong"]')) return 'wrong_final';
                if (/correct/i.test(body) && document.querySelector('.fa-check, [class*="correct"]')) return 'correct';
                return null;
            });
        } catch (e) {
            return null;
        }
    }

    async computerUseLoop(response, page, onStep) {
        let currentResponse = response;
        let totalSteps = 0;
        let questionSteps = 0;
        let questionNum = 1;
        let idleStreak = 0;

        while (totalSteps < MAX_STEPS) {
            totalSteps++;
            questionSteps++;

            // Extract reasoning text
            const reasoning = currentResponse.output.find(item => item.type === 'reasoning');
            const reasoningText = reasoning?.summary?.map(s => s.text).join('\n') || '';

            if (reasoningText) {
                console.log(`\n💬 [${this.currentModel}] Reasoning: ${reasoningText}`);
                if (onStep) onStep({ type: 'reasoning', text: `[${this.currentModel}] ${reasoningText}` });
            }

            // --- Escalation: first wrong answer (reasoning signal) ---
            if (!this.escalated && ESCALATION_PATTERNS.test(reasoningText)) {
                this.escalated = true;
                this.currentModel = MODEL_FULL;
                idleStreak = 0;
                console.log(`\n🔺🔺🔺 ESCALATING to ${MODEL_FULL} — wrong answer detected 🔺🔺🔺`);
                if (onStep) onStep({ type: 'model_switch', model: MODEL_FULL, reason: 'escalation' });
                currentResponse = await this.startFreshChain(page, MODEL_FULL,
                    'The previous answer was wrong. Look carefully at the problem and the feedback on screen. You have one more attempt — solve it correctly.');
                continue;
            }

            // --- De-escalation: question done (reasoning signal) ---
            if (this.escalated && QUESTION_DONE_PATTERNS.test(reasoningText)) {
                this.escalated = false;
                this.currentModel = MODEL_MINI;
                idleStreak = 0;
                questionNum++;
                questionSteps = 0;
                console.log(`\n🔽🔽🔽 DE-ESCALATING to ${MODEL_MINI} — question complete 🔽🔽🔽`);
                if (onStep) onStep({ type: 'model_switch', model: MODEL_MINI, reason: 'de-escalation' });
                currentResponse = await this.startFreshChain(page, MODEL_MINI,
                    'Solve the math problem shown in this screenshot.');
                continue;
            }

            // Find computer_call
            const computerCall = currentResponse.output.find(item => item.type === 'computer_call');
            if (!computerCall) {
                idleStreak++;
                if (idleStreak >= 3) {
                    console.warn(`\n⚠️ [Agent] Model not acting — stopping loop`);
                    return null;
                }
                // Check DOM to give a better prompt
                const idlePageState = await this.checkPageState(page);
                let nudge;
                if (idlePageState === 'correct') {
                    nudge = 'The answer was correct. Click the "Next Problem" button NOW to move to the next question.';
                    questionNum++;
                    questionSteps = 0;
                    console.log(`\n🔄 [Q${questionNum - 1} ✅] Answer correct — nudging to click Next Problem`);
                } else if (idlePageState === 'wrong_final') {
                    nudge = 'The question is over (red X). Click "Next Problem" NOW to move on.';
                    questionNum++;
                    questionSteps = 0;
                    console.log(`\n🔄 [Q${questionNum - 1} ❌] Question over — nudging to click Next Problem`);
                } else {
                    nudge = 'You must interact with the page. Click the input field, type the answer, and click Submit. Do not just describe the answer — use the computer.';
                    console.log(`\n🔄 [${this.currentModel}] No actions — prompting model to interact`);
                }
                currentResponse = await this.startFreshChain(page, this.currentModel, nudge);
                continue;
            }

            idleStreak = 0;
            const actionTypes = computerCall.actions.map(a => a.type);
            const realActions = actionTypes.filter(t => t !== 'screenshot');
            const modelTag = this.escalated ? `🔴 ${this.currentModel}` : `🟢 ${this.currentModel}`;
            console.log(`\n🎯 [Q${questionNum} Step ${questionSteps}] [${modelTag}] Actions: ${actionTypes.join(', ')}`);
            if (onStep) onStep({ type: 'actions', step: questionSteps, question: questionNum, actions: actionTypes, model: this.currentModel });

            // Execute each action
            for (const action of computerCall.actions) {
                await this.executeAction(page, action);
                await page.waitForTimeout(100);
            }

            // Only check DOM after real actions (not pure screenshot steps)
            if (realActions.length > 0) {
                const pageState = await this.checkPageState(page);

                if (!this.escalated && pageState === 'wrong_first') {
                    this.escalated = true;
                    this.currentModel = MODEL_FULL;
                    console.log(`\n🔺🔺🔺 ESCALATING to ${MODEL_FULL} — wrong answer detected via DOM 🔺🔺🔺`);
                    if (onStep) onStep({ type: 'model_switch', model: MODEL_FULL, reason: 'escalation' });
                    currentResponse = await this.startFreshChain(page, MODEL_FULL,
                        'The previous answer was wrong. Look carefully at the problem and the feedback on screen. You have one more attempt — solve it correctly.');
                    continue;
                }

                if (pageState === 'wrong_final') {
                    this.escalated = false;
                    this.currentModel = MODEL_MINI;
                    questionNum++;
                    questionSteps = 0;
                    console.log(`\n🔽🔽🔽 DE-ESCALATING to ${MODEL_MINI} — red X, question over 🔽🔽🔽`);
                    if (onStep) onStep({ type: 'model_switch', model: MODEL_MINI, reason: 'de-escalation' });
                    currentResponse = await this.startFreshChain(page, MODEL_MINI,
                        'The question showed a red X — it\'s over. Click "Next Problem" to move on, then solve the next question.');
                    continue;
                }
            }

            // Take new screenshot and feed it back (continue the chain)
            const screenshotBase64 = await this.captureScreenshot(page);

            currentResponse = await this.openai.responses.create({
                model: this.currentModel,
                tools: TOOLS,
                reasoning: { effort: 'high' },
                previous_response_id: currentResponse.id,
                input: [
                    {
                        type: 'computer_call_output',
                        call_id: computerCall.call_id,
                        output: {
                            type: 'computer_screenshot',
                            image_url: `data:image/jpeg;base64,${screenshotBase64}`,
                            detail: 'auto',
                        },
                    },
                ],
            });
        }

        console.warn(`\n⚠️ [Agent] Hit max steps (${MAX_STEPS}) — solved ${questionNum - 1} questions`);
        return null;
    }

    async solveProblem(page, taskDescription, onStep) {
        // Reset model state
        this.currentModel = MODEL_MINI;
        this.escalated = false;

        // Set consistent viewport for coordinate accuracy
        await page.setViewportSize({ width: 1280, height: 800 });

        // Wait for page to settle
        try {
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        } catch (e) { /* timeout is fine */ }
        await page.waitForTimeout(500);

        const promptText = taskDescription || 'Solve the math problem shown in this screenshot.';
        const response = await this.startFreshChain(page, MODEL_MINI, promptText);

        return this.computerUseLoop(response, page, onStep);
    }
}

// --- Cookie persistence helpers ---

async function loadCookies(page) {
    try {
        if (fs.existsSync(COOKIES_PATH)) {
            const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
            await page.context().addCookies(cookies);
            console.log(`[Cookies] Loaded ${cookies.length} cookies`);
        }
    } catch (e) {
        console.warn('[Cookies] Failed to load:', e.message);
    }
}

async function saveCookies(page) {
    try {
        const cookies = await page.context().cookies();
        fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        console.log(`[Cookies] Saved ${cookies.length} cookies`);
    } catch (e) {
        console.warn('[Cookies] Failed to save:', e.message);
    }
}

// --- Standalone main() ---

async function main() {
    const url = process.argv[2] || 'https://www.deltamath.com/';
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('Missing OPENAI_API_KEY in .env');
        process.exit(1);
    }

    console.log('[Main] Launching browser...');
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox'],
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // Load cookies before navigating
    await loadCookies(page);

    console.log(`[Main] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const agent = new DeltaMathAgent(apiKey, browser);

    console.log('[Main] Starting agent — solving problem...');
    const result = await agent.solveProblem(page, null, (step) => {
        if (step.type === 'reasoning') {
            console.log(`  💭 ${step.text}`);
        } else if (step.type === 'actions') {
            console.log(`  🎯 Step ${step.step}: ${step.actions.join(', ')}`);
        }
    });

    console.log('[Main] Agent finished.');
    if (result) {
        console.log(`[Main] Final response: ${result}`);
    } else {
        console.log('[Main] No text response from model.');
    }

    // Save cookies on exit
    await saveCookies(page);

    // Keep browser open for inspection
    console.log('[Main] Browser left open. Press Ctrl+C to exit.');
}

// Run standalone if executed directly
if (require.main === module) {
    main().catch((e) => {
        console.error('[Main] Fatal error:', e);
        process.exit(1);
    });
}

module.exports = { DeltaMathAgent, loadCookies, saveCookies };
