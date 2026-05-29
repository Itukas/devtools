export function render() {
    return `
        <style>
            .vf-container { display: flex; flex-direction: column; gap: 20px; user-select: none; }

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
            #vf-file-input {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                opacity: 0; cursor: pointer; pointer-events: none;
            }

            .video-wrapper {
                background: #000;
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 200px;
            }
            .vf-container video { max-width: 100%; max-height: 360px; display: block; }

            .controls-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
            }
            .vf-row { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
            .input-group { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; }
            .input-sm { width: 90px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: monospace; }
            .vf-select { padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; }
            .label-bold { font-weight: 600; color: #334155; }

            .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; color: #fff; font-size: 13px; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #2563eb; }
            .btn-green { background: #16a34a; }
            .btn-disabled { background: #94a3b8; cursor: not-allowed; }

            .progress-container {
                height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; position: relative; margin-top: 15px; display: none;
            }
            .progress-bar {
                height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); width: 0%;
                display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: bold;
            }

            .result-card {
                display: none; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;
            }
            .frames-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 10px;
                margin-top: 12px;
                max-height: 460px;
                overflow-y: auto;
            }
            .frame-item {
                border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: #f8fafc;
            }
            .frame-item img { width: 100%; display: block; }
            .frame-item .cap { font-size: 11px; color: #64748b; text-align: center; padding: 4px; font-family: monospace; }
        </style>

        <div class="tool-box vf-container">
            <div class="upload-zone" id="vf-drop-zone">
                <div style="font-size: 32px; margin-bottom: 5px;">🎬</div>
                <div id="vf-upload-text">点击或拖拽视频文件 (MP4, WebM, MOV)</div>
                <input type="file" id="vf-file-input" accept="video/*">
            </div>

            <div id="vf-editor-panel" style="display:none; flex-direction:column; gap:15px;">
                <div class="video-wrapper">
                    <video id="vf-video" controls playsinline></video>
                </div>

                <div class="controls-card">
                    <div class="vf-row" style="justify-content: space-between;">
                        <div class="vf-row">
                            <span class="label-bold">⚙️ 参数:</span>
                            <div class="input-group">
                                <label>抽取帧数</label>
                                <input type="number" id="vf-count" class="input-sm" value="10" min="1" step="1">
                            </div>
                            <div class="input-group">
                                <label>输出宽度</label>
                                <input type="number" id="vf-width" class="input-sm" value="0" min="0" step="10" title="0 表示保持原始宽度">
                            </div>
                            <div class="input-group">
                                <label>格式</label>
                                <select id="vf-format" class="vf-select">
                                    <option value="image/jpeg">JPG</option>
                                    <option value="image/png">PNG</option>
                                    <option value="image/webp">WEBP</option>
                                </select>
                            </div>
                        </div>
                        <button id="vf-extract" class="btn btn-blue">⚡ 开始抽帧</button>
                    </div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                        <span id="vf-duration">总长: 00:00</span> · 将在视频时间轴上均匀抽取指定帧数 · 输出宽度填 0 保持原始尺寸
                    </div>

                    <div id="vf-progress-container" class="progress-container">
                        <div id="vf-progress-bar" class="progress-bar">0%</div>
                    </div>
                </div>
            </div>

            <div id="vf-result-card" class="result-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:bold; color:#334155;">抽帧完成 <span id="vf-result-info" style="font-weight:normal; color:#64748b; font-size:12px;"></span></div>
                    <button id="vf-download" class="btn btn-green">📥 下载压缩包</button>
                </div>
                <div id="vf-frames-grid" class="frames-grid"></div>
            </div>
        </div>
    `;
}

export function init() {
    const loadJsZip = () => new Promise((resolve, reject) => {
        if (window.JSZip) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('JSZip load failed'));
        document.head.appendChild(script);
    });
    loadJsZip().catch(() => {});

    const fileInput = document.getElementById('vf-file-input');
    const dropZone = document.getElementById('vf-drop-zone');
    const uploadText = document.getElementById('vf-upload-text');
    const editorPanel = document.getElementById('vf-editor-panel');
    const video = document.getElementById('vf-video');
    const durationDisplay = document.getElementById('vf-duration');

    const inCount = document.getElementById('vf-count');
    const inWidth = document.getElementById('vf-width');
    const inFormat = document.getElementById('vf-format');
    const btnExtract = document.getElementById('vf-extract');

    const progressContainer = document.getElementById('vf-progress-container');
    const progressBar = document.getElementById('vf-progress-bar');

    const resultCard = document.getElementById('vf-result-card');
    const resultInfo = document.getElementById('vf-result-info');
    const framesGrid = document.getElementById('vf-frames-grid');
    const btnDownload = document.getElementById('vf-download');

    let videoDuration = 0;
    let extractedFrames = [];

    const fmtTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const extFromMime = (mime) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg');

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('video')) return alert('请上传视频文件');
        fileInput.value = '';

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = () => {
            editorPanel.style.display = 'flex';
            resultCard.style.display = 'none';
            progressContainer.style.display = 'none';
            extractedFrames = [];

            videoDuration = video.duration;
            durationDisplay.textContent = `总长: ${fmtTime(videoDuration)} (${videoDuration.toFixed(1)}s)`;
        };
    };

    const seekTo = (time) => new Promise((resolve) => {
        const onSeek = () => { video.removeEventListener('seeked', onSeek); resolve(); };
        video.addEventListener('seeked', onSeek);
        video.currentTime = time;
    });

    btnExtract.onclick = async () => {
        const count = parseInt(inCount.value, 10);
        if (!count || count < 1) return alert('请输入有效的帧数');
        if (!videoDuration) return alert('视频未就绪');

        const mime = inFormat.value;
        const quality = mime === 'image/png' ? undefined : 0.92;
        const targetW = parseInt(inWidth.value, 10) || 0;

        const ratio = video.videoHeight / video.videoWidth;
        const canvas = document.createElement('canvas');
        canvas.width = targetW > 0 ? targetW : video.videoWidth;
        canvas.height = Math.round(canvas.width * ratio);
        const ctx = canvas.getContext('2d');

        btnExtract.classList.add('btn-disabled');
        btnExtract.disabled = true;
        btnExtract.textContent = '抽帧中...';
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        resultCard.style.display = 'none';
        framesGrid.innerHTML = '';
        extractedFrames = [];

        video.pause();

        try {
            // 在视频中均匀分布抽取 count 帧（避开正好结尾导致黑帧）
            for (let i = 0; i < count; i++) {
                const time = count === 1
                    ? videoDuration / 2
                    : Math.min(videoDuration, (videoDuration * i) / (count - 1));
                // 略微回退，避免 seek 到最末尾取不到画面
                await seekTo(Math.min(time, Math.max(0, videoDuration - 0.01)));

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise((res) => canvas.toBlob(res, mime, quality));

                const fileName = `frame_${String(i + 1).padStart(4, '0')}.${extFromMime(mime)}`;
                extractedFrames.push({ fileName, blob, time });

                const url = URL.createObjectURL(blob);
                const item = document.createElement('div');
                item.className = 'frame-item';
                item.innerHTML = `<img src="${url}" alt="${fileName}"><div class="cap">${fmtTime(time)} · ${(time).toFixed(2)}s</div>`;
                framesGrid.appendChild(item);

                const pct = Math.round(((i + 1) / count) * 100);
                progressBar.style.width = `${pct}%`;
                progressBar.textContent = `${pct}%`;
            }

            const totalSize = extractedFrames.reduce((a, f) => a + f.blob.size, 0);
            resultInfo.textContent = `· 共 ${extractedFrames.length} 帧 · ${(totalSize / 1024 / 1024).toFixed(2)} MB · ${canvas.width}×${canvas.height}`;
            resultCard.style.display = 'block';
        } catch (e) {
            console.error(e);
            alert('抽帧失败: ' + e.message);
        } finally {
            btnExtract.classList.remove('btn-disabled');
            btnExtract.disabled = false;
            btnExtract.textContent = '⚡ 开始抽帧';
        }
    };

    btnDownload.onclick = async () => {
        if (extractedFrames.length === 0) return;
        try {
            await loadJsZip();
        } catch (e) {
            return alert('压缩组件加载失败，请检查网络');
        }

        btnDownload.disabled = true;
        btnDownload.textContent = '打包中...';
        try {
            const zip = new window.JSZip();
            extractedFrames.forEach((f) => zip.file(f.fileName, f.blob));
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `frames_${Date.now()}.zip`;
            link.click();
        } catch (e) {
            console.error(e);
            alert('打包下载失败: ' + e.message);
        } finally {
            btnDownload.disabled = false;
            btnDownload.textContent = '📥 下载压缩包';
        }
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.border = '2px solid #3b82f6'; };
    dropZone.ondragleave = () => { dropZone.style.border = '2px dashed #cbd5e1'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.border = '2px dashed #cbd5e1';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };
}
