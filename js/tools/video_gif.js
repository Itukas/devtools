export function render() {
    return `
        <style>
            .vg-container { display: flex; flex-direction: column; gap: 20px; user-select: none; }
            
            /* 上传区 */
            .upload-zone {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .upload-zone:hover { border-color: #3b82f6; background: #eff6ff; }
            #file-input { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                opacity: 0; cursor: pointer; pointer-events: none; 
            }

            /* 视频预览区 */
            .video-wrapper {
                background: #000;
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 300px;
                min-height: 150px;
                position: relative;
            }
            video { max-width: 100%; max-height: 100%; display: block; }

            /* 视频尺寸拖动手柄 */
            .resize-handle {
                position: absolute; bottom: 0; left: 0; width: 100%; height: 16px;
                cursor: ns-resize; background: rgba(255,255,255,0.08);
                display: flex; align-items: center; justify-content: center;
                z-index: 20; transition: background 0.2s;
            }
            .resize-handle:hover { background: rgba(59,130,246,0.45); }
            .resize-handle::before {
                content: ''; width: 44px; height: 4px;
                background: rgba(255,255,255,0.6); border-radius: 2px;
            }

            /* --- 核心：时间轴滑块样式 --- */
            .timeline-container {
                position: relative;
                height: 40px;
                display: flex;
                align-items: center;
                margin: 10px 0;
            }
            .track-bg {
                position: absolute; width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px;
            }
            .track-fill {
                position: absolute; height: 6px; background: #3b82f6; border-radius: 3px;
                left: 0; width: 100%; /* JS控制 */
            }
            .thumb {
                position: absolute; width: 18px; height: 18px; 
                background: #fff; border: 2px solid #3b82f6; border-radius: 50%;
                top: 50%; transform: translate(-50%, -50%);
                cursor: grab; z-index: 10;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: transform 0.1s;
            }
            .thumb:active { transform: translate(-50%, -50%) scale(1.2); cursor: grabbing; background: #eff6ff; }
            .thumb-start { left: 0%; }
            .thumb-end { left: 100%; }
            
            /* 当前播放指示器 (红线) */
            .play-indicator {
                position: absolute; width: 2px; height: 14px; background: #ef4444;
                top: 50%; transform: translate(-50%, -50%);
                z-index: 5; pointer-events: none;
            }

            /* 控制面板 */
            .controls-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
            }
            .row { display: flex; gap: 15px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
            
            .input-group { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #475569; }
            .input-sm { width: 70px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: monospace; }
            .label-bold { font-weight: 600; color: #334155; margin-right: 5px; }

            .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; color: #fff; font-size: 13px; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #2563eb; }
            .btn-green { background: #16a34a; }
            .btn-orange { background: #f97316; }
            .btn-disabled { background: #94a3b8; cursor: not-allowed; }
            .btn-lg { padding: 12px 28px; font-size: 15px; box-shadow: 0 2px 6px rgba(22,163,74,0.3); }

            .progress-container {
                height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; position: relative; margin-top: 15px; display: none;
            }
            .progress-bar {
                height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); width: 0%;
                display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: bold;
            }

            .result-area {
                display: none; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; animation: fadeIn 0.3s;
            }
            .gif-preview { max-width: 100%; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>

        <div class="tool-box vg-container">
            <div class="upload-zone" id="drop-zone">
                <div style="font-size: 32px; margin-bottom: 5px;">📹</div>
                <div id="upload-text">点击或拖拽视频文件 (MP4, WebM, MOV)</div>
                <input type="file" id="file-input" accept="video/*">
            </div>

            <div id="editor-panel" style="display:none; flex-direction:column; gap:15px;">
                <div class="video-wrapper" id="video-wrapper">
                    <video id="video-player" controls playsinline></video>
                    <div class="resize-handle" id="resize-handle" title="按住上下拖动，调整视频显示大小"></div>
                </div>

                <div class="controls-card">
                    <div style="margin-bottom: 20px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:5px;">
                            <span>拖动滑块调整范围</span>
                            <span id="duration-display">00:00</span>
                        </div>
                        <div class="timeline-container" id="timeline-track-area">
                            <div class="track-bg"></div>
                            <div class="track-fill" id="range-fill"></div>
                            <div class="play-indicator" id="play-head"></div>
                            <div class="thumb thumb-start" id="thumb-s" title="开始时间"></div>
                            <div class="thumb thumb-end" id="thumb-e" title="结束时间"></div>
                        </div>
                    </div>

                    <div class="row" style="justify-content: space-between;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <div class="input-group">
                                <label>开始(s)</label>
                                <input type="number" id="in-start" class="input-sm" value="0" min="0" step="0.1">
                            </div>
                            <span>-</span>
                            <div class="input-group">
                                <label>结束(s)</label>
                                <input type="number" id="in-end" class="input-sm" value="5" min="0" step="0.1">
                            </div>
                        </div>
                        
                        <button id="btn-play-range" class="btn btn-orange">▶️ 预览选中片段</button>
                    </div>

                    <div class="row" style="border-top:1px solid #f1f5f9; padding-top:15px; margin-top:5px;">
                        <span class="label-bold">⚙️ 参数:</span>
                        <div class="input-group">
                            <label>宽度</label>
                            <input type="number" id="in-width" class="input-sm" value="320" step="10">
                        </div>
                        <div class="input-group">
                            <label>帧率</label>
                            <input type="number" id="in-fps" class="input-sm" value="10" min="1" max="30">
                        </div>
                        <button id="btn-convert" class="btn btn-blue" style="margin-left:auto;">⚡ 生成 GIF</button>
                    </div>

                    <div id="progress-container" class="progress-container">
                        <div id="progress-bar" class="progress-bar">0%</div>
                    </div>
                </div>
            </div>

            <div id="result-area" class="result-area">
                <div style="display:flex; justify-content:center; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#16a34a;">✅ 转换完成!</span>
                    <span id="gif-size" style="font-size:12px; color:#64748b; background:#f1f5f9; padding:4px 8px; border-radius:4px;"></span>
                    <a id="btn-download" download="video.gif" style="text-decoration:none;">
                        <button class="btn btn-green btn-lg">⬇️ 下载 GIF</button>
                    </a>
                </div>
                <img id="gif-result" class="gif-preview">
            </div>
        </div>
    `;
}

export function init() {
    // 动态加载 GIF.js
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (window.GIF) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const statusText = document.getElementById('upload-text');

    // 加载库
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js')
        .then(() => fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'))
        .then(r => r.text())
        .then(workerScript => {
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            window.gifWorkerUrl = URL.createObjectURL(blob);
            statusText.textContent = "点击或拖拽视频文件 (引擎已就绪)";
        })
        .catch(err => {
            console.error(err);
            statusText.textContent = "引擎加载失败";
        });

    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const editorPanel = document.getElementById('editor-panel');
    const video = document.getElementById('video-player');
    const resultArea = document.getElementById('result-area');
    const videoWrapper = document.getElementById('video-wrapper');
    const resizeHandle = document.getElementById('resize-handle');

    // Timeline Elements
    const trackArea = document.getElementById('timeline-track-area');
    const rangeFill = document.getElementById('range-fill');
    const thumbS = document.getElementById('thumb-s');
    const thumbE = document.getElementById('thumb-e');
    const playHead = document.getElementById('play-head');
    const durationDisplay = document.getElementById('duration-display');

    // Inputs & Buttons
    const inStart = document.getElementById('in-start');
    const inEnd = document.getElementById('in-end');
    const inWidth = document.getElementById('in-width');
    const inFps = document.getElementById('in-fps');
    const btnPlayRange = document.getElementById('btn-play-range');
    const btnConvert = document.getElementById('btn-convert');

    // Result
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const gifResult = document.getElementById('gif-result');
    const gifSize = document.getElementById('gif-size');
    const btnDownload = document.getElementById('btn-download');

    let previewInterval = null;
    let videoDuration = 0;

    // --- 核心：时间轴滑块逻辑 ---

    // 更新 UI (根据 Input 值更新滑块位置)
    const updateSliderUI = () => {
        if (!videoDuration) return;
        const s = parseFloat(inStart.value);
        const e = parseFloat(inEnd.value);

        const pctS = (s / videoDuration) * 100;
        const pctE = (e / videoDuration) * 100;

        thumbS.style.left = `${pctS}%`;
        thumbE.style.left = `${pctE}%`;

        rangeFill.style.left = `${pctS}%`;
        rangeFill.style.width = `${pctE - pctS}%`;
    };

    // 初始化拖动功能
    const initDraggable = (thumb, isStart) => {
        let isDragging = false;

        const onMove = (event) => {
            if (!isDragging) return;

            const rect = trackArea.getBoundingClientRect();
            let x = event.clientX - rect.left;

            // 限制范围
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;

            const pct = x / rect.width;
            let time = pct * videoDuration;

            // 逻辑约束：起点不能大于终点，终点不能小于起点
            if (isStart) {
                const limit = parseFloat(inEnd.value);
                if (time >= limit) time = limit - 0.1;
                inStart.value = time.toFixed(1);
                // 拖动起点时，视频实时跳转预览
                video.currentTime = time;
            } else {
                const limit = parseFloat(inStart.value);
                if (time <= limit) time = limit + 0.1;
                inEnd.value = time.toFixed(1);
            }

            updateSliderUI();
        };

        const onUp = () => {
            if (isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
        };

        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault(); // 防止选中文本
            isDragging = true;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    };

    initDraggable(thumbS, true);
    initDraggable(thumbE, false);

    // --- 视频显示区域大小拖动 ---
    (() => {
        let resizing = false, startY = 0, startH = 0;

        const onResize = (e) => {
            if (!resizing) return;
            let h = startH + (e.clientY - startY);
            if (h < 150) h = 150;
            if (h > 800) h = 800;
            videoWrapper.style.height = `${h}px`;
        };

        const stopResize = () => {
            resizing = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
        };

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizing = true;
            startY = e.clientY;
            startH = videoWrapper.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        });
    })();

    // --- 视频播放事件同步 ---
    video.addEventListener('timeupdate', () => {
        if (!videoDuration) return;
        const pct = (video.currentTime / videoDuration) * 100;
        playHead.style.left = `${pct}%`;
    });

    // 监听输入框变化，反向更新滑块
    [inStart, inEnd].forEach(el => {
        el.addEventListener('change', updateSliderUI);
    });

    // --- 文件处理 ---
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('video')) return alert('请上传视频文件');
        fileInput.value = ''; // 允许重复上传

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = () => {
            editorPanel.style.display = 'flex';
            resultArea.style.display = 'none';
            progressContainer.style.display = 'none';

            videoDuration = video.duration;
            durationDisplay.textContent = `总长: ${videoDuration.toFixed(1)}s`;

            // 默认截取范围
            inStart.value = 0;
            inEnd.value = Math.min(5, videoDuration).toFixed(1);
            updateSliderUI();
        };
    };

    // --- 预览片段 ---
    btnPlayRange.onclick = () => {
        const start = parseFloat(inStart.value);
        const end = parseFloat(inEnd.value);

        if (btnPlayRange.textContent.includes("停止")) {
            clearInterval(previewInterval);
            previewInterval = null;
            video.pause();
            btnPlayRange.textContent = "▶️ 预览选中片段";
            btnPlayRange.classList.remove('btn-green');
            btnPlayRange.classList.add('btn-orange');
            return;
        }

        video.currentTime = start;
        video.play();
        btnPlayRange.textContent = "⏹ 停止预览";
        btnPlayRange.classList.remove('btn-orange');
        btnPlayRange.classList.add('btn-green');

        previewInterval = setInterval(() => {
            if (video.currentTime >= end) {
                video.currentTime = start;
                video.play();
            }
        }, 100);
    };

    // --- 转换逻辑 (保持不变) ---
    btnConvert.onclick = async () => {
        if (!window.GIF || !window.gifWorkerUrl) return alert("转换引擎未就绪");
        if (previewInterval) btnPlayRange.click();

        const startTime = parseFloat(inStart.value);
        const endTime = parseFloat(inEnd.value);
        const width = parseInt(inWidth.value);
        const fps = parseInt(inFps.value);

        if (startTime >= endTime) return alert("时间范围无效");

        btnConvert.classList.add('btn-disabled');
        btnConvert.disabled = true;
        btnConvert.textContent = "正在处理...";
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        resultArea.style.display = 'none';

        try {
            const gif = new window.GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: width * (video.videoHeight / video.videoWidth),
                workerScript: window.gifWorkerUrl
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = gif.options.width;
            canvas.height = gif.options.height;

            const step = 1 / fps;
            let currentTime = startTime;
            let frameCount = 0;
            const totalEstimFrames = (endTime - startTime) * fps;

            while (currentTime < endTime) {
                video.currentTime = currentTime;
                await new Promise(resolve => {
                    const onSeek = () => {
                        video.removeEventListener('seeked', onSeek);
                        resolve();
                    };
                    video.addEventListener('seeked', onSeek);
                });

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, { copy: true, delay: 1000 / fps });

                currentTime += step;
                frameCount++;
                const percent = Math.min(50, Math.round((frameCount / totalEstimFrames) * 50));
                progressBar.style.width = `${percent}%`;
                progressBar.textContent = `抓取中 ${percent}%`;
            }

            gif.on('progress', (p) => {
                const totalP = 50 + Math.round(p * 50);
                progressBar.style.width = `${totalP}%`;
                progressBar.textContent = `编码中 ${totalP}%`;
            });

            gif.on('finished', (blob) => {
                btnConvert.classList.remove('btn-disabled');
                btnConvert.disabled = false;
                btnConvert.textContent = "⚡ 生成 GIF";
                progressBar.textContent = "完成!";

                const url = URL.createObjectURL(blob);
                gifResult.src = url;
                btnDownload.href = url;
                const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
                gifSize.textContent = `大小: ${sizeMB} MB`;
                resultArea.style.display = 'block';
                resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            gif.render();

        } catch (e) {
            console.error(e);
            alert("错误: " + e.message);
            btnConvert.classList.remove('btn-disabled');
            btnConvert.disabled = false;
        }
    };

    // Events
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    };
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.border = "2px solid #3b82f6"; };
    dropZone.ondragleave = () => { dropZone.style.border = "2px dashed #cbd5e1"; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.border = "2px dashed #cbd5e1";
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };
}