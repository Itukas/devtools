export function render() {
    return `
        <style>
            .rb-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 15px;
                background: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .toolbar {
                display: flex;
                gap: 10px;
                padding: 10px 15px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                align-items: center;
                flex-wrap: wrap;
            }

            .canvas-area {
                flex: 1;
                background-color: #eee;
                background-image: 
                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 20px 20px;
                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                overflow: auto;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
            }

            canvas {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                max-width: 100%;
                max-height: 100%;
                cursor: crosshair;
            }

            .btn {
                padding: 6px 12px;
                border-radius: 4px;
                border: 1px solid #cbd5e1;
                background: #fff;
                cursor: pointer;
                font-size: 13px;
                color: #334155;
                transition: all 0.1s;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .btn:hover { background: #f1f5f9; border-color: #94a3b8; }
            .btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
            .btn.primary:hover { background: #1d4ed8; }
            
            .btn.active { background: #e0e7ff; color: #2563eb; border-color: #2563eb; }

            .control-group {
                display: flex;
                align-items: center;
                gap: 8px;
                border-right: 1px solid #e2e8f0;
                padding-right: 15px;
                margin-right: 5px;
            }
            .control-group:last-child { border-right: none; }

            .input-range { width: 100px; }
            .val-display { width: 30px; font-size: 12px; color: #64748b; text-align: right; }

            .msg-tip {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.7);
                color: #fff;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .msg-tip.show { opacity: 1; }
        </style>

        <div class="rb-container">
            <div class="toolbar">
                <div class="control-group">
                    <button id="btn-upload" class="btn">📂 打开图片</button>
                    <input type="file" id="file-input" accept="image/*" style="display:none">
                </div>

                <div class="control-group">
                    <span style="font-size:12px; font-weight:bold; color:#64748b;">模式:</span>
                    <button id="mode-auto" class="btn active" title="自动识别边缘的棋盘格并去除">🤖 自动去棋盘格</button>
                    <button id="mode-magic" class="btn" title="点击任意颜色进行去除">🪄 魔棒点选</button>
                </div>

                <div class="control-group">
                    <span style="font-size:12px; color:#64748b;">容差:</span>
                    <input type="range" id="tolerance" class="input-range" min="0" max="100" value="20">
                    <span id="tol-val" class="val-display">20</span>
                </div>

                <div class="control-group" style="margin-left:auto; border:none; padding:0;">
                    <button id="btn-undo" class="btn" disabled>↩️ 撤销</button>
                    <button id="btn-download" class="btn primary" disabled>📥 下载结果</button>
                </div>
            </div>

            <div class="canvas-area" id="canvas-wrapper">
                <canvas id="main-canvas"></canvas>
                <div id="msg-tip" class="msg-tip">点击画面背景进行去除</div>
            </div>
        </div>
    `;
}

export function init() {
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('file-input');
    const btnUpload = document.getElementById('btn-upload');
    const btnDownload = document.getElementById('btn-download');
    const btnUndo = document.getElementById('btn-undo');
    const tolRange = document.getElementById('tolerance');
    const tolVal = document.getElementById('tol-val');
    const msgTip = document.getElementById('msg-tip');
    
    const modeAuto = document.getElementById('mode-auto');
    const modeMagic = document.getElementById('mode-magic');

    let currentMode = 'auto'; // 'auto' | 'magic'
    let historyStack = [];
    let imgData = null; // 当前的 ImageData 对象

    // --- 工具函数 ---
    const showTip = (text) => {
        msgTip.textContent = text;
        msgTip.classList.add('show');
        setTimeout(() => msgTip.classList.remove('show'), 2000);
    };

    const saveHistory = () => {
        if (!imgData) return;
        // 深拷贝 ImageData
        const newArr = new Uint8ClampedArray(imgData.data);
        const state = new ImageData(newArr, imgData.width, imgData.height);
        historyStack.push(state);
        if (historyStack.length > 10) historyStack.shift(); // 限制步数
        btnUndo.disabled = false;
    };

    const loadImage = (file) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            historyStack = []; // 清空历史
            saveHistory(); // 保存初始状态
            
            btnDownload.disabled = false;
            URL.revokeObjectURL(url);
            showTip("图片已加载");

            // 如果是自动模式，直接尝试去背
            if (currentMode === 'auto') {
                autoRemoveCheckerboard();
            }
        };
        img.src = url;
    };

    // --- 核心算法：基于栈的 Flood Fill ---
    // colorsToMatch: Array of {r,g,b}，支持匹配多种颜色
    const floodFill = (startX, startY, colorsToMatch, tolerance) => {
        const w = imgData.width;
        const h = imgData.height;
        const data = imgData.data;
        const stack = [[startX, startY]];
        const visited = new Uint8Array(w * h); // 标记已访问

        // 颜色距离计算
        const matchCondition = (idx) => {
            const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
            if (a === 0) return true; // 已经是透明的，视为连通，继续穿透
            
            // 检查是否匹配目标颜色列表中的任意一个
            for (let c of colorsToMatch) {
                const dist = Math.abs(r - c.r) + Math.abs(g - c.g) + Math.abs(b - c.b); // 曼哈顿距离
                if (dist <= tolerance * 3) return true; // 简单容差
            }
            return false;
        };

        let pixelsChanged = 0;

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = (y * w + x) * 4;

            if (x < 0 || x >= w || y < 0 || y >= h) continue;
            if (visited[y * w + x]) continue;
            
            visited[y * w + x] = 1;

            if (matchCondition(idx)) {
                // 设置透明
                data[idx + 3] = 0;
                pixelsChanged++;

                // 4连通扩散
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }

        if (pixelsChanged > 0) {
            ctx.putImageData(imgData, 0, 0);
            saveHistory();
            showTip(`已移除 ${pixelsChanged} 个像素`);
        } else {
            showTip("未找到匹配区域");
        }
    };

    // --- 自动去除棋盘格 ---
    const autoRemoveCheckerboard = () => {
        if (!imgData) return;
        
        // 1. 采样四个角的颜色
        const w = imgData.width;
        const h = imgData.height;
        const getCol = (x, y) => {
            const i = (y * w + x) * 4;
            return { r: imgData.data[i], g: imgData.data[i+1], b: imgData.data[i+2] };
        };

        // 采样点：左上、右上、左下、右下
        // 棋盘格特点：相邻颜色不同。如果 (0,0) 是白，(10,0) 可能是灰。
        // 我们取左上角作为颜色A。尝试在附近找颜色B。
        
        const cA = getCol(0, 0);
        let cB = cA; // 默认一种颜色

        // 在第一行向右扫描找不同的颜色作为 B
        for (let x = 1; x < Math.min(50, w); x++) {
            const c = getCol(x, 0);
            if (Math.abs(c.r - cA.r) > 20) { // 阈值
                cB = c;
                break;
            }
        }

        showTip("自动分析中...");
        
        // 从四个角同时开始 Flood Fill，匹配 A 或 B
        const tol = parseInt(tolRange.value);
        const targets = [cA];
        if (cB !== cA) targets.push(cB);

        // 使用多点 Flood Fill 逻辑 (简单复用上面的单点，其实应该改写支持多起点，这里简单调用四次)
        // 为了性能，我们只从 (0,0) 开始。如果棋盘格是连通的（通常是），一次就够了。
        // 如果主体把背景隔断了，可能需要从四个角各来一次。
        
        // 我们改写 floodFill 稍微支持多起点？或者简单粗暴调4次（可能会重复计算但逻辑简单）
        // 这里为了效果好，我们手动模拟一次多起点 BFS
        
        const stack = [[0, 0], [w-1, 0], [0, h-1], [w-1, h-1]];
        // 把四个角都作为起点，执行一次大规模清理
        
        // 这里的 floodFill 是封装的单点入口，我们临时改一下逻辑：
        // 直接调用内部逻辑太乱，不如执行一次特殊的 BFS
        
        // 执行专用函数
        performMultiStartFloodFill(stack, targets, tol);
    };

    const performMultiStartFloodFill = (startPoints, colors, tolerance) => {
        const w = imgData.width;
        const h = imgData.height;
        const data = imgData.data;
        const stack = [...startPoints];
        const visited = new Uint8Array(w * h);

        const isMatch = (r, g, b) => {
            for (let c of colors) {
                const dist = Math.abs(r - c.r) + Math.abs(g - c.g) + Math.abs(b - c.b);
                if (dist <= tolerance * 3) return true;
            }
            return false;
        };

        let count = 0;

        while(stack.length) {
            const [x, y] = stack.pop();
            const offset = y * w + x;
            if (x < 0 || x >= w || y < 0 || y >= h || visited[offset]) continue;
            
            visited[offset] = 1;
            const idx = offset * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];

            if (a === 0) {
                // 透明的视为通路
                stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
                continue;
            }

            if (isMatch(r, g, b)) {
                data[idx+3] = 0; // 擦除
                count++;
                stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        saveHistory();
        showTip(count > 0 ? "已自动去除背景" : "未检测到连通背景");
    };


    // --- 事件绑定 ---
    btnUpload.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files[0]) loadImage(e.target.files[0]);
        e.target.value = '';
    };

    tolRange.oninput = () => tolVal.textContent = tolRange.value;

    const setMode = (mode) => {
        currentMode = mode;
        modeAuto.classList.toggle('active', mode === 'auto');
        modeMagic.classList.toggle('active', mode === 'magic');
        if (mode === 'auto') {
            showTip("切换到自动模式，重新加载图片可自动处理");
            // 如果当前有图，直接跑一次
            if(imgData) autoRemoveCheckerboard();
        } else {
            showTip("魔棒模式：点击画面去除颜色");
        }
    };

    modeAuto.onclick = () => setMode('auto');
    modeMagic.onclick = () => setMode('magic');

    canvas.onmousedown = (e) => {
        if (!imgData) return;
        if (currentMode !== 'magic') return;

        const rect = canvas.getBoundingClientRect();
        // 计算点击在 Canvas 内部的坐标（考虑 Canvas 可能被缩放显示）
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        // 获取点击处颜色
        const idx = (y * imgData.width + x) * 4;
        const targetColor = {
            r: imgData.data[idx],
            g: imgData.data[idx+1],
            b: imgData.data[idx+2]
        };

        const tol = parseInt(tolRange.value);
        floodFill(x, y, [targetColor], tol);
    };

    btnUndo.onclick = () => {
        if (historyStack.length <= 1) return; // 至少保留初始状态
        historyStack.pop(); // 移除当前状态
        const prevState = historyStack[historyStack.length - 1];
        // 恢复
        const newArr = new Uint8ClampedArray(prevState.data);
        imgData = new ImageData(newArr, prevState.width, prevState.height);
        ctx.putImageData(imgData, 0, 0);
        showTip("已撤销");
        if (historyStack.length <= 1) btnUndo.disabled = true;
    };

    btnDownload.onclick = () => {
        const link = document.createElement('a');
        link.download = 'removed_bg.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
}
