import Compressor from 'https://esm.sh/compressorjs@1.2.1';

export function render() {
    return `
        <style>
            .img-tool-container { display: flex; flex-direction: column; height: 100%; gap: 15px; position: relative; }
            
            /* 上传区域 */
            .upload-zone {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .upload-zone:hover, .upload-zone.drag-over { border-color: #3b82f6; background: #eff6ff; }
            .upload-icon { font-size: 32px; display: block; margin-bottom: 5px; }
            
            /* 关键修改：加上 pointer-events: none，防止点击冲突 */
            #file-input { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                opacity: 0; cursor: pointer; pointer-events: none; 
            }

            /* 控制栏 */
            .controls-panel {
                display: flex;
                gap: 12px;
                align-items: center;
                background: #fff;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                flex-wrap: wrap;
            }
            .control-group { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #334155; }
            .input-dim { width: 60px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: monospace; }
            select { padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; }
            
            /* 按钮样式 */
            .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s; color: #fff; }
            .btn:hover { opacity: 0.9; }
            .btn-blue { background: #3b82f6; }
            .btn-green { background: #10b981; }
            .btn-orange { background: #f97316; }
            .btn-gray { background: #64748b; }

            /* 裁剪编辑器覆盖层 */
            #crop-overlay {
                display: none;
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: #1e293b;
                z-index: 100;
                flex-direction: column;
                border-radius: 8px;
                overflow: hidden;
            }
            .crop-area { flex: 1; position: relative; background: #000; overflow: hidden; }
            .crop-toolbar {
                height: 50px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; padding: 0 15px;
                border-top: 1px solid #334155;
            }
            #image-to-crop { max-width: 100%; display: block; }

            /* 对比区域 */
            .preview-container { display: flex; gap: 15px; flex: 1; min-height: 0; }
            .img-card {
                flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
                display: flex; flex-direction: column; overflow: hidden;
            }
            .card-header {
                padding: 8px 12px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
                font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; align-items: center;
            }
            .img-wrapper {
                flex: 1; background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" fill="%23f0f0f0"/><rect x="10" y="10" width="10" height="10" fill="%23f0f0f0"/><rect x="0" y="10" width="10" height="10" fill="%23ffffff"/><rect x="10" y="0" width="10" height="10" fill="%23ffffff"/></svg>'); 
                display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 10px;
            }
            .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .card-footer { padding: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
            
            /* 徽章样式 */
            .badge-info { padding: 2px 6px; border-radius: 4px; font-weight: normal; font-size: 12px; }
            .bg-red { background: #fee2e2; color: #991b1b; }
            .bg-green { background: #dcfce7; color: #166534; }
        </style>

        <div class="tool-box img-tool-container">
            <div id="status-bar" style="display:none; text-align:center; padding:5px; background:#fff7ed; color:#c2410c; border-radius:4px; font-size:12px;"></div>

            <div class="upload-zone" id="drop-zone">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击或拖拽图片 (JPG, PNG, WebP)</span>
                <input type="file" id="file-input" accept="image/*">
            </div>

            <div id="controls" class="controls-panel" style="display:none;">
                <button id="btn-start-crop" class="btn btn-orange">✂️ 裁剪</button>
                <div style="width:1px; height:20px; background:#e2e8f0; margin:0 5px;"></div>

                <div class="control-group">
                    <label>模式:</label>
                    <select id="resize-mode">
                        <option value="ratio">保持比例</option>
                        <option value="stretch">强制拉伸</option>
                    </select>
                </div>

                <div class="control-group">
                    <input type="number" id="img-w" class="input-dim" placeholder="宽">
                    <span style="color:#94a3b8;">x</span>
                    <input type="number" id="img-h" class="input-dim" placeholder="高" disabled>
                </div>

                <div class="control-group">
                    <label>质量:</label>
                    <input type="range" id="quality-slider" min="0.1" max="1.0" step="0.1" value="0.8" style="width:60px;">
                    <span id="quality-val" style="font-weight:bold; color:#2563eb;">0.8</span>
                </div>

                <div class="control-group">
                    <select id="out-mime">
                        <option value="auto">原格式</option>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/webp">WebP</option>
                        <option value="image/png">PNG</option>
                    </select>
                </div>
                
                <button id="btn-recompress" class="btn btn-blue" style="margin-left:auto;">⚡ 压缩</button>
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
                        <span id="comp-dims" style="margin-right:10px;">-</span>
                        <a id="btn-download" href="#" download="image.jpg"><button class="btn btn-green">⬇️ 下载</button></a>
                    </div>
                </div>
            </div>

            <div id="crop-overlay">
                <div class="crop-area">
                    <img id="image-to-crop" src="">
                </div>
                <div class="crop-toolbar">
                    <div class="control-group">
                        <label style="color:#fff;">裁剪框:</label>
                        <input type="number" id="crop-w" class="input-dim" placeholder="W" style="background:#334155; color:white; border-color:#475569;">
                        <span style="color:#64748b;">x</span>
                        <input type="number" id="crop-h" class="input-dim" placeholder="H" style="background:#334155; color:white; border-color:#475569;">
                        <button id="btn-set-crop-box" class="btn btn-gray" style="padding:4px 8px; font-size:12px;">应用尺寸</button>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button id="btn-cancel-crop" class="btn btn-gray">取消</button>
                        <button id="btn-confirm-crop" class="btn btn-green">✅ 确认裁剪</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // 动态加载资源
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
    ]).then(() => {
        status.style.display = 'none';
    });

    // Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const controls = document.getElementById('controls');
    const previewArea = document.getElementById('preview-area');

    // Controls
    const resizeMode = document.getElementById('resize-mode');
    const inputW = document.getElementById('img-w');
    const inputH = document.getElementById('img-h');
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
    const btnSetCropBox = document.getElementById('btn-set-crop-box');

    let currentFile = null;
    let cropper = null;

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

        // 计算节省比例
        let sizeText = formatSize(blob.size);
        if (currentFile && currentFile.size > 0) {
            const saved = ((currentFile.size - blob.size) / currentFile.size * 100).toFixed(1);
            if (blob.size < currentFile.size) {
                sizeText += ` (省 ${saved}%)`;
            } else {
                sizeText += ` (变大)`;
            }
        }
        compSize.textContent = sizeText;

        const tempImg = new Image();
        tempImg.onload = () => { compDims.textContent = `${tempImg.width} x ${tempImg.height}`; };
        tempImg.src = url;

        let ext = blob.type.split('/')[1];
        btnDownload.href = url;
        btnDownload.download = `processed_${Date.now()}.${ext}`;
    };

    const doCompress = () => {
        if (!currentFile) return;

        const quality = parseFloat(qualitySlider.value);
        const w = parseInt(inputW.value);
        const h = parseInt(inputH.value);
        const mode = resizeMode.value;
        let mimeType = mimeSelect.value === 'auto' ? currentFile.type : mimeSelect.value;

        compImg.style.opacity = '0.5';

        if (mode === 'ratio') {
            const options = {
                quality: quality,
                mimeType: mimeType,
                success: updateCompInfo,
                error: (e) => alert(e.message)
            };
            if (w) options.maxWidth = w;
            new Compressor(currentFile, options);
        } else {
            if (!w || !h) return alert("拉伸模式需要宽度和高度");
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

        // 关键修改：清空 input，确保下次能选同一个文件
        fileInput.value = '';

        currentFile = file;

        const url = URL.createObjectURL(file);
        origImg.src = url;
        origSize.textContent = formatSize(file.size);

        const tempImg = new Image();
        tempImg.onload = () => {
            origDims.textContent = `${tempImg.width} x ${tempImg.height}`;
            inputW.value = tempImg.width;
            inputH.value = tempImg.height;
            doCompress();
        };
        tempImg.src = url;

        controls.style.display = 'flex';
        previewArea.style.display = 'flex';
        dropZone.style.padding = "10px";
        dropZone.querySelector('.upload-icon').style.display = 'none';
        dropZone.querySelector('.upload-text').textContent = '点击更换图片';
    };

    // Crop Logic
    btnStartCrop.onclick = () => {
        if (!window.Cropper) return alert("Cropper.js 尚未加载完成，请稍后再试");
        cropOverlay.style.display = 'flex';
        imageToCrop.src = URL.createObjectURL(currentFile);

        if (cropper) cropper.destroy();
        cropper = new Cropper(imageToCrop, {
            viewMode: 1,
            autoCropArea: 0.8,
            crop(event) {
                cropW.value = Math.round(event.detail.width);
                cropH.value = Math.round(event.detail.height);
            }
        });
    };

    btnSetCropBox.onclick = () => {
        if (!cropper) return;
        const w = parseFloat(cropW.value);
        const h = parseFloat(cropH.value);
        if (w && h) cropper.setData({ width: w, height: h });
    };

    btnConfirmCrop.onclick = () => {
        if (!cropper) return;
        cropper.getCroppedCanvas().toBlob((blob) => {
            currentFile = blob;
            handleFile(blob);
            cropOverlay.style.display = 'none';
            cropper.destroy();
            cropper = null;
        });
    };

    btnCancelCrop.onclick = () => {
        cropOverlay.style.display = 'none';
        if (cropper) { cropper.destroy(); cropper = null; }
    };

    // Listeners
    resizeMode.onchange = () => {
        if (resizeMode.value === 'ratio') {
            inputH.disabled = true; inputH.placeholder = "自动";
        } else {
            inputH.disabled = false; inputH.placeholder = "高";
        }
    };
    qualitySlider.oninput = () => qualityVal.textContent = qualitySlider.value;
    btnRecompress.onclick = doCompress;

    fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };
    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.border = "2px solid #3b82f6"; };
    dropZone.ondragleave = () => { dropZone.style.border = "2px dashed #cbd5e1"; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.border = "2px dashed #cbd5e1";
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    // Init
    resizeMode.dispatchEvent(new Event('change'));
}