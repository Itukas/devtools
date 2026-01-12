// js/tools/morse.js

// 摩斯电码字典 (国际标准)
const MORSE_CODE_DICT = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/' // 空格特殊处理
};

// 反向字典
const REVERSE_DICT = Object.fromEntries(
    Object.entries(MORSE_CODE_DICT).map(([k, v]) => [v, k])
);

// 生成对照表 HTML 的辅助函数
function generateTableHtml() {
    let html = '';
    for (const [char, code] of Object.entries(MORSE_CODE_DICT)) {
        // 让空格显示得更直观一点
        const displayChar = char === ' ' ? '<span style="font-size:11px; opacity:0.7">(Space)</span>' : char;
        html += `
            <div class="dict-row" onclick="navigator.clipboard.writeText('${code}')" title="点击复制: ${code}">
                <span class="dict-char">${displayChar}</span>
                <span class="dict-code">${code}</span>
            </div>
        `;
    }
    return html;
}

export function render() {
    return `
        <style>
            .morse-layout {
                display: flex;
                height: 100%;
                gap: 20px;
                overflow: hidden;
            }
            
            /* 左侧转换区 */
            .converter-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 15px;
                min-width: 0; /* 防止 flex 子项溢出 */
            }

            /* 右侧对照表区 */
            .table-section {
                width: 240px;
                display: flex;
                flex-direction: column;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #fff;
                flex-shrink: 0;
            }

            /* 通用盒子样式 */
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
                flex-shrink: 0;
            }
            
            .text-area {
                flex: 1;
                border: none;
                padding: 15px;
                resize: none;
                outline: none;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 14px;
                line-height: 1.6;
                color: #334155;
            }

            .controls {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                flex-shrink: 0;
            }

            .action-btn {
                display: flex; align-items: center; gap: 6px;
                padding: 6px 16px;
                border: none; border-radius: 18px;
                cursor: pointer; font-size: 12px; font-weight: 600; color: #fff;
                transition: transform 0.1s;
            }
            .action-btn:active { transform: scale(0.96); }
            .btn-encode { background: #3b82f6; }
            .btn-decode { background: #10b981; }

            .options-row { display: flex; gap: 10px; align-items: center; font-size: 12px; color: #64748b; }
            .copy-btn { cursor: pointer; color: #3b82f6; font-weight: normal; }
            .copy-btn:hover { text-decoration: underline; }

            /* 对照表特定样式 */
            .dict-content {
                flex: 1;
                overflow-y: auto;
                padding: 5px 0;
            }
            .dict-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 15px;
                border-bottom: 1px dashed #f1f5f9;
                cursor: pointer;
                transition: background 0.1s;
            }
            .dict-row:last-child { border-bottom: none; }
            .dict-row:hover { background: #f1f5f9; }
            .dict-char { font-weight: bold; color: #334155; font-family: monospace; }
            .dict-code { color: #3b82f6; font-family: monospace; font-weight: 600; }

            /* 响应式：屏幕窄时变上下堆叠 */
            @media (max-width: 768px) {
                .morse-layout { flex-direction: column; overflow-y: auto; }
                .table-section { width: 100%; height: 200px; }
            }
        </style>

        <div class="morse-layout">
            
            <div class="converter-section">
                <div class="io-box" id="box-text">
                    <div class="box-header">
                        <span>📝 文本 (Text)</span>
                        <div class="options-row">
                            <span class="copy-btn" id="btn-clear" style="color:#ef4444;">清空</span>
                        </div>
                    </div>
                    <textarea id="input-text" class="text-area" placeholder="输入英文或数字..."></textarea>
                </div>

                <div class="controls">
                    <button id="btn-enc" class="action-btn btn-encode">⬇️ 编码</button>
                    <span style="font-size:12px; color:#cbd5e1;">|</span>
                    <button id="btn-dec" class="action-btn btn-decode">⬆️ 解码</button>
                </div>

                <div class="io-box" id="box-morse">
                    <div class="box-header">
                        <span>📻 摩斯电码</span>
                        <div class="options-row">
                            <span class="copy-btn" id="btn-copy-morse">复制</span>
                        </div>
                    </div>
                    <textarea id="input-morse" class="text-area" placeholder="输入摩斯码..."></textarea>
                </div>
            </div>

            <div class="table-section">
                <div class="box-header" style="background: #f1f5f9;">
                    <span>📖 对照表</span>
                    <span style="font-size:11px; font-weight:normal; color:#94a3b8;">点击复制</span>
                </div>
                <div class="dict-content custom-scrollbar">
                    ${generateTableHtml()}
                </div>
            </div>

        </div>
    `;
}

export function init() {
    const inputText = document.getElementById('input-text');
    const inputMorse = document.getElementById('input-morse');
    const btnEnc = document.getElementById('btn-enc');
    const btnDec = document.getElementById('btn-dec');
    const btnClear = document.getElementById('btn-clear');
    const btnCopyMorse = document.getElementById('btn-copy-morse');
    const boxMorse = document.getElementById('box-morse');
    const boxText = document.getElementById('box-text');

    // 核心逻辑：Text -> Morse
    const doEncode = () => {
        const text = inputText.value.toUpperCase();
        if (!text) {
            inputMorse.value = '';
            boxMorse.style.borderColor = "";
            return;
        }

        let res = '';
        for (let char of text) {
            if (MORSE_CODE_DICT[char]) {
                res += MORSE_CODE_DICT[char] + ' ';
            } else if (char === '\n') {
                res += '\n';
            } else {
                res += char + ' ';
            }
        }
        inputMorse.value = res.trim();
    };

    // 核心逻辑：Morse -> Text
    const doDecode = () => {
        const morse = inputMorse.value.trim();
        if (!morse) {
            inputText.value = '';
            boxText.style.borderColor = "";
            return;
        }

        const lines = morse.split('\n');
        let result = [];

        lines.forEach(line => {
            const codes = line.trim().split(/\s+/);
            let lineDecoded = '';
            codes.forEach(code => {
                if (REVERSE_DICT[code]) {
                    lineDecoded += REVERSE_DICT[code];
                } else if (code === '/') {
                    lineDecoded += ' ';
                } else {
                    lineDecoded += '?';
                }
            });
            result.push(lineDecoded);
        });

        inputText.value = result.join('\n');
    };

    // --- 事件绑定 ---

    // 按钮点击
    btnEnc.onclick = doEncode;
    btnDec.onclick = doDecode;

    // 实时输入
    inputText.addEventListener('input', doEncode);
    inputMorse.addEventListener('input', doDecode);

    // 清空
    btnClear.onclick = () => {
        inputText.value = '';
        inputMorse.value = '';
        boxText.style.borderColor = "";
        boxMorse.style.borderColor = "";
    };

    // 复制
    btnCopyMorse.onclick = () => {
        if (!inputMorse.value) return;
        navigator.clipboard.writeText(inputMorse.value).then(() => {
            const originalText = btnCopyMorse.textContent;
            btnCopyMorse.textContent = '✅';
            setTimeout(() => btnCopyMorse.textContent = originalText, 1000);
        });
    };
}