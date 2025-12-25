export function render() {
    return `
        <style>
            .stitch-container { display: flex; flex-direction: column; gap: 20px; height: 100%; }
            
            /* 上传区 */
            .upload-zone {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s;
                position: relative; /* 关键 */
            }
            .upload-zone:hover, .upload-zone.drag-over { border-color: #3b82f6; background: #eff6ff; }
            .upload-icon { font-size: 32px; display: block; margin-bottom: 10px; }
            
            /* 关键修复：防止点击冲突，确保一定能点中 */
            #file-input { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                opacity: 0; cursor: pointer; pointer-events: none; 
            }

            /* 主体布局 */
            .main-content { display: flex; flex: 1; gap: 20px; min-height: 0; }

            /* 左侧图片列表 */
            .image-list-panel {
                width: 250px;
                display: flex;
                flex-direction: column;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background: #fff;
                overflow: hidden;
            }
            .panel-header {
                padding: 10px 15px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
                font-weight: 600; font-size: 14px; color: #475569;
            }
            #image-list {
                flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px;
            }
            .image-item {
                display: flex; align-items: center; gap: 10px;
                background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px;
                transition: all 0.2s;
            }
            .image-item:hover { border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .thumb { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; }
            .item-info { flex: 1; overflow: hidden; }
            .item-name { font-size: 12px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .item-dims { font-size: 11px; color: #94a3b8; }
            .item-controls { display: flex; flex-direction: column; gap: 2px; }
            .ctrl-btn {
                padding: 2px 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;
                font-size: 10px; border-radius: 3px; color: #64748b;
            }
            .ctrl-btn:hover { background: #f1f5f9; color: #334155; }
            .btn-del:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

            /* 右侧控制与预览 */
            .preview-panel {
                flex: 1; display: flex; flex-direction: column; gap: 15px;
                border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 15px;
                overflow: hidden;
            }
            
            .controls-bar {
                display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
                padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;
            }
            .radio-group { display: flex; gap: 15px; align-items: center; }
            .radio-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
            
            .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; color: #fff; font-size: 14px; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #2563eb; }
            .btn-green { background: #16a34a; }
            .btn-gray { background: #64748b; }
            .btn-disabled { background: #94a3b8; cursor: not-allowed; }

            /* 预览区域 */
            .preview-box {
                flex: 1;
                background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" fill="%23f0f0f0"/><rect x="10" y="10" width="10" height="10" fill="%23f0f0f0"/><rect x="0" y="10" width="10" height="10" fill="%23ffffff"/><rect x="10" y="0" width="10" height="10" fill="%23ffffff"/></svg>');
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                overflow: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            #result-img { max-width: 100%; max-height: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: none; }
            .empty-tip { color: #94a3b8; font-size: 14px; }
        </style>

        <div class="tool-box stitch-container">
            <div class="upload-zone" id="drop-zone">
                <span class="upload-icon">🎞️</span>
                <div>点击或拖拽多张图片到这里 (支持 JPG, PNG, WebP)</div>
                <input type="file" id="file-input" multiple accept="image/*">
            </div>

            <div class="main-content">
                <div class="image-list-panel">
                    <div class="panel-header">已添加图片 (<span id="img-count">0</span>)</div>
                    <div id="image-list">
                        <div class="empty-tip" style="text-align:center; padding-top:20px;">暂无图片</div>
                    </div>
                </div>

                <div class="preview-panel">
                    <div class="controls-bar">
                        <div style="font-weight:600; font-size:14px; color:#334155;">拼接方向:</div>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="direction" value="vertical" checked> 
                                ⬇️ 从上到下 (长图)
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="direction" value="horizontal"> 
                                ➡️ 从左到右 (横幅)
                            </label>
                        </div>
                        <div style="margin-left:auto; display:flex; gap:10px;">
                             <button id="btn-clear" class="btn btn-gray">清空</button>
                             <button id="btn-stitch" class="btn btn-blue btn-disabled" disabled>⚡ 开始拼接</button>
                        </div>
                    </div>

                    <div class="preview-box" id="preview-box">
                        <div class="empty-tip" id="preview-tip">点击“开始拼接”查看结果</div>
                        <img id="result-img">
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:15px;">
                        <div id="result-info" style="font-size:12px; color:#64748b;"></div>
                        <a id="btn-download" style="text-decoration:none; display:none;">
                            <button class="btn btn-green">⬇️ 下载拼接后的图片</button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <canvas id="stitch-canvas" style="display:none;"></canvas>
    `;
}

export function init() {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const imageListContainer = document.getElementById('image-list');
    const imgCountLabel = document.getElementById('img-count');
    const btnStitch = document.getElementById('btn-stitch');
    const btnClear = document.getElementById('btn-clear');
    const resultImg = document.getElementById('result-img');
    const previewTip = document.getElementById('preview-tip');
    const btnDownload = document.getElementById('btn-download');
    const resultInfo = document.getElementById('result-info');
    const canvas = document.getElementById('stitch-canvas');
    const ctx = canvas.getContext('2d');

    let loadedImages = [];

    // --- 核心逻辑：拼接图片 ---
    const stitchImages = () => {
        if (loadedImages.length === 0) return;

        const direction = document.querySelector('input[name="direction"]:checked').value;
        btnStitch.textContent = "处理中...";
        btnStitch.disabled = true;

        setTimeout(() => {
            let totalWidth = 0;
            let totalHeight = 0;

            // 1. 计算总画布大小
            if (direction === 'vertical') {
                loadedImages.forEach(item => {
                    totalWidth = Math.max(totalWidth, item.img.width);
                    totalHeight += item.img.height;
                });
            } else {
                loadedImages.forEach(item => {
                    totalWidth += item.img.width;
                    totalHeight = Math.max(totalHeight, item.img.height);
                });
            }

            // 2. 设置画布
            canvas.width = totalWidth;
            canvas.height = totalHeight;
            ctx.clearRect(0, 0, totalWidth, totalHeight);

            // 3. 绘制
            let currentX = 0;
            let currentY = 0;

            loadedImages.forEach(item => {
                if (direction === 'vertical') {
                    ctx.drawImage(item.img, 0, currentY);
                    currentY += item.img.height;
                } else {
                    ctx.drawImage(item.img, currentX, 0);
                    currentX += item.img.width;
                }
            });

            // 4. 导出
            const dataUrl = canvas.toDataURL('image/png');
            resultImg.src = dataUrl;
            resultImg.style.display = 'block';
            previewTip.style.display = 'none';

            btnDownload.href = dataUrl;
            btnDownload.download = `stitched_${direction}_${Date.now()}.png`;
            btnDownload.style.display = 'block';

            resultInfo.textContent = `最终尺寸: ${totalWidth} x ${totalHeight} px`;

            btnStitch.textContent = "⚡ 开始拼接";
            btnStitch.disabled = false;
        }, 50);
    };

    // --- UI 更新 ---
    const renderImageList = () => {
        imgCountLabel.textContent = loadedImages.length;
        btnStitch.disabled = loadedImages.length === 0;
        btnStitch.classList.toggle('btn-disabled', loadedImages.length === 0);

        if (loadedImages.length === 0) {
            imageListContainer.innerHTML = '<div class="empty-tip" style="text-align:center; padding-top:20px;">暂无图片</div>';
            return;
        }

        imageListContainer.innerHTML = '';
        loadedImages.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'image-item';
            el.innerHTML = `
                <img src="${item.img.src}" class="thumb">
                <div class="item-info">
                    <div class="item-name" title="${item.file.name}">${item.file.name}</div>
                    <div class="item-dims">${item.img.width} x ${item.img.height}</div>
                </div>
                <div class="item-controls">
                    ${index > 0 ? `<button class="ctrl-btn" data-action="up" data-idx="${index}">↑</button>` : ''}
                    ${index < loadedImages.length - 1 ? `<button class="ctrl-btn" data-action="down" data-idx="${index}">↓</button>` : ''}
                    <button class="ctrl-btn btn-del" data-action="del" data-idx="${index}">×</button>
                </div>
            `;
            imageListContainer.appendChild(el);
        });
    };

    // --- 文件处理 ---
    const handleFiles = (files) => {
        if (files.length === 0) return;

        let processed = 0;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    loadedImages.push({ img: img, file: file, id: Date.now() + Math.random() });
                    processed++;
                    if (processed === files.length) {
                        renderImageList();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        // 关键修复：允许重复选择
        fileInput.value = '';
    };

    // --- 事件监听 ---
    imageListContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.ctrl-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.idx);

        if (action === 'del') {
            loadedImages.splice(index, 1);
        } else if (action === 'up' && index > 0) {
            [loadedImages[index], loadedImages[index - 1]] = [loadedImages[index - 1], loadedImages[index]];
        } else if (action === 'down' && index < loadedImages.length - 1) {
            [loadedImages[index], loadedImages[index + 1]] = [loadedImages[index + 1], loadedImages[index]];
        }
        renderImageList();
    });

    btnStitch.onclick = stitchImages;

    btnClear.onclick = () => {
        loadedImages = [];
        renderImageList();
        resultImg.style.display = 'none';
        resultImg.src = '';
        previewTip.style.display = 'block';
        btnDownload.style.display = 'none';
        resultInfo.textContent = '';
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFiles(e.target.files);
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    };
}