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
            .input-group { margin-bottom: 25px; }
            
            .input-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .label-text { font-weight: 500; color: #374151; }
            
            .smart-paste-btn {
                font-size: 12px;
                background-color: #e0f2fe;
                color: #0284c7;
                border: 1px solid #bae6fd;
                padding: 4px 10px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .smart-paste-btn:hover { background-color: #bae6fd; }

            .bili-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.2s;
                font-family: monospace;
                color: #333;
                box-sizing: border-box; /* 防止padding撑破宽度 */
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
                font-size: 13px;
            }
            
            .btn-copy {
                background-color: #fb7299;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 20px;
                width: 100%;
                justify-content: center;
                font-size: 1.1rem;
            }
            .btn-copy:hover { background-color: #e4668b; }
            .btn-copy:active { transform: scale(0.98); }

            .badge-clean {
                display: none;
                font-size: 12px;
                background: #dcfce7;
                color: #166534;
                padding: 2px 8px;
                border-radius: 4px;
                margin-top: 5px;
            }
        </style>

        <div class="tool-box">
            <div class="bili-card">
                <div class="pink-title">
                    📺 VRChat Bilibili 播放链接生成器
                </div>
                
                <div class="input-group">
                    <div class="input-header">
                        <label class="label-text">输入 Bilibili 视频链接:</label>
                        <button id="btn-smart-read" class="smart-paste-btn">
                            ⚡ 读取剪贴板并生成
                        </button>
                    </div>
                    <input type="text" id="bili-input" class="bili-input" placeholder="支持粘贴 BV号、av号 或 完整链接" autofocus>
                    <div id="clean-msg" class="badge-clean">✨ 已自动剔除多余文字，提取纯净链接</div>
                </div>

                <div class="input-group">
                    <label class="label-text">生成的 VRChat 可用链接:</label>
                    <div id="result-url" class="result-box">等待输入...</div>
                </div>

                <button id="btn-copy" class="btn-copy">
                    📋 一键复制结果
                </button>
            </div>
            
            <div style="margin-top: 20px; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;">
                💡 提示：支持处理 B站 App 分享出来的“标题+链接”混合文本。<br>
                此工具使用 91vrchat 解析前缀，请确保遵循相关使用规范。
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('bili-input');
    const resultBox = document.getElementById('result-url');
    const copyBtn = document.getElementById('btn-copy');
    const smartReadBtn = document.getElementById('btn-smart-read');
    const cleanMsg = document.getElementById('clean-msg');

    // 固定前缀
    // const PREFIX = "https://biliplayer.91vrchat.com/player/?url=";
    const PREFIX = "https://api.xuan25.com/bili-resolve/ 在后面输入B站链接或BV号 ⇨          ";
    // 核心处理逻辑
    const processUrl = (rawText) => {
        if (!rawText) {
            resultBox.textContent = "等待输入...";
            resultBox.style.color = "#94a3b8";
            cleanMsg.style.display = 'none';
            return;
        }

        let cleanUrl = rawText.trim();
        let isCleaned = false;

        // 1. 智能清洗：如果包含中文或空格，尝试提取其中的 http 链接
        // 场景：复制了 "【视频标题】 https://www.bilibili.com/video/BVxxx?spm=..."
        const urlMatch = rawText.match(/https?:\/\/[a-zA-Z0-9\.\/\-\?=&_]+/);
        if (urlMatch) {
            if (cleanUrl !== urlMatch[0]) {
                cleanUrl = urlMatch[0];
                isCleaned = true;
            }
        }

        // 2. 参数净化：去除 B站分享自带的追踪参数 (spm_id_from, share_source 等)
        if (cleanUrl.includes('?')) {
            const [base, query] = cleanUrl.split('?');
            // 如果是 BV 或 av 链接，通常不需要参数，直接截断更安全
            if (base.includes('/video/BV') || base.includes('/video/av')) {
                cleanUrl = base;
                isCleaned = true;
            }
        }

        // 3. 补全：如果用户只输入了 BV 号
        if (cleanUrl.startsWith('BV') || cleanUrl.startsWith('av')) {
            cleanUrl = 'https://www.bilibili.com/video/' + cleanUrl;
        }

        // 更新 UI
        if (input.value !== rawText) {
            // 如果是剪贴板读取的，填充进输入框
            input.value = rawText;
        }

        // 显示清洗提示
        cleanMsg.style.display = isCleaned ? 'inline-block' : 'none';

        // 生成最终链接
        const finalUrl = PREFIX + cleanUrl;
        resultBox.textContent = finalUrl;
        resultBox.style.color = "#2563eb";
    };

    // 监听手动输入
    input.addEventListener('input', () => processUrl(input.value));

    // ⚡ 智能读取剪贴板
    smartReadBtn.onclick = async () => {
        try {
            // 读取剪贴板文本
            const text = await navigator.clipboard.readText();
            if (!text) {
                alert("剪贴板是空的");
                return;
            }

            // 填入并处理
            input.value = text;
            processUrl(text);

            // 给个小动画反馈
            smartReadBtn.innerHTML = "✅ 读取成功";
            setTimeout(() => {
                smartReadBtn.innerHTML = "⚡ 读取剪贴板并生成";
            }, 1500);

        } catch (err) {
            console.error(err);
            // 权限被拒绝或不支持
            alert("无法读取剪贴板。请检查浏览器权限，或手动粘贴。");
        }
    };

    // 复制功能
    copyBtn.onclick = () => {
        const text = resultBox.textContent;
        if (text === "等待输入...") {
            // 如果为空，尝试触发一次剪贴板读取（偷懒用户的福音）
            smartReadBtn.click();
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
