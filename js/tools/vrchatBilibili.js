export function render() {
    return `
        <style>
            .bili-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .pink-title {
                color: #fb7299; /* B站粉 */
                font-weight: bold;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 20px;
            }
            .input-group {
                margin-bottom: 25px;
            }
            .label-text {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #374151;
            }
            .bili-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
                font-family: monospace;
            }
            .bili-input:focus {
                border-color: #fb7299;
                outline: none;
            }
            .result-box {
                background: #f8fafc;
                border: 1px dashed #cbd5e1;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
                word-break: break-all;
                color: #2563eb;
                font-family: monospace;
                line-height: 1.5;
                min-height: 24px;
            }
            .btn-copy {
                background-color: #fb7299;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 15px;
                width: 100%;
                justify-content: center;
            }
            .btn-copy:hover {
                background-color: #e4668b;
            }
            .btn-copy:active {
                transform: scale(0.98);
            }
        </style>

        <div class="tool-box">
            <div class="bili-card">
                <div class="pink-title">
                    📺 VRChat Bilibili 播放链接生成器
                </div>
                
                <div class="input-group">
                    <label class="label-text">输入 Bilibili 视频链接:</label>
                    <input type="text" id="bili-url" class="bili-input" placeholder="粘贴链接，例如 https://www.bilibili.com/video/BV..." autofocus>
                </div>

                <div class="input-group">
                    <label class="label-text">生成的 VRChat 可用链接:</label>
                    <div id="result-url" class="result-box">等待输入...</div>
                </div>

                <button id="btn-copy" class="btn-copy">
                    📋 复制到剪贴板
                </button>
            </div>
            
            <div style="margin-top: 20px; color: #64748b; font-size: 13px; text-align: center;">
                💡 提示：此工具使用 91vrchat 解析服务，请确保遵循相关使用规范。
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('bili-url');
    const resultBox = document.getElementById('result-url');
    const copyBtn = document.getElementById('btn-copy');

    // 固定前缀
    const PREFIX = "https://biliplayer.91vrchat.com/player/?url=";

    // 实时监听输入
    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (!val) {
            resultBox.textContent = "等待输入...";
            resultBox.style.color = "#94a3b8";
            return;
        }

        // 简单的拼接逻辑
        const finalUrl = PREFIX + val;

        resultBox.textContent = finalUrl;
        resultBox.style.color = "#2563eb";
    });

    // 复制功能
    copyBtn.onclick = () => {
        const text = resultBox.textContent;
        if (text === "等待输入...") {
            alert("请先输入视频链接");
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = "✅ 已复制成功！";
            copyBtn.style.backgroundColor = "#10b981"; // 变绿

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = "#fb7299"; // 变回粉色
            }, 1500);
        });
    };
}