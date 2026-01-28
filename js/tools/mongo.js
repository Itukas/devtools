export function render() {
    return `
        <style>
            .mongo-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            .split-view { display: flex; gap: 15px; flex: 1; min-height: 0; }
            
            /* 编辑器容器 */
            .editor-box {
                flex: 1; display: flex; flex-direction: column;
                border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; overflow: hidden;
            }
            .editor-box:first-child textarea { overflow-y: auto; }
            .box-header {
                padding: 8px 15px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
                font-weight: 600; font-size: 13px; color: #475569;
                display: flex; justify-content: space-between; align-items: center;
            }

            /* --- 代码视图 --- */
            .code-wrapper {
                flex: 1; display: flex; position: relative; overflow: hidden; background: #fafafa;
            }
            .line-gutter {
                width: 45px; background-color: #f1f5f9; border-right: 1px solid #e2e8f0;
                color: #94a3b8; font-family: 'Menlo', 'Monaco', monospace; font-size: 13px; line-height: 1.6;
                text-align: right; padding: 10px 8px 10px 0; user-select: none; overflow: hidden; white-space: pre;
            }
            .code-view {
                flex: 1; margin: 0; padding: 10px 15px;
                font-family: 'Menlo', 'Monaco', monospace; font-size: 13px; line-height: 1.6;
                overflow: auto; white-space: pre; color: #334155; outline: none;
            }

            /* --- 表格视图 --- */
            .table-wrapper {
                flex: 1; overflow: auto; background: #fff; display: none; /* 默认隐藏 */
            }
            table.mongo-table {
                width: 100%; border-collapse: collapse; font-size: 13px; font-family: sans-serif; min-width: 600px;
            }
            .mongo-table th {
                background: #f8fafc; position: sticky; top: 0; z-index: 10;
                border: 1px solid #e2e8f0; padding: 0;
            }
            .th-content {
                padding: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #475569;
            }
            .th-content:hover { background: #e2e8f0; }
            .th-filter {
                padding: 4px; border-top: 1px solid #e2e8f0; background: #fff;
            }
            .th-filter input {
                width: 100%; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; box-sizing: border-box;
            }
            .mongo-table td {
                padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155; max-width: 300px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .mongo-table tr:nth-child(even) { background: #f8fafc; }
            .mongo-table tr:hover { background: #f1f5f9; }

            /* 原始输入框 */
            .raw-input {
                flex: 1; padding: 15px; border: none; resize: none; outline: none; white-space: pre;
                font-family: 'Menlo', 'Monaco', monospace; font-size: 13px; line-height: 1.6;
                overflow-y: auto; overflow-x: auto;
            }

            /* 高亮样式 */
            .hl-key { color: #800080; font-weight: bold; }
            .hl-str { color: #067d17; }
            .hl-num { color: #0000ff; }
            .hl-bool { color: #b22222; font-weight: bold; }
            .hl-null { color: #808080; font-weight: bold; }
            .hl-mongo { color: #a0522d; font-weight: bold; }
            .hl-func { color: #000080; font-weight: bold; }

            .config-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
            .input-sm { padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; }
            
            /* 排序指示器 */
            .sort-icon { font-size: 10px; color: #94a3b8; margin-left: 4px; }
            .sort-asc .sort-icon::after { content: '▲'; color: #2563eb; }
            .sort-desc .sort-icon::after { content: '▼'; color: #2563eb; }
        </style>

        <div class="tool-box mongo-container">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="config-row">
                    <label style="font-size:13px; font-weight:bold;">Collection Name:</label>
                    <input type="text" id="coll-name" class="input-sm" value="my_collection" placeholder="db.xxx">
                </div>
                <div style="display:flex; gap:10px;">
                    <input type="file" id="file-upload" accept=".txt,.json,.log,.js" style="display:none" />
                    <button id="btn-upload" class="secondary" style="background:#64748b;">📂 导入文件</button>
                    
                    <button id="btn-parse" style="background:#2563eb;">⚡ 解析</button>
                    <button id="btn-clear" class="secondary" style="background:#ef4444;">清空</button>
                </div>
            </div>

            <div class="split-view">
                <div class="editor-box" style="flex: 0 0 40%;">
                    <div class="box-header">
                        <span>原始数据 (Mongo Shell / Escaped JSON)</span>
                    </div>
                    <textarea id="mongo-input" class="raw-input" placeholder='支持粘贴或上传 .txt / .json / .log 文件\n会自动去除转义符 (如 \")'></textarea>
                </div>

                <div class="editor-box" style="flex:1;">
                    <div class="box-header">
                        <div style="display:flex; gap:15px;">
                            <label style="cursor:pointer;"><input type="radio" name="view-type" value="json" checked> JSON</label>
                            <label style="cursor:pointer;"><input type="radio" name="view-type" value="table"> 表格 (Table)</label>
                            <label style="cursor:pointer;"><input type="radio" name="view-type" value="insert"> Insert 语句</label>
                        </div>
                        <div style="display:flex; gap:5px;">
                             <button id="btn-csv" class="secondary" style="padding:2px 10px; font-size:12px; display:none; background:#10b981; color:white;">📊 导出 CSV</button>
                             <button id="btn-copy" class="secondary" style="padding:2px 10px; font-size:12px;">📄 复制</button>
                        </div>
                    </div>
                    
                    <div id="code-wrapper-el" class="code-wrapper">
                        <div id="line-gutter" class="line-gutter">1</div>
                        <pre id="result-view" class="code-view"></pre>
                    </div>

                    <div id="table-wrapper-el" class="table-wrapper">
                        <table class="mongo-table" id="data-table">
                            <thead id="table-head"></thead>
                            <tbody id="table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="status-msg" style="font-size:12px; color:#64748b; height:20px; display:flex; align-items:center;"></div>
        </div>
    `;
}

export function init() {
    // DOM Elements
    const input = document.getElementById('mongo-input');
    const resultView = document.getElementById('result-view');
    const lineGutter = document.getElementById('line-gutter');
    const collNameInput = document.getElementById('coll-name');
    const statusMsg = document.getElementById('status-msg');

    // Buttons
    const btnParse = document.getElementById('btn-parse');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnCsv = document.getElementById('btn-csv');
    const btnUpload = document.getElementById('btn-upload');
    const fileUpload = document.getElementById('file-upload');
    const radios = document.getElementsByName('view-type');

    // View Containers
    const codeWrapper = document.getElementById('code-wrapper-el');
    const tableWrapper = document.getElementById('table-wrapper-el');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    // State
    let cachedJsonObj = null;
    let cachedJsonRaw = '';
    let cachedInsertRaw = '';
    let currentRaw = '';

    // Table State
    let tableData = [];
    let tableColumns = [];
    let sortConfig = { key: null, direction: 'asc' };
    let filters = {};

    // --- 1. 高亮引擎 ---
    const highlightCode = (code) => {
        if (!code) return '';
        const escape = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return code.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|(\b(ObjectId|NumberLong|NumberInt|NumberDecimal|ISODate)\b)|(\b(db\.getCollection|insert)\b)/g,
            function (match) {
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) return '<span class="hl-key">' + escape(match.slice(0, -1)) + '</span>:';
                    return '<span class="hl-str">' + escape(match) + '</span>';
                }
                if (/true|false/.test(match)) return '<span class="hl-bool">' + match + '</span>';
                if (/null/.test(match)) return '<span class="hl-null">null</span>';
                if (/ObjectId|NumberLong|NumberInt|NumberDecimal|ISODate/.test(match)) return '<span class="hl-mongo">' + match + '</span>';
                if (/db\.getCollection|insert/.test(match)) return '<span class="hl-func">' + match + '</span>';
                return '<span class="hl-num">' + match + '</span>';
            }
        );
    };

    // --- 2. 视图切换与更新 ---
    const updateView = () => {
        const type = document.querySelector('input[name="view-type"]:checked').value;

        if (type === 'table') {
            codeWrapper.style.display = 'none';
            tableWrapper.style.display = 'block';
            btnCsv.style.display = 'block';
            renderTable();
        } else {
            codeWrapper.style.display = 'flex';
            tableWrapper.style.display = 'none';
            btnCsv.style.display = 'none';

            currentRaw = (type === 'json') ? cachedJsonRaw : cachedInsertRaw;
            if (!currentRaw) {
                resultView.innerHTML = '';
                lineGutter.textContent = '1';
                return;
            }
            resultView.innerHTML = highlightCode(currentRaw);
            const lineCount = currentRaw.split('\n').length;
            lineGutter.textContent = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
        }
    };

    // --- 3. 核心：解析逻辑 (含自动去转义) ---

    // 内部辅助：单次解析尝试，负责处理 Mongo Shell 语法和非标 JSON 修复
    const attemptParse = (str) => {
        // 预处理 Mongo Shell 格式为标准 JSON
        let jsonStr = str
            .replace(/ObjectId\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
            .replace(/ISODate\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
            .replace(/NumberLong\s*\(\s*["']?(\d+)["']?\s*\)/g, '"$1"')
            .replace(/NumberInt\s*\(\s*["']?(\d+)["']?\s*\)/g, '$1')
            .replace(/NumberDecimal\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"');

        // 容错：修复多条对象堆叠的情况 ( }{ -> },{ )
        if (!jsonStr.startsWith('[') && jsonStr.includes('}{')) {
            jsonStr = `[${jsonStr.replace(/}\s*{/g, '},{')}]`;
        }

        return JSON.parse(jsonStr);
    };

    const parseMongoData = () => {
        const raw = input.value.trim();
        if (!raw) return;

        try {
            let jsonObj;
            let successMsgExtra = '';

            try {
                // 尝试1：直接解析
                jsonObj = attemptParse(raw);

                // 尝试2：如果解析出来是 String，说明输入是被 stringify 过的 (如 "{\"a\":1}")
                // 此时我们需要对这个 String 再解析一次，才能得到对象
                if (typeof jsonObj === 'string') {
                    try {
                        const inner = attemptParse(jsonObj);
                        if (typeof inner === 'object') {
                            jsonObj = inner;
                            successMsgExtra = ' (已自动展开 Stringified JSON)';
                        }
                    } catch(e) {
                        // 二次解析失败，保持原样（可能它本身就是个字符串）
                    }
                }

            } catch (e) {
                // 尝试3：如果包含 \" ，尝试暴力去转义后解析
                // 场景：日志里的 {\"a\": 1} (没有首尾引号，但中间被转义了)
                if (raw.includes('\\"')) {
                    // 简单的反转义： \" -> " , \\ -> \
                    const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    try {
                        jsonObj = attemptParse(unescaped);
                        successMsgExtra = ' (已自动去除转义)';
                    } catch (e2) {
                        throw e; // 抛出原始错误
                    }
                } else {
                    throw e;
                }
            }

            // 解析成功，更新状态
            cachedJsonObj = jsonObj;
            tableData = Array.isArray(jsonObj) ? jsonObj : [jsonObj];

            // 提取 Key
            const keys = new Set();
            tableData.forEach(item => {
                if(item && typeof item === 'object') {
                    Object.keys(item).forEach(k => keys.add(k));
                }
            });
            tableColumns = Array.from(keys);

            cachedJsonRaw = JSON.stringify(jsonObj, null, 4);

            const coll = collNameInput.value || 'my_collection';
            cachedInsertRaw = `db.${coll}.insert(\n${cachedJsonRaw}\n);`;

            statusMsg.innerHTML = `<span style="color:#16a34a">✅ 解析成功: ${tableData.length} 条记录${successMsgExtra}</span>`;
            updateView();

        } catch (e) {
            console.error(e);
            cachedJsonRaw = "";
            cachedInsertRaw = "";
            tableData = [];
            statusMsg.innerHTML = `<span style="color:#dc2626">❌ 解析失败: ${e.message}</span>`;
            if(document.querySelector('input[name="view-type"]:checked').value !== 'table') {
                resultView.innerHTML = `<span style="color:#dc2626">无法解析，请检查数据格式。\n${e.message}</span>`;
            }
        }
    };

    // --- 4. 表格渲染 (保持不变) ---
    const renderTable = () => {
        if (!tableData || tableData.length === 0) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = '<tr><td style="text-align:center; color:#94a3b8; padding:20px;">暂无数据</td></tr>';
            return;
        }

        let displayData = tableData.filter(row => {
            return Object.keys(filters).every(key => {
                const filterVal = filters[key].toLowerCase();
                if (!filterVal) return true;
                const cellVal = String(row[key] === undefined || row[key] === null ? '' : row[key]).toLowerCase();
                return cellVal.includes(filterVal);
            });
        });

        if (sortConfig.key) {
            displayData.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA === valB) return 0;
                const comp = (valA > valB) ? 1 : -1;
                return sortConfig.direction === 'asc' ? comp : -comp;
            });
        }

        let theadHtml = '<tr>';
        tableColumns.forEach(col => {
            let sortClass = '';
            if (sortConfig.key === col) {
                sortClass = sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc';
            }
            theadHtml += `
                <th class="${sortClass}">
                    <div class="th-content" data-key="${col}">
                        <span>${col}</span>
                        <span class="sort-icon"></span>
                    </div>
                    <div class="th-filter">
                        <input type="text" placeholder="筛选..." data-filter-key="${col}" value="${filters[col] || ''}">
                    </div>
                </th>
            `;
        });
        theadHtml += '</tr>';
        tableHead.innerHTML = theadHtml;

        tableHead.querySelectorAll('.th-content').forEach(el => {
            el.onclick = () => {
                const key = el.dataset.key;
                if (sortConfig.key === key) {
                    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortConfig.key = key;
                    sortConfig.direction = 'asc';
                }
                renderTable();
            };
        });

        tableHead.querySelectorAll('input').forEach(input => {
            input.oninput = (e) => {
                const key = e.target.dataset.filterKey;
                filters[key] = e.target.value.trim();
                renderTableBody(displayData);
            };
            input.onclick = (e) => e.stopPropagation();
        });

        renderTableBody(displayData);
    };

    const renderTableBody = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${tableColumns.length}" style="text-align:center; padding:20px;">无匹配结果</td></tr>`;
            return;
        }

        const html = data.map(row => {
            let tr = '<tr>';
            tableColumns.forEach(col => {
                let val = row[col];
                if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val);
                } else if (val === undefined || val === null) {
                    val = '';
                }
                tr += `<td title="${String(val).replace(/"/g, '&quot;')}">${val}</td>`;
            });
            tr += '</tr>';
            return tr;
        }).join('');
        tableBody.innerHTML = html;
    };

    // --- 5. CSV 导出 ---
    const exportCSV = () => {
        if (!tableData || tableData.length === 0) return;

        let exportData = tableData.filter(row => {
            return Object.keys(filters).every(key => {
                const filterVal = filters[key].toLowerCase();
                if (!filterVal) return true;
                return String(row[key] || '').toLowerCase().includes(filterVal);
            });
        });

        if (sortConfig.key) {
            exportData.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA === valB) return 0;
                return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA > valB ? -1 : 1);
            });
        }

        const header = tableColumns.join(',');
        const rows = exportData.map(row => {
            return tableColumns.map(col => {
                let val = row[col];
                if (val === undefined || val === null) val = '';
                if (typeof val === 'object') val = JSON.stringify(val);
                val = String(val);
                if (val.search(/("|,|\n)/g) >= 0) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',');
        });

        const csvContent = "\uFEFF" + [header, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mongo_export_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- 事件绑定 ---
    btnUpload.onclick = () => fileUpload.click();

    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusMsg.innerHTML = '<span style="color:#64748b;">⏳ 正在读取文件...</span>';

        const reader = new FileReader();
        reader.onload = (event) => {
            input.value = event.target.result;
            // 自动切到表格视图
            document.querySelector('input[name="view-type"][value="table"]').checked = true;
            parseMongoData();
            fileUpload.value = '';
        };
        reader.onerror = () => {
            statusMsg.innerHTML = '<span style="color:#dc2626">❌ 读取文件失败</span>';
        };
        reader.readAsText(file);
    });

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
        tableBody.innerHTML = '';
        tableHead.innerHTML = '';
        cachedJsonRaw = '';
        cachedInsertRaw = '';
        cachedJsonObj = null;
        tableData = [];
        filters = {};
        statusMsg.textContent = '';
    };

    btnCsv.onclick = exportCSV;

    btnCopy.onclick = () => {
        if (!currentRaw) return;
        navigator.clipboard.writeText(currentRaw).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '✅ 已复制';
            setTimeout(() => btnCopy.textContent = '📄 复制', 1000);
        });
    };

    resultView.addEventListener('scroll', () => { lineGutter.scrollTop = resultView.scrollTop; });
}