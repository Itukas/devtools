export function render() {
    return `
        <style>
            .zhuyin-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 15px;
                background: #fff;
            }

            .io-panel {
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex: 1;
            }

            .input-area {
                width: 100%;
                height: 100px;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                font-size: 16px;
                resize: none;
                font-family: inherit;
                line-height: 1.6;
            }
            .input-area:focus { outline: 2px solid #2563eb; border-color: transparent; }

            /* 输出区域布局 */
            .output-container {
                flex: 2;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 15px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                overflow-y: auto;
            }

            .output-row {
                margin-bottom: 10px;
            }
            .output-label {
                font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 5px;
                display: flex; justify-content: space-between;
            }

            .result-text {
                font-size: 18px;
                line-height: 1.8;
                font-family: "Microsoft JhengHei", "PingFang TC", sans-serif;
                white-space: pre-wrap;
                color: #334155;
                min-height: 1.8em; /* 防止空内容时高度塌陷 */
            }
            
            .keyboard-text {
                font-family: "Menlo", "Monaco", "Courier New", monospace;
                font-size: 16px;
                color: #059669; /* 绿色代表按键 */
                background: #ecfdf5;
                padding: 10px;
                border-radius: 4px;
                border: 1px dashed #10b981;
                white-space: pre-wrap;
                min-height: 2em;
            }

            .action-bar {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .btn {
                padding: 8px 16px;
                border-radius: 6px;
                border: 1px solid #cbd5e1;
                background: #fff;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #334155;
                transition: all 0.1s;
            }
            .btn:hover { background: #f1f5f9; }
            .btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
            .btn.primary:hover { background: #1d4ed8; }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        </style>

        <div class="tool-box zhuyin-container">
            <div class="io-panel" style="flex: 0 0 auto;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-weight:bold; color:#475569;">输入汉字 (实时转换):</span>
                </div>
                <textarea id="input-text" class="input-area" placeholder="在此输入汉字，例如：你好台灣"></textarea>
            </div>

            <div class="action-bar">
                <button id="btn-copy-zhuyin" class="btn">📋 复制注音</button>
                <button id="btn-copy-keys" class="btn">⌨️ 复制按键</button>
                <button id="btn-clear" class="btn" style="color:#ef4444;">🗑️ 清空</button>
                <div id="status-msg" style="margin-left:auto; font-size:12px; color:#64748b;">⏳ 加载组件中...</div>
            </div>

            <div class="output-container">
                <div class="output-row">
                    <div class="output-label">注音结果 (Bopomofo)</div>
                    <div id="output-box" class="result-text"></div>
                </div>
                <div class="output-row">
                    <div class="output-label">
                        <span>键盘指法 (Standard Layout)</span>
                        <span style="font-weight:normal; font-size:11px; opacity:0.8;">空格=一声, 6=二声, 3=三声, 4=四声, 7=轻声</span>
                    </div>
                    <div id="keyboard-box" class="keyboard-text"></div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const inputText = document.getElementById('input-text');
    const outputBox = document.getElementById('output-box');
    const keyboardBox = document.getElementById('keyboard-box');

    const btnCopyZhuyin = document.getElementById('btn-copy-zhuyin');
    const btnCopyKeys = document.getElementById('btn-copy-keys');
    const btnClear = document.getElementById('btn-clear');
    const statusMsg = document.getElementById('status-msg');

    let debounceTimer = null; // 防抖定时器

    // --- 1. 动态加载 pinyin-pro ---
    const loadLib = () => {
        return new Promise((resolve, reject) => {
            if (window.pinyinPro) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pinyin-pro/3.18.2/index.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error("库加载失败"));
            document.head.appendChild(script);
        });
    };

    loadLib().then(() => {
        statusMsg.textContent = "✅ 实时模式就绪";
        statusMsg.style.color = "#16a34a";
        // 如果加载完成时输入框里已经有字，立即转换一次
        if (inputText.value.trim()) doConvert();
    }).catch(() => {
        statusMsg.textContent = "❌ 组件加载失败";
        statusMsg.style.color = "#dc2626";
    });

    // --- 2. 映射表 (Bopomofo -> Key) ---
    const KEY_MAP = {
        'ㄅ': '1', 'ㄆ': 'q', 'ㄇ': 'a', 'ㄈ': 'z',
        'ㄉ': '2', 'ㄊ': 'w', 'ㄋ': 's', 'ㄌ': 'x',
        'ㄍ': 'e', 'ㄎ': 'd', 'ㄏ': 'c',
        'ㄐ': 'r', 'ㄑ': 'f', 'ㄒ': 'v',
        'ㄓ': '5', 'ㄔ': 't', 'ㄕ': 'g', 'ㄖ': 'b',
        'ㄗ': 'y', 'ㄘ': 'h', 'ㄙ': 'n',
        'ㄧ': 'u', 'ㄨ': 'j', 'ㄩ': 'm',
        'ㄚ': '8', 'ㄛ': 'i', 'ㄜ': 'k', 'ㄝ': ',',
        'ㄞ': '9', 'ㄟ': 'o', 'ㄠ': 'l', 'ㄡ': '.',
        'ㄢ': '0', 'ㄣ': 'p', 'ㄤ': ';', 'ㄥ': '/',
        'ㄦ': '-',
        'ˊ': '6', 'ˇ': '3', 'ˋ': '4', '˙': '7', ' ': ' '
    };

    const BPMF_MAP = {
        'b': 'ㄅ', 'p': 'ㄆ', 'm': 'ㄇ', 'f': 'ㄈ',
        'd': 'ㄉ', 't': 'ㄊ', 'n': 'ㄋ', 'l': 'ㄌ',
        'g': 'ㄍ', 'k': 'ㄎ', 'h': 'ㄏ',
        'j': 'ㄐ', 'q': 'ㄑ', 'x': 'ㄒ',
        'zh': 'ㄓ', 'ch': 'ㄔ', 'sh': 'ㄕ', 'r': 'ㄖ',
        'z': 'ㄗ', 'c': 'ㄘ', 's': 'ㄙ',
        'y': '', 'w': '',

        'a': 'ㄚ', 'o': 'ㄛ', 'e': 'ㄜ', 'er': 'ㄦ', 'ai': 'ㄞ',
        'ei': 'ㄟ', 'ao': 'ㄠ', 'ou': 'ㄡ', 'an': 'ㄢ', 'en': 'ㄣ',
        'ang': 'ㄤ', 'eng': 'ㄥ', 'ong': 'ㄨㄥ',
        'i': 'ㄧ', 'ia': 'ㄧㄚ', 'iao': 'ㄧㄠ', 'ie': 'ㄧㄝ', 'iu': 'ㄧㄡ',
        'ian': 'ㄧㄢ', 'in': 'ㄧㄣ', 'iang': 'ㄧㄤ', 'ing': 'ㄧㄥ', 'iong': 'ㄩㄥ',
        'u': 'ㄨ', 'ua': 'ㄨㄚ', 'uo': 'ㄨㄛ', 'uai': 'ㄨㄞ', 'ui': 'ㄨㄟ',
         'un': 'ㄨㄣ', 'uang': 'ㄨㄤ', 'ueng': 'ㄨㄥ',
        'v': 'ㄩ', 'ue': 'ㄩㄝ', 've': 'ㄩㄝ', 'uan': 'ㄩㄢ', 'van': 'ㄩㄢ', 'vn': 'ㄩㄣ',
        'ju': 'ㄐㄩ', 'qu': 'ㄑㄩ', 'xu': 'ㄒㄩ',
        'jue': 'ㄐㄩㄝ', 'que': 'ㄑㄩㄝ', 'xue': 'ㄒㄩㄝ', 'yue': 'ㄩㄝ',
        'juan': 'ㄐㄩㄢ', 'quan': 'ㄑㄩㄢ', 'xuan': 'ㄒㄩㄢ', 'yuan': 'ㄩㄢ',
        'jun': 'ㄐㄩㄣ', 'qun': 'ㄑㄩㄣ', 'xun': 'ㄒㄩㄣ', 'yun': 'ㄩㄣ',

        'yi': 'ㄧ', 'wu': 'ㄨ', 'yu': 'ㄩ',
        'zi': 'ㄗ', 'ci': 'ㄘ', 'si': 'ㄙ',
        'zhi': 'ㄓ', 'chi': 'ㄔ', 'shi': 'ㄕ', 'ri': 'ㄖ',
        'ye': 'ㄧㄝ', 'yin': 'ㄧㄣ', 'ying': 'ㄧㄥ',
        'yan': 'ㄧㄢ', 'yang': 'ㄧㄤ', 'wa': 'ㄨㄚ', 'wo': 'ㄨㄛ', 'wai': 'ㄨㄞ',
        'wei': 'ㄨㄟ', 'wan': 'ㄨㄢ', 'wen': 'ㄨㄣ', 'wang': 'ㄨㄤ', 'weng': 'ㄨㄥ',
        'yo': 'ㄧㄛ'
    };

    const TONE_MAP = { '1': ' ', '2': 'ˊ', '3': 'ˇ', '4': 'ˋ', '0': '˙', '5': '˙' };

    // --- 3. 转换核心逻辑 ---
    const processText = (text) => {
        if (!window.pinyinPro) return { zhuyin: "组件未加载", keys: "" };
        const { pinyin } = window.pinyinPro;

        // 获取拼音数组
        const pinyinArr = pinyin(text, { toneType: 'num', type: 'array', nonZh: 'consecutive' });

        let resultZhuyin = [];
        let resultKeys = [];

        pinyinArr.forEach(py => {
            // 处理非中文
            if (!/^[a-z]+[0-5]?$/i.test(py)) {
                resultZhuyin.push(py);
                resultKeys.push(py);
                return;
            }

            let tone = '1';
            if (/[0-5]$/.test(py)) {
                tone = py.slice(-1);
                py = py.slice(0, -1);
            }
            py = py.replace('ü', 'v');

            let charZhuyin = '';

            if (BPMF_MAP[py]) {
                charZhuyin = BPMF_MAP[py];
            } else {
                const initials = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
                let initial = '';
                let final = py;

                for (let ini of initials) {
                    if (py.startsWith(ini)) {
                        initial = ini;
                        final = py.slice(ini.length);
                        break;
                    }
                }

                if (['j','q','x'].includes(initial) && final.startsWith('u')) final = 'v' + final.slice(1);

                let zInitial = BPMF_MAP[initial] || '';
                let zFinal = BPMF_MAP[final] || '';

                if (initial === 'y') { zInitial = ''; if(!final.startsWith('i')) zFinal = BPMF_MAP['i'+final] || zFinal; }
                if (initial === 'w') { zInitial = ''; if(!final.startsWith('u')) zFinal = BPMF_MAP['u'+final] || zFinal; }

                charZhuyin = zInitial + zFinal;
            }

            // 生成键盘序列
            let keySeq = '';
            for (let char of charZhuyin) {
                if (KEY_MAP[char]) keySeq += KEY_MAP[char];
            }

            // 声调键
            if (tone === '1') keySeq += '␣';
            else if (tone === '2') keySeq += '6';
            else if (tone === '3') keySeq += '3';
            else if (tone === '4') keySeq += '4';
            else if (tone === '0' || tone === '5') keySeq += '7';

            // 显示注音
            let displayZhuyin = charZhuyin;
            const toneChar = TONE_MAP[tone];
            if (tone === '0' || tone === '5') displayZhuyin = toneChar + displayZhuyin;
            else if (tone !== '1') displayZhuyin += toneChar;

            resultZhuyin.push(displayZhuyin);
            resultKeys.push(keySeq);
        });

        return {
            zhuyin: resultZhuyin.join(' '),
            keys: resultKeys.join(' ')
        };
    };

    // --- 4. 实时执行逻辑 ---
    const doConvert = () => {
        const text = inputText.value; // 这里不去 trim，保留空格让用户输入更自然
        if (!text) {
            outputBox.textContent = '';
            keyboardBox.textContent = '';
            return;
        }
        const res = processText(text);
        outputBox.textContent = res.zhuyin;
        keyboardBox.textContent = res.keys;
    };

    // --- 5. 事件绑定 ---

    // 监听输入：使用防抖 (300ms)，避免打字过快时频繁计算造成卡顿
    inputText.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            doConvert();
        }, 100); // 100ms 延迟，感觉基本是实时的
    });

    // 复制功能
    const copyToClip = (text, btn) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const old = btn.textContent;
            btn.textContent = "✅ 已复制";
            setTimeout(() => btn.textContent = old, 1000);
        });
    };

    btnCopyZhuyin.onclick = () => copyToClip(outputBox.textContent, btnCopyZhuyin);
    btnCopyKeys.onclick = () => copyToClip(keyboardBox.textContent, btnCopyKeys);

    btnClear.onclick = () => {
        inputText.value = '';
        outputBox.textContent = '';
        keyboardBox.textContent = '';
        inputText.focus();
    };
}