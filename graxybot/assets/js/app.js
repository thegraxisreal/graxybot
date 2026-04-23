import {
    BACKGROUND_VIDEOS,
    BOT_ICON_SRC,
    CHATS_STORAGE_KEY,
    CHAT_USAGE_LIMIT,
    CURRENT_CHAT_ID_KEY,
    DEFAULT_CHAT_MODEL,
    GEMINI_CHAT_ENDPOINT,
    GEMINI_CHAT_MODEL,
    GEMINI_IMAGE_ENDPOINT,
    IMAGE_USAGE_LIMIT,
    ME_PROFILE_STORAGE_KEY,
    OPENAI_PROXY_ENDPOINT,
    OPENAI_SEARCH_ENDPOINT,
    PERSONALITY_STORAGE_KEY,
    SEARCH_USAGE_LIMIT,
    SEARCH_USAGE_WINDOW_MS,
    THEME_MODE_STORAGE_KEY,
    THEME_STORAGE_KEY,
    USER_ICON_CLASS,
    USAGE_STORAGE_KEY,
    USAGE_WINDOW_MS
} from './config.js';
import {
    getSearchSystemPrompt,
    getSystemPrompt,
    getWebDesignSystemPrompt,
    getBuildClarificationSystemPrompt,
    getBuildPlannerSystemPrompt,
    getBuildExecutionSystemPrompt,
    getBuildRepairSystemPrompt
} from './prompts.js';

    // --- DOM Element References ---
    let chatApp, chatMessagesContainer, messageInput, chatInputArea, sendButton, createImageButton;
    let imageUploadButton, imageUploadInput, imagePreviewArea, imagePreview, removeImageButton;
    let loader, toastContainer, micButton, speechRecognition, isListening = false;
    let sidebar, newChatBtn, chatList, settingsButton, chatTitle, mainContent, menuBackdrop, menuToggleBtn;
    let personalityOverlay, userNameInput, responseStyleInput, savePersonalityBtn, closePersonalityModalBtn;
    // New Theme elements
    let themesButton, themesOverlay, closeThemesModalBtn, themePromptInput, generateThemeBtn;
    let themePreview, themeSpinner, themeImagePreview, saveThemeBtn, removeThemeBtn, themeContainer;
    let grassThemeBox, cloudsThemeBox;
    let themeModeToggle;
    let meButton, mePopup, mePopupCloseBtn, meStartCameraBtn, meCaptureBtn, meUploadBtn, meUploadInput;
    let meRetakeRow, meRetakeBtn, meRemoveBtn, meMediaPreview, meMediaPlaceholder, mePhotoPreview;
    let mePromptArea, mePromptInput, meSubtitle, meCameraStreamEl, meCanvas;
    let meActiveBanner, meInlineRetakeBtn, meInlineRemoveBtn;
    let homeworkTabButton, buildTabButton, chatComposer, homeworkPanel, homeworkUploadBtn, homeworkPresetsBtn, homeworkUploadInput;
    let homeworkWorkspace, homeworkPasteInput, homeworkParseBtn, homeworkDetectedList, homeworkDetectedCount;
    let homeworkWorkspaceBackBtn, homeworkFileSummary, chatInputContainer, homeworkWorkspaceHead;
    let homeworkHomeScreen, homeworkHomeTitle, homeworkIntakeCard, homeworkWorkingState, homeworkDetectedCard;
    let homeworkAnswerCard, homeworkQuestionPosition, homeworkQuestionTitle, homeworkQuestionText;
    let homeworkAnswerText, homeworkAnswerStatus, homeworkElaborateBtn, homeworkRegenerateBtn, homeworkShorterBtn, homeworkNextBtn;
    let buildWorkspace, buildHomeTitle, buildPromptWrap, buildPromptInput, buildPromptButton, buildPromptSprite;
    let buildIdleScreen, buildAgentScreen, buildAgentSprite, buildAgentKicker, buildAgentTitle, buildAgentSubtitle;
    let buildProgressWrap, buildProgressBar, buildProgressStatus;
    let buildWorkbench, buildThinkingStream, buildCodeStream;
    let buildResultScreen, buildPreviewFrame, buildOpenPreviewBtn, buildResetBtn, buildLogsList;
    let webDesignModeContainer, webDesignModeToggle, webDesignModeMenu, modeSimpleBtn, modeProBtn;
    let customizeImageModeContainer, customizeImageModeToggle, customizeImageModeMenu, imageModelMiniBtn, imageModelMaxBtn;
    let currentImageModel = 'gpt-image-1-mini';
    let currentWebDesignMode = 'simple';
    
    let settingsTabButtons = [];
    let settingsTabPanels = [];
    let usageChatsBar, usageChatsLabel, usageChatsReset;
    let usageImagesBar, usageImagesLabel, usageImagesReset;
    
    let actionMenuToggle, actionMenu, actionCoachmark;
    let agentMenuToggle, agentMenu, webDesignAgentButton;
    let searchModeButton;
    let wipeDataBtn;
    let initialNameOverlay, initialNameInput, initialNameSaveBtn;
    let redditStoryButton, storyOverlay, storyVideo, storyCaptionsContainer, closeStoryBtn, downloadStoryBtn;

    // --- Application State ---
    let chats = {};
    let currentChatId = null;
    let isRequestInProgress = false;
    let isImageGenerationModeActive = false;
    let isWebDesignModeActive = false;
    let currentThinkingIndicatorElement = null;
    let selectedImageData = null, selectedImageMimeType = null, selectedImagePreviewUrl = null;
    let userPersonality = { name: null, responseStyle: null };
    let currentTheme = { type: 'none' }; // e.g., { type: 'grass' }, { type: 'clouds' }, { type: 'generated', data: '...' }
    let generatedThemeData = null; // Holds temporary generated image data
    let currentSpeechUtterance = null;
    let lastStoryVoiceName = null;
    let meProfile = null;
    let meStream = null;
    let meIsCapturing = false;
    let meQuickModeActive = false;
    let usageStats = { chats: [], images: [], searches: [] };
    let usageUpdateInterval = null;
    let coachmarkHideTimeout = null;
    let isSearchModeQueued = false;
    let isHomeworkModeActive = false;
    let isHomeworkWorkspaceActive = false;
    let isBuildModeActive = false;
    let homeworkWorkspaceStage = 'intake';
    let homeworkSourceFiles = [];
    let homeworkParsedQuestions = [];
    let currentHomeworkQuestionIndex = 0;
    let currentBuildHeadline = 'graxybot build';
    let currentBuildHeadlineIndex = 0;
    let currentBuildSprite = '';
    let currentBuildVerb = 'building';
    let currentBuildHtml = '';
    let buildLogEntries = [];
    let buildFlowState = 'idle';
    let buildOriginalPrompt = '';
    let buildClarificationQuestion = '';
    let buildAwaitingClarification = false;
    let buildFakeProgressValue = 0;
    let buildFakeProgressInterval = null;
    let buildFakeCodeInterval = null;
    let buildSpriteFocusInterval = null;
    let buildThinkingText = '';
    let buildCodeText = '';
    let buildLastRealCodeAt = 0;
    let buildLastRealThinkingAt = 0;
    const HOMEWORK_FUN_LINES = [
        'Graxybot Homework',
        'what are we getting done?',
        'let’s knock this out',
        'homework, but less painful',
        'what needs solving today?'
    ];
    const BUILD_FUN_LINES = [
        'graxybot build',
        'Graxybot Build',
        'what are we coding?',
        'build anything',
        'lets build something new'
    ];
    const BUILD_SPRITE_VARIANTS = [
        'orb',
        'laptop',
        'astronaut'
    ];
    const BUILD_VERBS = ['working', 'coding', 'building'];
    const BUILD_FAKE_CODE_LINES = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '  <title>Graxybot Build</title>',
        '  <style>',
        '    body { margin: 0; font-family: system-ui, sans-serif; }',
        '    .app { display: grid; place-items: center; min-height: 100vh; }',
        '  </style>',
        '</head>',
        '<body>',
        '  <div class="app">building something fun...</div>',
        '  <script>',
        '    console.log("graxybot build in progress");',
        '  </script>',
        '</body>',
        '</html>'
    ];
    const BUILD_FAKE_THINKING_LINES = [
        'figuring out the simplest usable flow',
        'keeping the first-run experience easy',
        'planning the layout before coding',
        'choosing interactions the user will understand fast',
        'turning the request into a single-file app brief',
        'making sure the html can run standalone'
    ];
    const BOT_TRANSFORM_ACTIONS = [
        {
            id: 'shorter',
            label: 'make shorter',
            loadingLabel: 'shortening...',
            buildInstruction: () => 'Rewrite the assistant response so it is shorter and tighter. Keep the same meaning, preserve key facts, and do not add new information. Output only the rewritten answer.'
        },
        {
            id: 'clearer',
            label: 'make clearer',
            loadingLabel: 'clarifying...',
            buildInstruction: () => 'Rewrite the assistant response so it is clearer and easier to understand. Keep the same meaning, preserve key facts, and do not add new information. Output only the rewritten answer.'
        },
        {
            id: 'elaborate',
            label: 'elaborate',
            loadingLabel: 'elaborating...',
            buildInstruction: () => 'Rewrite the assistant response so it is a bit more detailed and explanatory while keeping the same meaning and core facts. Clarify the answer, but do not go off topic or add unrelated new claims. Output only the rewritten answer.'
        }
    ];
    
    // --- Core Functions ---
    function showToast(message, type = 'info', duration = 3000) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    }
    function applyThemeMode(mode) {
        const normalized = mode === 'light' ? 'light' : 'dark';
        if (normalized === 'light') {
            document.body.classList.add('theme-light');
        } else {
            document.body.classList.remove('theme-light');
        }
        localStorage.setItem(THEME_MODE_STORAGE_KEY, normalized);
        if (themeModeToggle) {
            themeModeToggle.checked = normalized === 'dark';
        }
    }
    function setDynamicChatTitle() {
        if (!chatTitle) return;
        if (isBuildModeActive) {
            chatTitle.textContent = 'Graxybot Build Beta';
            return;
        }
        if (isHomeworkWorkspaceActive) {
            const activeQuestion = getHomeworkQuestionAtCurrentIndex();
            if (homeworkWorkspaceStage === 'results' && activeQuestion) {
                chatTitle.textContent = `question ${activeQuestion.number}`;
            } else if (homeworkWorkspaceStage === 'working') {
                chatTitle.textContent = 'graxybot working...';
            } else {
                chatTitle.textContent = 'paste it all here!';
            }
            return;
        }
        if (isHomeworkModeActive) {
            chatTitle.textContent = getHomeworkFunLine();
            return;
        }
        const name = (userPersonality?.name || '').trim();
        if (!name) {
            chatTitle.textContent = 'Graxybot';
            return;
        }
        const roll = Math.random();
        let title = 'Graxybot';
        if (roll < 0.7) {
            title = 'Graxybot';
        } else if (roll < 0.8) {
            title = `how can i help today, ${name}?`;
        } else if (roll < 0.9) {
            title = `hey ${name}`;
        } else {
            title = `how\'s it going, ${name}?`;
        }
        chatTitle.textContent = title;
    }
    function getHomeworkFunLine() {
        return HOMEWORK_FUN_LINES[Math.floor(Math.random() * HOMEWORK_FUN_LINES.length)];
    }
    function advanceBuildHeadline() {
        currentBuildHeadline = BUILD_FUN_LINES[currentBuildHeadlineIndex];
        currentBuildHeadlineIndex = (currentBuildHeadlineIndex + 1) % BUILD_FUN_LINES.length;
    }
    function chooseBuildVerb() {
        currentBuildVerb = BUILD_VERBS[Math.floor(Math.random() * BUILD_VERBS.length)];
    }
    function getBuildBadgeMarkup(label = 'Graxybot Build') {
        return `${label} <span class="build-beta-tag build-beta-tag-inline">Beta</span>`;
    }
    function refreshBuildHeadline() {
        if (buildHomeTitle && isBuildModeActive) {
            buildHomeTitle.innerHTML = `${escapeHtml(currentBuildHeadline)} <span class="build-beta-tag build-beta-tag-inline">Beta</span>`;
        }
    }
    function chooseBuildSprite() {
        const previousSprite = currentBuildSprite;
        let nextSprite = BUILD_SPRITE_VARIANTS[Math.floor(Math.random() * BUILD_SPRITE_VARIANTS.length)];
        if (previousSprite && BUILD_SPRITE_VARIANTS.length > 1) {
            while (nextSprite === previousSprite) {
                nextSprite = BUILD_SPRITE_VARIANTS[Math.floor(Math.random() * BUILD_SPRITE_VARIANTS.length)];
            }
        }
        currentBuildSprite = nextSprite;
    }
    function refreshBuildSprite() {
        if (!buildPromptSprite || !currentBuildSprite) return;
        buildPromptSprite.className = `build-prompt-sprite build-prompt-sprite--${currentBuildSprite}`;
        if (buildAgentSprite) {
            buildAgentSprite.className = `build-agent-sprite build-agent-sprite--${currentBuildSprite}`;
        }
    }
    function stopBuildWorkbenchMotion() {
        if (buildFakeCodeInterval) {
            clearInterval(buildFakeCodeInterval);
            buildFakeCodeInterval = null;
        }
        if (buildSpriteFocusInterval) {
            clearInterval(buildSpriteFocusInterval);
            buildSpriteFocusInterval = null;
        }
    }
    function setBuildFocus(mode = 'thinking') {
        if (!buildAgentScreen) return;
        buildAgentScreen.dataset.focus = mode;
    }
    function formatBuildCodeMarkup(text = '') {
        let html = escapeHtml(text);
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="build-code-comment">$1</span>');
        html = html.replace(/(&lt;\/?)([a-zA-Z0-9:-]+)/g, '$1<span class="build-code-tag">$2</span>');
        html = html.replace(/([a-zA-Z-:]+)(=)(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="build-code-attr">$1</span>$2<span class="build-code-string">$3</span>');
        html = html.replace(/\b(function|const|let|var|return|if|else|for|while|new|class|async|await|true|false|null)\b/g, '<span class="build-code-keyword">$1</span>');
        html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="build-code-number">$1</span>');
        html = html.replace(/\b([A-Za-z_$][\w$]*)(?=\()/g, '<span class="build-code-function">$1</span>');
        return html;
    }
    function renderBuildWorkbench() {
        if (buildThinkingStream) {
            buildThinkingStream.textContent = buildThinkingText || 'waiting for the planner...';
            buildThinkingStream.scrollTop = buildThinkingStream.scrollHeight;
        }
        if (buildCodeStream) {
            buildCodeStream.innerHTML = formatBuildCodeMarkup(buildCodeText || 'waiting for code output...');
            buildCodeStream.scrollTop = buildCodeStream.scrollHeight;
        }
    }
    function resetBuildWorkbench() {
        buildThinkingText = '';
        buildCodeText = '';
        buildLastRealCodeAt = 0;
        buildLastRealThinkingAt = 0;
        renderBuildWorkbench();
    }
    function appendBuildThinkingText(chunk = '', isReal = false) {
        if (!chunk) return;
        buildThinkingText += chunk;
        if (isReal) buildLastRealThinkingAt = Date.now();
        renderBuildWorkbench();
    }
    function appendBuildCodeText(chunk = '', isReal = false) {
        if (!chunk) return;
        buildCodeText += chunk;
        if (isReal) buildLastRealCodeAt = Date.now();
        renderBuildWorkbench();
    }
    function primeBuildWorkbench() {
        buildThinkingText = `// graxybot build planner\n// waiting for gpt-5.4-mini...\n\n`;
        buildCodeText = `// gpt-5.4 code stream\n// waiting for standalone html...\n`;
        renderBuildWorkbench();
    }
    function startBuildWorkbenchMotion() {
        stopBuildWorkbenchMotion();
        primeBuildWorkbench();
        setBuildFocus('thinking');
        let fakeCodeIndex = 0;
        let fakeThinkingIndex = 0;
        buildFakeCodeInterval = setInterval(() => {
            const now = Date.now();
            if (now - buildLastRealThinkingAt > 900) {
                const line = BUILD_FAKE_THINKING_LINES[fakeThinkingIndex % BUILD_FAKE_THINKING_LINES.length];
                fakeThinkingIndex += 1;
                appendBuildThinkingText(`• ${line}\n`, false);
            }
            if (now - buildLastRealCodeAt > 1200) {
                const line = BUILD_FAKE_CODE_LINES[fakeCodeIndex % BUILD_FAKE_CODE_LINES.length];
                fakeCodeIndex += 1;
                appendBuildCodeText(`${line}\n`, false);
            }
        }, 780);
        const focusModes = ['thinking', 'coding', 'drift-left', 'drift-right', 'thinking-high', 'coding-high'];
        let lastFocus = 'thinking';
        buildSpriteFocusInterval = setInterval(() => {
            let nextFocus = focusModes[Math.floor(Math.random() * focusModes.length)];
            while (nextFocus === lastFocus && focusModes.length > 1) {
                nextFocus = focusModes[Math.floor(Math.random() * focusModes.length)];
            }
            lastFocus = nextFocus;
            setBuildFocus(nextFocus);
        }, 980 + Math.floor(Math.random() * 520));
    }
    function stopFakeBuildProgress() {
        if (buildFakeProgressInterval) {
            clearInterval(buildFakeProgressInterval);
            buildFakeProgressInterval = null;
        }
    }
    function setFakeBuildProgress(value, label = '') {
        buildFakeProgressValue = Math.max(0, Math.min(100, value));
        if (buildProgressBar) {
            buildProgressBar.style.width = `${buildFakeProgressValue}%`;
        }
        if (buildProgressStatus && label) {
            buildProgressStatus.textContent = label;
        }
    }
    function startFakeBuildProgress() {
        stopFakeBuildProgress();
        setFakeBuildProgress(8, 'starting build...');
        buildFakeProgressInterval = setInterval(() => {
            const increment = buildFakeProgressValue < 40
                ? 7 + Math.random() * 8
                : buildFakeProgressValue < 72
                    ? 3 + Math.random() * 5
                    : 1 + Math.random() * 2.5;
            setFakeBuildProgress(Math.min(92, buildFakeProgressValue + increment));
        }, 850);
    }
    function resetBuildLogs() {
        buildLogEntries = [];
        renderBuildLogs();
    }
    function addBuildLog(text) {
        if (!text) return;
        buildLogEntries.push(text);
        buildLogEntries = buildLogEntries.slice(-6);
        renderBuildLogs();
    }
    function renderBuildLogs() {
        if (!buildLogsList) return;
        if (!buildLogEntries.length) {
            buildLogsList.innerHTML = '<div class="build-log-line">build logs appear here</div>';
            return;
        }
        buildLogsList.innerHTML = buildLogEntries
            .map((entry) => `<div class="build-log-line">${escapeHtml(entry)}</div>`)
            .join('');
    }
    function showBuildIdleScreen() {
        buildFlowState = 'idle';
        if (buildIdleScreen) buildIdleScreen.style.display = 'flex';
        if (buildAgentScreen) buildAgentScreen.style.display = 'none';
        if (buildResultScreen) buildResultScreen.style.display = 'none';
        if (buildProgressWrap) buildProgressWrap.style.display = 'none';
        if (buildPromptWrap) buildPromptWrap.style.display = 'block';
        if (buildPromptInput) {
            buildPromptInput.placeholder = 'Describe what you want to build...';
            buildPromptInput.value = '';
            if (isBuildModeActive) {
                setTimeout(() => buildPromptInput.focus(), 0);
            }
        }
        stopFakeBuildProgress();
        stopBuildWorkbenchMotion();
        setFakeBuildProgress(0, 'starting build...');
        if (buildPromptButton) buildPromptButton.disabled = false;
        if (buildPromptSprite) buildPromptSprite.style.display = '';
        refreshBuildHeadline();
        refreshBuildSprite();
        resetBuildLogs();
    }
    function showBuildClarificationScreen(questionText) {
        buildFlowState = 'clarifying';
        if (buildIdleScreen) buildIdleScreen.style.display = 'none';
        if (buildResultScreen) buildResultScreen.style.display = 'none';
        if (buildAgentScreen) buildAgentScreen.style.display = 'flex';
        if (buildProgressWrap) buildProgressWrap.style.display = 'none';
        if (buildPromptWrap) buildPromptWrap.style.display = 'block';
        if (buildAgentKicker) buildAgentKicker.innerHTML = getBuildBadgeMarkup();
        if (buildAgentTitle) buildAgentTitle.textContent = questionText || 'one quick question';
        if (buildAgentSubtitle) buildAgentSubtitle.textContent = 'answer this and graxybot will start building.';
        if (buildPromptInput) {
            buildPromptInput.placeholder = 'Answer graxybot...';
            buildPromptInput.value = '';
            setTimeout(() => buildPromptInput.focus(), 0);
        }
        if (buildPromptButton) buildPromptButton.disabled = false;
        if (buildPromptSprite) buildPromptSprite.style.display = '';
        stopBuildWorkbenchMotion();
        refreshBuildSprite();
    }
    function showBuildWorkingScreen() {
        buildFlowState = 'building';
        if (buildIdleScreen) buildIdleScreen.style.display = 'none';
        if (buildResultScreen) buildResultScreen.style.display = 'none';
        if (buildAgentScreen) buildAgentScreen.style.display = 'flex';
        if (buildProgressWrap) buildProgressWrap.style.display = 'block';
        if (buildPromptWrap) buildPromptWrap.style.display = 'none';
        if (buildAgentKicker) buildAgentKicker.innerHTML = getBuildBadgeMarkup();
        if (buildAgentTitle) buildAgentTitle.textContent = currentBuildVerb;
        if (buildAgentSubtitle) buildAgentSubtitle.textContent = 'graxybot is turning your prompt into a single-file app.';
        if (buildPromptInput) buildPromptInput.value = '';
        if (buildPromptButton) buildPromptButton.disabled = true;
        if (buildPromptSprite) buildPromptSprite.style.display = 'none';
        startFakeBuildProgress();
        startBuildWorkbenchMotion();
        refreshBuildSprite();
    }
    function showBuildResultScreen(htmlCode) {
        buildFlowState = 'result';
        currentBuildHtml = htmlCode || '';
        if (buildIdleScreen) buildIdleScreen.style.display = 'none';
        if (buildAgentScreen) buildAgentScreen.style.display = 'none';
        if (buildResultScreen) buildResultScreen.style.display = 'flex';
        if (buildProgressWrap) buildProgressWrap.style.display = 'none';
        if (buildPromptWrap) buildPromptWrap.style.display = 'none';
        stopFakeBuildProgress();
        stopBuildWorkbenchMotion();
        setFakeBuildProgress(100, 'preview ready');
        if (buildPreviewFrame) {
            buildPreviewFrame.srcdoc = currentBuildHtml;
        }
        if (buildPromptInput) buildPromptInput.value = '';
    }
    function resetBuildFlow() {
        buildOriginalPrompt = '';
        buildClarificationQuestion = '';
        buildAwaitingClarification = false;
        currentBuildHtml = '';
        showBuildIdleScreen();
    }
    function extractHtmlFromModelResponse(responseText = '') {
        const codeBlockMatch = responseText.match(/```html\s*([\s\S]*?)```/i);
        if (codeBlockMatch?.[1]) {
            return codeBlockMatch[1].trim();
        }
        const genericBlockMatch = responseText.match(/```\s*([\s\S]*?)```/);
        if (genericBlockMatch?.[1]) {
            return genericBlockMatch[1].trim();
        }
        return responseText.trim();
    }
    function normalizeBuildHtml(responseText = '') {
        let html = extractHtmlFromModelResponse(responseText);
        const lower = html.toLowerCase();
        const doctypeIndex = lower.indexOf('<!doctype html');
        const htmlIndex = lower.indexOf('<html');
        const startIndex = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;
        if (startIndex > 0) {
            html = html.slice(startIndex);
        }
        const endIndex = html.toLowerCase().lastIndexOf('</html>');
        if (endIndex >= 0) {
            html = html.slice(0, endIndex + 7);
        }
        return html.trim();
    }
    function isStandaloneHtmlDocument(html = '') {
        const lower = html.toLowerCase();
        return lower.includes('<html') && lower.includes('</html>') && lower.includes('<body') && lower.includes('</body>');
    }
    function parseBuildJsonResponse(responseText = '') {
        const trimmed = responseText.trim();
        if (!trimmed) throw new Error('empty build response');
        try {
            return JSON.parse(trimmed);
        } catch (error) {
            const match = trimmed.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw error;
        }
    }
    async function runBuildClarificationCheck(userPrompt) {
        addBuildLog('sending to gpt-5.4-mini');
        const messages = [
            { role: 'system', content: getBuildClarificationSystemPrompt() },
            { role: 'user', content: userPrompt }
        ];
        const raw = await sendMessageToModel(messages, 'gpt-5.4-mini', true, true);
        return parseBuildJsonResponse(raw);
    }
    async function runBuildPlanner(userPrompt, clarificationAnswer = '') {
        addBuildLog('preparing build brief with gpt-5.4-mini');
        const plannerInput = clarificationAnswer
            ? `Original request:\n${userPrompt}\n\nClarifying question:\n${buildClarificationQuestion}\n\nUser answer:\n${clarificationAnswer}`
            : `Original request:\n${userPrompt}`;
        const messages = [
            { role: 'system', content: getBuildPlannerSystemPrompt() },
            { role: 'user', content: plannerInput }
        ];
        setBuildFocus('thinking');
        buildThinkingText = `// gpt-5.4-mini planner\n\n`;
        renderBuildWorkbench();
        return sendMessageToModel(messages, 'gpt-5.4-mini', true, true, {
            onStreamText: (chunk) => appendBuildThinkingText(chunk, true)
        });
    }
    async function runBuildExecution(builderBrief) {
        addBuildLog('sending to gpt-5.4');
        const messages = [
            { role: 'system', content: getBuildExecutionSystemPrompt() },
            { role: 'user', content: builderBrief }
        ];
        setBuildFocus('coding');
        buildCodeText = '// gpt-5.4 code stream\n\n';
        renderBuildWorkbench();
        const raw = await sendMessageToModel(messages, 'gpt-5.4', true, true, {
            onStreamText: (chunk) => appendBuildCodeText(chunk, true)
        });
        return normalizeBuildHtml(raw);
    }
    async function repairBuildExecution(builderBrief, brokenOutput) {
        addBuildLog('repairing standalone html');
        const messages = [
            { role: 'system', content: getBuildRepairSystemPrompt() },
            {
                role: 'user',
                content: `Builder brief:\n${builderBrief}\n\nBroken output:\n${brokenOutput}`
            }
        ];
        setBuildFocus('coding');
        appendBuildCodeText('\n\n// repairing invalid output...\n', false);
        const raw = await sendMessageToModel(messages, 'gpt-5.4', true, true, {
            onStreamText: (chunk) => appendBuildCodeText(chunk, true)
        });
        return normalizeBuildHtml(raw);
    }
    async function startBuildFlow(userPrompt, clarificationAnswer = '') {
        try {
            isRequestInProgress = true;
            updateActionButtonsState();
            chooseBuildVerb();
            showBuildWorkingScreen();
            addBuildLog('checking if prompt needs clarification');
            let plannerBrief = '';

            if (!clarificationAnswer) {
                const clarification = await runBuildClarificationCheck(userPrompt);
                if (clarification?.needs_clarification && clarification?.question) {
                    buildAwaitingClarification = true;
                    buildClarificationQuestion = clarification.question.trim();
                    addBuildLog('waiting for clarification');
                    isRequestInProgress = false;
                    updateActionButtonsState();
                    showBuildClarificationScreen(buildClarificationQuestion);
                    return;
                }
            }

            buildAwaitingClarification = false;
            addBuildLog('prompt is clear enough to build');
            plannerBrief = await runBuildPlanner(userPrompt, clarificationAnswer);
            addBuildLog('builder brief ready');
            setFakeBuildProgress(32, 'writing builder brief...');
            let htmlCode = await runBuildExecution(plannerBrief);
            setFakeBuildProgress(74, 'generating standalone html...');
            if (!isStandaloneHtmlDocument(htmlCode)) {
                htmlCode = await repairBuildExecution(plannerBrief, htmlCode);
            }
            if (!isStandaloneHtmlDocument(htmlCode)) {
                throw new Error('model did not return a valid standalone html file');
            }
            setFakeBuildProgress(94, 'loading preview...');
            addBuildLog('rendering preview');
            showBuildResultScreen(htmlCode);
            addBuildLog('build complete');
        } catch (error) {
            console.error('Build flow failed:', error);
            addBuildLog('build failed');
            stopFakeBuildProgress();
            stopBuildWorkbenchMotion();
            showToast(`build failed: ${error.message}`, 'error', 3200);
            showBuildClarificationScreen('build hit a snag');
            if (buildAgentSubtitle) {
                buildAgentSubtitle.textContent = 'try changing the prompt and sending it again.';
            }
        } finally {
            isRequestInProgress = false;
            updateActionButtonsState();
        }
    }
    async function handleBuildPromptSubmit() {
        if (!isBuildModeActive || !buildPromptInput || isRequestInProgress) return;
        const promptText = buildPromptInput.value.trim();
        if (!promptText) return;

        if (!buildAwaitingClarification) {
            const usageAttempt = tryConsumeUsage('chats');
            if (!usageAttempt.success) {
                const waitText = usageAttempt.remainingMs
                    ? ` try again in ${formatDuration(usageAttempt.remainingMs)}.`
                    : '';
                showToast(`chat limit reached.${waitText}`, 'error', 4000);
                return;
            }
            buildOriginalPrompt = promptText;
            chooseBuildSprite();
            refreshBuildSprite();
            addBuildLog('starting build');
            await startBuildFlow(promptText);
            return;
        }

        addBuildLog('received clarification');
        await startBuildFlow(buildOriginalPrompt, promptText);
    }
    function getTransformActionById(actionId) {
        return BOT_TRANSFORM_ACTIONS.find((action) => action.id === actionId) || null;
    }
    function generateChatId() { return `chat_${Date.now()}`; }
    function loadData() {
        try {
            const storedChats = localStorage.getItem(CHATS_STORAGE_KEY);
            chats = storedChats ? JSON.parse(storedChats) : {};
            const storedChatId = localStorage.getItem(CURRENT_CHAT_ID_KEY);
            if (storedChatId && chats[storedChatId]) {
                currentChatId = storedChatId;
            } else {
                currentChatId = null;
                localStorage.removeItem(CURRENT_CHAT_ID_KEY);
            }
            const storedPersonality = localStorage.getItem(PERSONALITY_STORAGE_KEY);
            if (storedPersonality) userPersonality = JSON.parse(storedPersonality);
            
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme) {
                currentTheme = JSON.parse(storedTheme);
                applyTheme(currentTheme.type, currentTheme.data);
            }

        } catch (error) {
            console.error("Error loading data:", error);
            chats = {}; currentChatId = null;
        }
    }
    function saveChats() {
        try {
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
            if (currentChatId) {
                localStorage.setItem(CURRENT_CHAT_ID_KEY, currentChatId);
            } else {
                localStorage.removeItem(CURRENT_CHAT_ID_KEY);
            }
        } catch (e) { console.error("Error saving chats:", e); }
    }
    function savePersonalitySettings() {
        try {
            localStorage.setItem(PERSONALITY_STORAGE_KEY, JSON.stringify(userPersonality));
        } catch (e) { console.error("Error saving personality:", e); }
    }
    function updateActionButtonsState() {
        const isBusy = isRequestInProgress || isListening;
        sendButton.disabled = isBusy || (!messageInput.value.trim() && !selectedImageData);
        imageUploadButton.disabled = isBusy;
        micButton.disabled = isBusy;
        micButton.classList.toggle('active', isListening);
        createImageButton.disabled = isBusy;
        createImageButton.classList.toggle('active', isImageGenerationModeActive);
        if (actionMenuToggle) actionMenuToggle.disabled = isBusy;
        if (agentMenuToggle) agentMenuToggle.disabled = isBusy;
        if (webDesignAgentButton) webDesignAgentButton.disabled = isBusy;
        if (searchModeButton) {
            searchModeButton.disabled = isBusy;
        }
        if (redditStoryButton) redditStoryButton.disabled = isBusy;
        if (meButton) meButton.disabled = isBusy;
        if (meStartCameraBtn) meStartCameraBtn.disabled = isBusy;
        if (meUploadBtn) meUploadBtn.disabled = isBusy;
        if (meCaptureBtn) meCaptureBtn.disabled = isBusy;
        if (meRetakeBtn) meRetakeBtn.disabled = isBusy;
        if (meRemoveBtn) meRemoveBtn.disabled = isBusy;
        if (meInlineRetakeBtn) meInlineRetakeBtn.disabled = isBusy;
        if (meInlineRemoveBtn) meInlineRemoveBtn.disabled = isBusy;
        if (webDesignAgentButton) {
            webDesignAgentButton.disabled = isBusy;
            webDesignAgentButton.classList.toggle('active', isWebDesignModeActive);
        }
        if (homeworkTabButton) homeworkTabButton.disabled = isBusy;
        if (buildTabButton) buildTabButton.disabled = isBusy;
        if (buildPromptInput) buildPromptInput.disabled = isBusy;
        if (buildPromptButton) buildPromptButton.disabled = isBusy || (isBuildModeActive && buildFlowState !== 'building' && !buildPromptInput.value.trim());
        if (buildResetBtn) buildResetBtn.disabled = isBusy;
        if (buildOpenPreviewBtn) buildOpenPreviewBtn.disabled = isBusy || !currentBuildHtml;
        if (homeworkUploadBtn) homeworkUploadBtn.disabled = isBusy;
        if (homeworkPresetsBtn) homeworkPresetsBtn.disabled = isBusy;
        if (homeworkElaborateBtn) homeworkElaborateBtn.disabled = isBusy || !homeworkParsedQuestions.length;
        if (homeworkRegenerateBtn) homeworkRegenerateBtn.disabled = isBusy || !homeworkParsedQuestions.length;
        if (homeworkShorterBtn) homeworkShorterBtn.disabled = isBusy || !homeworkParsedQuestions.length;
        if (homeworkNextBtn) homeworkNextBtn.disabled = isBusy || currentHomeworkQuestionIndex >= homeworkParsedQuestions.length - 1;
        settingsButton.disabled = isBusy;
        themesButton.disabled = isBusy;
        if (chatInputArea) {
            const highlightImageActive = isImageGenerationModeActive && !isBusy;
            const highlightWebActive = isWebDesignModeActive && !isBusy;
            chatInputArea.classList.toggle('image-mode-active', highlightImageActive);
            chatInputArea.classList.toggle('web-design-mode-active', highlightWebActive);
            chatInputArea.classList.toggle('image-mode-busy', (isImageGenerationModeActive || isWebDesignModeActive) && isBusy);
        }
        updateSearchModeUI();
    }
    function refreshInputPlaceholder() {
        if (!messageInput || meQuickModeActive) return;
        if (isHomeworkModeActive || isBuildModeActive) return;
        if (isImageGenerationModeActive) {
            messageInput.placeholder = "Enter image prompt...";
            return;
        }
        if (isWebDesignModeActive) {
            messageInput.placeholder = "Describe the website you want...";
            return;
        }
        if (isSearchModeQueued) {
            messageInput.placeholder = "What should I search for?";
            return;
        }
        messageInput.placeholder = "Ask me anything...";
    }
    function updateHomeworkModeUI() {
        const isWorkspaceModeActive = isHomeworkModeActive || isBuildModeActive;
        if (homeworkTabButton) {
            homeworkTabButton.classList.toggle('active', isHomeworkModeActive);
        }
        if (buildTabButton) {
            buildTabButton.classList.toggle('active', isBuildModeActive);
        }
        if (chatComposer) {
            chatComposer.style.display = isWorkspaceModeActive ? 'none' : '';
        }
        if (chatMessagesContainer) {
            chatMessagesContainer.style.display = isWorkspaceModeActive ? 'none' : '';
        }
        if (homeworkWorkspace) {
            homeworkWorkspace.style.display = isHomeworkModeActive ? 'block' : 'none';
        }
        if (buildWorkspace) {
            buildWorkspace.style.display = isBuildModeActive ? 'block' : 'none';
        }
        if (chatInputContainer) {
            chatInputContainer.style.display = isWorkspaceModeActive ? 'none' : '';
            chatInputContainer.style.borderTop = '';
            chatInputContainer.style.backgroundColor = '';
            chatInputContainer.style.backdropFilter = '';
            chatInputContainer.style.paddingTop = '';
        }
        updateHomeworkWorkspaceStageUI();
        refreshBuildHeadline();
        refreshBuildSprite();
        setDynamicChatTitle();
        syncLandingViewState();
    }
    function shouldShowLandingView() {
        if (isHomeworkModeActive || isBuildModeActive) {
            return false;
        }
        const currentChat = currentChatId ? chats[currentChatId] : null;
        return !currentChat || currentChat.history.length === 0;
    }
    function syncLandingViewState() {
        setChatActiveState(shouldShowLandingView());
    }
    function setHomeworkWorkspaceStage(stage) {
        homeworkWorkspaceStage = stage;
        updateHomeworkWorkspaceStageUI();
        setDynamicChatTitle();
    }
    function updateHomeworkWorkspaceStageUI() {
        if (homeworkWorkspace) {
            homeworkWorkspace.dataset.stage = homeworkWorkspaceStage;
        }
        if (homeworkHomeScreen) {
            homeworkHomeScreen.style.display = isHomeworkModeActive && !isHomeworkWorkspaceActive ? 'flex' : 'none';
        }
        if (homeworkHomeTitle && isHomeworkModeActive && !isHomeworkWorkspaceActive) {
            homeworkHomeTitle.textContent = getHomeworkFunLine();
        }
        if (homeworkWorkspaceHead) {
            homeworkWorkspaceHead.style.display = isHomeworkWorkspaceActive ? 'flex' : 'none';
        }
        if (homeworkIntakeCard) {
            homeworkIntakeCard.style.display = isHomeworkWorkspaceActive && homeworkWorkspaceStage === 'intake' ? 'block' : 'none';
        }
        if (homeworkWorkingState) {
            homeworkWorkingState.style.display = isHomeworkWorkspaceActive && homeworkWorkspaceStage === 'working' ? 'flex' : 'none';
        }
        if (homeworkAnswerCard) {
            const shouldShowAnswerCard = isHomeworkWorkspaceActive && homeworkWorkspaceStage === 'results' && !!getHomeworkQuestionAtCurrentIndex();
            homeworkAnswerCard.style.display = shouldShowAnswerCard ? 'flex' : 'none';
        }
        if (homeworkDetectedCard) {
            homeworkDetectedCard.style.display = 'none';
        }
    }
    function escapeHtml(text = '') {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function parseHomeworkQuestions(rawText = '') {
        const normalized = rawText.replace(/\r/g, '').trim();
        if (!normalized) return [];

        const isLikelyWorksheetHeader = (entry) => {
            const text = entry.trim().toLowerCase();
            if (!text) return true;

            const headerPatterns = [
                /^terms:\s*/,
                /^name:\s*/,
                /^date:\s*/,
                /^period:\s*/,
                /^unit\s+\d+/,
                /\bhw\s*#?\d+/,
                /\bhomework\b/,
                /\banswer below on this sheet\b/,
                /\bshow your work\b/,
                /\bwrite your answers\b/,
                /\bpage\s+\d+\b/
            ];

            const looksLikeHeader = headerPatterns.some((pattern) => pattern.test(text));
            const hasQuestionSignal = /[?=+\-/*^]|find|solve|graph|simplify|factor|evaluate|determine|write|identify|explain|compare|what|which|how|why/.test(text);

            if (looksLikeHeader && !hasQuestionSignal) {
                return true;
            }

            const wordCount = text.split(/\s+/).filter(Boolean).length;
            const looksLikeMetadata = /\bunit\b|\bhw\b|\bscore\b|\bpoints?\b|\bworksheet\b/.test(text);
            if (looksLikeMetadata && wordCount <= 10 && !hasQuestionSignal) {
                return true;
            }

            return false;
        };

        const numberedLines = normalized
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        const numberedRegex = /^((\d+|[A-Za-z])[\)\.\-:])\s+/;
        const grouped = [];
        let current = '';

        numberedLines.forEach((line) => {
            if (numberedRegex.test(line) && current) {
                grouped.push(current.trim());
                current = line;
            } else if (numberedRegex.test(line)) {
                current = line;
            } else if (current) {
                current += ` ${line}`;
            } else {
                grouped.push(line);
            }
        });

        if (current) grouped.push(current.trim());

        let questions = grouped
            .map((entry) => entry.replace(numberedRegex, '').trim())
            .filter(Boolean)
            .filter((entry) => !isLikelyWorksheetHeader(entry));

        if (questions.length <= 1) {
            questions = normalized
                .split(/(?<=\?)(?:\s+|\n+)/)
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 12)
                .filter((entry) => !isLikelyWorksheetHeader(entry));
        }

        if (questions.length <= 1) {
            questions = normalized
                .split(/\n{2,}/)
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 12)
                .filter((entry) => !isLikelyWorksheetHeader(entry));
        }

        return questions.map((question, index) => ({
            id: `hw_q_${index + 1}`,
            number: index + 1,
            text: question
        }));
    }
    function renderHomeworkDetectedQuestions() {
        if (!homeworkDetectedList || !homeworkDetectedCount) return;
        homeworkDetectedCount.textContent = `${homeworkParsedQuestions.length} found`;

        if (!homeworkParsedQuestions.length) {
            homeworkDetectedList.innerHTML = '<div class="homework-empty-state">Parsed questions will show up here.</div>';
            return;
        }

        homeworkDetectedList.innerHTML = homeworkParsedQuestions
            .map((question) => `
                <article class="homework-question-preview">
                    <strong>Question ${question.number}</strong>
                    <p>${escapeHtml(question.text)}</p>
                </article>
            `)
            .join('');
    }
    function updateHomeworkFileSummary() {
        if (!homeworkFileSummary) return;
        if (!homeworkSourceFiles.length) {
            homeworkFileSummary.textContent = 'No homework sheets added yet.';
            return;
        }
        const names = homeworkSourceFiles.map((file) => file.name).join(', ');
        homeworkFileSummary.textContent = `${homeworkSourceFiles.length} file${homeworkSourceFiles.length === 1 ? '' : 's'} added: ${names}`;
    }
    function getHomeworkQuestionAtCurrentIndex() {
        return homeworkParsedQuestions[currentHomeworkQuestionIndex] || null;
    }
    function renderHomeworkAnswerCard() {
        if (!homeworkAnswerCard || !homeworkQuestionPosition || !homeworkQuestionTitle || !homeworkQuestionText || !homeworkAnswerText || !homeworkNextBtn) {
            return;
        }

        const question = getHomeworkQuestionAtCurrentIndex();
        if (!question) {
            if (homeworkAnswerCard) {
                homeworkAnswerCard.style.display = 'none';
            }
            return;
        }

        if (homeworkWorkspaceStage === 'results') {
            homeworkAnswerCard.style.display = 'flex';
        }
        homeworkQuestionPosition.textContent = `Question ${question.number} of ${homeworkParsedQuestions.length}`;
        homeworkQuestionTitle.textContent = `Question ${question.number}`;
        homeworkQuestionText.textContent = question.text;
        homeworkAnswerText.textContent = question.answer || 'Solving this question now...';
        homeworkNextBtn.disabled = currentHomeworkQuestionIndex >= homeworkParsedQuestions.length - 1;

        if (homeworkDetectedList) {
            const entries = homeworkDetectedList.querySelectorAll('.homework-question-preview');
            entries.forEach((entry, index) => {
                entry.classList.toggle('active', index === currentHomeworkQuestionIndex);
            });
        }
    }
    function setHomeworkAnswerStatus(label, isLoading = false) {
        if (!homeworkAnswerStatus) return;
        homeworkAnswerStatus.textContent = label;
        homeworkAnswerStatus.classList.toggle('is-loading', isLoading);
    }
    function buildHomeworkMessages(question, mode = 'default') {
        const systemPrompt = [
            'You are Graxybot solving homework questions.',
            'The pasted worksheet may include headers, directions, point values, teacher notes, examples, page labels, or other non-question text before the actual question.',
            'Your job is to infer the real question from the provided worksheet block and answer that, not complain that no question was given unless the block truly has nothing solvable in it.',
            'If there is setup text plus a question, treat the setup as context and solve the actual task.',
            'If the wording is messy, incomplete, or mixed with worksheet junk, still do your best to infer what the student needs solved.',
            'Answer in simple lowercase language.',
            'Be short and useful.',
            'Default mode: answer in the fewest words possible while staying correct.',
            'Usually keep it to one short sentence or a very short answer fragment.',
            'Do not restate the full question or repeat the prompt wording.',
            'Answer directly, like a filled-in answer sheet entry.',
            'For "define" questions, prefer the format "term: short definition."',
            'Do not use big paragraphs.',
            'If the problem is math, give the result and only the tiniest amount of explanation needed.'
        ].join('\n');

        if (mode === 'elaborate') {
            return [
                { role: 'system', content: `${systemPrompt}\nElaborate mode: explain a little more, but still stay concise and easy to understand.` },
                { role: 'user', content: `Question:\n${question.text}\n\nCurrent short answer:\n${question.answer || ''}\n\nExplain this answer a bit more clearly.` }
            ];
        }

        if (mode === 'shorter') {
            return [
                { role: 'system', content: `${systemPrompt}\nShorter mode: reply in the fewest words possible while staying correct.` },
                { role: 'user', content: `Question:\n${question.text}\n\nCurrent answer:\n${question.answer || ''}\n\nMake it shorter.` }
            ];
        }

        if (mode === 'regenerate') {
            return [
                { role: 'system', content: `${systemPrompt}\nRegenerate mode: keep it short, but rewrite fresh from scratch.` },
                { role: 'user', content: `Question:\n${question.text}\n\nGive a fresh concise answer.` }
            ];
        }

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Question:\n${question.text}\n\nGive the answer in graxybot's simple style.` }
        ];
    }
    async function solveHomeworkQuestion(mode = 'default') {
        const question = getHomeworkQuestionAtCurrentIndex();
        if (!question) return;

        isRequestInProgress = true;
        updateActionButtonsState();
        if (mode === 'default' && !question.answer) {
            setHomeworkWorkspaceStage('working');
        } else {
            setHomeworkWorkspaceStage('results');
            renderHomeworkAnswerCard();
        }
        setHomeworkAnswerStatus(mode === 'default' ? 'Solving...' : 'Updating...', true);
        if (homeworkAnswerText) {
            homeworkAnswerText.textContent = mode === 'default' && !question.answer
                ? 'Solving this question now...'
                : 'Updating answer...';
        }

        try {
            const messages = buildHomeworkMessages(question, mode);
            const answer = await sendMessageToModel(messages, DEFAULT_CHAT_MODEL, true, true);
            question.answer = (answer || '').trim() || 'no answer came back.';
            setHomeworkWorkspaceStage('results');
            renderHomeworkAnswerCard();
            setHomeworkAnswerStatus('Solved', false);
        } catch (error) {
            question.answer = `error: ${error.message}`;
            setHomeworkWorkspaceStage('results');
            renderHomeworkAnswerCard();
            setHomeworkAnswerStatus('Error', false);
        } finally {
            isRequestInProgress = false;
            updateActionButtonsState();
        }
    }
    function openHomeworkWorkspace() {
        isHomeworkModeActive = true;
        isHomeworkWorkspaceActive = true;
        isBuildModeActive = false;
        if (!homeworkParsedQuestions.length) {
            setHomeworkWorkspaceStage('intake');
        }
        setChatActiveState(false);
        updateHomeworkModeUI();
        if (homeworkPasteInput) {
            setTimeout(() => homeworkPasteInput.focus(), 0);
        }
    }
    function closeHomeworkWorkspace() {
        setHomeworkWorkspaceStage('intake');
        isHomeworkWorkspaceActive = false;
        updateHomeworkModeUI();
    }
    function exitHomeworkMode() {
        setHomeworkWorkspaceStage('intake');
        isHomeworkWorkspaceActive = false;
        isHomeworkModeActive = false;
        updateHomeworkModeUI();
    }
    function enterBuildMode() {
        isHomeworkModeActive = false;
        isHomeworkWorkspaceActive = false;
        isBuildModeActive = true;
        if (buildFlowState === 'idle') {
            advanceBuildHeadline();
            chooseBuildSprite();
            showBuildIdleScreen();
        } else {
            refreshBuildSprite();
        }
        setChatActiveState(false);
        updateHomeworkModeUI();
    }
    function exitBuildMode() {
        isBuildModeActive = false;
        updateHomeworkModeUI();
    }
    function updateSearchModeUI() {
        if (searchModeButton) {
            searchModeButton.classList.toggle('active', isSearchModeQueued);
        }
        if (chatInputArea) {
            const busy = isRequestInProgress || isListening;
            chatInputArea.classList.toggle('search-mode-armed', isSearchModeQueued && !busy);
        }
        refreshInputPlaceholder();
    }
    function addMessageToHistory(role, contentParts, imagePreview = null, generatedMediaSrc = null, mediaPrompt = null, extraData = null) {
       if (!currentChatId) { handleNewChat(false); }
       if (!chats[currentChatId]) return;
       if (role === 'user' && chats[currentChatId].history.length === 0) {
           const firstText = contentParts.find(p => p.text)?.text;
           chats[currentChatId].title = firstText ? firstText.substring(0, 30) : "New Chat";
           renderChatList();
       }
       const messageData = { role, parts: contentParts, timestamp: new Date().toISOString() };
       if (imagePreview) messageData.imagePreview = imagePreview;
       if (generatedMediaSrc) {
           messageData.generatedMediaSrc = generatedMediaSrc;
           messageData.mediaPrompt = mediaPrompt;
       }
       if (extraData) {
           messageData.extraData = extraData;
       }
       chats[currentChatId].history.push(messageData);
       saveChats();
    }
    function getChatHistoryForContext(limit = 10) {
        if (!currentChatId || !chats[currentChatId]) return [];
        return chats[currentChatId].history
            .filter((msg) => !msg?.extraData?.excludeFromContext)
            .slice(-limit);
    }
    function createChatReplyExtraData(sourcePrompt = '', overrides = {}) {
        return {
            messageType: 'chat_reply',
            transformable: true,
            showTransformActions: Math.random() < 0.5,
            sourcePrompt,
            ...overrides
        };
    }
    function shouldShowTransformActions({ sender, isError, textContent, generatedMediaSrc, imagePreview, extraData }) {
        if (sender !== 'bot' || isError) return false;
        if (!textContent || !textContent.trim()) return false;
        if (generatedMediaSrc || imagePreview) return false;
        if (!extraData || extraData.type === 'web_design') return false;
        return extraData.transformable === true && extraData.showTransformActions === true;
    }
    function setTransformButtonsBusy(actionsRow, busy, loadingLabel = '') {
        if (!actionsRow) return;
        actionsRow.classList.toggle('is-busy', busy);
        actionsRow.querySelectorAll('.message-transform-btn').forEach((button) => {
            button.disabled = busy;
        });
        if (busy && loadingLabel) {
            actionsRow.dataset.loadingLabel = loadingLabel;
        } else {
            delete actionsRow.dataset.loadingLabel;
        }
    }
    function attachTransformActions(wrapper, textContent, extraData = {}) {
        if (!wrapper || !textContent?.trim()) return;
        const bubbleDiv = wrapper.querySelector('.message-bubble');
        if (!bubbleDiv) return;

        const existing = bubbleDiv.querySelector('.message-transform-actions');
        if (existing) existing.remove();

        const actionsRow = document.createElement('div');
        actionsRow.className = 'message-transform-actions';

        BOT_TRANSFORM_ACTIONS.forEach((action) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'message-transform-btn';
            button.textContent = action.label;
            button.addEventListener('click', () => {
                handleMessageTransform(action.id, {
                    sourceText: textContent,
                    sourcePrompt: extraData?.sourcePrompt || ''
                }, actionsRow);
            });
            actionsRow.appendChild(button);
        });

        bubbleDiv.appendChild(actionsRow);
    }
    async function handleMessageTransform(actionId, context, actionsRow) {
        if (isRequestInProgress) {
            showToast('graxybot is already working on something.', 'info', 2200);
            return;
        }

        const action = getTransformActionById(actionId);
        const sourceText = context?.sourceText?.trim();
        if (!action || !sourceText) return;

        const usageAttempt = tryConsumeUsage('chats');
        if (!usageAttempt.success) {
            const waitText = usageAttempt.remainingMs
                ? ` try again in ${formatDuration(usageAttempt.remainingMs)}.`
                : '';
            showToast(`chat limit reached.${waitText}`, 'error', 4000);
            return;
        }

        const modelToUse = DEFAULT_CHAT_MODEL;
        const systemPrompt = getSystemPrompt(modelToUse, userPersonality);
        const rewriteInstruction = action.buildInstruction(userPersonality);
        const messagesForModel = [
            { role: 'system', content: systemPrompt },
            ...(context?.sourcePrompt ? [{ role: 'user', content: `Original user request: ${context.sourcePrompt}` }] : []),
            { role: 'assistant', content: sourceText },
            { role: 'user', content: rewriteInstruction }
        ];

        isRequestInProgress = true;
        updateActionButtonsState();
        setTransformButtonsBusy(actionsRow, true, action.loadingLabel);

        try {
            const replyExtraData = createChatReplyExtraData(context?.sourcePrompt || '', {
                excludeFromContext: true,
                transformSource: action.id
            });
            const transformedText = await sendMessageToModel(messagesForModel, modelToUse, true, false, {
                displayExtraData: replyExtraData,
                transformContext: {
                    sourcePrompt: context?.sourcePrompt || ''
                }
            });
            addMessageToHistory('model', [{ text: transformedText }], null, null, null, replyExtraData);
        } catch (error) {
            showToast(`couldn't ${action.label}.`, 'error', 2600);
        } finally {
            isRequestInProgress = false;
            setTransformButtonsBusy(actionsRow, false);
            updateActionButtonsState();
        }
    }
    function showThinkingIndicator(message = 'Thinking...', iconClass = 'fa-brain') {
        removeThinkingIndicator();
        currentThinkingIndicatorElement = displayMessage([], 'bot-thinking', false, null, null, iconClass, message);
        if (currentThinkingIndicatorElement) {
            currentThinkingIndicatorElement.classList.add('thinking-indicator');
            const msgDiv = currentThinkingIndicatorElement.querySelector('.message');
            if (msgDiv) msgDiv.innerHTML = `<span></span><span></span><span></span> ${message}`;
        }
    }
    function removeThinkingIndicator() {
        if (currentThinkingIndicatorElement) {
            currentThinkingIndicatorElement.remove();
            currentThinkingIndicatorElement = null;
        }
    }
    function displayMessage(contentParts, sender, isError = false, imagePreview = null, generatedMediaSrc = null, customIconClass = null, mediaPrompt = null, extraData = null) {
        const usingMeQuickMode = meQuickModeActive && meProfile && meProfile.imageData;

        setChatActiveState(false);
        const wrapper = document.createElement('div');
        wrapper.className = 'message-content-wrapper';
        if (sender === 'user') wrapper.classList.add('user-message');
        const iconDiv = document.createElement('div');
        iconDiv.className = 'message-icon';
        if (sender === 'user') {
            iconDiv.classList.add('user-icon');
            iconDiv.innerHTML = `<i class="${USER_ICON_CLASS}"></i>`;
        } else {
            if (customIconClass) {
                 iconDiv.innerHTML = `<i class="fas ${customIconClass}"></i>`;
            } else {
                const img = document.createElement('img');
                img.src = BOT_ICON_SRC;
                img.alt = "G";
                img.onerror = () => iconDiv.innerHTML = `<i class="fas fa-robot"></i>`;
                iconDiv.appendChild(img);
            }
        }
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        if (isError) messageDiv.classList.add('error-message');
        const paragraph = document.createElement('p');
        paragraph.dataset.streamTarget = "true";
        let textContent = Array.isArray(contentParts) ? (contentParts.find(p => p.text)?.text || '') : '';
        
        if (extraData && extraData.type === 'web_design' && extraData.html) {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';
            container.style.gap = '8px';

            const viewButton = document.createElement('button');
            // Style similar to me-active-controls buttons
            viewButton.style.background = 'transparent';
            viewButton.style.border = '1px solid rgba(255, 193, 7, 0.5)';
            viewButton.style.color = 'var(--text-primary)';
            viewButton.style.padding = '8px 16px';
            viewButton.style.borderRadius = '8px';
            viewButton.style.fontWeight = '600';
            viewButton.style.cursor = 'pointer';
            viewButton.style.display = 'inline-flex';
            viewButton.style.alignItems = 'center';
            viewButton.style.gap = '8px';
            viewButton.style.transition = 'all 0.2s ease';
            
            viewButton.innerHTML = '<i class="fas fa-external-link-alt" style="color: #FFC107;"></i> View Site';
            
            viewButton.onmouseover = () => {
                viewButton.style.background = 'rgba(255, 193, 7, 0.15)';
            };
            viewButton.onmouseout = () => {
                viewButton.style.background = 'transparent';
            };

            viewButton.onclick = () => {
                const blob = new Blob([extraData.html], {type: 'text/html'});
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            };
            
            container.appendChild(viewButton);

            if (extraData.stats) {
                const statsLine = document.createElement('div');
                statsLine.style.fontSize = '0.75rem';
                statsLine.style.color = 'var(--text-secondary)';
                statsLine.style.marginLeft = '4px';
                statsLine.textContent = `${extraData.stats.lines} lines generated in ${extraData.stats.time}s`;
                container.appendChild(statsLine);
            }

            messageDiv.appendChild(container);
        } else {
            if (generatedMediaSrc) {
                const media = document.createElement('img');
                media.src = generatedMediaSrc; media.className = 'generated-image';
                messageDiv.appendChild(media);
                if (mediaPrompt) paragraph.innerHTML = `<em>Prompt: ${mediaPrompt}</em>`;
            } else if (imagePreview) {
                const img = document.createElement('img');
                img.src = imagePreview; img.className = 'sent-image';
                messageDiv.appendChild(img);
            }
            if (textContent) processAndAppendText(textContent, paragraph);
            if (paragraph.hasChildNodes() || paragraph.textContent || sender === 'bot') {
                messageDiv.appendChild(paragraph);
            }
        }

        bubbleDiv.appendChild(messageDiv);
        wrapper.appendChild(iconDiv);
        wrapper.appendChild(bubbleDiv);
        if (shouldShowTransformActions({ sender, isError, textContent, generatedMediaSrc, imagePreview, extraData })) {
            attachTransformActions(wrapper, textContent, extraData);
        }
        chatMessagesContainer.appendChild(wrapper);
        chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'smooth' });
        return wrapper;
    }
    
    function processAndAppendText(text, targetElement, shouldHighlight = true) {
        targetElement.innerHTML = '';
        const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            const precedingText = text.substring(lastIndex, match.index);
            if (precedingText) {
                const textSpan = document.createElement('span');
                textSpan.innerHTML = precedingText.replace(/\n/g, '<br>');
                targetElement.appendChild(textSpan);
            }

            const lang = match[1]?.trim().toLowerCase() || 'plaintext';
            const code = match[2].trim();
            
            const codeContainer = document.createElement('div');
            codeContainer.className = 'code-block-container';

            const header = document.createElement('div');
            header.className = 'code-block-header';

            const langSpan = document.createElement('span');
            langSpan.textContent = lang;

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-block-buttons';

            if (lang === 'html') {
                const runButton = document.createElement('button');
                runButton.innerHTML = '<i class="fas fa-play"></i> Run';
                runButton.title = 'Run Code';
                runButton.onclick = () => handleRunCode(code);
                buttonContainer.appendChild(runButton);
            }

            const copyButton = document.createElement('button');
            copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyButton.title = 'Copy Code';
            copyButton.onclick = (e) => handleCopyCode(code, e.currentTarget);
            buttonContainer.appendChild(copyButton);
            
            header.appendChild(langSpan);
            header.appendChild(buttonContainer);

            const pre = document.createElement('pre');
            const codeEl = document.createElement('code');
            codeEl.className = `language-${lang}`;
            codeEl.textContent = code;

            pre.appendChild(codeEl);
            codeContainer.appendChild(header);
            codeContainer.appendChild(pre);
            targetElement.appendChild(codeContainer);
            
            lastIndex = codeBlockRegex.lastIndex;
        }

        const remainingText = text.substring(lastIndex);
        if (remainingText) {
            const textSpan = document.createElement('span');
            textSpan.innerHTML = remainingText.replace(/\n/g, '<br>');
            targetElement.appendChild(textSpan);
        }

        if (shouldHighlight && window.Prism) {
            setTimeout(() => Prism.highlightAllUnder(targetElement), 0);
        }
    }

    function handleCopyCode(codeContent, buttonElement) {
        navigator.clipboard.writeText(codeContent).then(() => {
            showToast("Code copied!", 'success');
            buttonElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => { 
                buttonElement.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            showToast("Failed to copy code.", 'error');
        });
    }

    function handleRunCode(codeContent) {
        try {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.open();
                newWindow.document.write(codeContent);
                newWindow.document.close();
            } else {
                showToast("Please allow pop-ups to run code.", 'error');
            }
        } catch (e) {
             showToast("Error opening window. Check pop-up blocker.", 'error');
             console.error("Error running code:", e);
        }
    }

    function renderChatList() {
        chatList.innerHTML = '';
        const sortedChatIds = Object.keys(chats).sort((a,b) => (chats[b].history[0]?.timestamp || 0) - (chats[a].history[0]?.timestamp || 0));
        sortedChatIds.forEach(id => {
            const li = document.createElement('li');
            li.className = 'chat-list-item';
            li.dataset.chatId = id;
            li.textContent = chats[id].title || 'Chat';
            if (id === currentChatId) li.classList.add('active');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteChat(id); };
            li.appendChild(deleteBtn);
            li.onclick = () => handleSelectChat(id);
            chatList.appendChild(li);
        });
    }
    function loadChat(chatId) {
        if (!chats[chatId]) return;
        isHomeworkModeActive = false;
        isHomeworkWorkspaceActive = false;
        isBuildModeActive = false;
        currentChatId = chatId;
        updateHomeworkModeUI();
        saveChats();
        renderChatList();
        chatMessagesContainer.innerHTML = '';
        const hasHistory = chats[chatId].history.length > 0;
        setChatActiveState(hasHistory ? false : shouldShowLandingView());
        if (hasHistory) {
            chats[chatId].history.forEach(msg => {
                displayMessage(msg.parts, msg.role, false, msg.imagePreview, msg.generatedMediaSrc, null, msg.mediaPrompt, msg.extraData);
            });
        }
    }
    function handleNewChat(clearUI = true) {
        isHomeworkModeActive = false;
        isHomeworkWorkspaceActive = false;
        isBuildModeActive = false;
        const newId = generateChatId();
        chats[newId] = { history: [], title: "New Chat" };
        currentChatId = newId;
        updateHomeworkModeUI();
        saveChats();
        renderChatList();
        if (clearUI) {
            chatMessagesContainer.innerHTML = '';
            syncLandingViewState();
            deactivateMeQuickMode();
        }
    }
    function handleSelectChat(id) {
        if (id === currentChatId) return;
        sidebar.classList.remove('visible');
        menuBackdrop.classList.remove('visible');
        loadChat(id);
        deactivateMeQuickMode();
    }
    function handleDeleteChat(id) {
        if (confirm(`Are you sure you want to delete "${chats[id].title}"?`)) {
            delete chats[id];
            if (currentChatId === id) {
                currentChatId = null;
                chatMessagesContainer.innerHTML = '';
                syncLandingViewState();
                deactivateMeQuickMode();
            }
            saveChats();
            renderChatList();
        }
    }
    
    function setChatActiveState(isActive) {
        if (isActive) {
            mainContent.classList.add('initial-view');
        } else {
            mainContent.classList.remove('initial-view');
        }
    }

    async function handleImageSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast("Invalid image file type.", 'error'); return;
        }
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                selectedImageData = reader.result.split(',')[1];
                selectedImageMimeType = file.type;
                selectedImagePreviewUrl = URL.createObjectURL(file);
                imagePreview.src = selectedImagePreviewUrl;
                imagePreviewArea.style.display = 'block';
                updateActionButtonsState();
            };
            reader.onerror = () => { throw new Error("File could not be read.");};
        } catch (e) {
            showToast("Error processing image.", 'error');
            removeSelectedImage();
        }
    }
    function removeSelectedImage() {
        selectedImageData = null; selectedImageMimeType = null;
        if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
        selectedImagePreviewUrl = null;
        imagePreviewArea.style.display = 'none';
        imageUploadInput.value = '';
        updateActionButtonsState();
    }

    // --- Usage Tracking ---
    function loadUsageStats() {
        try {
            const stored = localStorage.getItem(USAGE_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                usageStats = {
                    chats: Array.isArray(parsed?.chats) ? parsed.chats : [],
                    images: Array.isArray(parsed?.images) ? parsed.images : [],
                    searches: Array.isArray(parsed?.searches) ? parsed.searches : []
                };
            } else {
                usageStats = { chats: [], images: [], searches: [] };
            }
        } catch (error) {
            console.error("Error loading usage stats:", error);
            usageStats = { chats: [], images: [], searches: [] };
        }
        pruneUsageStats();
    }

    function saveUsageStats() {
        try {
            localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageStats));
        } catch (error) {
            console.error("Error saving usage stats:", error);
        }
    }

    function pruneUsageStats(save = true) {
        const now = Date.now();
        const types = ['chats', 'images', 'searches'];
        types.forEach(type => {
            const { windowMs } = getUsageConfig(type);
            usageStats[type] = (usageStats[type] || []).filter(ts => now - ts < windowMs);
        });
        if (save) saveUsageStats();
    }

    function getUsageConfig(type) {
        if (type === 'images') return { limit: IMAGE_USAGE_LIMIT, windowMs: USAGE_WINDOW_MS };
        if (type === 'searches') return { limit: SEARCH_USAGE_LIMIT, windowMs: SEARCH_USAGE_WINDOW_MS };
        return { limit: CHAT_USAGE_LIMIT, windowMs: USAGE_WINDOW_MS };
    }

    function getUsageStatus(type) {
        const { limit, windowMs } = getUsageConfig(type);
        const list = usageStats[type] || [];
        const now = Date.now();
        const count = list.length;
        let remainingMs = windowMs;
        if (count > 0) {
            const oldest = Math.min(...list);
            remainingMs = Math.max(0, windowMs - (now - oldest));
        }
        return { count, limit, remainingMs };
    }

    function tryConsumeUsage(type) {
        pruneUsageStats(false);
        const { limit, windowMs } = getUsageConfig(type);
        usageStats[type] = usageStats[type] || [];
        const list = usageStats[type];
        if (list.length >= limit) {
            const oldest = Math.min(...list);
            const remainingMs = Math.max(0, windowMs - (Date.now() - oldest));
            saveUsageStats();
            return { success: false, remainingMs };
        }
        list.push(Date.now());
        saveUsageStats();
        updateUsageUI();
        return { success: true, remainingMs: 0 };
    }

    function formatDuration(ms) {
        if (!ms || ms <= 0) return 'a few moments';
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        return `${Math.max(minutes, 1)}m`;
    }

    function updateUsageUI() {
        pruneUsageStats(false);
        const chatStatus = getUsageStatus('chats');
        const imageStatus = getUsageStatus('images');

        if (usageChatsLabel) usageChatsLabel.textContent = `${chatStatus.count} / ${chatStatus.limit}`;
        if (usageImagesLabel) usageImagesLabel.textContent = `${imageStatus.count} / ${imageStatus.limit}`;

        const chatPercent = chatStatus.limit ? Math.min(100, (chatStatus.count / chatStatus.limit) * 100) : 0;
        const imagePercent = imageStatus.limit ? Math.min(100, (imageStatus.count / imageStatus.limit) * 100) : 0;

        if (usageChatsBar) {
            usageChatsBar.style.width = `${chatPercent}%`;
            usageChatsBar.classList.toggle('at-limit', chatStatus.count >= chatStatus.limit);
        }
        if (usageImagesBar) {
            usageImagesBar.style.width = `${imagePercent}%`;
            usageImagesBar.classList.toggle('at-limit', imageStatus.count >= imageStatus.limit);
        }

        if (usageChatsReset) {
            usageChatsReset.textContent = chatStatus.count
                ? `Resets in ${formatDuration(chatStatus.remainingMs)}`
                : 'Full allowance available';
        }
        if (usageImagesReset) {
            usageImagesReset.textContent = imageStatus.count
                ? `Resets in ${formatDuration(imageStatus.remainingMs)}`
                : 'Full allowance available';
        }
    }

    function showActionCoachmark() {
        if (!actionCoachmark) return;
        actionCoachmark.classList.add('visible');
        if (coachmarkHideTimeout) {
            clearTimeout(coachmarkHideTimeout);
        }
        coachmarkHideTimeout = setTimeout(() => hideActionCoachmark(true), 5000);
    }

    function hideActionCoachmark(removeNode = false) {
        if (!actionCoachmark) return;
        actionCoachmark.classList.remove('visible');
        if (coachmarkHideTimeout) {
            clearTimeout(coachmarkHideTimeout);
            coachmarkHideTimeout = null;
        }
        if (removeNode) {
            setTimeout(() => {
                actionCoachmark?.remove();
                actionCoachmark = null;
            }, 400);
        }
    }

    function activateSettingsTab(tabId = 'profile') {
        if (!settingsTabButtons || !settingsTabPanels) return;
        settingsTabButtons.forEach(btn => {
            if (!btn) return;
            btn.classList.toggle('active', btn.dataset.settingsTab === tabId);
        });
        settingsTabPanels.forEach(panel => {
            if (!panel) return;
            panel.classList.toggle('active', panel.dataset.settingsPanel === tabId);
        });
        if (tabId === 'usage') {
            updateUsageUI();
        }
    }

    function saveMeProfile() {
        try {
            if (meProfile && meProfile.imageData) {
                localStorage.setItem(ME_PROFILE_STORAGE_KEY, JSON.stringify(meProfile));
            } else {
                localStorage.removeItem(ME_PROFILE_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Error saving me profile:", error);
        }
    }

    function loadMeProfileFromStorage() {
        try {
            const stored = localStorage.getItem(ME_PROFILE_STORAGE_KEY);
            meProfile = stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error("Error loading me profile:", error);
            meProfile = null;
        }
        updateMePopupUI();
    }

    function activateMeQuickMode(focusInput = true) {
        meQuickModeActive = true;
        if (messageInput) {
            if (!messageInput.dataset.prevPlaceholder) {
                messageInput.dataset.prevPlaceholder = messageInput.placeholder;
            }
            messageInput.placeholder = "describe your remix...";
            messageInput.classList.add('me-input-highlight');
            if (focusInput) {
                setTimeout(() => messageInput.focus(), 0);
            }
        }
        if (meActiveBanner) {
            meActiveBanner.style.display = 'flex';
        }
        showToast("me photo ready. type your remix and hit send.", "info", 2200);
        updateActionButtonsState();
    }

    function deactivateMeQuickMode() {
        meQuickModeActive = false;
        if (messageInput) {
            messageInput.classList.remove('me-input-highlight');
        }
        if (messageInput && messageInput.dataset.prevPlaceholder) {
            delete messageInput.dataset.prevPlaceholder;
        }
        refreshInputPlaceholder();
        if (meActiveBanner) {
            meActiveBanner.style.display = 'none';
        }
        updateActionButtonsState();
    }

    function updateMePopupUI() {
        if (!mePopup || !meMediaPreview || !meMediaPlaceholder || !mePhotoPreview || !meRetakeRow || !meRetakeBtn || !meRemoveBtn || !meStartCameraBtn || !meUploadBtn || !meSubtitle) return;
        const hasPhoto = meProfile && meProfile.imageData;
        const placeholder = meMediaPlaceholder;
        const photoImg = mePhotoPreview;

        if (!meIsCapturing) {
            meCameraStreamEl.style.display = 'none';
            meCaptureBtn.style.display = 'none';
        }

        if (hasPhoto) {
            const dataUrl = `data:${meProfile.mimeType || 'image/png'};base64,${meProfile.imageData}`;
            photoImg.src = dataUrl;
            photoImg.style.display = 'block';
            photoImg.classList.add('has-photo');
            placeholder.style.display = 'none';
            meMediaPreview.style.display = 'flex';
            meMediaPreview.classList.add('clickable');
            if (meRetakeRow) {
                meRetakeRow.style.display = 'flex';
                requestAnimationFrame(() => meRetakeRow.classList.add('visible'));
            }
            meRetakeBtn.style.display = 'block';
            meRemoveBtn.style.display = 'block';
            meStartCameraBtn.style.display = 'none';
            meUploadBtn.style.display = 'none';
            meSubtitle.textContent = "ready when you are. describe what you want graxybot to make.";
        } else {
            if (!meIsCapturing) {
                photoImg.style.display = 'none';
                photoImg.classList.remove('has-photo');
                placeholder.style.display = 'block';
                meMediaPreview.style.display = 'flex';
                meMediaPreview.classList.remove('clickable');
                mePromptArea.style.display = 'none';
                if (meRetakeRow) {
                    meRetakeRow.classList.remove('visible');
                    setTimeout(() => {
                        if (meRetakeRow && !meRetakeRow.classList.contains('visible')) {
                            meRetakeRow.style.display = 'none';
                        }
                    }, 200);
                }
                meRetakeBtn.style.display = 'none';
                meRemoveBtn.style.display = 'none';
                meStartCameraBtn.style.display = 'block';
                meUploadBtn.style.display = 'block';
                meSubtitle.textContent = "snap a quick pic so graxybot can remix you into anything.";
                mePromptInput.value = '';
            }
        }
    }

    function showMePopup() {
        if (!mePopup) return;
        mePopup.classList.add('visible');
        updateMePopupUI();
        if (mePromptInput && meProfile && meProfile.imageData) {
            setTimeout(() => mePromptInput.focus(), 0);
        }
    }

    function hideMePopup() {
        if (!mePopup) return;
        mePopup.classList.remove('visible');
        stopMeCamera();
    }

    async function startMeCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("camera not supported, try uploading a photo.", "error");
            return;
        }
        try {
            meStream = await navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 720 } });
            meCameraStreamEl.srcObject = meStream;
            await meCameraStreamEl.play();
            meIsCapturing = true;
            meCameraStreamEl.style.display = 'block';
            meMediaPreview.style.display = 'none';
            meCaptureBtn.style.display = 'block';
            meStartCameraBtn.style.display = 'none';
            meUploadBtn.style.display = 'none';
            mePromptArea.style.display = 'none';
            meRetakeBtn.style.display = 'none';
            if (meRetakeRow) {
                meRetakeRow.style.display = 'none';
                meRetakeRow.classList.remove('visible');
            }
            if (meRemoveBtn) meRemoveBtn.style.display = 'none';
            meSubtitle.textContent = "line up your face and tap capture.";
        } catch (error) {
            console.error("camera error:", error);
            showToast("couldn't open camera, try uploading instead.", "error");
            stopMeCamera();
        }
    }

    function stopMeCamera() {
        if (meStream) {
            meStream.getTracks().forEach(track => track.stop());
            meStream = null;
        }
        meIsCapturing = false;
        if (meCameraStreamEl) {
            meCameraStreamEl.pause();
            meCameraStreamEl.style.display = 'none';
            meCameraStreamEl.srcObject = null;
        }
        meCaptureBtn.style.display = 'none';
        meUploadBtn.style.display = 'block';
        meStartCameraBtn.style.display = meProfile && meProfile.imageData ? 'none' : 'block';
        updateMePopupUI();
    }

    function handleMeCapture() {
        if (!meIsCapturing) return;
        const video = meCameraStreamEl;
        if (!video.videoWidth || !video.videoHeight) {
            showToast("camera still warming up. try again.", "error");
            return;
        }
        const canvas = meCanvas;
        const ctx = canvas.getContext('2d');
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        meProfile = {
            imageData: base64,
            mimeType: 'image/png',
            updatedAt: new Date().toISOString()
        };
        saveMeProfile();
        stopMeCamera();
        hideMePopup();
        activateMeQuickMode();
        showToast("me photo saved! type your remix and hit send.", "success", 2500);
    }

    function handleMeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast("unsupported image type.", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const base64 = result.split(',')[1];
            meProfile = {
                imageData: base64,
                mimeType: file.type,
                updatedAt: new Date().toISOString()
            };
            saveMeProfile();
            hideMePopup();
            activateMeQuickMode();
            showToast("me photo saved! type your remix and hit send.", "success", 2500);
            meUploadInput.value = '';
        };
        reader.onerror = () => {
            showToast("couldn't read that photo.", "error");
        };
        reader.readAsDataURL(file);
    }

    async function handleMeGenerate() {
        if (!meProfile || !meProfile.imageData) {
            showToast("grab or upload a photo first.", "error");
            return;
        }
        hideMePopup();
        activateMeQuickMode();
        showToast("me mode ready. type your remix!", "info", 2000);
    }

    function handleMeRemove() {
        meProfile = null;
        saveMeProfile();
        mePromptInput.value = '';
        updateMePopupUI();
        deactivateMeQuickMode();
    }
    
    function isImageGenerationRequest(prompt) {
        const lowercasedPrompt = prompt.toLowerCase();
        const keywords = [
            'draw', 'paint', 'sketch', 'illustrate', 'generate an image', 
            'make an image', 'create an image', 'show me a picture', 'make a picture',
            'create a picture'
        ];
        return keywords.some(keyword => lowercasedPrompt.includes(keyword));
    }

    function randomVividColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60 + Math.random() * 20;
        const lightness = 45 + Math.random() * 10;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    function isLikelyFreshInfoQuery(text = '') {
        const lower = text.toLowerCase();
        const keywords = [
            'moist'
        ];
        return keywords.some(k => lower.includes(k));
    }

    function buildSwirlGradient() {
        const colors = [randomVividColor(), randomVividColor(), randomVividColor()];
        const start = Math.floor(Math.random() * 360);
        return `conic-gradient(from ${start}deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`;
    }

    function truncatePromptText(text, maxLength = 68) {
        if (!text) return '';
        const trimmed = text.trim();
        if (trimmed.length <= maxLength) return trimmed;
        return `${trimmed.substring(0, maxLength - 1)}…`;
    }

    function showImageGenerationProgress(promptText = '') {
        removeThinkingIndicator();
        const wrapper = displayMessage([], 'bot', false, null, null, 'fa-palette');
        if (!wrapper) return null;
        wrapper.classList.add('image-build-message');
        const messageDiv = wrapper.querySelector('.message');
        if (messageDiv) {
            messageDiv.innerHTML = '';
            const preview = document.createElement('div');
            preview.className = 'image-build-preview';

            const swatch = document.createElement('div');
            swatch.className = 'image-build-swatch';
            swatch.style.background = buildSwirlGradient();
            swatch.style.animationDelay = `${(Math.random() * 1.4).toFixed(2)}s`;
            preview.appendChild(swatch);

            const glow = document.createElement('div');
            glow.className = 'image-build-glow';
            glow.style.animationDelay = `${(Math.random() * 1.2).toFixed(2)}s`;
            preview.appendChild(glow);

            messageDiv.appendChild(preview);

            const caption = document.createElement('div');
            caption.className = 'image-build-caption';
            const title = document.createElement('strong');
            title.textContent = 'graxybot is painting…';
            caption.appendChild(title);
            const trimmedPrompt = truncatePromptText(promptText);
            if (trimmedPrompt) {
                const promptLine = document.createElement('span');
                promptLine.className = 'caption-prompt';
                promptLine.textContent = `“${trimmedPrompt}”`;
                caption.appendChild(promptLine);
            } else {
                const promptLine = document.createElement('span');
                promptLine.className = 'caption-prompt';
                promptLine.textContent = 'dreaming something vivid for you';
                caption.appendChild(promptLine);
            }
            messageDiv.appendChild(caption);
        }
        currentThinkingIndicatorElement = wrapper;
        return wrapper;
    }

    async function triggerGeminiImageGeneration(promptText, isForTheme = false, referenceImage = null) {
        if (!isForTheme) {
            hideActionCoachmark(true);
            showImageGenerationProgress(promptText);
        }
        isRequestInProgress = true; 
        if(!isForTheme) updateActionButtonsState();

        const payload = { 
            prompt: promptText,
            model: isForTheme ? 'gpt-image-1-mini' : (currentImageModel || 'gpt-image-1-mini')
        };
        if (referenceImage && referenceImage.imageData) {
            payload.referenceImage = {
                data: referenceImage.imageData,
                mimeType: referenceImage.mimeType || 'image/png'
            };
        }
        try {
            const response = await fetch(GEMINI_IMAGE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const responseText = await response.text();
            if(!isForTheme) removeThinkingIndicator();
            let parsedData = null;
            if (responseText) {
                try {
                    parsedData = JSON.parse(responseText);
                } catch (err) {
                    parsedData = null;
                }
            }
            if (!response.ok) {
                let errorMessage = `API error ${response.status}`;
                if (parsedData?.message) {
                    errorMessage = parsedData.message;
                } else if (parsedData?.error) {
                    errorMessage = typeof parsedData.error === 'string' ? parsedData.error : JSON.stringify(parsedData.error);
                } else if (responseText) {
                    errorMessage = responseText;
                }
                throw new Error(errorMessage);
            }
            const data = parsedData || {};
            if (data.image || data.imageUrl) {
                const imageSrc = data.image
                    ? `data:${data.mimeType || 'image/png'};base64,${data.image}`
                    : data.imageUrl;
                if (isForTheme) {
                    return imageSrc;
                } else {
                    displayMessage([], 'bot', false, null, imageSrc, 'fa-palette', promptText);
                    addMessageToHistory('model', [{text: `Image generated`}], null, imageSrc, promptText);
                }
            } else {
                throw new Error('No image data returned from Gemini.');
            }
        } catch (error) {
            removeThinkingIndicator();
            if(!isForTheme) {
                const friendlyMessage = error.message?.startsWith('API error')
                    ? `Image generation failed: ${error.message}`
                    : error.message || 'Image generation failed.';
                displayMessage([{ text: friendlyMessage }], 'bot', true);
            }
            throw error;
        } finally {
            removeThinkingIndicator();
            isRequestInProgress = false; 
            if(!isForTheme) {
                deactivateImageGenerationMode(); 
                updateActionButtonsState();
            }
        }
    }
    async function streamOpenAIResponse(messages, modelName, stream = true, silent = false, options = {}) {
        console.log("sendMessageToOpenAI: Start", modelName);
        // If silent, we don't display a message initially
        const botMessageElement = (!silent && stream)
            ? displayMessage([], 'bot', false, null, null, null, null, options.displayExtraData || null)
            : null;
        const paragraph = botMessageElement ? botMessageElement.querySelector('[data-stream-target="true"]') : null;
        
        let fullResponseText = "";
        try {
            const response = await fetch(OPENAI_PROXY_ENDPOINT, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: modelName, messages, stream: true })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Proxy error ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                chunk.split('\n').forEach(line => {
                    if (!line.startsWith('data: ')) {
                        if (line.trim() !== '') {
                            console.warn("Unexpected non-data: prefixed line in stream:", line);
                        }
                        return;
                    }
                    const data = line.substring(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponseText += content;
                            if (typeof options.onStreamText === 'function') {
                                options.onStreamText(content, fullResponseText);
                            }
                            if (paragraph) {
                               processAndAppendText(fullResponseText, paragraph, false); // No highlight during stream
                               chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'auto' });
                            }
                        }
                    } catch (e) { 
                        console.warn("Non-JSON data in stream:", data, e);
                    }
                });
            }
            if (paragraph) {
                processAndAppendText(fullResponseText, paragraph, true); // Highlight at the end
            }
            if (botMessageElement && options.transformContext && fullResponseText.trim()) {
                attachTransformActions(botMessageElement, fullResponseText, {
                    ...(options.displayExtraData || {}),
                    ...options.transformContext
                });
            }
            console.log("sendMessageToOpenAI: End (Success)");
            return fullResponseText;
        } catch (error) {
            if (paragraph) {
                paragraph.textContent = `Error: ${error.message}`;
                paragraph.parentElement.classList.add('error-message');
            }
            console.error("sendMessageToOpenAI: Error", error);
            throw error;
        }
    }

    async function sendMessageToModel(messages, modelName, stream = true, silent = false, options = {}) {
        if (modelName === GEMINI_CHAT_MODEL) {
            console.log("sendMessageToGemini: Start", modelName);
            const botMessageElement = (!silent && stream)
                ? displayMessage([], 'bot', false, null, null, null, null, options.displayExtraData || null)
                : null;
            const paragraph = botMessageElement ? botMessageElement.querySelector('[data-stream-target="true"]') : null;
            let fullResponseText = "";
            try {
                const response = await fetch(GEMINI_CHAT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Proxy error ${response.status}: ${errorText}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    chunk.split('\n').forEach(line => {
                        if (!line.startsWith('data: ')) {
                            if (line.trim() !== '') {
                                console.warn("Unexpected non-data: prefixed line in stream:", line);
                            }
                            return;
                        }
                        const data = line.substring(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponseText += content;
                                if (typeof options.onStreamText === 'function') {
                                    options.onStreamText(content, fullResponseText);
                                }
                                if (paragraph) {
                                    processAndAppendText(fullResponseText, paragraph, false); // No highlight during stream
                                    chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'auto' });
                                }
                            }
                        } catch (e) {
                            console.warn("Non-JSON data in stream:", data, e);
                        }
                    });
                }
                if (paragraph) {
                    processAndAppendText(fullResponseText, paragraph, true); // Highlight at end
                }
                if (botMessageElement && options.transformContext && fullResponseText.trim()) {
                    attachTransformActions(botMessageElement, fullResponseText, {
                        ...(options.displayExtraData || {}),
                        ...options.transformContext
                    });
                }
                console.log("sendMessageToGemini: End (Success)");
                return fullResponseText;
            } catch (error) {
                if (paragraph) {
                    const errMsg = /429|quota|resource_exhausted/i.test(error?.message || '')
                        ? "nano banana is taking a breather. try again in a bit."
                        : `Error: ${error.message}`;
                    paragraph.textContent = errMsg;
                    paragraph.parentElement.classList.add('error-message');
                }
                console.error("sendMessageToGemini: Error", error);
                throw error;
            }
        }

        return streamOpenAIResponse(messages, modelName, stream, silent, options);
    }

    async function sendSearchRequest(queryText) {
        if (!queryText) throw new Error("Search query missing.");
        const instructions = getSearchSystemPrompt();
        try {
            const response = await fetch(OPENAI_SEARCH_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText, instructions })
            });
            const rawText = await response.text();
            let data = {};
            if (rawText) {
                try {
                    data = JSON.parse(rawText);
                } catch (err) {
                    data = {};
                }
            }
            if (!response.ok) {
                const message = data?.error || data?.details || response.statusText || 'Search request failed.';
                throw new Error(message);
            }
            let text = '';
            if (typeof data?.text === 'string') {
                text = data.text.trim();
            } else if (Array.isArray(data?.text)) {
                text = data.text.join('\n').trim();
            } else if (Array.isArray(data?.output_text)) {
                text = data.output_text.join('\n').trim();
            } else if (Array.isArray(data?.raw?.output_text)) {
                text = data.raw.output_text.join('\n').trim();
            }
            if (!text) {
                text = 'Search finished but no response text was returned.';
            }
            return text;
        } catch (error) {
            console.error("sendSearchRequest error:", error);
            throw error;
        }
    }
    
    async function handleSendMessage() {
        console.log("handleSendMessage: Start");
        const messageText = messageInput.value.trim();
        if (!messageText && !selectedImageData) {
            console.log("handleSendMessage: No message or image, returning.");
            return;
        }

        hideActionCoachmark(true);

        const usingMeQuickMode = meQuickModeActive && meProfile && meProfile.imageData;
        let currentPrompt = messageText;
        let useSearchMode = isSearchModeQueued;

        const shouldGenerateImage = !useSearchMode && (usingMeQuickMode || isImageGenerationModeActive || isImageGenerationRequest(currentPrompt));
        const usageType = useSearchMode ? 'searches' : shouldGenerateImage ? 'images' : 'chats';
        const usageAttempt = tryConsumeUsage(usageType);

        if (!usageAttempt.success) {
            if (usageType === 'searches') {
                showToast("looks like graxybot's under high usage, try asking again later.", 'error', 4000);
            } else {
                const waitText = usageAttempt.remainingMs
                    ? ` try again in ${formatDuration(usageAttempt.remainingMs)}.`
                    : '';
                const label = usageType === 'images' ? 'image' : 'chat';
                showToast(`${label} limit reached.${waitText}`, 'error', 4000);
            }
            return;
        }

        if (useSearchMode) {
            isSearchModeQueued = false;
            updateSearchModeUI();
        }

        setChatActiveState(false);
        
        const userMessageParts = [];
        if (messageText) userMessageParts.push({ text: messageText });
        
        addMessageToHistory('user', userMessageParts, selectedImagePreviewUrl);
        displayMessage(userMessageParts, 'user', false, selectedImagePreviewUrl);

        messageInput.value = '';
        removeSelectedImage();

        // Suggest manual search for time-sensitive questions
        if (!useSearchMode && !shouldGenerateImage && isLikelyFreshInfoQuery(currentPrompt)) {
            const promptMsg = "need fresh info? turn on Search in the + menu, then resend.";
            displayMessage([{ text: promptMsg }], 'bot', false, null, null, 'fa-globe');
            addMessageToHistory('model', [{ text: promptMsg }]);
            updateActionButtonsState();
            return;
        }

        if (shouldGenerateImage) {
            isRequestInProgress = true; 
            updateActionButtonsState();
            console.log("handleSendMessage: Triggering image generation.");
            const promptForImage = usingMeQuickMode
                ? `Use the provided reference photo of this person and transform them accordingly. ${currentPrompt}`
                : currentPrompt;
            await triggerGeminiImageGeneration(promptForImage, false, usingMeQuickMode ? meProfile : null);
            isRequestInProgress = false; 
            updateActionButtonsState();
            if (usingMeQuickMode) {
                deactivateMeQuickMode();
            }

        } else if (useSearchMode) {
            isRequestInProgress = true;
            updateActionButtonsState();
            console.log("handleSendMessage: Running web search.");
            showThinkingIndicator("Searching the web...", 'fa-globe');
            try {
                const searchResponse = await sendSearchRequest(currentPrompt);
                removeThinkingIndicator();
                displayMessage([{ text: searchResponse }], 'bot', false, null, null, 'fa-globe');
                addMessageToHistory('model', [{ text: searchResponse }]);
            } catch (error) {
                removeThinkingIndicator();
                const friendly = /limit|quota|rate/i.test(error?.message || '')
                    ? "search is cooling off. try again soon."
                    : `Search failed: ${error.message}`;
                displayMessage([{ text: friendly }], 'bot', true, null, null, 'fa-globe');
            } finally {
                isRequestInProgress = false;
                updateActionButtonsState();
                console.log("handleSendMessage: End (search).");
            }
        } else if (isWebDesignModeActive) {
            isRequestInProgress = true; 
            updateActionButtonsState();
            console.log("handleSendMessage: Web Design Agent active.");
            
            showThinkingIndicator("Designing your Site...", 'fa-palette');

            // Determine mode from variable
            const designMode = currentWebDesignMode;
            const modelToUse = designMode === 'simple' ? "gpt-4.1-mini" : "gpt-5.4";
            
            const systemPrompt = getWebDesignSystemPrompt(designMode);
            
            const historyForAPI = getChatHistoryForContext(6)
                .map(msg => ({ // Less history for focused design task
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.parts.map(p => p.text).join(' ')
                }));
            
            // Prioritize the current prompt context
            const messagesForModel = [
                { role: "system", content: systemPrompt },
                ...historyForAPI,
                { role: "user", content: currentPrompt } // Ensure current prompt is explicit if history is messy
            ];
            
            // Remove the duplicate user message if it was already added to history above (it is added in handleSendMessage before this block)
            // Actually, historyForAPI includes the message we just added? 
            // Let's check addMessageToHistory... Yes, it pushes to history.
            // So historyForAPI will include the current message as the last item.
            // We just need the system prompt + history.
            
            const messages = [{ role: "system", content: systemPrompt }, ...historyForAPI];

            const startTime = Date.now(); // Start timer

            try {
                const aiResponse = await sendMessageToModel(messages, modelToUse, true, true); // Silent mode
                
                const endTime = Date.now(); // End timer
                const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

                // Extract HTML code from response
                const codeBlockRegex = /```html([\s\S]*?)```/i;
                const match = aiResponse.match(codeBlockRegex);
                const htmlCode = match ? match[1].trim() : aiResponse;
                
                // robust line counting
                const lineCount = htmlCode.split(/\r\n|\r|\n/).length;

                // Display result with View Site button
                const extraData = { 
                    type: 'web_design', 
                    html: htmlCode,
                    stats: { 
                        lines: lineCount, 
                        time: durationSeconds 
                    }
                };
                console.log("Web Design Stats:", extraData.stats); // Debug log

                displayMessage([], 'bot', false, null, null, 'fa-palette', null, extraData);
                addMessageToHistory('model', [{ text: "Website generated" }], null, null, null, extraData);

            } catch (error) {
                 // Error handled in sendMessageToModel / displayMessage
                 removeThinkingIndicator();
                 displayMessage([{ text: `Design failed: ${error.message}` }], 'bot', true);
            } finally {
                removeThinkingIndicator();
                isRequestInProgress = false;
                updateActionButtonsState();
                console.log("handleSendMessage: End (Web Design).");
            }

        } else {
            isRequestInProgress = true; 
            updateActionButtonsState();
            console.log("handleSendMessage: Sending message to model.");
            
            const modelToUse = DEFAULT_CHAT_MODEL;
            const systemPrompt = getSystemPrompt(modelToUse, userPersonality);
            const historyForAPI = getChatHistoryForContext(10)
                .map(msg => ({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.parts.map(p => p.text).join(' ')
                }));
            const messagesForModel = [{ role: "system", content: systemPrompt }, ...historyForAPI];
            
            try {
                const replyExtraData = createChatReplyExtraData(currentPrompt);
                const aiResponse = await sendMessageToModel(messagesForModel, modelToUse, true, false, {
                    displayExtraData: replyExtraData,
                    transformContext: {
                        sourcePrompt: currentPrompt
                    }
                });
                addMessageToHistory('model', [{ text: aiResponse }], null, null, null, replyExtraData);
            } catch (error) {
                // Error is already displayed by sendMessageToModel
            } finally {
                isRequestInProgress = false;
                updateActionButtonsState();
                console.log("handleSendMessage: End.");
            }
        }
    }
    
    // --- UI Toggles & Handlers ---
    function initializeSpeechRecognition() {
        const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechAPI) { 
            micButton.style.display = 'none'; 
            return; 
        }
        speechRecognition = new SpeechAPI();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;

        speechRecognition.onstart = () => { 
            isListening = true; 
            updateActionButtonsState(); 
            messageInput.placeholder = "Listening...";
        };

        speechRecognition.onresult = (e) => { 
            const transcript = e.results[e.results.length - 1][0].transcript;
            messageInput.value = transcript;
        };

        speechRecognition.onend = () => { 
            isListening = false;
            updateActionButtonsState(); 
            refreshInputPlaceholder();
            if(messageInput.value.trim()) {
                handleSendMessage(); 
            }
        };

        speechRecognition.onerror = (e) => { 
            console.error("Speech recognition error:", e.error); 
            showToast(`Mic error: ${e.error}`, 'error'); 
            isListening = false;
            updateActionButtonsState();
            refreshInputPlaceholder();
        };
    }
    function toggleSpeechRecognition() {
        if(isListening) {
             speechRecognition.stop();
        } else {
             if (!speechRecognition) initializeSpeechRecognition();
             speechRecognition.start();
        }
    }
    function deactivateImageGenerationMode() {
        isImageGenerationModeActive = false;
        refreshInputPlaceholder();
        updateImageModeUI();
        updateActionButtonsState();
    }
    function handleCreateImageButtonClick() {
        hideActionCoachmark(true);
        if (actionMenu) actionMenu.classList.remove('visible');
        if (actionMenuToggle) actionMenuToggle.classList.remove('active');

        isImageGenerationModeActive = !isImageGenerationModeActive;
        if (isImageGenerationModeActive) {
            if (isSearchModeQueued) isSearchModeQueued = false;
            if (isWebDesignModeActive) isWebDesignModeActive = false;
        }
        refreshInputPlaceholder();
        updateSearchModeUI();
        updateWebDesignModeUI();
        updateImageModeUI();
        updateActionButtonsState();
        messageInput.focus();
    }
    function handleSearchModeToggle() {
        hideActionCoachmark(true);
        if (isRequestInProgress) return;
        isSearchModeQueued = !isSearchModeQueued;
        if (isSearchModeQueued) {
            if (isImageGenerationModeActive) {
                isImageGenerationModeActive = false;
            }
            if (isWebDesignModeActive) {
                isWebDesignModeActive = false;
            }
            refreshInputPlaceholder();
            if (meQuickModeActive) {
                deactivateMeQuickMode();
            }
            showToast("next message will search the web.", "info", 2200);
        } else {
            showToast("web search off.", "info", 1800);
        }
        updateSearchModeUI();
        updateWebDesignModeUI();
        updateImageModeUI();
        updateActionButtonsState();
        if (actionMenu) actionMenu.classList.remove('visible');
        if (actionMenuToggle) actionMenuToggle.classList.remove('active');
    }
    function handleWebDesignAgentToggle() {
        hideActionCoachmark(true);
        if (isRequestInProgress) return;
        
        isWebDesignModeActive = !isWebDesignModeActive;
        console.log("Web Design Mode toggled:", isWebDesignModeActive);
        
        if (isWebDesignModeActive) {
            // Disable other modes
            if (isImageGenerationModeActive) isImageGenerationModeActive = false;
            if (isSearchModeQueued) isSearchModeQueued = false;
            if (meQuickModeActive) deactivateMeQuickMode();
            
            showToast("Web Design Agent active!", "info", 2000);
        } else {
            showToast("Web Design Agent disabled.", "info", 1800);
        }
        
        updateWebDesignModeUI();
        updateImageModeUI();
        updateActionButtonsState();
        
        // Close menu
        if (agentMenu) agentMenu.classList.remove('visible');
        if (agentMenuToggle) agentMenuToggle.classList.remove('active');
    }

    function updateWebDesignModeUI() {
        if (webDesignAgentButton) {
            webDesignAgentButton.classList.toggle('active', isWebDesignModeActive);
        }
        
        if (webDesignModeContainer) {
            webDesignModeContainer.style.display = isWebDesignModeActive ? 'flex' : 'none';
        }
        
        if (chatInputArea) {
            const busy = isRequestInProgress || isListening;
            chatInputArea.classList.toggle('web-design-mode-active', isWebDesignModeActive && !busy);
            // Re-apply busy state logic just in case
            chatInputArea.classList.toggle('image-mode-busy', (isImageGenerationModeActive || isWebDesignModeActive) && busy);
        }

        if (chatTitle) {
            if (isWebDesignModeActive) {
                // Store original title if needed, or just set it
                chatTitle.textContent = "What can I design?";
            } else {
                setDynamicChatTitle();
            }
        }
        refreshInputPlaceholder();
    }

    function updateImageModeUI() {
        if (customizeImageModeContainer) {
            customizeImageModeContainer.style.display = isImageGenerationModeActive ? 'flex' : 'none';
        }
        const agentContainer = document.querySelector('.agent-menu-container');
        if (agentContainer) {
            agentContainer.style.display = isImageGenerationModeActive ? 'none' : 'flex';
        }
    }
    
    function showPersonalityModal() {
        activateSettingsTab('profile');
        updateUsageUI();
        userNameInput.value = userPersonality.name || '';
        responseStyleInput.value = userPersonality.responseStyle || '';
        personalityOverlay.classList.add('visible');
    }
    function hidePersonalityModal() {
        personalityOverlay.classList.remove('visible');
    }
    function handleSavePersonality() {
        userPersonality.name = userNameInput.value.trim() || null;
        userPersonality.responseStyle = responseStyleInput.value.trim() || '';
        savePersonalitySettings();
        setDynamicChatTitle();
        showToast("Personality saved!", "success");
        hidePersonalityModal();
    }

    function showInitialNamePrompt() {
        if (!initialNameOverlay) return;
        initialNameOverlay.classList.add('visible');
        if (initialNameInput) {
            initialNameInput.value = '';
            setTimeout(() => initialNameInput.focus(), 0);
        }
    }
    function hideInitialNamePrompt() {
        if (!initialNameOverlay) return;
        initialNameOverlay.classList.remove('visible');
    }
    function handleInitialNameSave() {
        if (!initialNameInput) return;
        const name = initialNameInput.value.trim();
        if (!name) {
            showToast("please add a name first.", "error");
            initialNameInput.focus();
            return;
        }
        userPersonality.name = name;
        savePersonalitySettings();
        setDynamicChatTitle();
        hideInitialNamePrompt();
        showToast(`hey ${name}!`, "success");
    }

    // --- Theme Functions ---
    function showThemesModal() {
        themesOverlay.classList.add('visible');
        themePromptInput.value = '';
        themeImagePreview.style.display = 'none';
        saveThemeBtn.disabled = true;
        generatedThemeData = null;
        updateActiveThemeBox();
    }
    function hideThemesModal() {
        themesOverlay.classList.remove('visible');
    }

    function updateActiveThemeBox() {
        document.querySelectorAll('.theme-box').forEach(box => {
            box.classList.toggle('active', box.dataset.theme === currentTheme.type);
        });
    }
    
    function saveAndApplyTheme(type, data = null) {
        currentTheme = { type, data };
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentTheme));
        applyTheme(type, data);
        updateActiveThemeBox();
    }

    function applyTheme(type, data) {
        // Clear existing theme elements and listeners
        themeContainer.innerHTML = '';
        mainContent.style.backgroundImage = '';
        mainContent.removeEventListener('mousemove', handleGrassInteraction);
        mainContent.removeEventListener('mousemove', handleCloudInteraction);

        switch(type) {
            case 'grass':
                mainContent.style.backgroundColor = '#c1ffc1';
                createGrassTheme();
                break;
            case 'clouds':
                createCloudsTheme();
                break;
            case 'generated':
                if (data) mainContent.style.backgroundImage = `url(${data})`;
                break;
            case 'none':
            default:
                 mainContent.style.backgroundColor = '#f0f4f8'; // Default bg
                break;
        }
    }

    function createGrassTheme() {
        const grassContainer = document.createElement('div');
        grassContainer.id = 'grass-theme-container';
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('id', 'grass-svg');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', '0 0 100 10');
        
        for (let i = 0; i < 150; i++) {
            const path = document.createElementNS(svgNS, "path");
            const x = Math.random() * 100;
            const h = 2 + Math.random() * 8;
            const w = 0.2 + Math.random() * 0.3;
            const sway = (Math.random() - 0.5) * 2;
            path.setAttribute('d', `M ${x} 10 Q ${x+sway} ${10-h/2}, ${x} ${10-h}`);
            path.setAttribute('stroke', `hsl(120, ${60 + Math.random()*20}%, ${30 + Math.random()*20}%)`);
            path.setAttribute('stroke-width', w);
            path.setAttribute('fill', 'none');
            path.setAttribute('class', 'grass-blade');
            path.style.animation = `sway ${2 + Math.random() * 4}s ease-in-out ${Math.random() * -6}s infinite alternate`;
            svg.appendChild(path);
        }
        
        grassContainer.appendChild(svg);
        themeContainer.appendChild(grassContainer);
        mainContent.addEventListener('mousemove', handleGrassInteraction);
    }
    
    function handleGrassInteraction(e) {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const blades = document.querySelectorAll('.grass-blade');
        blades.forEach(blade => {
            const bladeBox = blade.getBBox();
            const bladeX = (bladeBox.x / 100) * containerRect.width;
            const dist = Math.abs(mouseX - bladeX);
            if (dist < 50) {
                const angle = (mouseX - bladeX) * 0.3 * (1 - dist / 50);
                blade.style.transform = `rotate(${angle}deg)`;
            } else {
                blade.style.transform = 'rotate(0deg)';
            }
        });
    }

    function createCloudsTheme() {
        const cloudContainer = document.createElement('div');
        cloudContainer.id = 'clouds-theme-container';
        for(let i=1; i<=3; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud-${i}`;
            cloudContainer.appendChild(cloud);
        }
        themeContainer.appendChild(cloudContainer);
        mainContent.addEventListener('mousemove', handleCloudInteraction);
    }

    function handleCloudInteraction(e) {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        const clouds = document.querySelectorAll('.cloud');
        clouds.forEach((cloud, index) => {
            const moveX = (mouseX - containerRect.width / 2) / (20 + index * 10);
            const moveY = (mouseY - containerRect.height / 2) / (20 + index * 10);
            cloud.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        });
    }


    async function handleGenerateTheme() {
        const prompt = themePromptInput.value.trim();
        if (!prompt) {
            showToast("Please enter a prompt for the theme.", "error");
            return;
        }
        themeSpinner.style.display = 'block';
        themeImagePreview.style.display = 'none';
        generateThemeBtn.disabled = true;
        saveThemeBtn.disabled = true;
        try {
            const imageSrc = await triggerGeminiImageGeneration(prompt, true);
            if(imageSrc){
                generatedThemeData = imageSrc;
                themeImagePreview.src = imageSrc;
                themeImagePreview.style.display = 'block';
                saveThemeBtn.disabled = false;
            } else {
                 showToast("Failed to generate theme. Please try again.", "error");
            }
        } catch (error) {
            console.error("Theme generation error:", error);
            showToast(`Error: ${error.message}`, "error");
        } finally {
            themeSpinner.style.display = 'none';
            generateThemeBtn.disabled = false;
        }
    }
    
    function handleSaveGeneratedTheme() {
        if (generatedThemeData) {
            saveAndApplyTheme('generated', generatedThemeData);
            showToast("Theme saved!", "success");
            hideThemesModal();
        }
    }

    function handleRemoveTheme() {
        saveAndApplyTheme('none');
        showToast("Theme removed.", "success");
        hideThemesModal();
    }
    
    // --- Reddit Story Functions ---
    let videoPlaybackInterval;
    let currentVideoIndex = 0;

    async function handleRedditStoryGeneration() {
        const promptText = messageInput.value.trim();
        if (!promptText) {
            showToast("Please enter a topic for the story.", "error");
            return;
        }

        const usageAttempt = tryConsumeUsage('chats');
        if (!usageAttempt.success) {
            const waitText = usageAttempt.remainingMs
                ? ` try again in ${formatDuration(usageAttempt.remainingMs)}.`
                : '';
            showToast(`chat limit reached.${waitText}`, "error", 4000);
            return;
        }

        displayMessage([{ text: `Tell me a Reddit story about ${promptText}` }], 'user');
        addMessageToHistory('user', [{ text: `Tell me a Reddit story about ${promptText}` }]);
        messageInput.value = '';
        updateActionButtonsState();
        isRequestInProgress = true;
        showThinkingIndicator("Writing your story...");

        try {
            const systemPrompt = getSystemPrompt(DEFAULT_CHAT_MODEL, userPersonality, true);
            const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: promptText }];
            
            const storyText = await sendMessageToModel(messages, DEFAULT_CHAT_MODEL, true); 

            removeThinkingIndicator();
            addMessageToHistory('model', [{ text: storyText }]);

            await playStoryWithVideo(storyText);

        } catch (error) {
            removeThinkingIndicator();
            displayMessage([{ text: `Error generating story: ${error.message}` }], 'bot', true);
        } finally {
            isRequestInProgress = false;
            updateActionButtonsState();
        }
    }

    async function playStoryWithVideo(text) {
        if ('speechSynthesis' in window === false) {
            showToast("Speech synthesis is not supported in your browser.", "error");
            return;
        }

        window.speechSynthesis.cancel();
        storyOverlay.classList.add('visible');
        storyVideo.muted = true;

        const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
        let currentLineIndex = 0;

        const getVoicesAsync = () => {
            return new Promise(resolve => {
                let voices = window.speechSynthesis.getVoices();
                if (voices.length) {
                    resolve(voices);
                } else {
                    window.speechSynthesis.onvoiceschanged = () => {
                        voices = window.speechSynthesis.getVoices();
                        resolve(voices);
                    };
                }
            });
        };

        const voices = await getVoicesAsync();
        let availableVoices = voices.filter(voice => 
            voice.name.includes('Google') && 
            (voice.lang === 'en-US' || voice.lang === 'en-GB')
        );

        if (availableVoices.length > 1 && lastStoryVoiceName) {
            availableVoices = availableVoices.filter(v => v.name !== lastStoryVoiceName);
        }

        let storyVoice = null;
        if (availableVoices.length > 0) {
            storyVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
            lastStoryVoiceName = storyVoice.name;
        } else {
            const allGoogleVoices = voices.filter(voice => voice.name.includes('Google') && (voice.lang === 'en-US' || voice.lang === 'en-GB'));
            if (allGoogleVoices.length > 0) {
                storyVoice = allGoogleVoices[Math.floor(Math.random() * allGoogleVoices.length)];
                lastStoryVoiceName = storyVoice.name;
            }
        }

        const speakNextLine = () => {
            if (currentLineIndex < lines.length) {
                const lineText = lines[currentLineIndex].trim();
                storyCaptionsContainer.textContent = lineText;

                currentSpeechUtterance = new SpeechSynthesisUtterance(lineText);
                
                if (storyVoice) {
                    currentSpeechUtterance.voice = storyVoice;
                }

                window.speechSynthesis.speak(currentSpeechUtterance);

                currentSpeechUtterance.onend = () => {
                    currentLineIndex++;
                    speakNextLine();
                };

                currentSpeechUtterance.onerror = (e) => {
                    console.error("Speech synthesis error:", e);
                    showToast(`Speech error: ${e.error}`, 'error');
                    closeStoryPlayer();
                };
            } else {
                showOutro();
            }
        };

        speakNextLine();

        currentVideoIndex = 0;
        function playNextVideoSegment() {
            if (BACKGROUND_VIDEOS.length === 0) return;
            const videoSrc = BACKGROUND_VIDEOS[currentVideoIndex % BACKGROUND_VIDEOS.length];
            storyVideo.src = videoSrc;
            storyVideo.currentTime = 0;
            storyVideo.play().catch(e => console.error("Video autoplay failed:", e));
            currentVideoIndex++;
        }

        playNextVideoSegment();
        videoPlaybackInterval = setInterval(playNextVideoSegment, 20000);
    }

    function showOutro() {
        const storyOutro = document.getElementById('story-outro');
        storyOutro.classList.add('visible');
        setTimeout(() => {
            closeStoryPlayer();
        }, 4000);
    }

    function closeStoryPlayer() {
        if (currentSpeechUtterance) {
            window.speechSynthesis.cancel();
            currentSpeechUtterance = null;
        }
        clearInterval(videoPlaybackInterval);
        storyOverlay.classList.remove('visible');
        storyVideo.pause();
        storyVideo.src = '';
        storyVideo.currentTime = 0;

        const storyOutro = document.getElementById('story-outro');
        storyOutro.classList.remove('visible');
    }

    function handleWipeData() {
        if (confirm("Are you sure you want to delete ALL chats, settings, and stored data? This cannot be undone.")) {
            localStorage.clear();
            usageStats = { chats: [], images: [] };
            updateUsageUI();
            
            showToast("All data has been wiped.", "success");
            setTimeout(() => window.location.reload(), 1500);
        }
    }
    // --- Initialization Sequence ---
    document.addEventListener('DOMContentLoaded', () => {
        // Assign DOM elements
        loader = document.getElementById('loader');
        toastContainer = document.getElementById('toast-container');
        chatApp = document.getElementById('chat-app');
        sidebar = document.getElementById('sidebar');
        mainContent = document.getElementById('main-content');
        themeContainer = document.getElementById('theme-container');
        newChatBtn = document.getElementById('new-chat-btn');
        homeworkTabButton = document.getElementById('homework-tab-button');
        buildTabButton = document.getElementById('build-tab-button');
        chatList = document.getElementById('chat-list');
        settingsButton = document.getElementById('settings-button');
        themesButton = document.getElementById('themes-button');
        chatTitle = document.getElementById('chat-title');
        menuBackdrop = document.getElementById('menu-backdrop');
        menuToggleBtn = document.getElementById('menu-toggle-btn');
        chatMessagesContainer = document.getElementById('chat-messages');
        homeworkWorkspace = document.getElementById('homework-workspace');
        buildWorkspace = document.getElementById('build-workspace');
        chatComposer = document.getElementById('chat-composer');
        homeworkPanel = document.getElementById('homework-panel');
        homeworkUploadBtn = document.getElementById('homework-upload-btn');
        homeworkPresetsBtn = document.getElementById('homework-presets-btn');
        homeworkUploadInput = document.getElementById('homework-upload-input');
        homeworkHomeScreen = document.getElementById('homework-home-screen');
        homeworkHomeTitle = document.getElementById('homework-home-title');
        homeworkIntakeCard = document.getElementById('homework-intake-card');
        homeworkPasteInput = document.getElementById('homework-paste-input');
        homeworkParseBtn = document.getElementById('homework-parse-btn');
        homeworkWorkingState = document.getElementById('homework-working-state');
        homeworkDetectedList = document.getElementById('homework-detected-list');
        homeworkDetectedCount = document.getElementById('homework-detected-count');
        homeworkDetectedCard = document.getElementById('homework-detected-card');
        homeworkWorkspaceHead = document.querySelector('.homework-workspace-head');
        homeworkWorkspaceBackBtn = document.getElementById('homework-workspace-back-btn');
        homeworkFileSummary = document.getElementById('homework-file-summary');
        homeworkAnswerCard = document.getElementById('homework-answer-card');
        homeworkQuestionPosition = document.getElementById('homework-question-position');
        homeworkQuestionTitle = document.getElementById('homework-question-title');
        homeworkQuestionText = document.getElementById('homework-question-text');
        homeworkAnswerText = document.getElementById('homework-answer-text');
        homeworkAnswerStatus = document.getElementById('homework-answer-status');
        homeworkElaborateBtn = document.getElementById('homework-elaborate-btn');
        homeworkRegenerateBtn = document.getElementById('homework-regenerate-btn');
        homeworkShorterBtn = document.getElementById('homework-shorter-btn');
        homeworkNextBtn = document.getElementById('homework-next-btn');
        buildIdleScreen = document.getElementById('build-idle-screen');
        buildAgentScreen = document.getElementById('build-agent-screen');
        buildHomeTitle = document.getElementById('build-home-title');
        buildAgentSprite = document.getElementById('build-agent-sprite');
        buildAgentKicker = document.getElementById('build-agent-kicker');
        buildAgentTitle = document.getElementById('build-agent-title');
        buildAgentSubtitle = document.getElementById('build-agent-subtitle');
        buildProgressWrap = document.getElementById('build-progress-wrap');
        buildProgressBar = document.getElementById('build-progress-bar');
        buildProgressStatus = document.getElementById('build-progress-status');
        buildWorkbench = document.getElementById('build-workbench');
        buildThinkingStream = document.getElementById('build-thinking-stream');
        buildCodeStream = document.getElementById('build-code-stream');
        buildResultScreen = document.getElementById('build-result-screen');
        buildPreviewFrame = document.getElementById('build-preview-frame');
        buildOpenPreviewBtn = document.getElementById('build-open-preview-btn');
        buildResetBtn = document.getElementById('build-reset-btn');
        buildLogsList = document.getElementById('build-logs-list');
        buildPromptWrap = document.querySelector('.build-prompt-wrap');
        buildPromptInput = document.getElementById('build-prompt-input');
        buildPromptButton = document.getElementById('build-prompt-button');
        buildPromptSprite = document.getElementById('build-prompt-sprite');
        messageInput = document.getElementById('message-input');
        chatInputArea = document.querySelector('.chat-input-area');
        chatInputContainer = document.querySelector('.chat-input-container');
        sendButton = document.getElementById('send-button');
        createImageButton = document.getElementById('create-image-button');
        imageUploadButton = document.getElementById('image-upload-button');
        imageUploadInput = document.getElementById('image-upload-input');
        imagePreviewArea = document.getElementById('image-preview-area');
        imagePreview = document.getElementById('image-preview');
        removeImageButton = document.getElementById('remove-image-button');
        micButton = document.getElementById('mic-button');
        redditStoryButton = document.getElementById('reddit-story-button');
        storyOverlay = document.getElementById('story-overlay');
        storyVideo = document.getElementById('story-video');
        storyCaptionsContainer = document.getElementById('story-captions-container');
        closeStoryBtn = document.getElementById('close-story-btn');
        downloadStoryBtn = document.getElementById('download-story-btn');
        
        personalityOverlay = document.getElementById('personality-overlay');
        userNameInput = document.getElementById('user-name-input');
        responseStyleInput = document.getElementById('response-style-input');
        savePersonalityBtn = document.getElementById('save-personality-btn');
        closePersonalityModalBtn = document.getElementById('close-personality-modal-btn');
        themeModeToggle = document.getElementById('theme-mode-toggle');
        
        themesOverlay = document.getElementById('themes-overlay');
        closeThemesModalBtn = document.getElementById('close-themes-modal-btn');
        themePromptInput = document.getElementById('theme-prompt-input');
        generateThemeBtn = document.getElementById('generate-theme-btn');
        themePreview = document.getElementById('theme-preview');
        themeSpinner = document.getElementById('theme-spinner');
        themeImagePreview = document.getElementById('theme-image-preview');
        saveThemeBtn = document.getElementById('save-theme-btn');
        removeThemeBtn = document.getElementById('remove-theme-btn');
        grassThemeBox = document.getElementById('grass-theme-box');
        cloudsThemeBox = document.getElementById('clouds-theme-box');

        meButton = document.getElementById('me-button');
        mePopup = document.getElementById('me-popup');
        mePopupCloseBtn = document.getElementById('me-popup-close-btn');
        meStartCameraBtn = document.getElementById('me-start-camera-btn');
        meCaptureBtn = document.getElementById('me-capture-btn');
        meUploadBtn = document.getElementById('me-upload-btn');
        meUploadInput = document.getElementById('me-upload-input');
        meRetakeRow = document.getElementById('me-retake-row');
        meRetakeBtn = document.getElementById('me-retake-btn');
        meRemoveBtn = document.getElementById('me-remove-btn');
        meMediaPreview = document.getElementById('me-media-preview');
        meMediaPlaceholder = document.getElementById('me-media-placeholder');
        mePhotoPreview = document.getElementById('me-photo-preview');
        mePromptArea = document.getElementById('me-prompt-area');
        mePromptInput = document.getElementById('me-prompt-input');
        meSubtitle = document.getElementById('me-popup-subtitle');
        meCameraStreamEl = document.getElementById('me-camera-stream');
        meCanvas = document.getElementById('me-canvas');
        meActiveBanner = document.getElementById('me-active-banner');
        meInlineRetakeBtn = document.getElementById('me-inline-retake-btn');
        meInlineRemoveBtn = document.getElementById('me-inline-remove-btn');
        webDesignModeContainer = document.getElementById('web-design-mode-container');
        webDesignModeToggle = document.getElementById('web-design-mode-toggle');
        webDesignModeMenu = document.getElementById('web-design-mode-menu');
        modeSimpleBtn = document.getElementById('mode-simple-btn');
        modeProBtn = document.getElementById('mode-pro-btn');

        customizeImageModeContainer = document.getElementById('customize-image-mode-container');
        customizeImageModeToggle = document.getElementById('customize-image-mode-toggle');
        customizeImageModeMenu = document.getElementById('customize-image-mode-menu');
        imageModelMiniBtn = document.getElementById('image-model-mini-btn');
        imageModelMaxBtn = document.getElementById('image-model-max-btn');

        settingsTabButtons = Array.from(document.querySelectorAll('[data-settings-tab]'));
        settingsTabPanels = Array.from(document.querySelectorAll('[data-settings-panel]'));
        usageChatsBar = document.getElementById('usage-chats-bar');
        usageChatsLabel = document.getElementById('usage-chats-label');
        usageChatsReset = document.getElementById('usage-chats-reset');
        usageImagesBar = document.getElementById('usage-images-bar');
        usageImagesLabel = document.getElementById('usage-images-label');
        usageImagesReset = document.getElementById('usage-images-reset');

        actionMenuToggle = document.getElementById('action-menu-toggle');
        actionMenu = document.getElementById('action-menu');
        agentMenuToggle = document.getElementById('agent-menu-toggle');
        agentMenu = document.getElementById('agent-menu');
        webDesignAgentButton = document.getElementById('web-design-agent-button');
        actionCoachmark = document.getElementById('action-coachmark');
        searchModeButton = document.getElementById('search-mode-button');

        wipeDataBtn = document.getElementById('wipe-data-btn');
        initialNameOverlay = document.getElementById('initial-name-overlay');
        initialNameInput = document.getElementById('initial-name-input');
        initialNameSaveBtn = document.getElementById('initial-name-save-btn');

        const storedThemeMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) || 'dark';
        applyThemeMode(storedThemeMode);
        setDynamicChatTitle();

        // --- Event Listeners ---
        actionMenuToggle.addEventListener('click', () => {
            hideActionCoachmark(true);
            actionMenu.classList.toggle('visible');
            actionMenuToggle.classList.toggle('active');
            // Ensure agent menu is closed when action menu is opened
            if (agentMenu) agentMenu.classList.remove('visible');
            if (agentMenuToggle) agentMenuToggle.classList.remove('active');
        });

        if (agentMenuToggle) {
            agentMenuToggle.addEventListener('click', () => {
                agentMenu.classList.toggle('visible');
                agentMenuToggle.classList.toggle('active');
                // Ensure action menu is closed when agent menu is opened
                actionMenu.classList.remove('visible');
                actionMenuToggle.classList.remove('active');
                hideActionCoachmark(true);
            });
        }

        if (webDesignModeToggle) {
            webDesignModeToggle.addEventListener('click', () => {
                webDesignModeMenu.classList.toggle('visible');
                // Close other menus
                if (actionMenu) actionMenu.classList.remove('visible');
                if (actionMenuToggle) actionMenuToggle.classList.remove('active');
                if (agentMenu) agentMenu.classList.remove('visible');
                if (agentMenuToggle) agentMenuToggle.classList.remove('active');
            });
        }
        
        function setWebDesignMode(mode) {
            currentWebDesignMode = mode;
            const label = mode === 'simple' ? 'Simple' : 'Pro';
            if (webDesignModeToggle) {
                webDesignModeToggle.querySelector('span').textContent = label;
                webDesignModeToggle.classList.add('web-design-mode-selected'); // Apply selected class
            }
            if (webDesignModeMenu) webDesignModeMenu.classList.remove('visible');
            showToast(`Web Design: ${label} Mode`, 'info');
        }

        if (modeSimpleBtn) modeSimpleBtn.addEventListener('click', () => setWebDesignMode('simple'));
        if (modeProBtn) modeProBtn.addEventListener('click', () => setWebDesignMode('pro'));

        if (customizeImageModeToggle) {
            customizeImageModeToggle.addEventListener('click', () => {
                customizeImageModeMenu.classList.toggle('visible');
                // Close other menus
                if (actionMenu) actionMenu.classList.remove('visible');
                if (actionMenuToggle) actionMenuToggle.classList.remove('active');
                if (agentMenu) agentMenu.classList.remove('visible');
                if (agentMenuToggle) agentMenuToggle.classList.remove('active');
                if (webDesignModeMenu) webDesignModeMenu.classList.remove('visible');
            });
        }

        function setImageModel(model) {
            currentImageModel = model;
            const label = model === 'gpt-image-1-mini' ? 'Mini' : 'Max';
            if (customizeImageModeToggle) {
                 customizeImageModeToggle.querySelector('span').textContent = label;
                 customizeImageModeToggle.classList.add('active');
            }
            if (customizeImageModeMenu) customizeImageModeMenu.classList.remove('visible');
            showToast(`Image Model: ${label}`, 'info');
        }

        if (imageModelMiniBtn) imageModelMiniBtn.addEventListener('click', () => setImageModel('gpt-image-1-mini'));
        if (imageModelMaxBtn) imageModelMaxBtn.addEventListener('click', () => setImageModel('gpt-image-1.5'));

        // Initialize Image Mode state
        setImageModel(currentImageModel);

        // ... (rest of the event listeners) ...

        // Initialize Web Design mode state
        setWebDesignMode(currentWebDesignMode);
        
        document.addEventListener('click', (e) => {
const clickedInsideAgentMenu = agentMenu && (agentMenu.contains(e.target) || agentMenuToggle.contains(e.target));
            const clickedInsideWebDesignMenu = webDesignModeContainer && (webDesignModeContainer.contains(e.target));
            const clickedInsideImageMenu = customizeImageModeContainer && (customizeImageModeContainer.contains(e.target));

            if (!clickedInsideActionMenu) {
                if (actionMenu) actionMenu.classList.remove('visible');
                if (actionMenuToggle) actionMenuToggle.classList.remove('active');
            }

            if (!clickedInsideAgentMenu) {
                 if (agentMenu) agentMenu.classList.remove('visible');
                 if (agentMenuToggle) agentMenuToggle.classList.remove('active');
            }

            if (!clickedInsideWebDesignMenu) {
                 if (webDesignModeMenu) webDesignModeMenu.classList.remove('visible');
            }

            if (!clickedInsideImageMenu) {
                 if (customizeImageModeMenu) customizeImageModeMenu.classList.remove('visible');
            }
        });
        if (searchModeButton) {
            searchModeButton.addEventListener('click', handleSearchModeToggle);
        }
        if (themeModeToggle) {
            themeModeToggle.addEventListener('change', (e) => {
                applyThemeMode(e.target.checked ? 'dark' : 'light');
            });
        }
        
        loadData();
        loadMeProfileFromStorage();
        loadUsageStats();
        updateUsageUI();
        if (usageUpdateInterval) clearInterval(usageUpdateInterval);
        usageUpdateInterval = setInterval(updateUsageUI, 60000);
        if (!userPersonality.name) {
            showInitialNamePrompt();
        }
        renderChatList();
        syncLandingViewState();
        if (currentChatId && chats[currentChatId]?.history.length > 0) {
            loadChat(currentChatId); 
        }
        renderHomeworkDetectedQuestions();
        renderHomeworkAnswerCard();
        updateHomeworkFileSummary();
        updateHomeworkModeUI();
        updateActionButtonsState();
        if (actionCoachmark) {
            setTimeout(() => showActionCoachmark(), 400);
        }

        newChatBtn.addEventListener('click', () => {
            if (!isAgentSessionActive && currentChatId && chats[currentChatId] && chats[currentChatId].history.length === 0) {
                showToast("Send a message to start the current chat first.", 'info');
                sidebar.classList.remove('visible');
                menuBackdrop.classList.remove('visible');
                return;
            }
            // If agent session is active, end it and return to chat
            if (isAgentSessionActive) {
                isAgentSessionActive = false;
                if (socket) socket.emit('stop-agent');
            }
            sidebar.classList.remove('visible');
            menuBackdrop.classList.remove('visible');
            handleNewChat(true);
            syncLandingViewState();
        });
        if (homeworkTabButton) {
            homeworkTabButton.addEventListener('click', () => {
                if (isHomeworkModeActive) {
                    exitHomeworkMode();
                } else {
                    isHomeworkModeActive = true;
                    isHomeworkWorkspaceActive = false;
                    isBuildModeActive = false;
                    setHomeworkWorkspaceStage('intake');
                    updateHomeworkModeUI();
                }
            });
        }
        if (buildTabButton) {
            buildTabButton.addEventListener('click', () => {
                if (isBuildModeActive) {
                    exitBuildMode();
                } else {
                    enterBuildMode();
                }
            });
        }
        if (buildPromptButton) {
            buildPromptButton.addEventListener('click', handleBuildPromptSubmit);
        }
        if (buildPromptInput) {
            buildPromptInput.addEventListener('input', () => updateActionButtonsState());
            buildPromptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleBuildPromptSubmit();
                }
            });
        }
        if (buildOpenPreviewBtn) {
            buildOpenPreviewBtn.addEventListener('click', () => {
                if (!currentBuildHtml) return;
                const blob = new Blob([currentBuildHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            });
        }
        if (buildResetBtn) {
            buildResetBtn.addEventListener('click', () => {
                resetBuildFlow();
                updateActionButtonsState();
            });
        }
        settingsButton.addEventListener('click', showPersonalityModal);
        themesButton.addEventListener('click', showThemesModal);
        settingsTabButtons.forEach(btn => {
            btn.addEventListener('click', () => activateSettingsTab(btn.dataset.settingsTab));
        });
        
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => {
                sidebar.classList.add('visible');
                menuBackdrop.classList.add('visible');
            });
        }
        
        menuBackdrop.addEventListener('click', () => {
             sidebar.classList.remove('visible');
            menuBackdrop.classList.remove('visible');
        });
        sendButton.addEventListener('click', handleSendMessage);
        redditStoryButton.addEventListener('click', handleRedditStoryGeneration);
        closeStoryBtn.addEventListener('click', closeStoryPlayer);
        downloadStoryBtn.addEventListener('click', () => {
            if (storyVideo.src) {
                const a = document.createElement('a');
                a.href = storyVideo.src;
                a.download = 'graxybot_story_video.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast("Downloading video...", "info");
            } else {
                showToast("No video to download.", "error");
            }
        });
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey && !sendButton.disabled) { e.preventDefault(); handleSendMessage(); } });
        messageInput.addEventListener('input', () => {
            updateActionButtonsState();
        });
        createImageButton.addEventListener('click', handleCreateImageButtonClick);
        imageUploadButton.addEventListener('click', () => imageUploadInput.click());
        imageUploadInput.addEventListener('change', handleImageSelection);
        if (homeworkUploadBtn) {
            homeworkUploadBtn.addEventListener('click', () => openHomeworkWorkspace());
        }
        if (homeworkUploadInput) {
            homeworkUploadInput.addEventListener('change', (event) => {
                const files = Array.from(event.target.files || []);
                if (files.length > 0) {
                    homeworkSourceFiles = files;
                    updateHomeworkFileSummary();
                    openHomeworkWorkspace();
                    showToast(`${files.length} homework file${files.length === 1 ? '' : 's'} selected.`, 'success', 2500);
                }
            });
        }
        if (homeworkPresetsBtn) {
            homeworkPresetsBtn.addEventListener('click', () => {
                showToast("Homework presets coming next.", 'info', 2500);
            });
        }
        if (homeworkWorkspaceBackBtn) {
            homeworkWorkspaceBackBtn.addEventListener('click', () => closeHomeworkWorkspace());
        }
        if (homeworkParseBtn) {
            homeworkParseBtn.addEventListener('click', async () => {
                const sourceText = homeworkPasteInput?.value || '';
                homeworkParsedQuestions = parseHomeworkQuestions(sourceText);
                renderHomeworkDetectedQuestions();
                if (homeworkParsedQuestions.length) {
                    currentHomeworkQuestionIndex = 0;
                    setHomeworkWorkspaceStage('working');
                    showToast(`${homeworkParsedQuestions.length} questions detected.`, 'success', 2200);
                    await solveHomeworkQuestion('default');
                } else {
                    currentHomeworkQuestionIndex = 0;
                    setHomeworkWorkspaceStage('intake');
                    renderHomeworkAnswerCard();
                    showToast('Couldn’t detect questions yet. Try pasting more worksheet text.', 'error', 2600);
                }
            });
        }
        if (homeworkElaborateBtn) {
            homeworkElaborateBtn.addEventListener('click', async () => {
                await solveHomeworkQuestion('elaborate');
            });
        }
        if (homeworkRegenerateBtn) {
            homeworkRegenerateBtn.addEventListener('click', async () => {
                await solveHomeworkQuestion('regenerate');
            });
        }
        if (homeworkShorterBtn) {
            homeworkShorterBtn.addEventListener('click', async () => {
                await solveHomeworkQuestion('shorter');
            });
        }
        if (homeworkNextBtn) {
            homeworkNextBtn.addEventListener('click', async () => {
                if (currentHomeworkQuestionIndex < homeworkParsedQuestions.length - 1) {
                    currentHomeworkQuestionIndex += 1;
                    renderHomeworkAnswerCard();
                    const question = getHomeworkQuestionAtCurrentIndex();
                    if (question && !question.answer) {
                        await solveHomeworkQuestion('default');
                    } else {
                        setHomeworkAnswerStatus('Solved', false);
                    }
                }
            });
        }
        removeImageButton.addEventListener('click', removeSelectedImage);
        if (micButton) micButton.addEventListener('click', toggleSpeechRecognition);

        if (webDesignAgentButton) {
            // Use onclick to prevent multiple listeners
            webDesignAgentButton.onclick = handleWebDesignAgentToggle;
        }
        
        closePersonalityModalBtn.addEventListener('click', hidePersonalityModal);
        savePersonalityBtn.addEventListener('click', handleSavePersonality);
        personalityOverlay.addEventListener('click', (e) => { if(e.target === personalityOverlay) hidePersonalityModal(); });
        
        closeThemesModalBtn.addEventListener('click', hideThemesModal);
        themesOverlay.addEventListener('click', (e) => { if(e.target === themesOverlay) hideThemesModal(); });
        generateThemeBtn.addEventListener('click', handleGenerateTheme);
        saveThemeBtn.addEventListener('click', handleSaveGeneratedTheme);
        removeThemeBtn.addEventListener('click', handleRemoveTheme);
        grassThemeBox.addEventListener('click', () => saveAndApplyTheme('grass'));
        cloudsThemeBox.addEventListener('click', () => saveAndApplyTheme('clouds'));

        if (meButton) {
            meButton.addEventListener('click', () => {
                if (meProfile && meProfile.imageData) {
                    if (meQuickModeActive) {
                        deactivateMeQuickMode();
                        showMePopup();
                    } else {
                        activateMeQuickMode();
                    }
                } else {
                    showMePopup();
                }
            });
        }
        if (mePopup) mePopup.addEventListener('click', (e) => { if (e.target === mePopup) hideMePopup(); });
        if (mePopupCloseBtn) mePopupCloseBtn.addEventListener('click', hideMePopup);
        if (meStartCameraBtn) meStartCameraBtn.addEventListener('click', startMeCamera);
        if (meCaptureBtn) meCaptureBtn.addEventListener('click', handleMeCapture);
        if (meUploadBtn) meUploadBtn.addEventListener('click', () => { if (meUploadInput) meUploadInput.click(); });
        if (meUploadInput) meUploadInput.addEventListener('change', handleMeUpload);
        if (meMediaPreview) {
            meMediaPreview.addEventListener('click', () => {
                if (meProfile && meProfile.imageData) {
                    activateMeQuickMode();
                }
            });
        }
        if (meRetakeBtn) meRetakeBtn.addEventListener('click', () => startMeCamera());
        if (meRemoveBtn) meRemoveBtn.addEventListener('click', handleMeRemove);
        if (meInlineRetakeBtn) {
            meInlineRetakeBtn.addEventListener('click', () => {
                deactivateMeQuickMode();
                showMePopup();
                setTimeout(() => startMeCamera(), 120);
            });
        }
        if (meInlineRemoveBtn) {
            meInlineRemoveBtn.addEventListener('click', () => {
                handleMeRemove();
                showToast("me photo removed.", "info", 2000);
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mePopup && mePopup.classList.contains('visible')) {
                hideMePopup();
            }
        });

        wipeDataBtn.addEventListener('click', handleWipeData);
        if (initialNameSaveBtn) {
            initialNameSaveBtn.addEventListener('click', handleInitialNameSave);
        }
        if (initialNameInput) {
            initialNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInitialNameSave();
                }
            });
        }

        loader.classList.remove('visible');
        updateSearchModeUI();
        messageInput.focus();
                // --- DeltaMath Agent Logic ---
        const dmTcOverlay = document.getElementById('dm-tc-overlay');
        const dmTcCheck = document.getElementById('dm-tc-check');
        const dmTcNextBtn = document.getElementById('dm-tc-next-btn');
        const closeDmTcBtn = document.getElementById('close-dm-tc-btn');
        
        const dmSetupOverlay = document.getElementById('dm-setup-overlay');
        const dmAssignmentInput = document.getElementById('dm-assignment-input');
        const dmLaunchBtn = document.getElementById('dm-launch-btn');
        const closeDmSetupBtn = document.getElementById('close-dm-setup-btn');

        const deltamathAgentButton = document.getElementById('deltamath-agent-button');
        
        // Removed static element references (agentModeUi, etc.)
        let socket = null;
        let isAgentSessionActive = false;

        // Dynamic references for the inline interface
        let currentAgentStatusText = null;
        let currentAgentStreamView = null;
        let currentModalStreamView = null;
        let currentAgentLogContainer = null;
        let currentAgentStopBtn = null;
        let currentAgentConsoleToggle = null; // New reference
        let currentAgentCursor = null;
        let currentAgentCursorLabel = null;
        let cursorIdleTimeout = null; // New timer reference
        let isFirstAgentAction = true; // New flag

        const AGENT_PHRASES = [
            // single words
            "fidgeting",
            "toying",
            "pondering",
            "scribbling",
            "crunching",
            "squinting",
            "vibing",
            "locked in",
            "cooking",
            "scheming",
            // short phrases
            "oooh whats this?",
            "this looks right... right?",
            "math is hard but i got this",
            "target acquired",
            "engaging big brain mode",
            "hold on lemme cook",
            "ez clap",
            "nah this one's tricky",
            "wait that can't be right",
            "okay okay okay",
            "i swear i know this one",
            "don't look at me like that",
            "clicking things aggressively",
            "is this the submit button?",
            "trust the process",
            "let me just...",
            "almost... there...",
            "geometry is my passion",
            "bro what is this diagram",
            "angles on angles on angles",
            "soh cah toa baby",
            "this triangle looks sus",
            // funny / chaotic
            "so this student's cheating huh",
            "i'm doing their homework lmao",
            "hope the teacher doesn't see this",
            "deltamath more like deltameth",
            "i am speed",
            "built different",
            "this is what AI was made for",
            "doing someone's geometry rn",
            "my neurons are firing",
            "calculator? i AM the calculator",
            "no thoughts just clicking",
            "this better be right",
            "if i get this wrong i'm cooked",
            "the answer is always 42... right?",
            "please be multiple choice",
            "a squared plus b scared",
            "parallel lines never meet and neither will my expectations",
        ];

        const IDLE_PHRASES = [
            "still here...",
            "just thinking",
            "loading brain cells",
            "give me a sec",
            "buffering",
            "zoning out",
            "waiting for inspiration",
            "elevator music plays",
            "...",
            "staring at the screen",
            "contemplating existence",
            "the wifi here is crazy",
            "hello? anyone there?",
            "i haven't crashed i promise",
        ];

        function showInitialEstimate() {
            if (!currentAgentCursor || !currentAgentCursorLabel) return;
            
            const mins = Math.floor(Math.random() * 7) + 3; // 3-9
            const startPhrases = [
                `this will take about ${mins} mins`,
                `check back in ${mins} mins`,
                `ETA: ${mins} minutes`,
                `give me about ${mins} mins for this`
            ];
            
            const phrase = startPhrases[Math.floor(Math.random() * startPhrases.length)];
            
            currentAgentCursor.style.display = 'block';
            currentAgentCursor.classList.add('moving');
            currentAgentCursor.style.left = '50%';
            currentAgentCursor.style.top = '50%';
            currentAgentCursorLabel.textContent = phrase;

            setTimeout(() => {
                if (currentAgentCursor) currentAgentCursor.classList.remove('moving');
            }, 5000);
        }

        function resetCursorIdleTimer() {
            if (cursorIdleTimeout) clearTimeout(cursorIdleTimeout);
            cursorIdleTimeout = setTimeout(triggerIdleCursor, 7000);
        }

        function triggerIdleCursor() {
            if (!currentAgentCursor || !currentAgentCursorLabel) return;
             // Ensure visible
            currentAgentCursor.style.display = 'block';
            currentAgentCursor.classList.add('moving');

            // Move slightly to show life
            const x = 20 + Math.random() * 60;
            const y = 20 + Math.random() * 60;
            
            currentAgentCursor.style.left = `${x}%`;
            currentAgentCursor.style.top = `${y}%`;

            // Idle phrase
            const phrase = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
            currentAgentCursorLabel.textContent = phrase;

            setTimeout(() => {
                if (currentAgentCursor) currentAgentCursor.classList.remove('moving');
            }, 3000);
            
            // Re-arm timer to keep it alive if it stays idle
            resetCursorIdleTimer();
        }

        function moveAgentCursor() {
            if (!currentAgentCursor || !currentAgentCursorLabel) return;
            
            if (isFirstAgentAction) {
                isFirstAgentAction = false;
                resetCursorIdleTimer();
                return; // Skip the first AI thought move since we just showed the estimate
            }

            // Reset idle timer since we have activity
            resetCursorIdleTimer();

            // Ensure visible
            currentAgentCursor.style.display = 'block';
            currentAgentCursor.classList.add('moving');

            // Random position (keep within 10-90% to stay visible)
            const x = 10 + Math.random() * 80;
            const y = 10 + Math.random() * 80;
            
            currentAgentCursor.style.left = `${x}%`;
            currentAgentCursor.style.top = `${y}%`;

            // Random phrase
            const phrase = AGENT_PHRASES[Math.floor(Math.random() * AGENT_PHRASES.length)];
            currentAgentCursorLabel.textContent = phrase;

            // Hide label after a short delay so it doesn't clutter
            setTimeout(() => {
                if (currentAgentCursor) currentAgentCursor.classList.remove('moving');
            }, 3000);
        }

        function renderAgentInlineInterface() {
            // Create the wrapper message
            const wrapper = document.createElement('div');
            wrapper.className = 'message-content-wrapper';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'message-icon';
            iconDiv.innerHTML = `<i class="fas fa-robot"></i>`;
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.style.width = '100%'; 
            
            // Build the card HTML
            const card = document.createElement('div');
            card.className = 'agent-inline-card';
            card.innerHTML = `
                <div class="agent-card-header">
                    <div class="agent-card-title">
                        <i class="fas fa-robot"></i> DeltaMath Agent
                    </div>
                    <div class="agent-card-status" id="dynamic-agent-status">Initializing...</div>
                </div>
                <div class="agent-card-body">
                    <div class="agent-stream-box">
                        <img id="dynamic-agent-stream" class="agent-stream-img" src="" alt="Agent Stream">
                        <div id="agent-login-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(11,18,32,0.55);z-index:5;">
                            <button id="agent-login-btn" style="background:var(--primary);color:#0b1220;font-weight:800;border:none;border-radius:12px;padding:14px 32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(75,181,255,0.4);letter-spacing:0.3px;"><i class="fas fa-sign-in-alt"></i> Log In</button>
                        </div>
                        <div id="dynamic-agent-cursor" class="agent-fake-cursor">
                            <i class="fas fa-mouse-pointer"></i>
                            <div class="agent-fake-cursor-label"></div>
                        </div>
                    </div>
                    <div class="agent-logs-box" id="dynamic-agent-logs" style="display: none;">
                        <div class="log-entry">Waiting for agent connection...</div>
                    </div>
                </div>
                <div class="agent-card-footer" style="justify-content: space-between; align-items: center;">
                    <button id="dynamic-agent-console-toggle" class="icon-btn" title="Toggle Console" style="width: 32px; height: 32px; font-size: 0.9rem;"><i class="fas fa-terminal"></i></button>
                    <button id="dynamic-agent-stop-btn" class="agent-stop-btn">Stop Agent</button>
                </div>
            `;
            
            // Professional Info Box
            const infoBox = document.createElement('div');
            infoBox.style.marginTop = '12px';
            infoBox.style.padding = '14px';
            infoBox.style.borderRadius = '12px';
            infoBox.style.backgroundColor = 'rgba(75, 181, 255, 0.08)';
            infoBox.style.border = '1px solid rgba(75, 181, 255, 0.2)';
            infoBox.style.color = 'var(--text-primary)';
            infoBox.style.fontSize = '0.85rem';
            infoBox.style.lineHeight = '1.5';

            infoBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--primary); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem;">
                    <i class="fas fa-info-circle"></i> Research Preview
                </div>
                <p style="margin: 0 0 10px 0; color: var(--text-secondary);">
                    Graxybot Agent is a research preview. If you see it getting stuck on things, give it some time! 
                    If it is frozen after <strong style="color: var(--primary);">90 seconds</strong>, stop the agent.
                </p>
                <div style="border-top: 1px solid rgba(75, 181, 255, 0.15); padding-top: 10px;">
                    <div style="font-weight: 600; font-size: 0.8rem; margin-bottom: 6px; color: var(--text-primary);">Terms & Conditions:</div>
                    <ul style="margin: 0; padding-left: 18px; color: var(--text-secondary); font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px;">
                        <li>1. Graxybot does not store your login session or any personal data. You log in to DeltaMath yourself.</li>
                        <li>2. Graxybot does not condone cheating or using AI for work, this is a research preview.</li>
                        <li>3. Graxybot can make mistakes, and can do things that cannot be reveresed. Be advised, you will be able to see graxybot as it acts on the browser.</li>
                        <li>4. Graxybot Agent can only do multiple choise or simple(ish) questions, this is a research preview</li>
                    </ul>
                </div>
            `;
            
            bubbleDiv.appendChild(card);
            bubbleDiv.appendChild(infoBox);
            wrapper.appendChild(iconDiv);
            wrapper.appendChild(bubbleDiv);
            
            chatMessagesContainer.appendChild(wrapper);
            chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'smooth' });

            // Update references
            currentAgentStatusText = card.querySelector('#dynamic-agent-status');
            currentAgentStreamView = card.querySelector('#dynamic-agent-stream');
            currentAgentLogContainer = card.querySelector('#dynamic-agent-logs');
            currentAgentStopBtn = card.querySelector('#dynamic-agent-stop-btn');
            currentAgentConsoleToggle = card.querySelector('#dynamic-agent-console-toggle');
            currentAgentCursor = card.querySelector('#dynamic-agent-cursor');
            currentAgentCursorLabel = card.querySelector('.agent-fake-cursor-label');

            isFirstAgentAction = true;

            // --- Login Modal ---
            const loginModal = document.createElement('div');
            loginModal.style.cssText = 'position:fixed;inset:0;background:rgba(7,12,22,0.93);z-index:2000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;backdrop-filter:blur(6px);';
            loginModal.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;width:90vw;max-width:1280px;">
                    <div style="color:var(--primary);font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-sign-in-alt"></i> Log in to DeltaMath</div>
                    <button id="agent-modal-close-btn" style="background:none;border:1px solid rgba(255,255,255,0.15);color:var(--text-secondary);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:0.82rem;">✕ Close</button>
                </div>
                <div style="position:relative;width:90vw;max-width:1280px;aspect-ratio:16/10;background:#000;border-radius:10px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);">
                    <img id="agent-modal-stream-img" style="width:100%;height:100%;object-fit:contain;cursor:crosshair;outline:none;" tabindex="0">
                    <div id="agent-login-hint-bubble" style="display:none;position:absolute;top:12px;right:12px;z-index:6;background:#ffffff;color:#0b1220;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:0.82rem;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.45);max-width:190px;line-height:1.5;pointer-events:none;">&#9776; Press a bit to the right of these 3 lines to log in. (currently buggy)</div>
                    <div id="agent-modal-instructions" style="position:absolute;inset:0;background:rgba(11,18,32,0.94);display:flex;align-items:center;justify-content:center;z-index:5;padding:32px;">
                        <div style="max-width:460px;text-align:center;">
                            <div style="font-size:2.2rem;margin-bottom:16px;">🔑</div>
                            <h3 style="color:var(--text-primary);font-size:1.2rem;margin:0 0 12px 0;">Sign in &amp; Navigate</h3>
                            <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.7;margin:0 0 24px 0;">
                                Click any field in the browser preview to focus it, then type normally on your keyboard.<br><br>
                                Log in, then <strong style="color:var(--text-primary);">open the assignment</strong> you want Graxybot to solve. Once you're on it, press <strong style="color:var(--primary);">Hand over to Graxybot</strong> below.<br><br>
                                <span style="color:#f0a500;font-size:0.82rem;"><i class="fas fa-exclamation-triangle"></i> Graxybot is not perfect — always review its answers.</span>
                            </p>
                            <button id="agent-modal-understand-btn" style="background:var(--primary);color:#0b1220;font-weight:700;border:none;border-radius:8px;padding:10px 28px;cursor:pointer;font-size:0.9rem;">I understand</button>
                        </div>
                    </div>
                </div>
                <button id="agent-modal-handoff-btn" style="background:var(--primary);color:#0b1220;font-weight:800;border:none;border-radius:12px;padding:16px 44px;cursor:pointer;font-size:1.05rem;display:flex;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(75,181,255,0.35);letter-spacing:0.3px;"><i class="fas fa-robot"></i> Hand over to Graxybot</button>
            `;
            document.body.appendChild(loginModal);

            const modalStreamImg = loginModal.querySelector('#agent-modal-stream-img');
            const modalInstructions = loginModal.querySelector('#agent-modal-instructions');
            const modalUnderstandBtn = loginModal.querySelector('#agent-modal-understand-btn');
            const modalHandoffBtn = loginModal.querySelector('#agent-modal-handoff-btn');
            const modalCloseBtn = loginModal.querySelector('#agent-modal-close-btn');

            // Keydown forwarding when modal is open
            const handleManualKeydown = (e) => {
                if (loginModal.style.display === 'none' || !socket) return;
                const tag = document.activeElement.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                e.preventDefault();
                socket.emit('keypress', { key: e.key });
            };
            document.addEventListener('keydown', handleManualKeydown);

            // Click forwarding in modal stream
            modalStreamImg.addEventListener('click', (e) => {
                if (!socket) return;
                const rect = modalStreamImg.getBoundingClientRect();
                const x = Math.round((e.clientX - rect.left) * (1024 / rect.width));
                const y = Math.round((e.clientY - rect.top) * (640 / rect.height));
                socket.emit('click', { x, y });
                modalStreamImg.focus();
            });

            // "I understand" → dismiss instructions, let user interact
            modalUnderstandBtn.addEventListener('click', () => {
                modalInstructions.style.display = 'none';
                const hintBubble = loginModal.querySelector('#agent-login-hint-bubble');
                if (hintBubble) hintBubble.style.display = 'block';
                modalStreamImg.focus();
            });

            // Open modal (Log In button on card)
            const cardLoginBtn = card.querySelector('#agent-login-btn');
            if (cardLoginBtn) {
                cardLoginBtn.addEventListener('click', () => {
                    modalInstructions.style.display = 'flex';
                    currentModalStreamView = modalStreamImg;
                    loginModal.style.display = 'flex';
                });
            }

            const closeLoginModal = () => {
                loginModal.style.display = 'none';
                currentModalStreamView = null;
            };
            modalCloseBtn.addEventListener('click', closeLoginModal);

            // Hand over to Graxybot
            modalHandoffBtn.addEventListener('click', () => {
                closeLoginModal();
                document.removeEventListener('keydown', handleManualKeydown);
                document.body.removeChild(loginModal);
                const loginOverlay = card.querySelector('#agent-login-overlay');
                if (loginOverlay) loginOverlay.style.display = 'none';
                if (socket) socket.emit('start-ai');
                if (currentAgentStatusText) currentAgentStatusText.textContent = 'AI Taking Over...';
                logAgent('Handing off to Graxybot AI...', 'info');
                showInitialEstimate();
                resetCursorIdleTimer();
            });

            // Bind Console Toggle
            if (currentAgentConsoleToggle && currentAgentLogContainer) {
                currentAgentConsoleToggle.addEventListener('click', () => {
                    const isHidden = currentAgentLogContainer.style.display === 'none';
                    currentAgentLogContainer.style.display = isHidden ? 'flex' : 'none';
                    currentAgentConsoleToggle.classList.toggle('active', isHidden);
                    if (isHidden) {
                        chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'smooth' });
                    }
                });
            }

            // Bind Stop Button
            if (currentAgentStopBtn) {
                currentAgentStopBtn.addEventListener('click', () => {
                    closeLoginModal();
                    document.removeEventListener('keydown', handleManualKeydown);
                    if (document.body.contains(loginModal)) document.body.removeChild(loginModal);
                    if (socket) socket.emit('stop-agent');
                    currentAgentStopBtn.disabled = true;
                    currentAgentStopBtn.textContent = "Stopping...";
                    if (cursorIdleTimeout) clearTimeout(cursorIdleTimeout);
                });
            }
        }

        // Cloudflare tunnel URL for local agent — update this when tunnel restarts
        const REMOTE_AGENT_URL = "https://dust-apps-cornwall-courier.trycloudflare.com";

        function initSocket() {
            if (socket) return;
            
            console.log("Connecting to Remote Agent at:", REMOTE_AGENT_URL);

            // Connect specifically to the Remote Agent URL
            // eslint-disable-next-line no-undef
            socket = io(REMOTE_AGENT_URL, {
                transports: ['websocket', 'polling'], // Ensure compatibility
                withCredentials: true
            });

            socket.on('connect', () => {
                logAgent("Connected to server.");
            });

            socket.on('status', (msg) => {
                if (currentAgentStatusText) currentAgentStatusText.textContent = msg;

                if (msg.includes('Busy')) {
                     if (dmLaunchBtn) dmLaunchBtn.disabled = false;
                     isAgentSessionActive = false;
                     setChatActiveState(true);
                     // Show a modal they have to dismiss
                     const busyOverlay = document.createElement('div');
                     busyOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,12,22,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);';
                     busyOverlay.innerHTML = `
                         <div style="background:#0f1a2e;border:1px solid rgba(75,181,255,0.2);border-radius:20px;padding:40px 36px;max-width:420px;text-align:center;box-shadow:0 8px 48px rgba(0,0,0,0.6);">
                             <div style="font-size:2.8rem;margin-bottom:16px;">⚡</div>
                             <h2 style="color:#fff;margin:0 0 12px 0;font-size:1.4rem;">High Demand Right Now</h2>
                             <p style="color:rgba(255,255,255,0.6);font-size:0.92rem;line-height:1.7;margin:0 0 28px 0;">
                                 Graxybot is currently helping another student.<br>
                                 We're actively expanding access — please try again in a few minutes.
                             </p>
                             <button onclick="this.closest('[style]').remove()" style="background:var(--primary);color:#0b1220;font-weight:800;border:none;border-radius:12px;padding:14px 40px;cursor:pointer;font-size:1rem;">Got it</button>
                         </div>`;
                     document.body.appendChild(busyOverlay);
                     busyOverlay.addEventListener('click', (e) => { if (e.target === busyOverlay) busyOverlay.remove(); });
                     return;
                }
                if (msg.includes('Error')) {
                     showToast(msg, 'error');
                     if (dmLaunchBtn) dmLaunchBtn.disabled = false;
                }

                if (msg === "Agent Stopped" || msg.includes('time limit') || msg.includes('disconnected')) {
                    isAgentSessionActive = false;
                    if (currentAgentStopBtn) {
                         currentAgentStopBtn.textContent = "Agent Stopped";
                         currentAgentStopBtn.disabled = true;
                    }
                    if (currentAgentCursor) currentAgentCursor.style.display = 'none';
                    if (cursorIdleTimeout) clearTimeout(cursorIdleTimeout);
                }
                logAgent(msg, 'info');
            });

            socket.on('agent-frame', (base64) => {
                if (currentAgentStreamView) currentAgentStreamView.src = `data:image/jpeg;base64,${base64}`;
                if (currentModalStreamView) currentModalStreamView.src = `data:image/jpeg;base64,${base64}`;
            });

            socket.on('agent-thought', (thought) => {
                logAgent(thought, 'thought');
                moveAgentCursor();
            });
        }

        function logAgent(msg, type='info') {
            if (!currentAgentLogContainer) return;
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            currentAgentLogContainer.prepend(entry);
        }

        if (deltamathAgentButton) {
            deltamathAgentButton.disabled = false; 
            deltamathAgentButton.title = "Deltamath Agent";
            deltamathAgentButton.addEventListener('click', () => {
                dmTcOverlay.classList.add('visible');
                if (agentMenu) agentMenu.classList.remove('visible');
                if (agentMenuToggle) agentMenuToggle.classList.remove('active');
            });
        }

        if (closeDmTcBtn) closeDmTcBtn.addEventListener('click', () => dmTcOverlay.classList.remove('visible'));
        
        if (dmTcCheck) {
            dmTcCheck.addEventListener('change', () => {});
        }

        if (dmTcNextBtn) {
            dmTcNextBtn.addEventListener('click', () => {
                dmTcOverlay.classList.remove('visible');
            });
        }

        if (closeDmSetupBtn) closeDmSetupBtn.addEventListener('click', () => dmSetupOverlay.classList.remove('visible'));

        if (dmLaunchBtn) {
            dmLaunchBtn.addEventListener('click', () => {
                dmSetupOverlay.classList.remove('visible');

                handleNewChat(true);
                setChatActiveState(false);

                isAgentSessionActive = true;
                setTimeout(() => {
                    renderAgentInlineInterface();
                    initSocket();
                    logAgent("Launching agent...");
                    socket.emit('launch-agent', {});
                }, 100);
            });
        }

        console.log("Graxybot UI Initialized.");

    });
