export function render() {
    return `
        <style>
            .img-tool-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                height: 100%;
                background: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            /* --- 控制面板 --- */
            .control-panel {
                padding: 15px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .row {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .label { font-size: 13px; font-weight: 600; color: #64748b; min-width: 60px; }

            /* 输入控件 */
            .input-std {
                padding: 6px 10px;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s;
                height: 30px;
                box-sizing: border-box;
            }
            .input-std:focus { border-color: #2563eb; }
            .input-num { width: 70px; }
            .input-text { flex: 1; min-width: 120px; }
            select.input-std { cursor: pointer; background: #fff; }

            /* 按钮通用 */
            .btn {
                padding: 0 14px;
                height: 30px;
                border-radius: 4px;
                border: 1px solid #cbd5e1;
                background: #fff;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: #334155;
                transition: all 0.1s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            .btn:hover { background: #f1f5f9; border-color: #94a3b8; }
            .btn:disabled { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; cursor: not-allowed; }
            
            /* 蓝色按钮 */
            .btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
            .btn.primary:hover { background: #1d4ed8; }
            .btn.primary:disabled { background: #94a3b8; border-color: #94a3b8; }

            /* 绿色按钮 */
            .btn.success { background: #10b981; color: #fff; border-color: #10b981; }
            .btn.success:hover { background: #059669; }
            .btn.success:disabled { background: #6ee7b7; border-color: #6ee7b7; }

            .lock-btn { width: 30px; padding: 0; font-size: 14px; }
            .btn.active { background: #e0e7ff; color: #2563eb; border-color: #2563eb; }

            /* 上传区域 */
            .upload-area {
                border: 2px dashed #cbd5e1;
                border-radius: 6px;
                padding: 12px;
                text-align: center;
                background: #fff;
                cursor: pointer;
                transition: all 0.2s;
            }
            .upload-area:hover { border-color: #2563eb; background: #f0f9ff; }
            .upload-area p { margin: 0; color: #64748b; font-size: 13px; }

            /* --- 列表区域 --- */
            .file-list {
                flex: 1;
                overflow-y: auto;
                padding: 0 15px 15px 15px;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 12px;
                gap: 10px;
            }
            .file-thumb {
                width: 40px; height: 40px; object-fit: cover;
                border-radius: 4px; border: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0;
            }
            .file-info { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
            .file-name { color: #334155; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            
            .file-stats { color: #94a3b8; font-size: 11px; margin-top: 2px; display: flex; gap: 8px; }
            .stat-saved { color: #16a34a; font-weight: 600; }
            .stat-worse { color: #dc2626; }

            .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 11px; white-space: nowrap; }
            .status-wait { background: #f1f5f9; color: #64748b; }
            .status-done { background: #dcfce7; color: #16a34a; }
            .status-process { background: #dbeafe; color: #2563eb; }

            /* --- 底部总计面板 --- */
            .total-panel {
                margin-top: 5px;
                padding: 8px 12px;
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                border-radius: 4px;
                font-size: 12px;
                color: #065f46;
                display: none; /* 默认隐藏，计算后显示 */
                justify-content: space-between;
                align-items: center;
            }
            .total-highlight { font-weight: bold; font-size: 13px; }

            .progress-container {
                height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; margin-top: 5px; display: none;
            }
            .progress-bar {
                height: 100%; background: #2563eb; width: 0%; transition: width 0.3s;
            }
        </style>

        <div class="img-tool-container">
            <div style="padding: 15px 15px 0 15px;">
                <input type="file" id="file-input" multiple accept="image/*" style="display: none;">
                <div class="upload-area" id="drop-zone">
                    <p>📂 点击或拖拽图片 (支持多选)</p>
                </div>
            </div>

            <div class="control-panel" id="control-panel">
                <div class="row">
                    <span class="label">尺寸/比例</span>
                    <select id="preset-select" class="input-std" style="width: 100px;">
                        <optgroup label="固定分辨率">
                            <option value="original">保持原图</option>
                            <option value="1920x1080">1080P (1920x1080)</option>
                            <option value="1280x720">720P (1280x720)</option>
                        </optgroup>
                        <optgroup label="固定比例 (自动算高)">
                            <option value="ratio_1.7777">16:9</option>
                            <option value="ratio_1.6">16:10</option>
                            <option value="ratio_1.3333">4:3</option>
                            <option value="ratio_1">1:1 (正方形)</option>
                        </optgroup>
                        <option value="custom">自定义</option>
                    </select>

                    <input type="number" id="input-w" class="input-std input-num" placeholder="宽">
                    <span style="color:#94a3b8">:</span>
                    <input type="number" id="input-h" class="input-std input-num" placeholder="高">
                    <button id="btn-lock" class="btn lock-btn active" title="锁定比例">🔒</button>
                </div>

                <div class="row">
                    <span class="label">输出格式</span>
                    <select id="format-select" class="input-std">
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WEBP</option>
                    </select>

                    <span class="label" style="margin-left:5px;">质量</span>
                    <input type="range" id="quality-range" min="0.1" max="1" step="0.1" value="0.8" style="width: 80px;">
                    <span id="quality-val" style="font-size: 12px; color: #64748b; width: 24px;">0.8</span>
                </div>

                <div class="row">
                    <span class="label">前缀命名</span>
                    <input type="text" id="prefix-input" class="input-std input-text" value="img" placeholder="如 image">
                    <span style="font-size: 12px; color: #94a3b8;">_01.jpg</span>
                </div>

                <div class="row" style="margin-top: 5px;">
                    <button id="btn-compress" class="btn primary" style="flex: 1;" disabled>
                        ⚡ 开始压缩
                    </button>
                    <button id="btn-download" class="btn success" style="flex: 1;" disabled>
                        📥 打包下载
                    </button>
                </div>
                
                <div id="total-stats-panel" class="total-panel">
                    <span>总计: <span id="total-text">0MB -> 0MB</span></span>
                    <span id="total-savings" class="total-highlight">节省 0%</span>
                </div>

                <div class="progress-container" id="progress-wrap">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
            </div>

            <div class="file-list" id="file-list-container">
                <div style="text-align: center; margin-top: 30px; color: #cbd5e1; font-size: 12px;">
                    请先上传图片，点击“开始压缩”预览结果
                </div>
            </div>
            
            <div id="status-bar" class="status-ok" style="padding: 0 15px 10px 15px; font-size: 12px;">初始化...</div>
        </div>
    `;
}

export function init() {
    // DOM 元素
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileListContainer = document.getElementById('file-list-container');
    const btnCompress = document.getElementById('btn-compress');
    const btnDownload = document.getElementById('btn-download');
    const statusBar = document.getElementById('status-bar');

    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    const btnLock = document.getElementById('btn-lock');
    const presetSelect = document.getElementById('preset-select');
    const formatSelect = document.getElementById('format-select');
    const qualityRange = document.getElementById('quality-range');
    const qualityVal = document.getElementById('quality-val');
    const prefixInput = document.getElementById('prefix-input');

    const progressWrap = document.getElementById('progress-wrap');
    const progressBar = document.getElementById('progress-bar');
    const totalStatsPanel = document.getElementById('total-stats-panel');
    const totalText = document.getElementById('total-text');
    const totalSavings = document.getElementById('total-savings');
    const controlPanel = document.getElementById('control-panel');

    // 状态管理
    let selectedFiles = []; // { file, thumbUrl, id }
    let compressedCache = []; // 存储压缩后的 { blob, fileName }，避免下载时重新压缩
    let isLocked = true;
    let currentAspectRatio = 16 / 9;

    // --- 工具函数 ---
    const updateStatus = (msg, isErr = false) => {
        statusBar.textContent = msg;
        statusBar.style.color = isErr ? '#dc2626' : '#16a34a';
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- 0. 动态加载 JSZip ---
    const loadJsZip = () => {
        return new Promise((resolve, reject) => {
            if (window.JSZip) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error("JSZip load failed"));
            document.head.appendChild(script);
        });
    };

    loadJsZip().then(() => {
        updateStatus("就绪 ✅");
        if (selectedFiles.length > 0) btnCompress.disabled = false;
        else btnCompress.textContent = "⚡ 开始压缩";
    }).catch(() => {
        updateStatus("❌ JSZip 组件加载失败", true);
        btnCompress.textContent = "组件错误";
    });

    // --- 1. 文件选择逻辑 ---
    const handleFiles = (files) => {
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (newFiles.length === 0) return;

        // 生成 ID 和 缩略图
        const processedNewFiles = newFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            thumbUrl: URL.createObjectURL(file)
        }));

        selectedFiles = [...selectedFiles, ...processedNewFiles];

        // 任何新文件加入，都清空旧的压缩缓存，禁用下载按钮，强制用户重新压缩
        compressedCache = [];
        btnDownload.disabled = true;
        totalStatsPanel.style.display = 'none';

        renderFileList();

        if (window.JSZip) btnCompress.disabled = false;
        btnCompress.textContent = `⚡ 开始压缩 (${selectedFiles.length})`;

        // 智能填充尺寸 (仅当第一次)
        if (inputW.value === '' && processedNewFiles.length > 0) {
            const img = new Image();
            img.src = processedNewFiles[0].thumbUrl;
            img.onload = () => {
                inputW.value = img.width;
                inputH.value = img.height;
                currentAspectRatio = img.width / img.height;
            };
        }
        updateStatus(`新增 ${newFiles.length} 张图片，请点击压缩预览`);
    };

    const renderFileList = () => {
        if (selectedFiles.length === 0) {
            fileListContainer.innerHTML = '<div style="text-align: center; margin-top: 30px; color: #cbd5e1; font-size: 12px;">暂无图片，请先上传</div>';
            return;
        }

        fileListContainer.innerHTML = selectedFiles.map((item, i) => `
            <div class="file-item" id="item-${item.id}">
                <img src="${item.thumbUrl}" class="file-thumb">
                <div class="file-info">
                    <div class="file-name" title="${item.file.name}">${i + 1}. ${item.file.name}</div>
                    <div class="file-stats" id="stats-${item.id}">
                        <span>原始: ${formatSize(item.file.size)}</span>
                    </div>
                </div>
                <span class="status-badge status-wait" id="badge-${item.id}">待处理</span>
            </div>
        `).join('');
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFiles(e.target.files);
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#2563eb'; dropZone.style.background = '#f0f9ff'; };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = '#fff'; };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = '#fff'; handleFiles(e.dataTransfer.files); };

    // --- 2. 参数变更监听 (一旦参数变了，必须重新压缩才能下载) ---
    const invalidateCache = () => {
        if (compressedCache.length > 0) {
            compressedCache = [];
            btnDownload.disabled = true;
            updateStatus("⚠️ 参数已变更，请重新点击压缩", true);
            totalStatsPanel.style.display = 'none';
        }
    };

    // 监听 control-panel 下所有的 input/select 变化
    controlPanel.addEventListener('input', (e) => {
        // 排除前缀输入框，改名不需要重新压缩
        if(e.target.id !== 'prefix-input') invalidateCache();
    });
    // 前缀变化时，更新缓存里的名字（如果已经压缩过）
    prefixInput.addEventListener('input', () => {
        if(compressedCache.length > 0) {
            const prefix = prefixInput.value.trim() || 'img';
            const outFormat = formatSelect.value;
            let ext = outFormat === 'image/png' ? '.png' : (outFormat === 'image/webp' ? '.webp' : '.jpg');

            // 仅仅更新缓存里的文件名，不重新压缩
            compressedCache.forEach((item, i) => {
                const idxStr = (i + 1).toString().padStart(2, '0');
                item.fileName = `${prefix}_${idxStr}${ext}`;
            });
            updateStatus("已更新文件名设置，可直接下载");
        }
    });


    // --- 3. 尺寸与比例逻辑 ---
    const updateHeightFromWidth = () => {
        if (!inputW.value) return;
        inputH.value = Math.round(inputW.value / currentAspectRatio);
    };
    const updateWidthFromHeight = () => {
        if (!inputH.value) return;
        inputW.value = Math.round(inputH.value * currentAspectRatio);
    };
    btnLock.onclick = () => {
        isLocked = !isLocked;
        btnLock.textContent = isLocked ? '🔒' : '🔓';
        btnLock.classList.toggle('active', isLocked);
        if (isLocked && inputW.value && inputH.value) currentAspectRatio = inputW.value / inputH.value;
        invalidateCache();
    };
    presetSelect.onchange = () => {
        const val = presetSelect.value;
        if (val === 'custom') return;
        if (val === 'original') { inputW.value = ''; inputH.value = ''; invalidateCache(); return; }

        if (val.startsWith('ratio_')) {
            currentAspectRatio = parseFloat(val.split('_')[1]);
            isLocked = true;
            btnLock.textContent = '🔒';
            btnLock.classList.add('active');
            if (inputW.value) updateHeightFromWidth();
            else { inputW.value = 1920; updateHeightFromWidth(); }
        } else {
            const [w, h] = val.split('x');
            inputW.value = w; inputH.value = h;
            currentAspectRatio = w / h;
            isLocked = true;
            btnLock.textContent = '🔒';
            btnLock.classList.add('active');
        }
        invalidateCache();
    };
    inputW.oninput = () => { presetSelect.value = 'custom'; if (isLocked) updateHeightFromWidth(); };
    inputH.oninput = () => { presetSelect.value = 'custom'; if (isLocked) updateWidthFromHeight(); };
    qualityRange.oninput = () => { qualityVal.textContent = qualityRange.value; };

    // --- 4. 压缩核心算法 ---
    const compressImage = (fileUrl, targetW, targetH, quality, format) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = fileUrl;
            img.onload = () => {
                let w = targetW;
                let h = targetH;
                if (!w || !h) {
                    if (presetSelect.value === 'original') { w = img.width; h = img.height; }
                    else if (isLocked && w) { h = Math.round(w / (img.width / img.height)); }
                    else { w = img.width; h = img.height; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (format === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); }
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), format, parseFloat(quality));
            };
            img.onerror = reject;
        });
    };

    // --- 5. 按钮 A: 点击压缩 (生成缓存) ---
    btnCompress.onclick = async () => {
        if (!window.JSZip || selectedFiles.length === 0) return;

        btnCompress.disabled = true;
        btnDownload.disabled = true;
        btnCompress.textContent = "计算中...";
        progressWrap.style.display = 'block';
        progressBar.style.width = '0%';
        totalStatsPanel.style.display = 'none';

        compressedCache = []; // 清空缓存
        let totalOriginalSize = 0;
        let totalNewSize = 0;

        const quality = qualityRange.value;
        const outFormat = formatSelect.value;
        const prefix = prefixInput.value.trim() || 'img';

        let ext = outFormat === 'image/png' ? '.png' : (outFormat === 'image/webp' ? '.webp' : '.jpg');

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const item = selectedFiles[i];
                const badge = document.getElementById(`badge-${item.id}`);
                const statsDiv = document.getElementById(`stats-${item.id}`);
                if (badge) { badge.textContent = "处理中"; badge.className = "status-badge status-process"; }

                // 执行压缩
                const blob = await compressImage(item.thumbUrl, inputW.value, inputH.value, quality, outFormat);

                // 存入缓存
                const idxStr = (i + 1).toString().padStart(2, '0');
                const fileName = `${prefix}_${idxStr}${ext}`;
                compressedCache.push({ blob, fileName });

                // 单个文件统计
                const originalSize = item.file.size;
                const newSize = blob.size;
                totalOriginalSize += originalSize;
                totalNewSize += newSize;

                const savings = originalSize - newSize;
                const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

                if (statsDiv) {
                    let sizeHtml = `<span>${formatSize(originalSize)} → <b>${formatSize(newSize)}</b></span>`;
                    sizeHtml += savings > 0
                        ? ` <span class="stat-saved">↓${savingsPercent}%</span>`
                        : ` <span class="stat-worse">↑${Math.abs(savingsPercent)}%</span>`;
                    statsDiv.innerHTML = sizeHtml;
                }
                if (badge) { badge.textContent = "已压缩"; badge.className = "status-badge status-done"; }

                progressBar.style.width = `${((i + 1) / selectedFiles.length) * 100}%`;
            }

            // 总计统计
            const totalSavingsBytes = totalOriginalSize - totalNewSize;
            const totalPct = ((totalSavingsBytes / totalOriginalSize) * 100).toFixed(1);

            totalText.innerHTML = `${formatSize(totalOriginalSize)} → ${formatSize(totalNewSize)}`;
            totalSavings.textContent = totalSavingsBytes > 0 ? `共节省 ${totalPct}%` : `体积增加 ${Math.abs(totalPct)}%`;
            totalSavings.className = totalSavingsBytes > 0 ? 'total-highlight stat-saved' : 'total-highlight stat-worse';
            totalStatsPanel.style.display = 'flex';

            updateStatus("✅ 压缩完成，请点击下载按钮打包");
            btnDownload.disabled = false; // 启用下载

        } catch (err) {
            console.error(err);
            updateStatus("压缩过程出错", true);
        } finally {
            btnCompress.disabled = false;
            btnCompress.textContent = `⚡ 重新压缩`;
        }
    };

    // --- 6. 按钮 B: 点击下载 (读取缓存打包) ---
    btnDownload.onclick = async () => {
        if (!window.JSZip || compressedCache.length === 0) return;

        btnDownload.disabled = true;
        btnDownload.textContent = "打包中...";

        try {
            const zip = new JSZip();

            // 纯粹的打包过程，速度极快，不需要重新压缩
            compressedCache.forEach(item => {
                zip.file(item.fileName, item.blob);
            });

            updateStatus("正在生成压缩包...");
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `compressed_${new Date().getTime()}.zip`;
            link.click();

            updateStatus("下载已触发 ✅");
        } catch (err) {
            console.error(err);
            updateStatus("打包下载失败", true);
        } finally {
            btnDownload.disabled = false;
            btnDownload.textContent = "📥 打包下载";
        }
    };
}