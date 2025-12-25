export function render() {
    return `
        <style>
            .tab-header { display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
            .tab-btn { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; color: #64748b; transition: all 0.2s; }
            .tab-btn:hover { color: #3b82f6; background: #f8fafc; }
            .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: #eff6ff; }
            
            .panel { display: none; flex-direction: column; gap: 20px; animation: fadeIn 0.2s ease; }
            .panel.active { display: flex; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

            /* 拖拽上传区 */
            .upload-box {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s;
            }
            .upload-box:hover { border-color: #3b82f6; background: #eff6ff; }

            /* 文本域 */
            .b64-textarea {
                width: 100%;
                height: 150px;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                resize: vertical;
                color: #475569;
            }
            .b64-textarea:focus { border-color: #3b82f6; outline: none; }

            /* 预览区 */
            .preview-box {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                background: #fff; /* 透明背景图 */
                background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                background-size: 20px 20px;
                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                text-align: center;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .preview-img { max-width: 100%; max-height: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            
            .action-bar { display: flex; gap: 10px; align-items: center; }
            .file-info { font-size: 12px; color: #64748b; margin-left: auto; }
        </style>

        <div class="tool-box">
            <div class="tab-header">
                <div class="tab-btn active" data-target="p-enc">图片转 Base64</div>
                <div class="tab-btn" data-target="p-dec">Base64 转图片</div>
            </div>

            <div id="p-enc" class="panel active">
                <div class="upload-box" id="drop-zone">
                    <div style="font-size:32px; margin-bottom:5px;">🖼️</div>
                    <div>点击或拖拽图片到这里</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:5px;">支持 PNG, JPG, GIF, WebP, SVG</div>
                    <input type="file" id="file-input" accept="image/*" style="display:none;">
                </div>

                <div id="enc-result-area" style="display:none; flex-direction:column; gap:15px;">
                    <div class="preview-box">
                        <img id="enc-preview" class="preview-img">
                    </div>
                    
                    <div>
                        <div class="action-bar" style="margin-bottom:5px;">
                            <label style="font-weight:bold;">Base64 结果:</label>
                            <span id="enc-info" class="file-info"></span>
                        </div>
                        <textarea id="enc-output" class="b64-textarea" readonly></textarea>
                        <div class="action-bar" style="margin-top:10px;">
                            <button id="btn-copy-enc" style="background:#2563eb;">📋 复制全部</button>
                            <button id="btn-copy-img-tag" class="secondary">复制 &lt;img&gt; 标签</button>
                            <button id="btn-copy-css" class="secondary">复制 CSS 背景</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="p-dec" class="panel">
                <div>
                    <div style="margin-bottom:5px; font-weight:bold;">输入 Base64 字符串:</div>
                    <textarea id="dec-input" class="b64-textarea" placeholder="粘贴 Base64 字符串 (包含或不包含 'data:image/...' 前缀均可)"></textarea>
                </div>

                <div class="action-bar">
                    <button id="btn-preview" style="background:#10b981;">⬇️ 转换并预览</button>
                    <button id="btn-clear-dec" class="secondary" style="background:#ef4444;">清空</button>
                </div>

                <div id="dec-result-area" style="display:none; flex-direction:column; gap:15px;">
                    <label style="font-weight:bold;">图片预览:</label>
                    <div class="preview-box">
                        <img id="dec-preview" class="preview-img">
                    </div>
                    <div class="action-bar">
                        <a id="btn-download" href="#" download="image.png" style="text-decoration:none;">
                            <button style="background:#8b5cf6;">💾 下载图片</button>
                        </a>
                        <span id="dec-info" class="file-info"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // --- Tabs ---
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        };
    });

    // --- 1. 图片 转 Base64 ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const encArea = document.getElementById('enc-result-area');
    const encPreview = document.getElementById('enc-preview');
    const encOutput = document.getElementById('enc-output');
    const encInfo = document.getElementById('enc-info');

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('请上传有效的图片文件');
            return;
        }

        // 读取文件
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            encPreview.src = base64;
            encOutput.value = base64;
            encInfo.textContent = `格式: ${file.type} | 大小: ${(file.size/1024).toFixed(1)} KB`;
            encArea.style.display = 'flex';
        };
        reader.onerror = () => alert('读取文件失败');
        reader.readAsDataURL(file);
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#3b82f6'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = '#cbd5e1'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e1';
        handleFile(e.dataTransfer.files[0]);
    };

    // 复制按钮组
    const copyText = (text, btn) => {
        navigator.clipboard.writeText(text).then(() => {
            const old = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => btn.textContent = old, 1500);
        });
    };

    document.getElementById('btn-copy-enc').onclick = function() {
        copyText(encOutput.value, this);
    };
    document.getElementById('btn-copy-img-tag').onclick = function() {
        if(!encOutput.value) return;
        copyText(`<img src="${encOutput.value}" alt="image" />`, this);
    };
    document.getElementById('btn-copy-css').onclick = function() {
        if(!encOutput.value) return;
        copyText(`background-image: url('${encOutput.value}');`, this);
    };


    // --- 2. Base64 转 图片 ---
    const decInput = document.getElementById('dec-input');
    const decArea = document.getElementById('dec-result-area');
    const decPreview = document.getElementById('dec-preview');
    const downloadBtn = document.getElementById('btn-download');
    const decInfo = document.getElementById('dec-info');

    document.getElementById('btn-preview').onclick = () => {
        let val = decInput.value.trim();
        if (!val) return;

        // 智能修复：如果用户只复制了 base64 码，没带 data:image 前缀，尝试补全
        // 简单的猜测逻辑：看开头字符
        if (!val.startsWith('data:image')) {
            // 默认补 png，虽然不一定对，但浏览器容错性很强
            // 如果是以 /9j/ 开头通常是 jpg, iVBORw 开头是 png, R0lG 开头是 gif
            if (val.startsWith('/9j/')) {
                val = `data:image/jpeg;base64,${val}`;
            } else if (val.startsWith('R0lG')) {
                val = `data:image/gif;base64,${val}`;
            } else if (val.startsWith('PHN2')) {
                val = `data:image/svg+xml;base64,${val}`;
            } else {
                val = `data:image/png;base64,${val}`;
            }
        }

        decPreview.src = val;
        decArea.style.display = 'flex';

        // 设置下载
        downloadBtn.href = val;

        // 尝试解析格式
        const match = val.match(/data:(image\/.*?);/);
        const ext = match ? match[1].split('/')[1] : 'png';
        downloadBtn.download = `decoded_image.${ext}`;

        // 计算大概大小 (Base64长度 * 0.75)
        const sizeKB = (val.length * 0.75 / 1024).toFixed(1);
        decInfo.textContent = `格式: ${match ? match[1] : 'unknown'} | 估算大小: ${sizeKB} KB`;
    };

    document.getElementById('btn-clear-dec').onclick = () => {
        decInput.value = '';
        decArea.style.display = 'none';
        decPreview.src = '';
    };
}