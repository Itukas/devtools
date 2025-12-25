import Compressor from 'https://esm.sh/compressorjs@1.2.1';

export function render() {
    return `
        <style>
            .img-tool-container { display: flex; flex-direction: column; height: 100%; gap: 20px; }
            
            /* 上传区域 */
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
            .upload-zone:hover, .upload-zone.drag-over {
                border-color: #3b82f6;
                background: #eff6ff;
            }
            .upload-icon { font-size: 40px; margin-bottom: 10px; display: block; }
            .upload-text { color: #64748b; font-size: 14px; }
            #file-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

            /* 控制栏 */
            .controls-panel {
                display: flex;
                gap: 20px;
                align-items: center;
                background: #fff;
                padding: 15px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                flex-wrap: wrap;
            }
            .control-group { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; }
            .slider-val { font-family: monospace; font-weight: bold; color: #2563eb; width: 40px; }
            
            /* 对比区域 */
            .preview-container {
                display: flex;
                gap: 20px;
                flex: 1;
                min-height: 0; /* 允许子元素滚动 */
            }
            .img-card {
                flex: 1;
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .card-header {
                padding: 10px 15px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
                font-weight: 600;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .file-info { font-size: 12px; color: #64748b; font-weight: normal; }
            .img-wrapper {
                flex: 1;
                background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" fill="%23f0f0f0"/><rect x="10" y="10" width="10" height="10" fill="%23f0f0f0"/><rect x="0" y="10" width="10" height="10" fill="%23ffffff"/><rect x="10" y="0" width="10" height="10" fill="%23ffffff"/></svg>'); 
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                padding: 10px;
                position: relative;
            }
            .preview-img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .card-footer {
                padding: 15px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
            }
            .size-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-green { background: #dcfce7; color: #166534; }
        </style>

        <div class="tool-box img-tool-container">
            <div class="upload-zone" id="drop-zone">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击或拖拽图片到这里 (JPG, PNG, WebP)</span>
                <input type="file" id="file-input" accept="image/*">
            </div>

            <div id="controls" class="controls-panel" style="display:none;">
                <div class="control-group">
                    <label>压缩质量 (Quality):</label>
                    <input type="range" id="quality-slider" min="0.1" max="1.0" step="0.1" value="0.8">
                    <span id="quality-val" class="slider-val">0.8</span>
                </div>
                
                <div class="control-group">
                    <label>最大宽度 (px):</label>
                    <input type="number" id="max-width" value="1920" style="width: 70px; padding: 4px;">
                </div>

                <div class="control-group">
                    <label>输出格式:</label>
                    <select id="out-mime" style="padding: 4px;">
                        <option value="auto">保持原样 (Auto)</option>
                        <option value="image/jpeg">JPEG (推荐)</option>
                        <option value="image/webp">WebP (更小)</option>
                        <option value="image/png">PNG</option>
                    </select>
                </div>

                <button id="btn-recompress" style="background:#3b82f6; padding: 6px 15px; margin-left: auto;">↻ 重新压缩</button>
            </div>

            <div id="preview-area" class="preview-container" style="display:none;">
                <div class="img-card">
                    <div class="card-header">
                        原始图片 (Original)
                        <span id="orig-size" class="size-badge badge-red">-</span>
                    </div>
                    <div class="img-wrapper">
                        <img id="orig-img" class="preview-img">
                    </div>
                    <div class="card-footer">
                        <span id="orig-dims" class="file-info">- x -</span>
                    </div>
                </div>

                <div class="img-card">
                    <div class="card-header">
                        压缩结果 (Compressed)
                        <span id="comp-size" class="size-badge badge-green">-</span>
                    </div>
                    <div class="img-wrapper">
                        <img id="comp-img" class="preview-img">
                    </div>
                    <div class="card-footer">
                        <span id="comp-dims" class="file-info" style="margin-right: 10px;">- x -</span>
                        <a id="btn-download" href="#" download="compressed.jpg" style="text-decoration:none;">
                            <button style="background:#16a34a; padding: 6px 15px;">⬇️ 下载</button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const controls = document.getElementById('controls');
    const previewArea = document.getElementById('preview-area');

    // 输入控件
    const qualitySlider = document.getElementById('quality-slider');
    const qualityVal = document.getElementById('quality-val');
    const maxWidthInput = document.getElementById('max-width');
    const mimeSelect = document.getElementById('out-mime');
    const btnRecompress = document.getElementById('btn-recompress');

    // 预览元素
    const origImg = document.getElementById('orig-img');
    const compImg = document.getElementById('comp-img');
    const origSize = document.getElementById('orig-size');
    const compSize = document.getElementById('comp-size');
    const origDims = document.getElementById('orig-dims');
    const compDims = document.getElementById('comp-dims');
    const btnDownload = document.getElementById('btn-download');

    let currentFile = null;

    // 工具函数：格式化文件大小
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 核心压缩逻辑
    const doCompress = () => {
        if (!currentFile) return;

        // 获取参数
        const quality = parseFloat(qualitySlider.value);
        const maxWidth = parseInt(maxWidthInput.value) || undefined;
        let mimeType = mimeSelect.value;

        if (mimeType === 'auto') mimeType = undefined; // 让库自动处理

        // 显示加载状态
        compImg.style.opacity = '0.5';

        new Compressor(currentFile, {
            quality: quality,
            maxWidth: maxWidth,
            mimeType: mimeType,
            success(result) {
                // result 是一个 Blob 对象
                const url = URL.createObjectURL(result);
                compImg.src = url;
                compImg.style.opacity = '1';

                // 更新数据
                compSize.textContent = formatSize(result.size);

                // 计算节省比例
                const saved = ((currentFile.size - result.size) / currentFile.size * 100).toFixed(1);
                if (result.size < currentFile.size) {
                    compSize.innerHTML = `${formatSize(result.size)} (省 ${saved}%)`;
                } else {
                    compSize.innerHTML = `${formatSize(result.size)} (变大)`;
                }

                // 更新图片尺寸 (需要加载图片对象才能获取宽高)
                const tempImg = new Image();
                tempImg.onload = () => {
                    compDims.textContent = `${tempImg.width} x ${tempImg.height}`;
                };
                tempImg.src = url;

                // 设置下载链接
                let ext = result.type.split('/')[1];
                btnDownload.href = url;
                btnDownload.download = `compressed_${Date.now()}.${ext}`;
            },
            error(err) {
                console.error(err.message);
                alert('压缩失败: ' + err.message);
            },
        });
    };

    // 处理新文件加载
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image')) {
            alert('请上传有效的图片文件');
            return;
        }

        currentFile = file;

        // 1. 显示原图
        const url = URL.createObjectURL(file);
        origImg.src = url;
        origSize.textContent = formatSize(file.size);

        // 获取原图尺寸
        const tempImg = new Image();
        tempImg.onload = () => {
            origDims.textContent = `${tempImg.width} x ${tempImg.height}`;
        };
        tempImg.src = url;

        // 2. 显示界面
        controls.style.display = 'flex';
        previewArea.style.display = 'flex';
        dropZone.style.padding = "10px"; // 缩小上传区

        // 3. 触发第一次压缩
        doCompress();
    };

    // --- 事件监听 ---

    // 滑块数值显示
    qualitySlider.oninput = () => {
        qualityVal.textContent = qualitySlider.value;
    };

    // 文件选择
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    // 拖拽支持
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    };
    dropZone.ondragleave = () => {
        dropZone.classList.remove('drag-over');
    };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // 重新压缩按钮 (也可以监听 slider 的 change 事件实现自动重压)
    btnRecompress.onclick = doCompress;

    // 如果想要拖动滑块松手后自动压缩，可以解开下面这行：
    // qualitySlider.onchange = doCompress;
}