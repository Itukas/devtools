export function render() {
    return `
        <style>
            .vc-container { display: flex; flex-direction: column; gap: 15px; height: 100%; user-select: none; }
            
            /* 上传区 */
            .upload-zone {
                border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px;
                text-align: center; background: #f8fafc; cursor: not-allowed; transition: all 0.2s; position: relative;
                opacity: 0.6;
            }
            .upload-zone.ready { cursor: pointer; opacity: 1; background: #fff; }
            .upload-zone.ready:hover { border-color: #3b82f6; background: #eff6ff; }
            
            #file-input { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                opacity: 0; cursor: pointer; pointer-events: none; 
            }

            /* 编辑区 */
            #editor-panel { display: none; flex-direction: column; gap: 10px; flex: 1; min-height: 0; }

            /* 视频播放器容器 */
            .video-box {
                background: #000;
                border-radius: 8px;
                height: 400px;
                min-height: 200px;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                resize: vertical;
                position: relative;
            }
            .video-box::after {
                content: '';
                position: absolute; bottom: 2px; right: 2px;
                width: 10px; height: 10px;
                background: linear-gradient(135deg, transparent 50%, #666 50%);
                cursor: ns-resize; pointer-events: none;
            }
            video { max-width: 100%; max-height: 100%; display: block; }

            /* 工具栏 */
            .toolbar { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 8px 15px; border-radius: 6px; }
            .zoom-control { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; }

            /* 时间轴容器 */
            .timeline-scroll-box {
                flex: 0 0 100px; 
                background: #1e293b;
                border-radius: 8px;
                overflow-x: auto;
                overflow-y: hidden;
                position: relative;
                border: 1px solid #334155;
            }
            .timeline-canvas-wrapper { position: relative; height: 100%; }
            canvas { display: block; height: 100%; cursor: default; position: absolute; top: 0; left: 0; }
            
            #play-head {
                position: absolute; top: 0; left: 0; width: 1px; height: 100%; 
                background: #fff; box-shadow: 0 0 4px rgba(255,255,255,0.8);
                pointer-events: none; z-index: 20; display: none;
            }

            /* 列表 */
            .segments-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; padding: 5px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; }
            .segment-item {
                display: flex; align-items: center; gap: 8px; padding: 8px;
                background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; border-left: 4px solid #ccc; transition: background 0.2s;
            }
            .segment-item.active { background: #eff6ff; border-color: #bfdbfe; }
            .seg-color-dot { width: 12px; height: 12px; border-radius: 50%; }
            .input-time { width: 80px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: monospace; font-size: 12px; }

            .btn { padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; color: #fff; display: flex; align-items: center; gap: 4px; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #3b82f6; }
            .btn-green { background: #10b981; }
            .btn-red { background: #ef4444; }

            .log-box { font-size: 11px; color: #64748b; margin-top: 5px; height: 20px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
            .spinner { width: 20px; height: 20px; border: 3px solid #cbd5e1; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>

        <div class="tool-box vc-container">
            <div class="upload-zone" id="drop-zone">
                <div style="font-size: 32px; margin-bottom: 5px;">🎬</div>
                <div id="upload-txt"><div class="spinner"></div>正在加载引擎...</div>
                <div style="font-size:12px; color:#94a3b8; margin-top:5px;" id="sub-txt">首次加载可能较慢 (GitHub 兼容模式)</div>
                <input type="file" id="file-input" accept="video/*">
            </div>

            <div id="editor-panel">
                <div class="video-box"><video id="video-player" controls playsinline></video></div>
                <div class="toolbar">
                    <div style="font-weight:bold; font-size:13px; color:#334155;">视频剪辑</div>
                    <div class="zoom-control">
                        <span>🔍 缩放:</span>
                        <input type="range" id="zoom-slider" min="1" max="50" value="1" step="1" style="width:100px;">
                        <span id="zoom-val">1x</span>
                    </div>
                </div>
                <div class="timeline-scroll-box" id="scroll-box">
                    <div class="timeline-canvas-wrapper" id="canvas-wrapper">
                        <canvas id="ruler-canvas"></canvas>
                        <div id="play-head"></div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; flex:1; min-height:0;">
                    <div style="display:flex; justify-content:space-between; padding:5px;">
                        <span style="font-size:12px; color:#64748b;">剪辑列表</span>
                        <button id="btn-add-seg" class="btn btn-blue">➕ 添加片段</button>
                    </div>
                    <div id="segments-container" class="segments-list"></div>
                </div>
                <div>
                    <button id="btn-export" class="btn btn-green" style="width:100%; padding: 10px; font-size: 14px; justify-content: center;">⚡ 导出视频</button>
                    <div id="log-msg" class="log-box"></div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    let ffmpeg = null;
    let isFFmpegLoaded = false;
    let videoFile = null;
    let videoDuration = 0;
    let segments = [];
    let activeSegmentId = null;
    let zoomLevel = 1;
    let pixelsPerSecond = 20;

    let isDragging = false, dragTargetId = null, dragAction = null, dragStartX = 0, dragOriginalStart = 0, dragOriginalEnd = 0;

    const SEGMENT_COLORS = [
        { fill: 'rgba(59, 130, 246, 0.5)', border: '#2563eb' },
        { fill: 'rgba(16, 185, 129, 0.5)', border: '#059669' },
        { fill: 'rgba(245, 158, 11, 0.5)', border: '#d97706' },
        { fill: 'rgba(239, 68, 68, 0.5)',  border: '#dc2626' }
    ];

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadTxt = document.getElementById('upload-txt');
    const subTxt = document.getElementById('sub-txt');
    const editorPanel = document.getElementById('editor-panel');
    const video = document.getElementById('video-player');
    const scrollBox = document.getElementById('scroll-box');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvas = document.getElementById('ruler-canvas');
    const ctx = canvas.getContext('2d');
    const playHead = document.getElementById('play-head');
    const segmentsContainer = document.getElementById('segments-container');
    const zoomSlider = document.getElementById('zoom-slider');
    const btnAddSeg = document.getElementById('btn-add-seg');
    const btnExport = document.getElementById('btn-export');
    const logMsg = document.getElementById('log-msg');

    // --- 核心修复：加载单线程版本 + 防缓存 + 强制单线程参数 ---
    const loadFFmpeg = async () => {
        if (window.FFmpeg && ffmpeg) { enableUpload(); return; }

        try {
            // 1. 加载主脚本 (0.9.5 版本)
            if (!window.FFmpeg) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.9.5/dist/ffmpeg.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const { createFFmpeg } = window.FFmpeg;

            // 2. 指定单线程核心路径
            // 注意：加上时间戳 ?v=... 是为了防止你之前失败的缓存文件干扰
            const coreUrl = `https://unpkg.com/@ffmpeg/core@0.8.5/dist/ffmpeg-core.js?v=${Date.now()}`;

            ffmpeg = createFFmpeg({
                log: true,
                corePath: coreUrl
            });

            await ffmpeg.load();
            isFFmpegLoaded = true;
            enableUpload();

        } catch (e) {
            console.error(e);
            uploadTxt.innerHTML = '<span style="color:#ef4444">⚠️ 加载失败</span>';
            // 如果还是 SharedArrayBuffer 报错，这里会给出明确提示
            if(e.message.includes("SharedArrayBuffer")) {
                subTxt.innerHTML = "浏览器缓存了旧版本，请<b>清除缓存</b>或尝试<b>无痕模式</b>。";
            } else {
                subTxt.innerHTML = "网络错误，请检查网络连接。";
            }
        }
    };

    const enableUpload = () => {
        uploadTxt.textContent = "点击或拖拽视频文件";
        subTxt.textContent = "引擎已就绪 (GitHub Pages 模式)";
        dropZone.classList.add('ready');
        fileInput.style.pointerEvents = 'auto';
    };

    loadFFmpeg();

    // 常规逻辑保持不变
    const handleFile = (file) => {
        if (!isFFmpegLoaded) return alert("引擎未就绪");
        if (!file || !file.type.startsWith('video')) return alert('请上传视频');

        fileInput.value = '';
        videoFile = file;
        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = () => {
            videoDuration = video.duration;
            dropZone.style.display = 'none';
            editorPanel.style.display = 'flex';
            resizeCanvas(); drawCanvas();
            addSegment(0, Math.min(videoDuration, 5));
        };
        video.onerror = () => alert("无法播放此视频格式");
    };

    const getCanvasWidth = () => videoDuration * pixelsPerSecond * zoomLevel;
    const timeToPx = (t) => t * pixelsPerSecond * zoomLevel;
    const pxToTime = (p) => p / (pixelsPerSecond * zoomLevel);

    const resizeCanvas = () => {
        const w = Math.max(scrollBox.clientWidth, getCanvasWidth());
        canvas.width = w; canvas.height = scrollBox.clientHeight;
        canvasWrapper.style.width = w + 'px';
    };

    const drawCanvas = () => {
        const w = canvas.width, h = canvas.height, rulerH = 25;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, rulerH);
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif';

        let step = zoomLevel > 15 ? 0.1 : (zoomLevel > 5 ? 0.5 : 1);
        for (let t = 0; t <= videoDuration; t += step) {
            const x = timeToPx(t);
            ctx.fillRect(x, 0, 1, rulerH);
            if (timeToPx(step) > 40 || (t % 5 === 0 && t % 1 === 0)) ctx.fillText(t.toFixed(step<1?1:0)+'s', x+3, 16);
        }

        ctx.fillStyle = '#334155'; ctx.fillRect(0, rulerH, w, h - rulerH);

        segments.forEach((seg, index) => {
            const x1 = timeToPx(seg.start), x2 = timeToPx(seg.end);
            const segW = Math.max(4, x2 - x1);
            const style = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
            if (seg.id === activeSegmentId) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x1, rulerH, segW, h-rulerH); }
            ctx.fillStyle = style.fill; ctx.fillRect(x1, rulerH+10, segW, h-rulerH-20);
            ctx.strokeStyle = style.border; ctx.lineWidth = 2; ctx.strokeRect(x1, rulerH+10, segW, h-rulerH-20);
            ctx.fillStyle = '#fff'; ctx.fillRect(x1, rulerH+10, 4, h-rulerH-20); ctx.fillRect(x2-4, rulerH+10, 4, h-rulerH-20);
            ctx.fillText(`#${index+1}`, x1+6, rulerH+25);
        });
    };

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y < 25) { canvas.style.cursor = 'default'; return; }
        const t = pxToTime(e.clientX - rect.left);
        let cursor = 'default';
        for (let seg of segments) {
            if (Math.abs(t - seg.start) < pxToTime(8)) { cursor = 'w-resize'; break; }
            if (Math.abs(t - seg.end) < pxToTime(8)) { cursor = 'e-resize'; break; }
            if (t > seg.start && t < seg.end) { cursor = 'grab'; break; }
        }
        canvas.style.cursor = cursor;
    });

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if ((e.clientY - rect.top) < 25) { video.currentTime = pxToTime(x); return; }
        const t = pxToTime(x);
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            if (Math.abs(t - seg.start) < pxToTime(10)) return startDrag(seg.id, 'L', x);
            if (Math.abs(t - seg.end) < pxToTime(10)) return startDrag(seg.id, 'R', x);
            if (t > seg.start && t < seg.end) return startDrag(seg.id, 'M', x);
        }
        activeSegmentId = null; updateSegmentsUI(); drawCanvas();
    });

    const startDrag = (id, action, startX) => {
        isDragging = true; dragTargetId = id; dragAction = action; dragStartX = startX; activeSegmentId = id;
        const seg = segments.find(s => s.id === id);
        dragOriginalStart = seg.start; dragOriginalEnd = seg.end;
        canvas.style.cursor = action === 'M' ? 'grabbing' : 'col-resize';
        updateSegmentsUI(); drawCanvas(); video.currentTime = seg.start;
        window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        const diffT = pxToTime((e.clientX - canvas.getBoundingClientRect().left) - dragStartX);
        const seg = segments.find(s => s.id === dragTargetId);
        if (dragAction === 'M') {
            const dur = dragOriginalEnd - dragOriginalStart;
            let ns = dragOriginalStart + diffT;
            if (ns < 0) ns = 0; if (ns + dur > videoDuration) ns = videoDuration - dur;
            seg.start = ns; seg.end = ns + dur;
        } else if (dragAction === 'L') {
            let ns = dragOriginalStart + diffT;
            if (ns < 0) ns = 0; if (ns >= seg.end - 0.1) ns = seg.end - 0.1;
            seg.start = ns;
        } else if (dragAction === 'R') {
            let ne = dragOriginalEnd + diffT;
            if (ne > videoDuration) ne = videoDuration; if (ne <= seg.start + 0.1) ne = seg.start + 0.1;
            seg.end = ne;
        }
        updateSegmentInputs(seg); drawCanvas();
        video.currentTime = (dragAction === 'L' || dragAction === 'M') ? seg.start : seg.end;
    };

    const onDragEnd = () => {
        isDragging = false; canvas.style.cursor = 'default';
        window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd);
    };

    const addSegment = (s, e) => {
        const id = Date.now() + Math.random(); segments.push({ id, start: s, end: e }); activeSegmentId = id;
        renderList(); drawCanvas();
    };

    const renderList = () => {
        segmentsContainer.innerHTML = '';
        segments.forEach((seg, idx) => {
            const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
            const el = document.createElement('div');
            el.className = `segment-item ${seg.id === activeSegmentId ? 'active' : ''}`;
            el.dataset.id = seg.id;
            el.innerHTML = `
                <div class="seg-color-dot" style="background:${color.border}"></div>
                <span style="font-size:12px; font-weight:bold;">#${idx+1}</span>
                <input type="number" class="input-time s-in" value="${seg.start.toFixed(2)}" step="0.1">
                <span>-</span>
                <input type="number" class="input-time e-in" value="${seg.end.toFixed(2)}" step="0.1">
                <button class="btn btn-red btn-del" style="margin-left:auto;">×</button>
            `;
            const update = () => {
                let s = parseFloat(el.querySelector('.s-in').value), e = parseFloat(el.querySelector('.e-in').value);
                if (s<0) s=0; if(e>videoDuration) e=videoDuration; if(s>e) [s,e]=[e,s];
                seg.start = s; seg.end = e; drawCanvas();
            };
            el.querySelector('.s-in').onchange = update; el.querySelector('.e-in').onchange = update;
            el.onclick = () => { activeSegmentId = seg.id; updateSegmentsUI(); drawCanvas(); video.currentTime = seg.start; };
            el.querySelector('.btn-del').onclick = (e) => { e.stopPropagation(); segments = segments.filter(x => x.id !== seg.id); renderList(); drawCanvas(); };
            segmentsContainer.appendChild(el);
        });
    };

    const updateSegmentsUI = () => segmentsContainer.querySelectorAll('.segment-item').forEach(el => el.classList.toggle('active', el.dataset.id == activeSegmentId));
    const updateSegmentInputs = (seg) => {
        const el = segmentsContainer.querySelector(`.segment-item[data-id="${seg.id}"]`);
        if (el) { el.querySelector('.s-in').value = seg.start.toFixed(2); el.querySelector('.e-in').value = seg.end.toFixed(2); }
    };

    video.ontimeupdate = () => {
        if (isDragging) return;
        const px = timeToPx(video.currentTime);
        playHead.style.display = 'block'; playHead.style.left = px + 'px';
        if (px > scrollBox.scrollLeft + scrollBox.clientWidth) scrollBox.scrollLeft = px - scrollBox.clientWidth / 2;
    };

    // 导出逻辑
    btnExport.onclick = async () => {
        if (!isFFmpegLoaded) return alert("FFmpeg 未就绪");
        if (segments.length === 0) return alert("请添加片段");
        btnExport.disabled = true; btnExport.textContent = "处理中..."; logMsg.textContent = "准备中...";
        try {
            const name = 'input.mp4';
            const { fetchFile } = window.FFmpeg;
            ffmpeg.FS('writeFile', name, await fetchFile(videoFile));
            const concatList = [];
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i], outName = `part${i}.mp4`;
                logMsg.textContent = `正在剪辑片段 ${i+1}/${segments.length}...`;
                await ffmpeg.run('-i', name, '-ss', seg.start.toString(), '-to', seg.end.toString(), '-c', 'copy', outName);
                concatList.push(`file '${outName}'`);
            }
            logMsg.textContent = "正在合并...";
            ffmpeg.FS('writeFile', 'list.txt', concatList.join('\n'));
            await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4');
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            const a = document.createElement('a'); a.href = url; a.download = `clip_${Date.now()}.mp4`; a.click();
            btnExport.textContent = "⚡ 导出成功";
        } catch (e) { console.error(e); logMsg.textContent = "错误: " + e.message; alert("导出出错，请检查是否使用了无痕模式"); }
        finally { btnExport.disabled = false; }
    };

    // Bindings
    zoomSlider.oninput = () => { zoomLevel = parseInt(zoomSlider.value); document.getElementById('zoom-val').textContent = zoomLevel + 'x'; resizeCanvas(); drawCanvas(); };
    fileInput.onchange = (e) => handleFile(e.target.files[0]);
    btnAddSeg.onclick = () => addSegment(0, Math.min(videoDuration, 5));
    window.onresize = () => { if (editorPanel.style.display === 'flex') { resizeCanvas(); drawCanvas(); } };
}