import {Base64} from 'https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.mjs';

export function render() {
    return `
        <style>
            .b64-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            
            .io-box {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #fff;
                overflow: hidden;
                transition: border-color 0.2s;
            }
            .io-box:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
            
            .box-header {
                padding: 8px 15px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                font-size: 13px;
                font-weight: 600;
                color: #64748b;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .text-area {
                flex: 1;
                border: none;
                padding: 15px;
                resize: none;
                outline: none;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6;
                color: #334155;
            }

            /* 中间控制栏 */
            .controls {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                padding: 0 10px;
            }

            .action-btn {
                display: flex; align-items: center; gap: 6px;
                padding: 8px 20px;
                border: none; border-radius: 20px;
                cursor: pointer; font-size: 13px; font-weight: 600; color: #fff;
                transition: transform 0.1s, opacity 0.2s;
            }
            .action-btn:active { transform: scale(0.96); }
            .btn-encode { background: #3b82f6; }
            .btn-encode:hover { background: #2563eb; }
            .btn-decode { background: #10b981; }
            .btn-decode:hover { background: #059669; }

            .options-row { display: flex; gap: 15px; align-items: center; font-size: 12px; color: #64748b; }
            .copy-btn { cursor: pointer; color: #3b82f6; font-weight: normal; }
            .copy-btn:hover { text-decoration: underline; }

            /* 错误提示动画 */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                20%, 40%, 60%, 80% { transform: translateX(4px); }
            }
            .error-shake { animation: shake 0.4s; border-color: #ef4444 !important; }
        </style>

        <div class="tool-box b64-container">
            
            <div class="io-box" id="box-plain">
                <div class="box-header">
                    <span>📄 明文 (Plain Text)</span>
                    <div class="options-row">
                        <span id="len-plain">0 chars</span>
                        <span class="copy-btn" data-target="plain">复制</span>
                        <span class="copy-btn" style="color:#ef4444;" id="btn-clear">清空</span>
                    </div>
                </div>
                <textarea id="input-plain" class="text-area" placeholder="在此输入要加密的内容..."></textarea>
            </div>

            <div class="controls">
                <button id="btn-enc" class="action-btn btn-encode">
                    ⬇️ Base64 编码
                </button>
                
                <div class="options-row">
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;">
                        <input type="checkbox" id="chk-urlsafe"> URL Safe Mode
                    </label>
                </div>

                <button id="btn-dec" class="action-btn btn-decode">
                    ⬆️ Base64 解码
                </button>
            </div>

            <div class="io-box" id="box-base64">
                <div class="box-header">
                    <span>🔒 密文 (Base64)</span>
                    <div class="options-row">
                        <span id="len-base64">0 chars</span>
                        <span class="copy-btn" data-target="base64">复制</span>
                    </div>
                </div>
                <textarea id="input-base64" class="text-area" placeholder="在此输入 Base64 字符串..."></textarea>
            </div>
        </div>
    `;
}

export function init() {
    const plainInput = document.getElementById('input-plain');
    const base64Input = document.getElementById('input-base64');
    const btnEnc = document.getElementById('btn-enc');
    const btnDec = document.getElementById('btn-dec');
    const btnClear = document.getElementById('btn-clear');
    const chkUrlSafe = document.getElementById('chk-urlsafe');

    const boxPlain = document.getElementById('box-plain');
    const boxBase64 = document.getElementById('box-base64');
    const lenPlain = document.getElementById('len-plain');
    const lenBase64 = document.getElementById('len-base64');
    const copyBtns = document.querySelectorAll('.copy-btn');

    // 辅助：更新长度显示
    const updateLens = () => {
        lenPlain.textContent = `${plainInput.value.length} chars`;
        lenBase64.textContent = `${base64Input.value.length} chars`;
    };

    // 核心：编码
    const doEncode = () => {
        const val = plainInput.value;
        if (!val) return;

        try {
            // 支持中文 UTF-8
            let res = Base64.encode(val);

            // URL Safe 处理 (+ -> -, / -> _)
            if (chkUrlSafe.checked) {
                res = res.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }

            base64Input.value = res;
            updateLens();

            // 视觉反馈
            boxBase64.style.borderColor = "#10b981";
            setTimeout(() => boxBase64.style.borderColor = "", 300);
        } catch (e) {
            console.error(e);
        }
    };

    // 核心：解码
    const doDecode = () => {
        let val = base64Input.value.trim();
        if (!val) return;

        try {
            // URL Safe 兼容还原 (- -> +, _ -> /)
            // 其实 js-base64 库通常能自动处理，但为了保险手动还原标准格式
            if (val.includes('-') || val.includes('_')) {
                val = val.replace(/-/g, '+').replace(/_/g, '/');
                // 补全 padding =
                while (val.length % 4) {
                    val += '=';
                }
            }

            const res = Base64.decode(val);
            plainInput.value = res;
            updateLens();

            // 视觉反馈
            boxPlain.style.borderColor = "#3b82f6";
            setTimeout(() => boxPlain.style.borderColor = "", 300);

            // 移除错误样式
            boxBase64.classList.remove('error-shake');
        } catch (e) {
            // 错误反馈
            boxBase64.classList.add('error-shake');
            setTimeout(() => boxBase64.classList.remove('error-shake'), 400);
        }
    };

    // --- 事件绑定 ---

    // 按钮点击
    btnEnc.onclick = doEncode;
    btnDec.onclick = doDecode;

    // 快捷键支持 (Ctrl+Enter)
    plainInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') doEncode();
    });
    base64Input.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') doDecode();
    });

    // 实时监听长度
    plainInput.addEventListener('input', updateLens);
    base64Input.addEventListener('input', updateLens);

    // URL Safe 切换时自动重新编码
    chkUrlSafe.onchange = () => {
        if (plainInput.value) doEncode();
    };

    // 清空
    btnClear.onclick = () => {
        plainInput.value = '';
        base64Input.value = '';
        updateLens();
    };

    // 复制功能
    copyBtns.forEach(btn => {
        if (btn.id === 'btn-clear') return; // 跳过清空按钮
        btn.onclick = () => {
            const targetId = btn.dataset.target === 'plain' ? 'input-plain' : 'input-base64';
            const el = document.getElementById(targetId);
            if (!el.value) return;

            navigator.clipboard.writeText(el.value).then(() => {
                const oldText = btn.textContent;
                btn.textContent = '✅';
                setTimeout(() => btn.textContent = oldText, 1000);
            });
        };
    });
}