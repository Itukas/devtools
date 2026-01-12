import Compressor from 'https://esm.sh/compressorjs@1.2.1';

export function render() {
    return `
        <style>
            .img-tool-container { display: flex; flex-direction: column; height: 100%; gap: 15px; position: relative; }
            
            /* 上传区域 */
            .upload-zone {
                border: 2px dashed #cbd5e1; border-radius: 8px; padding: 12px;
                text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s; position: relative;
                display: flex; justify-content: center; align-items: center; gap: 10px;
            }
            .upload-zone:hover, .upload-zone.drag-over { border-color: #3b82f6; background: #eff6ff; }
            .upload-icon { font-size: 20px; }
            .upload-text { font-size: 13px; color: #64748b; }
            #file-input { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                opacity: 0; cursor: pointer; pointer-events: none; 
            }

            /* 控制栏 */
            .controls-panel {
                display: flex; gap: 15px; align-items: flex-start;
                background: #fff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;
                flex-wrap: wrap; font-size: 13px; color: #334155;
            }
            .control-group { display: flex; flex-direction: column; gap: 6px; }
            .row { display: flex; align-items: center; gap: 8px; }
            
            .input-dim { width: 60px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: monospace; }
            select { padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; }
            
            /* 滑块样式 */
            input[type=range] {
                -webkit-appearance: none; width: 100px; height: 6px;
                background: #e2e8f0; border-radius: 3px; outline: none; transition: background 0.2s; cursor: pointer;
            }
            input[type=range]:hover { background: #cbd5e1; }
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none; width: 16px; height: 16px; background: #3b82f6;
                border-radius: 50%; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.1s; margin-top: -5px;
            }
            input[type=range]:active::-webkit-slider-thumb { transform: scale(1.2); background: #2563eb; }
            
            /* 按钮 */
            .btn { padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s; color: #fff; white-space: nowrap; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #3b82f6; }
            .btn-green { background: #10b981; }
            .btn-orange { background: #f97316; }
            .btn-gray { background: #64748b; }

            /* 预览区 */
            .preview-container { display: flex; gap: 15px; flex: 1; min-height: 0; }
            .img-card {
                flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
                display: flex; flex-direction: column; overflow: hidden;
            }
            .card-header {
                padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
                font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; align-items: center;
            }
            .img-wrapper {
                flex: 1; background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" fill="%23f0f0f0"/><rect x="10" y="10" width="10" height="10" fill="%23f0f0f0"/><rect x="0" y="10" width="10" height="10" fill="%23ffffff"/><rect x="10" y="0" width="10" height="10" fill="%23ffffff"/></svg>'); 
                display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 15px;
            }
            .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .card-footer { padding: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; display:flex; justify-content:center; align-items:center; gap:10px; }
            
            .badge-info { padding: 2px 8px; border-radius: 10px; font-weight: 500; font-size: 11px; }
            .bg-red { background: #fee2e2; color: #991b1b; }
            .bg-green { background: #dcfce7; color: #166534; }

            /* 裁剪层 */
            #crop-overlay {
                display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: #1e293b; z-index: 100; flex-direction: column; border-radius: 8px; overflow: hidden;
            }
            .crop-area { flex: 1; position: relative; background: #000; overflow: hidden; }
            .crop-toolbar {
                height: 50px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; padding: 0 15px;
                border-top: 1px solid #334155;
            }
            #image-to-crop { max-width: 100%; display: block; }
        </style>

        <div class="tool-box img-tool-container">
            <div id="status-bar" style="display:none; text-align:center; padding:5px; background:#fff7ed; color:#c2410c; border-radius:4px; font-size:12px;"></div>

            <div class="upload-zone" id="drop-zone">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击或拖拽图片更换 (JPG, PNG, WebP)</span>
                <input type="file" id="file-input" accept="image/*">
            </div>

            <div id="controls" class="controls-panel" style="display:none;">
                <div class="control-group">
                    <label>操作</label>
                    <button id="btn-start-crop" class="btn btn-orange">✂️ 裁剪</button>
                </div>

                <div class="control-group">
                    <label>缩放比例 <span id="scale-val" style="color:#2563eb; font-weight:bold;">100%</span></label>
                    <div class="row">
                        <select id="size-preset" style="width:110px;">
                            <option value="custom">自定义</option>
                            <option value="1920x1080">1920 x 1080</option>
                            <option value="1280x720">1280 x 720</option>
                            <option value="1080x1080">1080 x 1080</option>
                            <option value="800x600">800 x 600</option>
                            <option value="0.5">缩小 50%</option>
                            <option value="0.75">缩小 75%</option>
                        </select>
                        <input type="range" id="scale-slider" min="10" max="100" value="100" step="5" style="width:120px;" title="拖动缩放">
                    </div>
                </div>

                <div class="control-group">
                    <label>尺寸 (px)</label>
                    <div class="row">
                        <input type="number" id="img-w" class="input-dim" placeholder="W">
                        <span style="color:#94a3b8">×</span>
                        <input type="number" id="img-h" class="input-dim" placeholder="H">
                        <label style="font-size:12px; margin-left:2px; cursor:pointer; user-select:none;">
                            <input type="checkbox" id="chk-ratio" checked> 锁定
                        </label>
                    </div>
                </div>

                <div class="control-group">
                    <label>质量 / 格式 <span id="quality-val" style="color:#2563eb; font-weight:bold; font-size:12px;">0.8</span></label>
                    <div class="row">
                        <input type="range" id="quality-slider" min="0.1" max="1.0" step="0.1" value="0.8" style="width:100px;" title="质量调整">
                        <select id="out-mime" style="width:80px;">
                            <option value="auto">Auto</option>
                            <option value="image/jpeg">JPG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                </div>
                
                <div class="control-group" style="margin-left:auto; align-self:center;">
                     <button id="btn-recompress" class="btn btn-blue" style="padding:8px 20px; font-size:14px;">⚡ 开始处理</button>
                </div>
            </div>

            <div id="preview-area" class="preview-container" style="display:none;">
                <div class="img-card">
                    <div class="card-header">
                        原始图片 <span id="orig-size" class="badge-info bg-red">-</span>
                    </div>
                    <div class="img-wrapper"><img id="orig-img" class="preview-img"></div>
                    <div class="card-footer" id="orig-dims">-</div>
                </div>
                <div class="img-card">
                    <div class="card-header">
                        结果 <span id="comp-size" class="badge-info bg-green">-</span>
                    </div>
                    <div class="img-wrapper"><img id="comp-img" class="preview-img"></div>
                    <div class="card-footer">
                        <span id="comp-dims" style="font-weight:bold; color:#334155;">-</span>
                        <a id="btn-download" href="#" download="image.jpg"><button class="btn btn-green">⬇️ 下载</button></a>
                    </div>
                </div>
            </div>

            <div id="crop-overlay">
                <div class="crop-area">
                    <img id="image-to-crop" src="">
                </div>
                <div class="crop-toolbar">
                    <div class="row" style="color:#fff;">
                        <span>W:</span> <input type="number" id="crop-w" class="input-dim" style="background:#334155; color:#fff; border-color:#475569;">
                        <span>H:</span> <input type="number" id="crop-h" class="input-dim" style="background:#334155; color:#fff; border-color:#475569;">
                        
                        <label style="font-size:12px; display:flex; align-items:center; cursor:pointer; margin-left:5px; color:#cbd5e1;">
                            <input type="checkbox" id="chk-crop-ratio" style="margin-right:4px;"> 🔒锁定比例
                        </label>
                        
                        <button id="btn-set-crop" class="btn btn-gray" style="padding:4px 8px; font-size:11px; margin-left:5px;">应用尺寸</button>
                    </div>
                    <div class="row">
                        <button id="btn-cancel-crop" class="btn btn-gray">取消</button>
                        <button id="btn-confirm-crop" class="btn btn-green">✅ 确认</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // 资源加载
    const loadResource = (tag, url) => {
        return new Promise((resolve) => {
            if (document.querySelector(`${tag}[src="${url}"], ${tag}[href="${url}"]`)) return resolve();
            const el = document.createElement(tag);
            if (tag === 'script') { el.src = url; el.onload = resolve; }
            else { el.rel = 'stylesheet'; el.href = url; el.onload = resolve; }
            document.head.appendChild(el);
        });
    };

    const status = document.getElementById('status-bar');
    status.style.display = 'block';
    status.textContent = '正在加载引擎...';

    Promise.all([
        loadResource('link', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css'),
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js')
    ]).then(() => status.style.display = 'none');

    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const controls = document.getElementById('controls');
    const previewArea = document.getElementById('preview-area');

    // Inputs
    const sizePreset = document.getElementById('size-preset');
    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    const inputW = document.getElementById('img-w');
    const inputH = document.getElementById('img-h');
    const chkRatio = document.getElementById('chk-ratio');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityVal = document.getElementById('quality-val');
    const mimeSelect = document.getElementById('out-mime');
    const btnRecompress = document.getElementById('btn-recompress');

    // Display
    const origImg = document.getElementById('orig-img');
    const compImg = document.getElementById('comp-img');
    const origSize = document.getElementById('orig-size');
    const compSize = document.getElementById('comp-size');
    const origDims = document.getElementById('orig-dims');
    const compDims = document.getElementById('comp-dims');
    const btnDownload = document.getElementById('btn-download');

    // Crop
    const btnStartCrop = document.getElementById('btn-start-crop');
    const cropOverlay = document.getElementById('crop-overlay');
    const imageToCrop = document.getElementById('image-to-crop');
    const btnConfirmCrop = document.getElementById('btn-confirm-crop');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const cropW = document.getElementById('crop-w');
    const cropH = document.getElementById('crop-h');
    const btnSetCrop = document.getElementById('btn-set-crop');
    const chkCropRatio = document.getElementById('chk-crop-ratio'); // 新增

    let currentFile = null;
    let cropper = null;
    let originalWidth = 0;
    let originalHeight = 0;

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    const updateCompInfo = (blob) => {
        const url = URL.createObjectURL(blob);
        compImg.src = url;
        compImg.style.opacity = '1';

        let sizeText = formatSize(blob.size);
        if (currentFile && currentFile.size > 0) {
            const saved = ((currentFile.size - blob.size) / currentFile.size * 100).toFixed(1);
            if (blob.size < currentFile.size) sizeText += ` (省 ${saved}%)`;
            else sizeText += ` (变大)`;
        }
        compSize.textContent = sizeText;

        const tempImg = new Image();
        tempImg.onload = () => {
            // 1. 更新界面尺寸显示
            compDims.textContent = `${tempImg.width} x ${tempImg.height}`;

            // 2. 生成时间戳 yyyy_MM_dd_hhmmss
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const dateStr = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

            // 3. 获取后缀名
            let ext = blob.type.split('/')[1];
            if (mimeSelect.value !== 'auto') ext = mimeSelect.value.split('/')[1];
            if (ext === 'jpeg') ext = 'jpg'; // 习惯性优化

            // 4. 设置下载链接和文件名
            btnDownload.href = url;
            // 格式：yyyyMMddhhmmss_高x宽.后缀
            btnDownload.download = `${dateStr}_${tempImg.height}x${tempImg.width}.${ext}`;
        };
        tempImg.src = url;
    };
    const doCompress = () => {
        if (!currentFile) return;

        const quality = parseFloat(qualitySlider.value);
        const w = parseInt(inputW.value);
        const h = parseInt(inputH.value);
        const mimeType = mimeSelect.value === 'auto' ? currentFile.type : mimeSelect.value;
        const ratioLocked = chkRatio.checked;

        compImg.style.opacity = '0.5';

        if (ratioLocked) {
            new Compressor(currentFile, {
                quality: quality, mimeType: mimeType, maxWidth: w, maxHeight: h,
                success: updateCompInfo,
                error: (e) => alert(e.message)
            });
        } else {
            const img = new Image();
            img.src = URL.createObjectURL(currentFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => {
                    if(blob) updateCompInfo(blob);
                }, mimeType, quality);
            };
        }
    };

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image')) return alert('无效图片');
        fileInput.value = '';
        currentFile = file;

        const url = URL.createObjectURL(file);
        origImg.src = url;
        origSize.textContent = formatSize(file.size);

        const tempImg = new Image();
        tempImg.onload = () => {
            originalWidth = tempImg.width;
            originalHeight = tempImg.height;
            origDims.textContent = `${originalWidth} x ${originalHeight}`;
            inputW.value = originalWidth; inputH.value = originalHeight;
            scaleSlider.value = 100; scaleVal.textContent = "100%"; sizePreset.value = "custom";
            doCompress();
        };
        tempImg.src = url;

        controls.style.display = 'flex';
        previewArea.style.display = 'flex';
        dropZone.style.padding = "5px";
        dropZone.querySelector('.upload-icon').style.display = 'none';
        dropZone.querySelector('.upload-text').textContent = '点击更换';
    };

    // --- 裁剪功能 ---
    btnStartCrop.onclick = () => {
        if (!window.Cropper) return alert("组件加载中...");
        cropOverlay.style.display = 'flex';
        imageToCrop.src = URL.createObjectURL(currentFile);

        // 重置状态
        chkCropRatio.checked = false;

        if (cropper) cropper.destroy();
        cropper = new Cropper(imageToCrop, {
            viewMode: 1,
            autoCropArea: 0.8,
            crop(e) {
                cropW.value = Math.round(e.detail.width);
                cropH.value = Math.round(e.detail.height);
            }
        });
    };

    // 锁定/解锁比例
    chkCropRatio.onchange = () => {
        if (!cropper) return;
        if (chkCropRatio.checked) {
            // 锁定当前框的比例
            const data = cropper.getData();
            cropper.setAspectRatio(data.width / data.height);
        } else {
            // 自由拖动
            cropper.setAspectRatio(NaN);
        }
    };

    // 应用输入框尺寸
    btnSetCrop.onclick = () => {
        if(!cropper) return;
        const w = parseFloat(cropW.value);
        const h = parseFloat(cropH.value);
        if (w && h) {
            cropper.setData({ width: w, height: h });
            // 如果处于锁定状态，应用新尺寸后，比例也要更新成新的 w/h
            if (chkCropRatio.checked) {
                cropper.setAspectRatio(w / h);
            }
        }
    };

    btnConfirmCrop.onclick = () => {
        if(!cropper) return;
        cropper.getCroppedCanvas().toBlob(blob => {
            currentFile = blob; handleFile(blob);
            cropOverlay.style.display = 'none';
            cropper.destroy(); cropper = null;
        });
    };
    btnCancelCrop.onclick = () => {
        cropOverlay.style.display = 'none';
        if(cropper) { cropper.destroy(); cropper = null; }
    };

    // --- 其他常规逻辑 ---
    sizePreset.onchange = () => {
        const val = sizePreset.value;
        if (val === 'custom') return;
        if (val.includes('x')) {
            const [w, h] = val.split('x').map(Number);
            inputW.value = w; inputH.value = h;
            chkRatio.checked = false; scaleSlider.value = 100; scaleVal.textContent = "Custom";
        } else {
            const ratio = parseFloat(val);
            inputW.value = Math.round(originalWidth * ratio); inputH.value = Math.round(originalHeight * ratio);
            chkRatio.checked = true; scaleSlider.value = ratio * 100; scaleVal.textContent = (ratio * 100) + "%";
        }
        doCompress();
    };

    scaleSlider.oninput = () => {
        const pct = parseInt(scaleSlider.value);
        scaleVal.textContent = pct + "%";
        inputW.value = Math.round(originalWidth * (pct / 100));
        inputH.value = Math.round(originalHeight * (pct / 100));
        sizePreset.value = "custom"; chkRatio.checked = true;
    };
    scaleSlider.onchange = doCompress;

    inputW.oninput = () => {
        if (chkRatio.checked && originalWidth > 0) {
            const ratio = (parseInt(inputW.value)||0) / originalWidth;
            inputH.value = Math.round(originalHeight * ratio);
            const pct = Math.min(100, Math.round(ratio * 100));
            scaleSlider.value = pct; scaleVal.textContent = pct + "%";
        }
    };
    inputH.oninput = () => {
        if (chkRatio.checked && originalHeight > 0) {
            const ratio = (parseInt(inputH.value)||0) / originalHeight;
            inputW.value = Math.round(originalWidth * ratio);
            const pct = Math.min(100, Math.round(ratio * 100));
            scaleSlider.value = pct; scaleVal.textContent = pct + "%";
        }
    };

    [inputW, inputH].forEach(el => el.addEventListener('change', doCompress));
    qualitySlider.oninput = () => qualityVal.textContent = qualitySlider.value;
    btnRecompress.onclick = doCompress;
    fileInput.onchange = (e) => { if(e.target.files[0]) handleFile(e.target.files[0]); };
    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.border = "2px solid #3b82f6"; };
    dropZone.ondragleave = () => { dropZone.style.border = "2px dashed #cbd5e1"; };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.style.border = "2px dashed #cbd5e1"; if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
}