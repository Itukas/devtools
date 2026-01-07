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
                height: 120px;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                font-size: 16px;
                resize: none;
                font-family: inherit;
                line-height: 1.6;
            }
            .input-area:focus { outline: 2px solid #2563eb; border-color: transparent; }

            .output-area {
                flex: 1;
                padding: 15px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 18px;
                line-height: 2;
                overflow-y: auto;
                font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; /* 优化注音显示字体 */
                position: relative;
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

            /* 竖排注音模式 (可选，这里先做横排) */
            ruby { font-family: "Bopomofo", "Microsoft JhengHei"; }
            rt { font-size: 0.8em; color: #64748b; }
            
            .zhuyin-char {
                display: inline-block;
                margin-right: 5px;
            }
        </style>

        <div class="tool-box zhuyin-container">
            <div class="io-panel">
                <div style="font-weight:bold; color:#475569;">输入汉字 (繁体/简体):</div>
                <textarea id="input-text" class="input-area" placeholder="在此输入汉字，例如：你好台灣"></textarea>
            </div>

            <div class="action-bar">
                <button id="btn-convert" class="btn primary" disabled>🚀 转换为注音</button>
                <button id="btn-copy" class="btn">📋 复制结果</button>
                <button id="btn-clear" class="btn">🗑️ 清空</button>
                <div id="status-msg" style="margin-left:auto; font-size:12px; color:#64748b;">⏳ 正在加载拼音组件...</div>
            </div>

            <div class="io-panel" style="flex: 2;">
                <div style="font-weight:bold; color:#475569;">注音结果 (Bopomofo):</div>
                <div id="output-box" class="output-area"></div>
            </div>
        </div>
    `;
}

export function init() {
    const inputText = document.getElementById('input-text');
    const outputBox = document.getElementById('output-box');
    const btnConvert = document.getElementById('btn-convert');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const statusMsg = document.getElementById('status-msg');

    // --- 1. 动态加载 pinyin-pro 库 ---
    const loadLib = () => {
        return new Promise((resolve, reject) => {
            if (window.pinyinPro) { resolve(); return; }
            const script = document.createElement('script');
            // 使用 unpkg 加载最新版 pinyin-pro
            script.src = 'https://unpkg.com/pinyin-pro';
            script.onload = resolve;
            script.onerror = () => reject(new Error("库加载失败"));
            document.head.appendChild(script);
        });
    };

    loadLib().then(() => {
        statusMsg.textContent = "✅ 组件就绪";
        statusMsg.style.color = "#16a34a";
        btnConvert.disabled = false;
    }).catch(() => {
        statusMsg.textContent = "❌ 组件加载失败，请检查网络";
        statusMsg.style.color = "#dc2626";
    });

    // --- 2. 核心：拼音 -> 注音 映射表 ---
    // 这是一个简化但覆盖全面的映射，处理声母(Initials)和韵母(Finals)
    const BPMF_MAP = {
        // 声母
        'b': 'ㄅ', 'p': 'ㄆ', 'm': 'ㄇ', 'f': 'ㄈ',
        'd': 'ㄉ', 't': 'ㄊ', 'n': 'ㄋ', 'l': 'ㄌ',
        'g': 'ㄍ', 'k': 'ㄎ', 'h': 'ㄏ',
        'j': 'ㄐ', 'q': 'ㄑ', 'x': 'ㄒ',
        'zh': 'ㄓ', 'ch': 'ㄔ', 'sh': 'ㄕ', 'r': 'ㄖ',
        'z': 'ㄗ', 'c': 'ㄘ', 's': 'ㄙ',
        'y': '', 'w': '', // 特殊处理

        // 韵母 & 结合韵
        'a': 'ㄚ', 'o': 'ㄛ', 'e': 'ㄜ', 'er': 'ㄦ', 'ai': 'ㄞ',
        'ei': 'ㄟ', 'ao': 'ㄠ', 'ou': 'ㄡ', 'an': 'ㄢ', 'en': 'ㄣ',
        'ang': 'ㄤ', 'eng': 'ㄥ', 'ong': 'ㄨㄥ',
        'i': 'ㄧ', 'ia': 'ㄧㄚ', 'iao': 'ㄧㄠ', 'ie': 'ㄧㄝ', 'iu': 'ㄧㄡ',
        'ian': 'ㄧㄢ', 'in': 'ㄧㄣ', 'iang': 'ㄧㄤ', 'ing': 'ㄧㄥ', 'iong': 'ㄩㄥ',
        'u': 'ㄨ', 'ua': 'ㄨㄚ', 'uo': 'ㄨㄛ', 'uai': 'ㄨㄞ', 'ui': 'ㄨㄟ',
        'uan': 'ㄨㄢ', 'un': 'ㄨㄣ', 'uang': 'ㄨㄤ', 'ueng': 'ㄨㄥ',
        'v': 'ㄩ', 'ue': 'ㄩㄝ', 've': 'ㄩㄝ',
        'yun': 'ㄩㄣ', // v = ü
        'ju': 'ㄐㄩ', 'qu': 'ㄑㄩ', 'xu': 'ㄒㄩ',
        'yu': 'ㄩ', // j,q,x,y 后的 u 读 ü
        'jue': 'ㄐㄩㄝ', 'que': 'ㄑㄩㄝ', 'xue': 'ㄒㄩㄝ', 'yue': 'ㄩㄝ',
        'juan': 'ㄐㄩㄢ', 'quan': 'ㄑㄩㄢ', 'xuan': 'ㄒㄩㄢ', 'yuan': 'ㄩㄢ',
        'jun': 'ㄐㄩㄣ', 'qun': 'ㄑㄩㄣ', 'xun': 'ㄒㄩㄣ',

        // 特殊单音
        'yi': 'ㄧ', 'wu': 'ㄨ',
        'zi': 'ㄗ', 'ci': 'ㄘ', 'si': 'ㄙ',
        'zhi': 'ㄓ', 'chi': 'ㄔ', 'shi': 'ㄕ', 'ri': 'ㄖ',
        'ye': 'ㄧㄝ', 'yin': 'ㄧㄣ', 'ying': 'ㄧㄥ',
        'yan': 'ㄧㄢ', 'yang': 'ㄧㄤ', 'wa': 'ㄨㄚ', 'wo': 'ㄨㄛ', 'wai': 'ㄨㄞ',
        'wei': 'ㄨㄟ', 'wan': 'ㄨㄢ', 'wen': 'ㄨㄣ', 'wang': 'ㄨㄤ', 'weng': 'ㄨㄥ',
        'yo': 'ㄧㄛ'
    };

    const TONE_MAP = {
        '1': '',    // 一声（阴平）：不标
        '2': 'ˊ',   // 二声（阳平）
        '3': 'ˇ',   // 三声（上声）
        '4': 'ˋ',   // 四声（去声）
        '0': '˙',   // 轻声：点
        '5': '˙'    // 轻声通用
    };

    // --- 3. 转换逻辑 ---
    const convertToZhuyin = (text) => {
        if (!window.pinyinPro) return "组件未加载";
        const { pinyin } = window.pinyinPro;

        // 1. 获取拼音数组，带音调数字 (e.g., "ni3", "hao3")
        const pinyinArr = pinyin(text, {
            toneType: 'num',
            type: 'array',
            nonZh: 'consecutive' // 非中文保留原样
        });

        return pinyinArr.map(py => {
            // 如果不是拼音（是标点或英文），直接返回
            if (!/^[a-z]+[0-5]?$/i.test(py)) return py;

            // 提取音调
            let tone = '1'; // 默认为一声
            if (/[0-5]$/.test(py)) {
                tone = py.slice(-1);
                py = py.slice(0, -1);
            }

            // 处理特殊拼写 (ü -> v)
            py = py.replace('ü', 'v');

            // --- 核心映射逻辑 ---
            let zhuyin = '';

            // 1. 尝试全匹配 (处理 yi, wu, yu, zi, ci, si 等整体认读)
            if (BPMF_MAP[py]) {
                zhuyin = BPMF_MAP[py];
            } else {
                // 2. 声韵母拆解
                // 常见声母列表 (按长度排序，避免 zh 匹配成 z)
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

                // 修正 j,q,x 后的 u -> v
                if (['j','q','x'].includes(initial) && final.startsWith('u')) {
                    final = 'v' + final.slice(1);
                }

                // 映射
                let zInitial = BPMF_MAP[initial] || '';
                let zFinal = BPMF_MAP[final] || '';

                // y, w 开头的特殊韵母处理 (y不发音，仅代表i; w代表u)
                if (initial === 'y') { zInitial = ''; if(!final.startsWith('i')) zFinal = BPMF_MAP['i'+final] || zFinal; }
                if (initial === 'w') { zInitial = ''; if(!final.startsWith('u')) zFinal = BPMF_MAP['u'+final] || zFinal; }

                zhuyin = zInitial + zFinal;
            }

            // 加上声调
            const toneChar = TONE_MAP[tone] || '';

            // 轻声 '˙' 通常在最前面(直排)或前面，但电脑输入法常在后面。
            // 台湾教育部标准：轻声在字前，其他声调在字后。
            // 这里为了显示方便，我们统一放在后面，除了轻声。
            if (tone === '0' || tone === '5') {
                return toneChar + zhuyin;
            } else {
                return zhuyin + toneChar;
            }

        }).join(' ');
    };

    // --- 事件绑定 ---
    btnConvert.onclick = () => {
        const text = inputText.value.trim();
        if (!text) return;
        const res = convertToZhuyin(text);
        outputBox.textContent = res;
    };

    btnCopy.onclick = () => {
        if (!outputBox.textContent) return;
        navigator.clipboard.writeText(outputBox.textContent).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = "✅ 已复制";
            setTimeout(() => btnCopy.textContent = "📋 复制结果", 1000);
        });
    };

    btnClear.onclick = () => {
        inputText.value = '';
        outputBox.textContent = '';
        inputText.focus();
    };

    // 支持回车转换
    inputText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') btnConvert.click();
    });
}