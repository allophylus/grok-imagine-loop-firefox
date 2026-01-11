// Prevent duplicate injection
if (window.GrokLoopInjected) {
    console.log('Grok Imagine Loop content script already loaded. Skipping re-initialization.');
} else {
    window.GrokLoopInjected = true;
    console.log('Grok Imagine Loop content script (V2) Initializing...');

    // --- Selectors ---
    const SELECTORS = {
        textArea: 'textarea, div[contenteditable="true"], div[role="textbox"]',
        uploadButton: 'button[aria-label="Add photos or video"], button[title="Add image"], button svg rect',
        sendButton: 'button[aria-label="Send"], button[aria-label="Post"], button[type="submit"]',
        // Common grok.com specific
        grokUpload: 'button[aria-label="Upload file"]'
    };

    // --- State ---
    let state = {
        segments: [],
        isRunning: false,
        currentSegmentIndex: -1,
        config: { timeout: 30000 }
    };

    // --- DOM Utilities ---
    function createEl(tag, className, text = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    }

    // --- Helper Functions ---
    function dataURItoBlob(dataURI) {
        const split = dataURI.split(',');
        const byteString = atob(split[1]);
        const mimeString = split[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
        return new Blob([ab], { type: mimeString });
    }

    function blobToBase64(blob) {
        return new Promise((r, j) => {
            const rx = new FileReader();
            rx.onloadend = () => r(rx.result);
            rx.onerror = j;
            rx.readAsDataURL(blob);
        });
    }

    async function typeHumanly(element, text) {
        element.focus();

        // React/Framework handling: Use native value setter
        const setNativeValue = (el, value) => {
            const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value") ||
                Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
            if (descriptor && descriptor.set) {
                descriptor.set.call(el, value);
            } else {
                el.value = value;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
        };

        // Clear first (humanly: select all and delete?)
        // For now, fast clear:
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            setNativeValue(element, '');
        } else if (element.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
        }

        let currentText = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Random keystroke delay (20ms - 80ms) - slightly faster
            const delay = Math.floor(Math.random() * 60) + 20;
            await new Promise(r => setTimeout(r, delay));

            // Occasional "thinking" pause (0.5% chance)
            if (Math.random() < 0.005) {
                await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
            }

            // Dispatch events
            const keyEventOpts = { bubbles: true, cancelable: true, key: char, char: char };
            element.dispatchEvent(new KeyboardEvent('keydown', keyEventOpts));
            element.dispatchEvent(new KeyboardEvent('keypress', keyEventOpts));

            // Insert char
            if (element.tagName === 'DIV' && element.isContentEditable) {
                document.execCommand('insertText', false, char);
            } else {
                currentText += char;
                setNativeValue(element, currentText);
            }

            // Input event is dispatched by setNativeValue
            element.dispatchEvent(new KeyboardEvent('keyup', keyEventOpts));
        }

        element.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
    }

    async function simulateClick(element) {
        if (!element) return;

        // 1. Move to element (hover)
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window }));

        // "Hover" time
        await new Promise(r => setTimeout(r, Math.random() * 300 + 100));

        // 2. Down
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        element.focus();

        // Hold time
        await new Promise(r => setTimeout(r, Math.random() * 150 + 50));

        // 3. Up & Click
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        element.click();
    }

    async function uploadImageToGrok(input) {
        let fileInput = document.querySelector('input[type="file"]');

        // Gentle Back Logic
        if (!fileInput) {
            console.log('File input not found. Checking for Modal/Lightbox close...');
            // Check if we are in "Post View" (Lightbox)
            const closeButton = document.querySelector('button[aria-label="Close"]') || document.querySelector('button[aria-label="Back"]');

            if (closeButton) {
                console.log('In Post View. Navigation is required to upload next image.');
                closeButton.click();
                await new Promise(r => setTimeout(r, 1500));

                // Check if input appeared after navigation
                fileInput = document.querySelector('input[type="file"]');
                if (fileInput) console.log('File input found after navigation.');
            }

            // Only try to find/click the upload button if we STILL don't have the input
            if (!fileInput) {
                // Re-scan
                const buttons = Array.from(document.querySelectorAll('button'));
                const uploadTrigger = buttons.find(b => {
                    const label = (b.ariaLabel || b.title || '').toLowerCase();
                    return label.includes('upload') || label.includes('image') || label.includes('photo') || label.includes('add');
                });

                if (uploadTrigger) {
                    // Try to avoid clicking if it looks like the main "Upload" button which opens dialog
                    // But if we must...
                    console.log('Clicking upload trigger to reveal input...');
                    uploadTrigger.click();
                    await new Promise(r => setTimeout(r, 500));
                    fileInput = document.querySelector('input[type="file"]');
                }
            }
        }

        // Final fallback
        if (!fileInput) {
            const hiddenInput = document.querySelector('input[type="file"]');
            if (hiddenInput) fileInput = hiddenInput;
        }

        if (!fileInput) throw new Error('File input not found. Please ensure you are on the main Compose screen.');

        let blob = input;
        if (typeof input === 'string') blob = dataURItoBlob(input);

        const fileName = `input.${blob.type.split('/')[1]}`;
        const file = new File([blob], fileName, { type: blob.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 2000));
    }

    async function sendPromptToGrok(text) {
        await new Promise(r => setTimeout(r, 2000)); // Initial pause

        let inputArea = null;
        const timeoutMs = state.config.timeout;
        const retryDelay = 2000;
        const maxRetries = Math.ceil(timeoutMs / retryDelay);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            console.log(`Searching for input area (${attempt + 1}/${maxRetries})...`);

            // Precise
            inputArea = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                document.querySelector('textarea[placeholder*="customize"]') ||
                document.querySelector('input[placeholder*="customize"]');

            if (inputArea) break;

            // 2. Loose selectors
            const candidates = Array.from(document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]'));
            const visibleCandidates = candidates.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
            });

            // 2a. Strict Check
            inputArea = visibleCandidates.find(el => {
                const placeholder = (el.placeholder || el.getAttribute('aria-placeholder') || el.innerText || '').toLowerCase();
                return placeholder.includes('video') || placeholder.includes('customize') || placeholder.includes('prompt');
            });

            // 2b. Fallback
            if (!inputArea && visibleCandidates.length > 0) {
                inputArea = visibleCandidates.find(el => {
                    const placeholder = (el.placeholder || el.getAttribute('aria-placeholder') || '').toLowerCase();
                    return !placeholder.includes('search');
                });
            }

            if (inputArea) break;
            await new Promise(r => setTimeout(r, retryDelay));
        }

        // Final fallback
        if (!inputArea) {
            const visibleInputs = Array.from(document.querySelectorAll('textarea, input[type="text"]')).filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
            });
            if (visibleInputs.length === 1) {
                inputArea = visibleInputs[0];
            }
        }

        if (!inputArea) throw new Error('Could not find text input area.');

        // Use HUMAN TYPING instead of instant set
        console.log('Typing prompt humanly...');
        await typeHumanly(inputArea, text);

        await new Promise(r => setTimeout(r, 1000));

        // click "Make video" or "Send" button
        console.log('Searching for Send/Make Video button...');
        let sendBtn = null;
        for (let i = 0; i < 20; i++) {
            const buttons = Array.from(document.querySelectorAll('button'));
            sendBtn = buttons.find(b => {
                const label = (b.textContent || b.ariaLabel || b.title || '').trim().toLowerCase();
                return label === 'make video' || label === 'send' || label === 'generate';
            });

            if (sendBtn) {
                if (!sendBtn.disabled && !sendBtn.classList.contains('disabled')) {
                    console.log('Found enabled Send button. Clicking humanly...');
                    await simulateClick(sendBtn);
                    return;
                }
            }
            await new Promise(r => setTimeout(r, 500));
        }

        console.warn('Could not find enabled Send button after 10s. Trying Enter key...');
        inputArea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter' }));
    }

    async function waitForVideoResponse() {
        // Snapshot existing video URLs to ignore them
        const existingVideos = new Set(
            Array.from(document.querySelectorAll('video'))
                .map(v => v.src)
                .filter(s => s)
        );

        console.log('Waiting for new video... Existing:', existingVideos);

        return new Promise((resolve, reject) => {
            const timeoutMs = state.config && state.config.timeout ? state.config.timeout : 120000;
            let resolved = false;

            const cleanup = () => {
                resolved = true;
                observer.disconnect();
                clearInterval(poller);
                clearTimeout(failTimer);
            };

            const check = async () => {
                if (resolved) return;
                const videos = Array.from(document.querySelectorAll('video'));

                for (let v of videos) {
                    if (v.src && !existingVideos.has(v.src)) {
                        if (v.src.startsWith('blob:') || v.src.includes('video.twimg.com') || v.src.includes('grok.com')) {
                            console.log('New video detected:', v.src);
                            cleanup();
                            await new Promise(r => setTimeout(r, 2000));
                            resolve(v.src);
                            return;
                        }
                    }
                }
            };

            const observer = new MutationObserver(check);
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
            const poller = setInterval(check, 1000);
            const failTimer = setTimeout(() => {
                cleanup();
                console.error('Timeout waiting for video. Current videos:', Array.from(document.querySelectorAll('video')).map(v => v.src));
                reject(new Error('Timeout waiting for video generation'));
            }, timeoutMs);
        });
    }

    async function extractLastFrame(videoUrl) {
        console.log('Fetching video data via background script to bypass CORS...');
        const dataUrl = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'FETCH_VIDEO_AS_DATA_URL',
                payload: { url: videoUrl }
            }, (response) => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                if (response && response.success) resolve(response.dataUrl);
                else reject(new Error(response?.error || 'Unknown background fetch error'));
            });
        });

        const blob = dataURItoBlob(dataUrl);
        const objectUrl = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.muted = true;
        video.autoplay = false;

        return new Promise((resolve, reject) => {
            video.onloadedmetadata = async () => {
                try {
                    const time = Math.max(0, video.duration - 0.1);
                    video.currentTime = time;
                    await new Promise(r => video.onseeked = r);

                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);

                    canvas.toBlob(b => {
                        URL.revokeObjectURL(objectUrl);
                        video.remove();
                        resolve(b);
                    }, 'image/jpeg', 0.95);

                } catch (e) {
                    URL.revokeObjectURL(objectUrl);
                    reject(e);
                }
            };
            video.onerror = (e) => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Video load error'));
            };
            video.src = objectUrl;
        });
    }

    // --- Dashboard UI ---
    class Dashboard {
        constructor() {
            const existing = document.getElementById('grok-loop-dashboard');
            if (existing) existing.remove();

            this.root = createEl('div', '');
            this.root.id = 'grok-loop-dashboard';
            this.render();

            const append = () => {
                document.body.appendChild(this.root);
                console.log('Dashboard appended to body.');
                this.root.style.border = '5px solid yellow';
                setTimeout(() => this.root.style.border = '1px solid rgba(255,255,255,0.2)', 2000);
            };

            if (document.body) {
                append();
            } else {
                window.addEventListener('DOMContentLoaded', append);
            }
        }

        render() {
            this.root.innerHTML = '';

            // Header
            const header = createEl('div', 'dashboard-header');
            header.appendChild(createEl('h3', '', 'Grok Loop'));

            // Drag Logic
            let isDragging = false;
            let currentX, currentY, initialX, initialY;
            let xOffset = 0, yOffset = 0;

            header.onmousedown = (e) => {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                if (e.target === header || e.target.parentNode === header) isDragging = true;
            };

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    xOffset = currentX;
                    yOffset = currentY;
                    this.root.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
                    this.root.classList.remove('collapsed');
                }
            });

            document.addEventListener('mouseup', () => {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
            });

            const controls = createEl('div', 'dashboard-controls');
            const collapseBtn = createEl('button', 'icon-btn', '⇄');
            collapseBtn.onclick = () => {
                this.root.classList.toggle('collapsed');
                if (this.root.classList.contains('collapsed')) {
                    this.root.style.transform = '';
                    xOffset = 0;
                    yOffset = 0;
                }
            };
            controls.appendChild(collapseBtn);
            header.appendChild(controls);
            this.root.appendChild(header);

            // List
            const list = createEl('div', 'segments-list');
            if (state.segments.length === 0) {
                const empty = createEl('div', 'segment-info', 'Ready to start...');
                empty.style.padding = '10px';
                list.appendChild(empty);
            } else {
                state.segments.forEach((seg, index) => {
                    const card = createEl('div', `segment-card ${seg.status} ${index === state.currentSegmentIndex ? 'active' : ''}`);

                    const info = createEl('div', 'segment-info');
                    info.textContent = `Segment ${index + 1} • ${seg.status.toUpperCase()}`;
                    card.appendChild(info);

                    const prompt = createEl('div', 'segment-prompt', seg.prompt);
                    card.appendChild(prompt);

                    if (seg.inputImage || seg.videoUrl) {
                        const mediaContainer = createEl('div', 'segment-media');
                        if (seg.videoUrl) {
                            const video = createEl('video', 'preview-video');
                            video.src = seg.videoUrl;
                            video.controls = true;
                            video.muted = true;
                            mediaContainer.appendChild(video);
                        }
                        card.appendChild(mediaContainer);
                    }

                    const actions = createEl('div', 'segment-actions');
                    if (seg.videoUrl) {
                        const dlBtn = createEl('button', 'action-btn secondary', 'Download');
                        dlBtn.onclick = () => window.LoopManager.downloadSegment(index);
                        actions.appendChild(dlBtn);
                    }
                    if (seg.status !== 'working') {
                        const regenBtn = createEl('button', 'action-btn', 'Regenerate');
                        regenBtn.onclick = () => window.LoopManager.regenerateSegment(index);
                        actions.appendChild(regenBtn);
                    }
                    card.appendChild(actions);

                    list.appendChild(card);
                });
            }
            this.root.appendChild(list);

            // Status Bar
            const status = createEl('div', 'status-bar');
            status.style.display = 'flex';
            status.style.justifyContent = 'space-between';
            status.style.alignItems = 'center';
            status.style.gap = '8px';

            const statusText = createEl('span', '', state.isRunning ? 'Running...' : 'Paused/Idle');
            status.appendChild(statusText);

            if (state.segments.length > 0) {
                const pauseBtn = createEl('button', 'action-btn', state.isRunning ? 'Pause' : 'Resume');
                pauseBtn.style.padding = '4px 8px';
                pauseBtn.style.fontSize = '12px';
                pauseBtn.onclick = () => window.LoopManager.togglePause();
                status.appendChild(pauseBtn);
            }

            this.root.appendChild(status);
        }

        update() {
            this.render();
        }
    }

    // --- Loop Manager ---
    window.LoopManager = {
        dashboard: null,

        init() {
            this.dashboard = new Dashboard();
            console.log('LoopManager initialized dashboard');
        },

        async start(payload) {
            console.log('LoopManager starting...', payload);
            if (state.isRunning) return;

            state.config = {
                timeout: (payload.timeout || 30) * 1000
            };

            state.segments = payload.prompts.map((p, i) => ({
                id: i,
                prompt: p,
                inputImage: null,
                videoUrl: null,
                status: 'pending'
            }));

            if (payload.initialImage) {
                state.segments[0].inputImage = dataURItoBlob(payload.initialImage);
            }

            const expandedSegments = [];
            for (let i = 0; i < payload.loops; i++) {
                const sourcePromptIndex = i % payload.prompts.length;
                expandedSegments.push({
                    id: i,
                    prompt: payload.prompts[sourcePromptIndex],
                    inputImage: (i === 0 && payload.initialImage) ? dataURItoBlob(payload.initialImage) : null,
                    status: 'pending'
                });
            }
            state.segments = expandedSegments;

            state.isRunning = true;
            state.currentSegmentIndex = 0;
            this.dashboard.update();

            if (this.dashboard.root.style.display === 'none') {
                this.dashboard.root.style.display = 'flex';
            }

            await this.processQueue();
        },

        async restore(savedState) {
            console.log('Restoring loop state...', savedState);
            state.segments = savedState.segments;
            state.currentSegmentIndex = savedState.currentSegmentIndex;
            state.config = savedState.config;
            state.isRunning = true;

            if (state.currentSegmentIndex >= 0 && state.currentSegmentIndex < state.segments.length) {
                const seg = state.segments[state.currentSegmentIndex];
                if (seg.status === 'working' || seg.status === 'error') {
                    seg.status = 'pending';
                }
            }

            this.dashboard.update();
            if (this.dashboard.root.style.display === 'none') {
                this.dashboard.root.style.display = 'flex';
            }

            await this.processQueue();
        },

        saveState() {
            const segmentsToSave = state.segments.map(s => ({
                id: s.id,
                prompt: s.prompt,
                videoUrl: s.videoUrl,
                status: s.status,
                inputImage: null
            }));

            const savePayload = {
                segments: segmentsToSave,
                currentSegmentIndex: state.currentSegmentIndex,
                config: state.config
            };

            chrome.storage.local.set({ 'grokLoopState': savePayload });
        },

        togglePause() {
            state.isRunning = !state.isRunning;
            this.dashboard.update();
        },

        async processQueue() {
            for (let i = state.currentSegmentIndex; i < state.segments.length; i++) {
                state.currentSegmentIndex = i;

                if (!state.isRunning) {
                    console.log('Loop paused.');
                    this.saveState();
                    this.dashboard.update();
                    break;
                }

                if (state.segments[i].status === 'done') continue;

                if (i > 0) {
                    const delay = Math.floor(Math.random() * (60000 - 20000 + 1)) + 20000;
                    console.log(`Waiting for human-like delay (${(delay / 1000).toFixed(1)}s) before next segment...`);

                    for (let d = 0; d < delay; d += 1000) {
                        if (!state.isRunning) break;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (!state.isRunning) {
                    console.log('Loop paused during delay.');
                    this.saveState();
                    this.dashboard.update();
                    break;
                }

                await this.processSegment(i);
                this.saveState();

                if (!state.isRunning) break;
            }

            if (state.currentSegmentIndex >= state.segments.length - 1 && state.segments[state.segments.length - 1].status === 'done') {
                state.isRunning = false;
                state.currentSegmentIndex = -1;
                this.dashboard.update();
                chrome.storage.local.remove('grokLoopState');
                console.log('Loop finished. State cleared.');
            }
        },

        async processSegment(index) {
            const seg = state.segments[index];
            const maxRetries = 2;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                if (!state.isRunning) return;

                try {
                    console.log(`Processing Segment ${index + 1} (Attempt ${attempt + 1}/${maxRetries + 1})...`);

                    seg.status = 'working';
                    this.dashboard.update();

                    // 1. Input Image
                    if (!seg.inputImage && index > 0) {
                        const prevSeg = state.segments[index - 1];
                        if (prevSeg.videoUrl) {
                            console.log(`Extracting last frame from Segment ${index} (Late Extract)...`);
                            seg.inputImage = await extractLastFrame(prevSeg.videoUrl);
                        } else {
                            throw new Error(`Previous segment ${index} has no output video to chain from.`);
                        }
                    } else if (index === 0 && !seg.inputImage) {
                        console.warn('Initial segment missing input image.');
                    }

                    if (seg.inputImage) {
                        const base64 = await blobToBase64(seg.inputImage);
                        await uploadImageToGrok(base64);
                    }

                    // 2. Prompt
                    console.log(`Sending prompt for Segment ${index + 1}...`);
                    await sendPromptToGrok(seg.prompt);

                    // 3. Status
                    const videoUrl = await waitForVideoResponse();
                    seg.videoUrl = videoUrl;
                    seg.status = 'done';

                    // Proactive Extraction
                    if (index + 1 < state.segments.length) {
                        console.log(`Proactively extracting frame for Segment ${index + 2}...`);
                        try {
                            const nextFrame = await extractLastFrame(videoUrl);
                            state.segments[index + 1].inputImage = nextFrame;
                        } catch (e) {
                            console.warn('Proactive extraction failed (will retry on next step):', e);
                        }
                    }

                    console.log(`Segment ${index + 1} complete.`);
                    this.dashboard.update();
                    return;

                } catch (err) {
                    console.error(`Segment ${index + 1} failed on attempt ${attempt + 1}:`, err);

                    if (attempt < maxRetries) {
                        console.log('Retrying in 5 seconds...');
                        await new Promise(r => setTimeout(r, 5000));
                    } else {
                        seg.status = 'error';
                        this.dashboard.update();
                        state.isRunning = false;
                        throw err;
                    }
                }
            }
        },

        async regenerateSegment(index) {
            if (state.isRunning) { alert("Please Pause first."); return; }

            const cascade = confirm("Regenerate all subsequent segments too?\nOK = Cascade (Everything after this changes)\nCancel = Single (Just this one)");

            const seg = state.segments[index];
            seg.status = 'pending';
            seg.videoUrl = null;

            if (cascade) {
                for (let i = index + 1; i < state.segments.length; i++) {
                    state.segments[i].status = 'pending';
                    state.segments[i].videoUrl = null;
                    state.segments[i].inputImage = null;
                }
            }

            state.isRunning = true;
            state.currentSegmentIndex = index;
            this.dashboard.update();

            await this.processQueue();
        },

        downloadSegment(index) {
            const seg = state.segments[index];
            if (seg.videoUrl) {
                chrome.runtime.sendMessage({
                    action: 'DOWNLOAD_VIDEO',
                    payload: { url: seg.videoUrl, filename: `grok_loop_segment_${index + 1}.mp4` }
                });
            }
        }
    };

    // --- Init ---
    window.LoopManager.init();

    // Listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Content] Received message:', message);
        if (message.action === 'START_LOOP') {
            window.LoopManager.start(message.payload);
            sendResponse({ status: 'STARTED' });
        }
    });
}
