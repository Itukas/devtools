// 文件格式魔数映射表
const FILE_SIGNATURES = {
    // 图片格式
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF], // JPEG
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    'image/webp': [
        [0x52, 0x49, 0x46, 0x46], // RIFF (需要进一步检查 WEBP)
    ],
    'image/bmp': [
        [0x42, 0x4D], // BM
    ],
    'image/tiff': [
        [0x49, 0x49, 0x2A, 0x00], // TIFF (little-endian)
        [0x4D, 0x4D, 0x00, 0x2A], // TIFF (big-endian)
    ],
    'image/svg+xml': [
        // SVG 是文本格式，检查 XML 声明或 <svg 标签
    ],
    'image/ico': [
        [0x00, 0x00, 0x01, 0x00], // ICO
    ],
    'image/heic': [
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // HEIC
        [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // HEIC
    ],
    'image/avif': [
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // AVIF
    ],

    // 音频格式
    'audio/mpeg': [
        [0xFF, 0xFB], // MP3 with ID3v2
        [0xFF, 0xF3], // MP3
        [0xFF, 0xF2], // MP3
        [0x49, 0x44, 0x33], // ID3v2 tag (MP3)
    ],
    'audio/wav': [
        [0x52, 0x49, 0x46, 0x46], // RIFF (需要进一步检查 WAVE)
    ],
    'audio/ogg': [
        [0x4F, 0x67, 0x67, 0x53], // OggS
    ],
    'audio/aac': [
        [0xFF, 0xF1], // AAC ADTS
        [0xFF, 0xF9], // AAC ADTS
    ],
    'audio/flac': [
        [0x66, 0x4C, 0x61, 0x43], // fLaC
    ],
    'audio/m4a': [
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], // M4A
    ],
    'audio/wma': [
        [0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11], // WMA
    ],

    // 视频格式
    'video/mp4': [
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // MP4 (需要进一步检查)
        [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4
    ],
    'video/avi': [
        [0x52, 0x49, 0x46, 0x46], // RIFF (需要进一步检查 AVI)
    ],
    'video/quicktime': [
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // QuickTime
    ],
    'video/webm': [
        [0x1A, 0x45, 0xDF, 0xA3], // WebM (Matroska)
    ],
    'video/mkv': [
        [0x1A, 0x45, 0xDF, 0xA3], // Matroska (MKV)
    ],
    'video/flv': [
        [0x46, 0x4C, 0x56, 0x01], // FLV
    ],
    'video/wmv': [
        [0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11], // WMV
    ],
};

// 检查字节数组是否匹配签名
function matchesSignature(bytes, signature) {
    if (bytes.length < signature.length) return false;
    for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) return false;
    }
    return true;
}

// 检测文件实际格式
async function detectFileType(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            
            // 特殊处理：需要检查更多字节的格式
            // WebP: RIFF...WEBP
            if (bytes.length >= 12 && matchesSignature(bytes.slice(0, 4), [0x52, 0x49, 0x46, 0x46])) {
                const webpCheck = String.fromCharCode(...bytes.slice(8, 12));
                if (webpCheck === 'WEBP') {
                    resolve('image/webp');
                    return;
                }
            }
            
            // WAV: RIFF...WAVE
            if (bytes.length >= 12 && matchesSignature(bytes.slice(0, 4), [0x52, 0x49, 0x46, 0x46])) {
                const waveCheck = String.fromCharCode(...bytes.slice(8, 12));
                if (waveCheck === 'WAVE') {
                    resolve('audio/wav');
                    return;
                }
            }
            
            // AVI: RIFF...AVI 
            if (bytes.length >= 12 && matchesSignature(bytes.slice(0, 4), [0x52, 0x49, 0x46, 0x46])) {
                const aviCheck = String.fromCharCode(...bytes.slice(8, 12));
                if (aviCheck === 'AVI ') {
                    resolve('video/avi');
                    return;
                }
            }
            
            // MP4: 检查 ftyp box
            if (bytes.length >= 12) {
                const ftypCheck = String.fromCharCode(...bytes.slice(4, 8));
                if (ftypCheck === 'ftyp') {
                    // 检查品牌
                    const brand = String.fromCharCode(...bytes.slice(8, 12));
                    if (brand.includes('mp4') || brand.includes('isom') || brand.includes('avc1')) {
                        resolve('video/mp4');
                        return;
                    }
                    if (brand.includes('qt')) {
                        resolve('video/quicktime');
                        return;
                    }
                }
            }
            
            // SVG: 检查文本内容
            if (bytes.length > 0) {
                const text = new TextDecoder('utf-8').decode(bytes.slice(0, Math.min(100, bytes.length)));
                if (text.trim().startsWith('<?xml') || text.trim().startsWith('<svg')) {
                    resolve('image/svg+xml');
                    return;
                }
            }
            
            // 遍历所有签名进行匹配
            for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
                for (const signature of signatures) {
                    if (matchesSignature(bytes, signature)) {
                        resolve(mimeType);
                        return;
                    }
                }
            }
            
            // 如果都不匹配，返回未知
            resolve('unknown');
        };
        reader.onerror = () => resolve('unknown');
        // 读取前128字节应该足够检测大部分格式（某些格式如HEIC/AVIF需要更多字节）
        reader.readAsArrayBuffer(file.slice(0, 128));
    });
}

// 获取文件扩展名对应的常见MIME类型
function getMimeFromExtension(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap = {
        // 图片
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff', 'tif': 'image/tiff',
        'svg': 'image/svg+xml',
        'ico': 'image/ico',
        'heic': 'image/heic',
        'avif': 'image/avif',
        // 音频
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'aac': 'audio/aac',
        'flac': 'audio/flac',
        'm4a': 'audio/m4a',
        'wma': 'audio/wma',
        // 视频
        'mp4': 'video/mp4',
        'avi': 'video/avi',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
        'mkv': 'video/mkv',
        'flv': 'video/flv',
        'wmv': 'video/wmv',
    };
    return mimeMap[ext] || 'unknown';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 获取格式友好的显示名称
function getFormatName(mimeType) {
    const names = {
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WebP',
        'image/bmp': 'BMP',
        'image/tiff': 'TIFF',
        'image/svg+xml': 'SVG',
        'image/ico': 'ICO',
        'image/heic': 'HEIC',
        'image/avif': 'AVIF',
        'audio/mpeg': 'MP3',
        'audio/wav': 'WAV',
        'audio/ogg': 'OGG',
        'audio/aac': 'AAC',
        'audio/flac': 'FLAC',
        'audio/m4a': 'M4A',
        'audio/wma': 'WMA',
        'video/mp4': 'MP4',
        'video/avi': 'AVI',
        'video/quicktime': 'QuickTime (MOV)',
        'video/webm': 'WebM',
        'video/mkv': 'Matroska (MKV)',
        'video/flv': 'FLV',
        'video/wmv': 'WMV',
        'unknown': '未知格式',
    };
    return names[mimeType] || mimeType;
}

export function render() {
    return `
        <style>
            .upload-box {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s;
            }
            .upload-box:hover {
                border-color: #3b82f6;
                background: #eff6ff;
            }
            .upload-box.dragover {
                border-color: #3b82f6;
                background: #dbeafe;
            }

            .result-box {
                display: none;
                margin-top: 20px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .result-box.show {
                display: block;
            }

            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .info-table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
            }
            .info-table td:first-child {
                font-weight: 600;
                color: #475569;
                width: 150px;
            }
            .info-table td:last-child {
                color: #1e293b;
                font-family: monospace;
            }

            .match-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            .match-badge.match {
                background: #d1fae5;
                color: #065f46;
            }
            .match-badge.mismatch {
                background: #fee2e2;
                color: #991b1b;
            }
            .match-badge.unknown {
                background: #e5e7eb;
                color: #374151;
            }

            .preview-area {
                margin-top: 20px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .preview-img {
                max-width: 100%;
                max-height: 300px;
                border-radius: 4px;
            }
            .preview-audio, .preview-video {
                width: 100%;
                max-width: 600px;
                border-radius: 4px;
            }
        </style>

        <div class="tool-box">
            <div class="upload-box" id="drop-zone">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">拖拽或点击上传文件</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 10px;">
                    支持图片、音频、视频格式<br>
                    自动检测文件实际编码格式
                </div>
                <input type="file" id="file-input" style="display: none;" accept="image/*,audio/*,video/*">
            </div>

            <div id="result-box" class="result-box">
                <h3 style="margin-top: 0; color: #1e293b;">检测结果</h3>
                <table class="info-table">
                    <tr>
                        <td>文件名</td>
                        <td id="file-name">-</td>
                    </tr>
                    <tr>
                        <td>文件大小</td>
                        <td id="file-size">-</td>
                    </tr>
                    <tr>
                        <td>文件扩展名</td>
                        <td id="file-extension">-</td>
                    </tr>
                    <tr>
                        <td>扩展名对应格式</td>
                        <td id="extension-format">-</td>
                    </tr>
                    <tr>
                        <td>实际编码格式</td>
                        <td>
                            <span id="actual-format">-</span>
                            <span id="match-badge" class="match-badge" style="margin-left: 10px;"></span>
                        </td>
                    </tr>
                    <tr>
                        <td>MIME 类型</td>
                        <td id="mime-type">-</td>
                    </tr>
                </table>

                <div id="preview-area" class="preview-area" style="display: none;">
                    <div style="font-weight: 600; margin-bottom: 10px; color: #475569;">文件预览</div>
                    <div id="preview-content"></div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultBox = document.getElementById('result-box');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileExtension = document.getElementById('file-extension');
    const extensionFormat = document.getElementById('extension-format');
    const actualFormat = document.getElementById('actual-format');
    const mimeType = document.getElementById('mime-type');
    const matchBadge = document.getElementById('match-badge');
    const previewArea = document.getElementById('preview-area');
    const previewContent = document.getElementById('preview-content');

    const handleFile = async (file) => {
        // 显示加载状态
        resultBox.classList.add('show');
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileExtension.textContent = '-' + (file.name.split('.').pop() || '无扩展名');
        extensionFormat.textContent = '检测中...';
        actualFormat.textContent = '检测中...';
        mimeType.textContent = '检测中...';
        matchBadge.textContent = '';
        matchBadge.className = 'match-badge';
        previewArea.style.display = 'none';
        previewContent.innerHTML = '';

        // 获取扩展名对应的格式
        const extMime = getMimeFromExtension(file.name);
        extensionFormat.textContent = extMime !== 'unknown' ? getFormatName(extMime) : '未知格式';

        // 检测实际格式
        const actualMime = await detectFileType(file);
        const actualFormatName = getFormatName(actualMime);
        actualFormat.textContent = actualFormatName;
        mimeType.textContent = actualMime;

        // 判断是否匹配
        if (actualMime === 'unknown') {
            matchBadge.textContent = '无法识别';
            matchBadge.classList.add('unknown');
        } else if (extMime === actualMime) {
            matchBadge.textContent = '✓ 匹配';
            matchBadge.classList.add('match');
        } else {
            matchBadge.textContent = '✗ 不匹配';
            matchBadge.classList.add('mismatch');
        }

        // 显示预览
        if (actualMime.startsWith('image/') && actualMime !== 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContent.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="预览">`;
                previewArea.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else if (actualMime.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContent.innerHTML = `
                    <audio controls class="preview-audio">
                        <source src="${e.target.result}" type="${actualMime}">
                        您的浏览器不支持音频播放
                    </audio>
                `;
                previewArea.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else if (actualMime.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContent.innerHTML = `
                    <video controls class="preview-video">
                        <source src="${e.target.result}" type="${actualMime}">
                        您的浏览器不支持视频播放
                    </video>
                `;
                previewArea.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
}
