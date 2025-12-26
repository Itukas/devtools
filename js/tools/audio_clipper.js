export function render() {
    return `
        <style>
            .ac-container { display: flex; flex-direction: column; gap: 15px; height: 100%; user-select: none; }
            
            /* 上传区 */
            .upload-zone {
                border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px;
                text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s; position: relative;
            }
            .upload-zone:hover { border-color: #3b82f6; background: #eff6ff; }
            #file-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; pointer-events: none; }

            /* 编辑区容器 */
            #editor-panel { display: none; flex-direction: column; gap: 10px; flex: 1; min-height: 0; }

            /* 顶部工具栏 */
            .toolbar { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 8px 15px; border-radius: 6px; }
            .zoom-control { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; }
            
            /* --- 核心：滚动波形容器 --- */
            .waveform-scroll-box {
                flex: 0 0 160px; /* 固定高度 */
                background: #1e293b;
                border-radius: 8px;
                overflow-x: auto; /* 允许横向滚动 */
                overflow-y: hidden;
                position: relative;
                border: 1px solid #334155;
            }
            /* 实际画布 */
            canvas { display: block; height: 100%; cursor: default; }

            /* 播放指针 */
            #play-head {
                position: absolute; top: 0; left: 0; width: 1px; height: 100%; 
                background: #fff; box-shadow: 0 0 4px rgba(255,255,255,0.8);
                pointer-events: none; z-index: 20; display: none;
            }

            /* 片段列表区 */
            .segments-header { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #334155; }
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
            .btn-blue { background: #2563eb; }
            .btn-green { background: #10b981; }
            .btn-red { background: #ef4444; }
            .btn-gray { background: #64748b; }

            /* 底部 */
            .bottom-actions { display: flex; gap: 10px; padding-top: 10px; }
            
            /* 提示文字 */
            .help-tip { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
        </style>

        <div class="tool-box ac-container">
            <div class="upload-zone" id="drop-zone">
                <div style="font-size: 32px; margin-bottom: 5px;">🎵</div>
                <div>点击或拖拽音频文件 (MP3, WAV)</div>
                <input type="file" id="file-input" accept="audio/*">
            </div>

            <div id="editor-panel">
                <div class="toolbar">
                    <div id="file-info-txt" style="font-weight:bold; font-size:13px; color:#334155;"></div>
                    <div class="zoom-control">
                        <span>🔍 缩放:</span>
                        <input type="range" id="zoom-slider" min="1" max="50" value="1" step="1" style="width:100px;">
                        <span id="zoom-val">1x</span>
                    </div>
                </div>
                
                <div class="help-tip">
                    ℹ️ 提示: 在波形图上 <span style="font-weight:bold; color:#334155;">拖拽中间</span> 可移动片段，<span style="font-weight:bold; color:#334155;">拖拽边缘</span> 可调整时长。
                </div>

                <div class="waveform-scroll-box" id="scroll-box">
                    <canvas id="wave-canvas"></canvas>
                    <div id="play-head"></div>
                </div>

                <div style="display:flex; flex-direction:column; flex:1; min-height:0;">
                    <div class="segments-header">
                        <span>剪辑片段列表</span>
                        <button id="btn-add-seg" class="btn btn-blue">➕ 添加片段</button>
                    </div>
                    <div id="segments-container" class="segments-list"></div>
                </div>

                <div class="bottom-actions">
                    <button id="btn-merge" class="btn btn-green" style="flex:1; padding: 10px; font-size: 14px; justify-content: center;">⚡ 合并并导出 WAV</button>
                    <a id="btn-download" style="display:none; text-decoration:none;">
                        <button class="btn btn-blue" style="padding: 10px; font-size: 14px;">⬇️ 下载</button>
                    </a>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // --- 变量定义 ---
    let audioContext = null;
    let sourceBuffer = null;
    let segments = [];
    let activeSegmentId = null;
    let zoomLevel = 1;
    let pixelsPerSecond = 50; // 基础比例：每秒占多少像素

    // 拖拽状态
    let isDragging = false;
    let dragTargetId = null;
    let dragAction = null; // 'move', 'resize-left', 'resize-right'
    let dragStartX = 0;
    let dragOriginalStart = 0;
    let dragOriginalEnd = 0;

    // 播放状态
    let isPlaying = false;
    let currentSourceNode = null;
    let animationFrameId = null;
    let playStartTime = 0; // 音频上下文时间
    let playStartOffset = 0; // 播放起点的音频时间

    // 配色
    const SEGMENT_COLORS = [
        { fill: 'rgba(59, 130, 246, 0.3)', border: '#2563eb' },
        { fill: 'rgba(16, 185, 129, 0.3)', border: '#059669' },
        { fill: 'rgba(245, 158, 11, 0.3)', border: '#d97706' },
        { fill: 'rgba(239, 68, 68, 0.3)',  border: '#dc2626' },
        { fill: 'rgba(139, 92, 246, 0.3)', border: '#7c3aed' }
    ];

    // DOM
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const editorPanel = document.getElementById('editor-panel');
    const scrollBox = document.getElementById('scroll-box');
    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas.getContext('2d');
    const playHead = document.getElementById('play-head');
    const segmentsContainer = document.getElementById('segments-container');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomVal = document.getElementById('zoom-val');
    const btnAddSeg = document.getElementById('btn-add-seg');
    const btnMerge = document.getElementById('btn-merge');
    const btnDownload = document.getElementById('btn-download');

    // --- 1. 初始化与文件加载 ---

    const initAudioContext = () => {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    };

    const handleFile = async (file) => {
        if (!file || !file.type.startsWith('audio')) return alert('请上传音频文件');
        initAudioContext();

        try {
            const arrayBuffer = await file.arrayBuffer();
            sourceBuffer = await audioContext.decodeAudioData(arrayBuffer);

            dropZone.style.display = 'none';
            editorPanel.style.display = 'flex';
            document.getElementById('file-info-txt').textContent = file.name;

            // 初始化视图
            resizeCanvas();
            drawCanvas();

            // 默认加一个片段
            addSegment(0, Math.min(sourceBuffer.duration * 0.2, 5));

        } catch (e) {
            console.error(e);
            alert('解码失败');
        } finally {
            fileInput.value = '';
        }
    };

    // --- 2. 核心 Canvas 绘制逻辑 (Ruler + Wave + Segments) ---

    const getCanvasWidth = () => {
        if (!sourceBuffer) return 0;
        return sourceBuffer.duration * pixelsPerSecond * zoomLevel;
    };

    const timeToPx = (time) => time * pixelsPerSecond * zoomLevel;
    const pxToTime = (px) => px / (pixelsPerSecond * zoomLevel);

    const resizeCanvas = () => {
        if (!sourceBuffer) return;
        const w = getCanvasWidth();
        canvas.width = w;
        canvas.height = scrollBox.clientHeight;
        // 保持 canvas 样式宽度与内部像素一致，防止拉伸模糊
        canvas.style.width = w + 'px';
    };

    const drawCanvas = () => {
        if (!sourceBuffer) return;
        const w = canvas.width;
        const h = canvas.height;
        const rulerH = 20; // 刻度尺高度

        ctx.clearRect(0, 0, w, h);

        // A. 绘制时间轴 (Ruler)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, rulerH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';

        // 动态刻度间隔 (根据缩放级别)
        let step = 1; // 秒
        if (zoomLevel > 5) step = 0.5;
        if (zoomLevel > 10) step = 0.1;
        if (zoomLevel > 30) step = 0.05;

        for (let t = 0; t <= sourceBuffer.duration; t += step) {
            const x = timeToPx(t);
            // 大刻度
            ctx.fillRect(x, 0, 1, rulerH);
            // 文本 (避免太密)
            const pxStep = timeToPx(step);
            if (pxStep > 40 || (t % (step*5) < 0.001)) {
                ctx.fillText(t.toFixed(step < 1 ? 2 : 0) + 's', x + 2, 14);
            }
        }

        // B. 绘制波形 (优化：只画单声道)
        const channelData = sourceBuffer.getChannelData(0);
        const stepDraw = Math.ceil(channelData.length / w);
        const amp = (h - rulerH) / 2;
        const midY = rulerH + amp;

        ctx.fillStyle = '#475569';
        ctx.beginPath();

        // 简单的波形采样算法
        for (let i = 0; i < w; i += 2) { // 步进2像素，提升性能
            let min = 1.0;
            let max = -1.0;
            // 映射回原始数据索引
            const idx = Math.floor(pxToTime(i) * sourceBuffer.sampleRate);
            // 采样一段
            for (let j = 0; j < stepDraw; j++) {
                const val = channelData[idx + j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
            if (min > max) continue; // 空数据

            const y1 = midY + min * amp;
            const y2 = midY + max * amp;
            ctx.fillRect(i, y1, 2, Math.max(1, y2 - y1));
        }

        // C. 绘制片段 (Segments)
        segments.forEach((seg, index) => {
            const x1 = timeToPx(seg.start);
            const x2 = timeToPx(seg.end);
            const segW = Math.max(2, x2 - x1);
            const style = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

            // 填充
            ctx.fillStyle = style.fill;
            ctx.fillRect(x1, rulerH, segW, h - rulerH);

            // 边框
            ctx.strokeStyle = style.border;
            ctx.lineWidth = 2;
            if (seg.id === activeSegmentId) {
                ctx.lineWidth = 4; // 选中加粗
                ctx.strokeStyle = '#fff'; // 选中高亮
                ctx.strokeRect(x1, rulerH, segW, h - rulerH);
                ctx.strokeStyle = style.border; // 恢复颜色画内圈
            }
            ctx.strokeRect(x1, rulerH, segW, h - rulerH);

            // 左右拖拽手柄示意
            ctx.fillStyle = style.border;
            ctx.fillRect(x1, rulerH, 4, h - rulerH); // 左把手
            ctx.fillRect(x2 - 4, rulerH, 4, h - rulerH); // 右把手

            // 标签
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`#${index+1}`, x1 + 5, rulerH + 15);
        });
    };

    // --- 3. 交互逻辑 (拖拽、缩放) ---

    // 缩放
    zoomSlider.oninput = () => {
        zoomLevel = parseInt(zoomSlider.value);
        zoomVal.textContent = zoomLevel + 'x';
        resizeCanvas();
        drawCanvas();
    };

    // 鼠标交互辅助
    const getCursorStyle = (x, y) => {
        if (y < 20) return 'default'; // Ruler区域
        const time = pxToTime(x);
        const tolerance = pxToTime(5); // 5像素容差

        for (let seg of segments) {
            if (Math.abs(time - seg.start) < tolerance) return 'w-resize'; // 左边缘
            if (Math.abs(time - seg.end) < tolerance) return 'e-resize';   // 右边缘
            if (time > seg.start && time < seg.end) return 'grab';         // 中间
        }
        return 'default';
    };

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) return; // 拖拽中不由这里控制光标
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        canvas.style.cursor = getCursorStyle(x, y);
    });

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (y < 20) return; // 点击了尺子，不做操作(或可做跳转播放)

        const time = pxToTime(x);
        const tolerance = pxToTime(10); // 增大点击判定范围

        // 倒序遍历，优先选中上层（虽然这里没有重叠层级概念，但符合直觉）
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];

            // 1. 检查左边缘
            if (Math.abs(time - seg.start) < tolerance) {
                startDrag(seg.id, 'resize-left', x);
                return;
            }
            // 2. 检查右边缘
            if (Math.abs(time - seg.end) < tolerance) {
                startDrag(seg.id, 'resize-right', x);
                return;
            }
            // 3. 检查中间
            if (time > seg.start && time < seg.end) {
                startDrag(seg.id, 'move', x);
                return;
            }
        }

        // 点击空白处，取消选中
        activeSegmentId = null;
        updateSegmentsUI();
        drawCanvas();
    });

    const startDrag = (segId, action, startX) => {
        isDragging = true;
        dragTargetId = segId;
        dragAction = action;
        dragStartX = startX;

        const seg = segments.find(s => s.id === segId);
        dragOriginalStart = seg.start;
        dragOriginalEnd = seg.end;
        activeSegmentId = segId;

        canvas.style.cursor = action === 'move' ? 'grabbing' : 'col-resize';
        updateSegmentsUI(); // 高亮列表项
        drawCanvas();       // 高亮波形块

        // 全局监听，防止拖出 Canvas
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        // 计算当前鼠标在 Canvas 内的相对 X 坐标 (不受 scroll 影响，因为 rect 是视口坐标)
        // 但我们需要相对于 canvas 起点的坐标
        // 更好的方式：使用 e.movementX 或者重新计算
        // 简单方式：
        const currentMouseX = e.clientX - rect.left;
        const deltaPx = currentMouseX - dragStartX;
        const deltaTime = pxToTime(deltaPx);

        const seg = segments.find(s => s.id === dragTargetId);
        const maxTime = sourceBuffer.duration;

        if (dragAction === 'move') {
            const duration = dragOriginalEnd - dragOriginalStart;
            let newStart = dragOriginalStart + deltaTime;
            if (newStart < 0) newStart = 0;
            if (newStart + duration > maxTime) newStart = maxTime - duration;

            seg.start = newStart;
            seg.end = newStart + duration;
        } else if (dragAction === 'resize-left') {
            let newStart = dragOriginalStart + deltaTime;
            if (newStart < 0) newStart = 0;
            if (newStart >= seg.end - 0.1) newStart = seg.end - 0.1; // 最小间隔
            seg.start = newStart;
        } else if (dragAction === 'resize-right') {
            let newEnd = dragOriginalEnd + deltaTime;
            if (newEnd > maxTime) newEnd = maxTime;
            if (newEnd <= seg.start + 0.1) newEnd = seg.start + 0.1;
            seg.end = newEnd;
        }

        updateSegmentInputValues(seg); // 实时更新列表输入框
        drawCanvas();
    };

    const onDragEnd = () => {
        isDragging = false;
        dragTargetId = null;
        canvas.style.cursor = 'default';
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
    };

    // --- 4. 片段管理逻辑 ---

    const addSegment = (s, e) => {
        const id = Date.now().toString() + Math.random();
        segments.push({ id, start: s, end: e });
        activeSegmentId = id;
        renderSegmentsList();
        drawCanvas();
    };

    const renderSegmentsList = () => {
        segmentsContainer.innerHTML = '';
        segments.forEach((seg, index) => {
            const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
            const el = document.createElement('div');
            el.className = `segment-item ${seg.id === activeSegmentId ? 'active' : ''}`;
            el.dataset.id = seg.id;
            el.innerHTML = `
                <div class="seg-color-dot" style="background:${color.border}"></div>
                <span style="font-weight:bold; font-size:12px; color:#555;">#${index+1}</span>
                <input type="number" class="input-time start-in" value="${seg.start.toFixed(3)}" step="0.01">
                <span>-</span>
                <input type="number" class="input-time end-in" value="${seg.end.toFixed(3)}" step="0.01">
                <div style="margin-left:auto; display:flex; gap:5px;">
                    <button class="btn btn-gray btn-play" title="试听">▶</button>
                    <button class="btn btn-red btn-del" title="删除">×</button>
                </div>
            `;

            // 输入框事件
            const startIn = el.querySelector('.start-in');
            const endIn = el.querySelector('.end-in');

            const onInputChange = () => {
                let s = parseFloat(startIn.value);
                let e = parseFloat(endIn.value);
                if (s < 0) s = 0;
                if (e > sourceBuffer.duration) e = sourceBuffer.duration;
                if (s > e) [s, e] = [e, s];
                seg.start = s; seg.end = e;
                drawCanvas();
            };

            startIn.onchange = onInputChange;
            endIn.onchange = onInputChange;

            // 聚焦高亮
            el.onclick = () => {
                activeSegmentId = seg.id;
                updateSegmentsUI();
                drawCanvas();
            };

            // 按钮
            el.querySelector('.btn-play').onclick = (e) => {
                e.stopPropagation();
                playSegment(seg.start, seg.end);
            };
            el.querySelector('.btn-del').onclick = (e) => {
                e.stopPropagation();
                segments = segments.filter(s => s.id !== seg.id);
                renderSegmentsList();
                drawCanvas();
            };

            segmentsContainer.appendChild(el);
        });
    };

    const updateSegmentsUI = () => {
        // 仅切换 active 类
        const items = segmentsContainer.querySelectorAll('.segment-item');
        items.forEach(item => {
            if (item.dataset.id === activeSegmentId) item.classList.add('active');
            else item.classList.remove('active');
        });
    };

    // 拖动时只更新数值，不重绘整个列表
    const updateSegmentInputValues = (seg) => {
        const item = segmentsContainer.querySelector(`.segment-item[data-id="${seg.id}"]`);
        if (item) {
            item.querySelector('.start-in').value = seg.start.toFixed(3);
            item.querySelector('.end-in').value = seg.end.toFixed(3);
        }
    };

    // --- 5. 播放与导出 (复用逻辑) ---

    const stopPlayback = () => {
        if (currentSourceNode) {
            currentSourceNode.stop();
            currentSourceNode = null;
        }
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        playHead.style.display = 'none';
        isPlaying = false;
    };

    const playSegment = (start, end) => {
        stopPlayback();
        isPlaying = true;

        // 计算播放指针位置 (相对于 scrollBox)
        // 注意：播放指针需要在 scrollBox 内部绝对定位，位置是 timeToPx(t)
        // 但 scrollBox 有 overflow，所以 playHead 也要跟随滚动？
        // 实际上 playHead 是放在 scrollBox 里面的，left 会很大，自然会跟随滚动。

        playHead.style.display = 'block';

        currentSourceNode = audioContext.createBufferSource();
        currentSourceNode.buffer = sourceBuffer;
        currentSourceNode.connect(audioContext.destination);
        currentSourceNode.start(0, start, end - start);

        playStartTime = audioContext.currentTime;
        playStartOffset = start;

        const updatePlayHead = () => {
            if (!isPlaying) return;
            const elapsed = audioContext.currentTime - playStartTime;
            const currentPos = playStartOffset + elapsed;

            if (currentPos >= end) {
                stopPlayback();
                return;
            }

            // 更新指针位置 (像素)
            const px = timeToPx(currentPos);
            playHead.style.left = px + 'px';

            // 自动卷动：如果指针跑出可视区域，自动滚
            const boxLeft = scrollBox.scrollLeft;
            const boxW = scrollBox.clientWidth;
            if (px > boxLeft + boxW - 20) {
                scrollBox.scrollLeft = px - boxW / 2; // 居中
            }

            animationFrameId = requestAnimationFrame(updatePlayHead);
        };
        updatePlayHead();
        currentSourceNode.onended = stopPlayback;
    };

    const mergeAndExport = () => {
        if (segments.length === 0) return alert("无片段");
        stopPlayback();
        btnMerge.textContent = "处理中...";
        btnMerge.disabled = true;

        setTimeout(() => {
            // 计算总长
            let totalFrames = 0;
            const validSegs = segments.filter(s => s.end > s.start);
            validSegs.forEach(s => totalFrames += Math.round((s.end - s.start) * sourceBuffer.sampleRate));

            if (!totalFrames) { btnMerge.disabled = false; return; }

            const newBuffer = audioContext.createBuffer(sourceBuffer.numberOfChannels, totalFrames, sourceBuffer.sampleRate);

            for (let ch = 0; ch < sourceBuffer.numberOfChannels; ch++) {
                const oldData = sourceBuffer.getChannelData(ch);
                const newData = newBuffer.getChannelData(ch);
                let offset = 0;
                validSegs.forEach(s => {
                    const startF = Math.floor(s.start * sourceBuffer.sampleRate);
                    const len = Math.floor((s.end - s.start) * sourceBuffer.sampleRate);
                    newData.set(oldData.subarray(startF, startF + len), offset);
                    offset += len;
                });
            }

            const wavBlob = bufferToWave(newBuffer, totalFrames);
            const url = URL.createObjectURL(wavBlob);
            btnDownload.href = url;
            btnDownload.download = `clip_${Date.now()}.wav`;
            btnDownload.style.display = 'block';
            btnMerge.textContent = "⚡ 合并成功";
            btnMerge.disabled = false;
        }, 50);
    };

    // 标准 WAV 编码器 (同上一版)
    function bufferToWave(abuffer, len) {
        let numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample, offset = 0, pos = 0;

        function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
        function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
        setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
        setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);

        for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
        while(pos < length) {
            for(i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
                view.setInt16(pos, sample, true); pos += 2;
            }
            offset++;
        }
        return new Blob([buffer], {type: "audio/wav"});
    }

    // Bindings
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);
    btnAddSeg.onclick = () => addSegment(0, Math.min(2, sourceBuffer.duration));
    btnMerge.onclick = mergeAndExport;

    // 监听 Resize
    window.addEventListener('resize', () => {
        if(editorPanel.style.display !== 'none') {
            resizeCanvas();
            drawCanvas();
        }
    });
}