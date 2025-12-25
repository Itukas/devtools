export function render() {
    return `
        <style>
            .tool-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .tool-title {
                font-size: 1.1rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .big-display {
                font-size: 2rem;
                font-family: 'Menlo', monospace;
                font-weight: bold;
                color: #2563eb;
                text-align: center;
                padding: 10px;
                background: #f0f9ff;
                border-radius: 8px;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .row-group {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
                margin-bottom: 15px;
            }
            .label-text {
                width: 100px; 
                font-weight: 500; 
                color: #555;
                font-size: 0.95rem;
            }
            
            /* 日期组件样式 */
            .date-input-group {
                display: flex;
                gap: 2px;
                align-items: center;
                background: #f9fafb;
                padding: 6px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
            }
            .date-field {
                border: 1px solid transparent;
                background: transparent;
                text-align: center;
                font-family: 'Menlo', monospace;
                font-size: 1rem;
                padding: 4px 2px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .date-field:focus {
                background: #fff;
                border-color: #3b82f6;
                outline: none;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
            }
            .w-year { width: 55px; }
            .w-num { width: 32px; }
            .separator { color: #9ca3af; font-weight: bold; margin: 0 2px; }
            
            /* 通用输入框 */
            .input-long {
                flex: 1;
                padding: 10px;
                font-size: 1rem;
                font-family: 'Menlo', monospace;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                transition: border-color 0.2s;
            }
            .input-long:focus {
                border-color: #3b82f6;
                outline: none;
            }

            /* 结果展示区 */
            .result-container {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px dashed #e5e7eb;
                background-color: #fafafa;
                border-radius: 6px;
                padding: 15px;
            }
            .result-row {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            .result-row:last-child { margin-bottom: 0; }
            .result-box {
                flex: 1;
                background: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: 'Menlo', monospace;
                color: #374151;
                border: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-height: 24px;
            }
            .copy-btn {
                font-size: 12px;
                padding: 4px 10px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                color: #374151;
                cursor: pointer;
                transition: background 0.2s;
            }
            .copy-btn:hover { background: #e5e7eb; }

            .btn-action {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 0.9rem;
            }
        </style>

        <div class="tool-card">
            <div class="tool-title">⏰ 当前时间 (Current)</div>
            <div class="big-display" id="clock-display">Loading...</div>
            <div style="text-align: center;">
                <button id="btn-pause" class="btn-action" style="background: #6b7280;">暂停</button>
                <button id="btn-copy-now" class="btn-action" style="background: #2563eb;">复制时间戳</button>
            </div>
        </div>

        <div class="tool-card">
            <div class="tool-title">🛠️ 全能转换 (Converter)</div>
            
            <div class="row-group">
                <span class="label-text">日期组件:</span>
                <div class="date-input-group">
                    <input type="text" id="in-y" class="date-field w-year" placeholder="YYYY" maxlength="4">
                    <span class="separator">-</span>
                    <input type="text" id="in-m" class="date-field w-num" placeholder="MM" maxlength="2">
                    <span class="separator">-</span>
                    <input type="text" id="in-d" class="date-field w-num" placeholder="DD" maxlength="2">
                    <span class="separator" style="color: #e5e7eb;">|</span>
                    <input type="text" id="in-h" class="date-field w-num" placeholder="HH" maxlength="2">
                    <span class="separator">:</span>
                    <input type="text" id="in-min" class="date-field w-num" placeholder="mm" maxlength="2">
                    <span class="separator">:</span>
                    <input type="text" id="in-s" class="date-field w-num" placeholder="ss" maxlength="2">
                </div>
                <button id="btn-fill-now" class="btn-action" style="background: #8b5cf6; padding: 6px 12px; font-size: 0.85rem;">填入当前</button>
                <button id="btn-clear" class="btn-action" style="background: #ef4444; padding: 6px 12px; font-size: 0.85rem;">清空</button>
            </div>

            <div class="row-group">
                <span class="label-text">日期字符串:</span>
                <input type="text" id="in-string" class="input-long" placeholder="例如: 2024-12-25 12:00:00 (支持粘贴)">
            </div>

            <div class="row-group">
                <span class="label-text">时间戳:</span>
                <input type="text" id="ts-input" class="input-long" placeholder="输入 13位(毫秒) 或 10位(秒)">
            </div>

            <div class="result-container">
                <div style="margin-bottom: 12px; font-weight: bold; color: #374151; font-size: 0.9rem;">转换结果 (Results)</div>
                
                <div class="result-row">
                    <span class="label-text">毫秒 (13位):</span>
                    <div class="result-box">
                        <span id="res-ms" style="color: #2563eb; font-weight: bold;">-</span>
                        <button class="copy-btn" data-target="res-ms">复制</button>
                    </div>
                </div>

                <div class="result-row">
                    <span class="label-text">秒 (10位):</span>
                    <div class="result-box">
                        <span id="res-s" style="color: #059669; font-weight: bold;">-</span>
                        <button class="copy-btn" data-target="res-s">复制</button>
                    </div>
                </div>
                
                <div class="result-row">
                    <span class="label-text">本地时间:</span>
                    <div class="result-box">
                        <span id="res-local">-</span>
                        <button class="copy-btn" data-target="res-local">复制</button>
                    </div>
                </div>

                <div class="result-row">
                    <span class="label-text">UTC/GMT:</span>
                    <div class="result-box">
                        <span id="res-utc" style="color: #6b7280;">-</span>
                        <button class="copy-btn" data-target="res-utc">复制</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    let timer = null;
    let isPaused = false;

    // --- 1. 时钟模块 ---
    const updateClock = () => {
        if (isPaused) return;
        const now = new Date();
        document.getElementById('clock-display').textContent = Math.floor(now.getTime() / 1000);
    };
    timer = setInterval(updateClock, 1000);
    updateClock();

    document.getElementById('btn-pause').onclick = function() {
        isPaused = !isPaused;
        this.textContent = isPaused ? "继续" : "暂停";
        this.style.background = isPaused ? "#10b981" : "#6b7280";
    };

    document.getElementById('btn-copy-now').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('clock-display').textContent);
    };

    // --- 2. 核心逻辑 ---

    const inputs = {
        y: document.getElementById('in-y'),
        m: document.getElementById('in-m'),
        d: document.getElementById('in-d'),
        h: document.getElementById('in-h'),
        min: document.getElementById('in-min'),
        s: document.getElementById('in-s'),
        str: document.getElementById('in-string'), // 新增
        ts: document.getElementById('ts-input')
    };

    const outputs = {
        ms: document.getElementById('res-ms'),
        s: document.getElementById('res-s'),
        local: document.getElementById('res-local'),
        utc: document.getElementById('res-utc')
    };

    // 格式化日期辅助函数
    const formatDate = (date, isUtc = false) => {
        const pad = (n) => n.toString().padStart(2, '0');
        if (isUtc) {
            return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
        }
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // 核心渲染函数：根据 timestamp 更新所有 UI
    // source: 触发源 ('parts', 'str', 'ts', 'manual')，防止循环更新
    const updateUI = (ts, source) => {
        if (!ts) {
            if (source !== 'parts') clearInputs(['parts']);
            if (source !== 'str') inputs.str.value = '';
            if (source !== 'ts') inputs.ts.value = '';

            outputs.ms.textContent = '-';
            outputs.s.textContent = '-';
            outputs.local.textContent = '-';
            outputs.utc.textContent = '-';
            return;
        }

        const date = new Date(ts);
        if (isNaN(date.getTime())) return; // 无效日期

        // 1. 更新日期组件 (6个框)
        if (source !== 'parts') {
            inputs.y.value = date.getFullYear();
            inputs.m.value = date.getMonth() + 1;
            inputs.d.value = date.getDate();
            inputs.h.value = date.getHours();
            inputs.min.value = date.getMinutes();
            inputs.s.value = date.getSeconds();
        }

        // 2. 更新日期字符串框
        if (source !== 'str') {
            inputs.str.value = formatDate(date, false);
        }

        // 3. 更新时间戳框
        if (source !== 'ts') {
            inputs.ts.value = ts;
        }

        // 4. 更新结果展示区
        outputs.ms.textContent = ts;
        outputs.s.textContent = Math.floor(ts / 1000);
        outputs.local.textContent = formatDate(date, false);
        outputs.utc.textContent = formatDate(date, true) + ' UTC';
    };

    const clearInputs = (types) => {
        if (types.includes('parts')) {
            [inputs.y, inputs.m, inputs.d, inputs.h, inputs.min, inputs.s].forEach(el => el.value = '');
        }
    };

    // --- 3. 事件监听 ---

    // A. 6个日期组件输入
    const parts = [inputs.y, inputs.m, inputs.d, inputs.h, inputs.min, inputs.s];
    parts.forEach(el => {
        el.addEventListener('input', () => {
            const y = parseInt(inputs.y.value);
            const m = parseInt(inputs.m.value) - 1;
            const d = parseInt(inputs.d.value);
            const h = parseInt(inputs.h.value) || 0;
            const min = parseInt(inputs.min.value) || 0;
            const s = parseInt(inputs.s.value) || 0;

            if (!isNaN(y) && inputs.y.value.length === 4 && !isNaN(m) && !isNaN(d)) {
                const date = new Date(y, m, d, h, min, s);
                updateUI(date.getTime(), 'parts');
            }
        });
        el.addEventListener('focus', function() { this.select(); });
    });

    // B. [新增] 日期字符串输入
    inputs.str.addEventListener('input', function() {
        const val = this.value.trim();
        if (!val) {
            updateUI(null, 'str');
            return;
        }
        // 尝试解析字符串
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
            updateUI(date.getTime(), 'str');
        }
    });

    // C. 时间戳输入
    inputs.ts.addEventListener('input', function() {
        let val = this.value.trim();
        if (!val) {
            updateUI(null, 'ts');
            return;
        }
        let ts = parseInt(val);
        if (isNaN(ts)) return;

        // 智能判断 10位 (秒)
        if (val.length === 10) {
            ts *= 1000;
        }
        updateUI(ts, 'ts');
    });

    // D. 按钮
    document.getElementById('btn-fill-now').onclick = () => {
        updateUI(Date.now(), 'manual');
    };

    document.getElementById('btn-clear').onclick = () => {
        inputs.str.value = '';
        inputs.ts.value = '';
        clearInputs(['parts']);
        updateUI(null, 'manual');
    };

    // E. 复制功能
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = function() {
            const targetId = this.getAttribute('data-target');
            const text = document.getElementById(targetId).textContent;
            if (text && text !== '-') {
                navigator.clipboard.writeText(text);
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.style.background = '#dcfce7';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '#f3f4f6';
                }, 1000);
            }
        };
    });
}