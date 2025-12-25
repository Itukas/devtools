export function render() {
    return `
        <style>
            .mongo-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            .split-view { display: flex; gap: 15px; flex: 1; min-height: 0; }
            
            /* 编辑器容器 */
            .editor-box {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #fff;
                overflow: hidden;
            }
            .box-header {
                padding: 8px 15px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
                font-weight: 600;
                font-size: 13px;
                color: #475569;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            /* --- 核心：代码编辑器样式 --- */
            .code-wrapper {
                flex: 1;
                display: flex;
                position: relative;
                overflow: hidden;
                background: #fafafa;
            }

            /* 行号栏 */
            .line-gutter {
                width: 45px;
                background-color: #f1f5f9;
                border-right: 1px solid #e2e8f0;
                color: #94a3b8;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6; /* 行高必须一致 */
                text-align: right;
                padding: 10px 8px 10px 0;
                user-select: none;
                overflow: hidden;
                white-space: pre;
            }

            /* 代码内容区 */
            .code-view {
                flex: 1;
                margin: 0;
                padding: 10px 15px;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6; /* 行高必须一致 */
                overflow: auto;
                white-space: pre; /* 保持格式 */
                color: #334155;
                outline: none;
            }

            /* 原始输入框 (左侧) */
            .raw-input {
                flex: 1;
                padding: 15px;
                border: none;
                resize: none;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6;
                outline: none;
                white-space: pre;
            }

            /* --- 语法高亮配色 (IntelliJ Light 风格) --- */
            .hl-key { color: #800080; font-weight: bold; }      /* Key */
            .hl-str { color: #067d17; }                         /* String */
            .hl-num { color: #0000ff; }                         /* Number */
            .hl-bool { color: #b22222; font-weight: bold; }     /* Boolean */
            .hl-null { color: #808080; font-weight: bold; }     /* Null */
            .hl-mongo { color: #a0522d; font-weight: bold; }    /* MongoType (ObjectId) */
            .hl-func { color: #000080; font-weight: bold; }     /* db.insert */

            .config-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
            .input-sm { padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; }
        </style>

        <div class="tool-box mongo-container">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="config-row">
                    <label style="font-size:13px; font-weight:bold;">Collection Name:</label>
                    <input type="text" id="coll-name" class="input-sm" value="my_collection" placeholder="db.xxx">
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="btn-parse" style="background:#2563eb;">⚡ 解析并美化</button>
                    <button id="btn-clear" class="secondary" style="background:#ef4444;">清空</button>
                </div>
            </div>

            <div class="split-view">
                <div class="editor-box">
                    <div class="box-header">
                        <span>原始数据 (Mongo Shell Format)</span>
                    </div>
                    <textarea id="mongo-input" class="raw-input" placeholder='粘贴形如 { "_id" : ObjectId("..."), "time" : NumberLong(...) } 的数据'></textarea>
                </div>

                <div class="editor-box">
                    <div class="box-header">
                        <div style="display:flex; gap:15px;">
                            <label style="cursor:pointer;"><input type="radio" name="view-type" value="json" checked> 标准 JSON</label>
                            <label style="cursor:pointer;"><input type="radio" name="view-type" value="insert"> Insert 语句</label>
                        </div>
                        <button id="btn-copy" class="secondary" style="padding:2px 10px; font-size:12px;">📄 复制内容</button>
                    </div>
                    
                    <div class="code-wrapper">
                        <div id="line-gutter" class="line-gutter">1</div>
                        <pre id="result-view" class="code-view"></pre>
                    </div>
                </div>
            </div>
            
            <div id="status-msg" style="font-size:12px; color:#64748b; height:20px; display:flex; align-items:center;"></div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('mongo-input');
    const resultView = document.getElementById('result-view');
    const lineGutter = document.getElementById('line-gutter');
    const collNameInput = document.getElementById('coll-name');
    const statusMsg = document.getElementById('status-msg');
    const btnParse = document.getElementById('btn-parse');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const radios = document.getElementsByName('view-type');

    // 缓存数据
    let cachedJsonRaw = '';   // 纯文本 标准JSON
    let cachedInsertRaw = ''; // 纯文本 Insert语句
    let currentRaw = '';      // 当前显示的纯文本

    // --- 1. 高亮引擎 ---
    const highlightCode = (code) => {
        if (!code) return '';

        // 简单转义 HTML，防止 XSS 和布局错乱
        const escape = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 核心正则：匹配 JSON 的各个部分 + Mongo 特殊类型 + JS 关键字
        return code.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|(\b(ObjectId|NumberLong|NumberInt|NumberDecimal|ISODate)\b)|(\b(db\.getCollection|insert)\b)/g,
            function (match) {
                // 1. 字符串 或 Key
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        return '<span class="hl-key">' + escape(match.slice(0, -1)) + '</span>:';
                    }
                    return '<span class="hl-str">' + escape(match) + '</span>';
                }
                // 2. 布尔/Null
                if (/true|false/.test(match)) return '<span class="hl-bool">' + match + '</span>';
                if (/null/.test(match)) return '<span class="hl-null">null</span>';

                // 3. Mongo 类型 (ObjectId 等)
                if (/ObjectId|NumberLong|NumberInt|NumberDecimal|ISODate/.test(match)) {
                    return '<span class="hl-mongo">' + match + '</span>';
                }

                // 4. JS 函数 (db.insert)
                if (/db\.getCollection|insert/.test(match)) {
                    return '<span class="hl-func">' + match + '</span>';
                }

                // 5. 数字
                return '<span class="hl-num">' + match + '</span>';
            }
        );
    };

    // --- 2. 视图更新逻辑 ---
    const updateView = () => {
        const type = document.querySelector('input[name="view-type"]:checked').value;
        currentRaw = (type === 'json') ? cachedJsonRaw : cachedInsertRaw;

        if (!currentRaw) {
            resultView.innerHTML = '';
            lineGutter.textContent = '1';
            return;
        }

        // A. 渲染高亮代码
        resultView.innerHTML = highlightCode(currentRaw);

        // B. 渲染行号
        const lineCount = currentRaw.split('\n').length;
        lineGutter.textContent = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
    };

    // --- 3. 滚动同步 ---
    resultView.addEventListener('scroll', () => {
        lineGutter.scrollTop = resultView.scrollTop;
    });

    // --- 4. 解析逻辑 ---
    const parseMongoData = () => {
        const raw = input.value.trim();
        if (!raw) return;

        try {
            // Step 1: 转标准 JSON (用于预览)
            let jsonStr = raw
                .replace(/ObjectId\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
                .replace(/ISODate\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
                .replace(/NumberLong\s*\(\s*["']?(\d+)["']?\s*\)/g, '"$1"') // 保留精度为字符串
                .replace(/NumberInt\s*\(\s*["']?(\d+)["']?\s*\)/g, '$1')
                .replace(/NumberDecimal\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"');

            const jsonObj = JSON.parse(jsonStr);
            cachedJsonRaw = JSON.stringify(jsonObj, null, 4);

            // Step 2: 生成 Insert 语句 (保留原始结构并美化)
            const coll = collNameInput.value || 'my_collection';

            // 为了美化原始的 Mongo 字符串（包含 ObjectId），我们不能用 JSON.stringify。
            // 我们写一个简单的格式化器 formatRawMongoString
            const formattedRaw = formatRawMongoString(raw);
            cachedInsertRaw = `db.${coll}.insert(\n${formattedRaw}\n);`;

            statusMsg.innerHTML = '<span style="color:#16a34a">✅ 解析成功</span>';
            updateView();

        } catch (e) {
            console.error(e);
            cachedJsonRaw = "";
            cachedInsertRaw = "";
            currentRaw = "";
            statusMsg.innerHTML = `<span style="color:#dc2626">❌ 解析失败: ${e.message}</span>`;
            resultView.innerHTML = `<span style="color:#dc2626">无法解析，请检查 JSON 格式。\n错误信息: ${e.message}</span>`;
            lineGutter.textContent = '1';
        }
    };

    // 简单的缩进格式化器 (处理 Mongo 特殊对象)
    const formatRawMongoString = (str) => {
        let res = '';
        let pad = 0;
        const TAB = '    ';
        let inString = false;

        // 简单的去空格预处理 (稍微危险，只去除结构性的换行和空格)
        // 为了稳妥，我们直接逐字扫描，只处理结构字符

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            // 字符串状态切换
            if (char === '"' && str[i-1] !== '\\') inString = !inString;

            if (inString) {
                res += char;
                continue;
            }

            // 处理括号和逗号
            if (char === '{' || char === '[') {
                res += char + '\n';
                pad++;
                res += TAB.repeat(pad);
            } else if (char === '}' || char === ']') {
                res += '\n';
                pad--;
                res += TAB.repeat(pad) + char;
            } else if (char === ',') {
                res += char + '\n' + TAB.repeat(pad);
            } else if (char === ':') {
                res += ': ';
            } else if (/\s/.test(char)) {
                // 忽略非字符串内的空白，除非它在 Key 之前? 简单起见全部忽略，由上面逻辑重建格式
                // 但要小心 ObjectId("...") 中间的字符。
                // 这里的简易逻辑只适用于标准格式。
                // 如果是 NumberLong( 123 ) 中间的空格会被吃掉变成 NumberLong(123)，这通常是可以接受的
            } else {
                res += char;
            }
        }
        return res;
    };

    // --- 事件绑定 ---
    btnParse.onclick = parseMongoData;

    let timer;
    input.addEventListener('input', () => {
        if(timer) clearTimeout(timer);
        timer = setTimeout(parseMongoData, 500);
    });

    radios.forEach(r => r.addEventListener('change', updateView));
    collNameInput.addEventListener('input', () => { if (cachedJsonRaw) parseMongoData(); });

    btnClear.onclick = () => {
        input.value = '';
        resultView.innerHTML = '';
        lineGutter.textContent = '1';
        cachedJsonRaw = '';
        cachedInsertRaw = '';
        statusMsg.textContent = '';
    };

    btnCopy.onclick = () => {
        if (!currentRaw) return;
        navigator.clipboard.writeText(currentRaw).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '✅ 已复制';
            btnCopy.style.background = '#dcfce7';
            btnCopy.style.color = '#166534';
            setTimeout(() => {
                btnCopy.textContent = '📄 复制内容';
                btnCopy.style.background = '';
                btnCopy.style.color = '';
            }, 1000);
        });
    };
}