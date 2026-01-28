export function render() {
    return `
        <style>
            /* --- 基础通用样式 --- */
            .json-editor-area { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; outline: none; border: none; resize: none; background: transparent; white-space: pre; overflow-wrap: normal; overflow-x: auto; color: #334155; }
            
            .status-ok { color: #16a34a; font-weight: 500; font-size: 12px; }
            .status-err { color: #dc2626; font-weight: 500; font-size: 12px; }

            /* --- Tabs 和 工具栏 --- */
            .view-tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; align-items: center; padding-right: 8px; }
            .view-tab { padding: 8px 12px; cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; background: transparent; border: none; border-right: 1px solid #e2e8f0; transition: all 0.2s; }
            .view-tab:hover { background: #e2e8f0; color: #334155; }
            .view-tab.active { background: #fff; color: #2563eb; border-bottom: 2px solid #2563eb; margin-bottom: -1px; }
            
            .tree-controls { display: flex; gap: 5px; margin-left: auto; }
            .mini-btn { padding: 2px 6px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 3px; cursor: pointer; background: #fff; color: #475569; }
            .mini-btn:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }

            /* --- JSON 树形视图 --- */
            .json-tree-container { flex: 1; overflow: auto; padding: 10px; background-color: #fff; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; white-space: nowrap; }
            
            details > summary { list-style: none; cursor: pointer; outline: none; display: inline-block; }
            details > summary::-webkit-details-marker { display: none; }
            details > summary::before { content: '▶'; display: inline-block; font-size: 10px; width: 14px; transition: transform 0.1s; color: #94a3b8; }
            details[open] > summary::before { transform: rotate(90deg); }
            details[open] > summary > .j-meta { display: none; }
            details:not([open]) > summary > .j-meta { display: inline-block; }

            /* 语法高亮 */
            .j-key { color: #7c3aed; font-weight: 600; }
            .j-str { color: #059669; }
            .j-num { color: #2563eb; }
            .j-bool { color: #db2777; font-weight: 600; }
            .j-null { color: #94a3b8; font-weight: 600; }
            .j-syntax { color: #475569; }
            .j-meta { color: #94a3b8; font-size: 12px; margin-left: 6px; user-select: none; font-style: italic; }
            details div { padding-left: 18px; border-left: 1px solid #f1f5f9; }
            summary:hover { background-color: #f8fafc; border-radius: 4px; }

            /* --- 布局容器 --- */
            .tool-box { height: 100%; display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
            .main-container { display: flex; flex: 1; min-height: 0; overflow: hidden; }
            
            .btn-group { flex-shrink: 0; padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 8px; flex-wrap: wrap; }
            .btn-group button { padding: 4px 10px; font-size: 12px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer; background: #fff; color: #334155; }
            .btn-group button:hover { background: #f1f5f9; border-color: #94a3b8; }
            .btn-group button.primary { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; }
            .btn-group button.primary:hover { background: #1d4ed8; }

            .resizer { width: 1px; background-color: #e2e8f0; cursor: col-resize; position: relative; z-index: 10; flex-shrink: 0; transition: background-color 0.2s; }
            .resizer::after { content: ''; position: absolute; top: 0; bottom: 0; left: -4px; right: -4px; z-index: 10; }
            .resizer:hover, .resizer.dragging { background-color: #2563eb; width: 2px; }

            .panel-left { flex: 0 0 40%; display: flex; flex-direction: column; min-width: 150px; background: #fff; overflow: hidden; }
            .panel-left textarea { overflow-y: auto; overflow-x: auto; }
            .panel-right { flex: 1; display: flex; flex-direction: column; min-width: 150px; background: #fff; overflow: hidden; }
            .panel-header { padding: 5px 10px; font-size: 12px; font-weight: bold; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }

            /* --- 仅右侧使用的行号样式 --- */
            .editor-wrapper { flex: 1; display: flex; position: relative; overflow: hidden; }
            
            .line-numbers {
                width: 40px;
                background-color: #f1f5f9; /* 与右侧背景匹配 */
                border-right: 1px solid #e2e8f0;
                color: #94a3b8;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                text-align: right;
                padding: 10px 5px 10px 0;
                user-select: none;
                overflow: hidden;
                flex-shrink: 0;
            }
            .line-numbers div { height: 1.5em; }
            
            textarea.json-editor-area {
                flex: 1;
                padding: 10px;
                white-space: pre;
                overflow: auto;
            }
            textarea.json-editor-area:focus { background: #fafafa; }
            
            /* 右侧源码视图背景 */
            #view-raw { background-color: #fcfcfc; }

            /* --- 表格视图样式 --- */
            .table-wrapper {
                flex: 1; overflow: auto; background: #fff; display: none;
            }
            .json-table {
                width: 100%; border-collapse: collapse; font-size: 13px; font-family: sans-serif; min-width: 600px;
            }
            .json-table th {
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
            .json-table td {
                padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155; max-width: 300px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .json-table tr:nth-child(even) { background: #f8fafc; }
            .json-table tr:hover { background: #f1f5f9; }
            .sort-icon { font-size: 10px; color: #94a3b8; margin-left: 4px; }
            .sort-asc .sort-icon::after { content: '▲'; color: #2563eb; }
            .sort-desc .sort-icon::after { content: '▼'; color: #2563eb; }
            .table-empty { text-align: center; color: #94a3b8; padding: 40px; }

        </style>

        <div class="tool-box">
            <div class="btn-group">
                <button id="btn-fmt" class="primary">🌲 格式化</button>
                <button id="btn-compress">压缩</button>
                <button id="btn-escape">转义</button>
                <button id="btn-unescape">去转义</button>
                <div style="flex:1"></div>
                <button id="btn-copy" style="color:#059669; border-color:#059669;">复制</button>
                <button id="btn-clear" style="color:#dc2626; border-color:#dc2626;">清空</button>
            </div>
            
            <div class="main-container" id="main-container">
                <div class="panel-left" id="panel-left">
                    <div class="panel-header">输入 (Input)</div>
                    <textarea id="json-input" class="json-editor-area" placeholder="在此粘贴 JSON..." spellcheck="false"></textarea>
                </div>

                <div class="resizer" id="dragMe"></div>

                <div class="panel-right" id="panel-right">
                    <div class="view-tabs">
                        <div style="padding:0 10px; font-size:12px; font-weight:bold; color:#64748b;">结果</div>
                        <button class="view-tab active" data-view="tree">🌲 树形</button>
                        <button class="view-tab" data-view="raw">📝 源码</button>
                        <button class="view-tab" data-view="table">📊 表格</button>
                        
                        <div class="tree-controls" id="tree-controls">
                            <button class="mini-btn" id="btn-expand">➕ 展开全部</button>
                            <button class="mini-btn" id="btn-collapse">➖ 折叠全部</button>
                        </div>
                    </div>
                    
                    <div id="view-tree" class="json-tree-container">
                        <div style="color:#cbd5e1; text-align:center; margin-top:40px; font-size:12px;">等待输入...</div>
                    </div>
                    
                    <div id="raw-wrapper" class="editor-wrapper" style="display:none;">
                        <div class="line-numbers" id="line-numbers-raw"></div>
                        <textarea id="view-raw" class="json-editor-area" readonly></textarea>
                    </div>

                    <div id="table-wrapper" class="table-wrapper">
                        <table class="json-table" id="json-table">
                            <thead id="table-head"></thead>
                            <tbody id="table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style="padding: 4px 10px; border-top: 1px solid #e2e8f0; background: #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <div id="status-bar" class="status-ok">就绪</div>
                <div style="font-size:10px; color:#cbd5e1;">JSON Viewer v2.2</div>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('json-input');

    // 右侧元素
    const viewTree = document.getElementById('view-tree');
    const viewRaw = document.getElementById('view-raw');
    const rawWrapper = document.getElementById('raw-wrapper');
    const lineNumbersRaw = document.getElementById('line-numbers-raw');
    const tableWrapper = document.getElementById('table-wrapper');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    const status = document.getElementById('status-bar');
    const tabs = document.querySelectorAll('.view-tab');
    const treeControls = document.getElementById('tree-controls');

    // --- 1. 行号逻辑 (仅 Output) ---
    const updateRawLineNumbers = () => {
        const val = viewRaw.value;
        const lines = val ? val.split('\n').length : 0;
        if (lines === 0) {
            lineNumbersRaw.innerHTML = '';
        } else {
            lineNumbersRaw.innerHTML = Array.from({length: lines}, (_, i) => `<div>${i + 1}</div>`).join('');
        }
    };
    // 同步滚动：右侧 Textarea -> 右侧行号
    viewRaw.addEventListener('scroll', () => { lineNumbersRaw.scrollTop = viewRaw.scrollTop; });


    // --- 2. 核心处理 ---
    let currentMode = 'tree';
    let debounceTimer = null;

    const updateStatus = (msg, isError = false) => {
        status.textContent = msg;
        status.className = isError ? 'status-err' : 'status-ok';
    };

    const getJson = () => {
        try {
            const val = input.value.trim();
            if (!val) return null;
            return JSON.parse(val);
        } catch (e) {
            updateStatus(`语法错误: ${e.message}`, true);
            return null;
        }
    };

    // 表格相关状态
    let tableData = [];
    let tableColumns = [];
    let sortConfig = { key: null, direction: 'asc' };
    let filters = {};

    const switchView = (mode) => {
        currentMode = mode;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.view === mode));

        if (mode === 'tree') {
            viewTree.style.display = 'block';
            rawWrapper.style.display = 'none';
            tableWrapper.style.display = 'none';
            treeControls.style.display = 'flex';
        } else if (mode === 'raw') {
            viewTree.style.display = 'none';
            rawWrapper.style.display = 'flex';
            tableWrapper.style.display = 'none';
            treeControls.style.display = 'none';
            updateRawLineNumbers();
        } else if (mode === 'table') {
            viewTree.style.display = 'none';
            rawWrapper.style.display = 'none';
            tableWrapper.style.display = 'block';
            treeControls.style.display = 'none';
            renderTable();
        }
    };

    tabs.forEach(tab => {
        tab.onclick = () => {
            switchView(tab.dataset.view);
            if (tab.dataset.view === 'tree' || tab.dataset.view === 'table') {
                autoProcess();
            }
        };
    });

    // --- 3. 生成 Tree HTML ---
    const escapeHtml = (str) => {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    const buildTreeHtml = (data) => {
        if (data === null) return `<span class="j-null">null</span>`;
        if (typeof data === 'boolean') return `<span class="j-bool">${data}</span>`;
        if (typeof data === 'number') return `<span class="j-num">${data}</span>`;
        if (typeof data === 'string') return `<span class="j-str">"${escapeHtml(data)}"</span>`;

        if (Array.isArray(data)) {
            if (data.length === 0) return `<span class="j-syntax">[]</span>`;
            let html = `<details open><summary><span class="j-syntax">[</span><span class="j-meta">Array(${data.length})</span></summary><div>`;
            data.forEach((item, index) => {
                html += `<div>${buildTreeHtml(item)}${index < data.length - 1 ? '<span class="j-syntax">,</span>' : ''}</div>`;
            });
            html += `</div><span class="j-syntax">]</span></details>`;
            return html;
        }

        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length === 0) return `<span class="j-syntax">{}</span>`;
            let html = `<details open><summary><span class="j-syntax">{</span><span class="j-meta">Object{${keys.length}}</span></summary><div>`;
            keys.forEach((key, index) => {
                html += `<div><span class="j-key">"${escapeHtml(key)}"</span><span class="j-syntax">: </span>${buildTreeHtml(data[key])}${index < keys.length - 1 ? '<span class="j-syntax">,</span>' : ''}</div>`;
            });
            html += `</div><span class="j-syntax">}</span></details>`;
            return html;
        }
        return String(data);
    };

    // 表格渲染函数
    const renderTable = () => {
        if (!tableData || tableData.length === 0) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = '<tr><td colspan="100%" class="table-empty">暂无数据或数据不是数组格式</td></tr>';
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
            tableBody.innerHTML = `<tr><td colspan="${tableColumns.length}" class="table-empty">无匹配结果</td></tr>`;
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

    const autoProcess = () => {
        const val = input.value.trim();
        if (!val) {
            viewTree.innerHTML = '<div style="color:#cbd5e1; text-align:center; margin-top:40px; font-size:12px;">等待输入...</div>';
            viewRaw.value = '';
            tableData = [];
            tableColumns = [];
            updateRawLineNumbers();
            updateStatus("就绪");
            if (currentMode === 'table') renderTable();
            return;
        }
        try {
            const obj = JSON.parse(val);
            updateStatus("JSON 有效 ✅");

            // 实时更新右侧 Raw 视图
            viewRaw.value = JSON.stringify(obj, null, 4);
            updateRawLineNumbers();

            // 处理表格数据
            if (Array.isArray(obj) && obj.length > 0) {
                tableData = obj;
                const keys = new Set();
                obj.forEach(item => {
                    if (item && typeof item === 'object') {
                        Object.keys(item).forEach(k => keys.add(k));
                    }
                });
                tableColumns = Array.from(keys);
            } else if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
                // 单个对象也转换为表格
                tableData = [obj];
                tableColumns = Object.keys(obj);
            } else {
                tableData = [];
                tableColumns = [];
            }

            if (currentMode === 'tree') {
                viewTree.innerHTML = buildTreeHtml(obj);
            } else if (currentMode === 'table') {
                renderTable();
            }
        } catch (e) {
            if (currentMode === 'tree') {
                viewTree.innerHTML = `<div style="color:#dc2626; padding:10px;">🚫 解析错误:<br>${e.message}</div>`;
            } else if (currentMode === 'table') {
                tableHead.innerHTML = '';
                tableBody.innerHTML = `<tr><td colspan="100%" class="table-empty" style="color:#dc2626;">解析错误: ${e.message}</td></tr>`;
            }
            updateStatus(`❌ 语法错误`, true);
        }
    };

    // --- 4. 事件监听 ---
    input.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoProcess, 300);
    });

    document.getElementById('btn-expand').onclick = () => {
        viewTree.querySelectorAll('details').forEach(el => el.open = true);
    };

    document.getElementById('btn-collapse').onclick = () => {
        viewTree.querySelectorAll('details').forEach(el => el.open = false);
    };

    document.getElementById('btn-fmt').onclick = () => {
        try {
            const obj = JSON.parse(input.value);
            input.value = JSON.stringify(obj, null, 4); // 仅格式化左侧内容
            switchView('tree');
            autoProcess();
        } catch(e) { autoProcess(); }
    };

    document.getElementById('btn-compress').onclick = () => {
        const obj = getJson();
        if (obj) {
            const compressed = JSON.stringify(obj);
            viewRaw.value = compressed;
            input.value = compressed;
            updateRawLineNumbers();
            switchView('raw');
            updateStatus("已压缩");
        }
    };

    document.getElementById('btn-escape').onclick = () => {
        const val = input.value;
        if (!val) return;
        viewRaw.value = JSON.stringify(val).slice(1, -1);
        updateRawLineNumbers();
        switchView('raw');
        updateStatus("已转义");
    };

    document.getElementById('btn-unescape').onclick = () => {
        try {
            const val = input.value;
            viewRaw.value = JSON.parse(`"${val}"`);
            updateRawLineNumbers();
            switchView('raw');
            updateStatus("去转义成功");
        } catch (e) { updateStatus("去转义失败", true); }
    };

    document.getElementById('btn-copy').onclick = () => {
        let text = currentMode === 'tree' ? (viewRaw.value || input.value) : viewRaw.value;
        if(!text) text = input.value;
        if(!text) return;
        navigator.clipboard.writeText(text).then(() => updateStatus("已复制 ✅"));
    };

    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
        viewRaw.value = '';
        viewTree.innerHTML = '';
        updateRawLineNumbers();
        autoProcess();
        updateStatus("已清空");
    };

    // 拖拽逻辑
    const resizer = document.getElementById('dragMe');
    const leftPanel = document.getElementById('panel-left');
    const container = document.getElementById('main-container');
    let x = 0; let leftWidth = 0;
    const mouseMoveHandler = function(e) {
        const dx = e.clientX - x;
        const newWidth = leftWidth + dx;
        if (newWidth > 100 && newWidth < container.getBoundingClientRect().width - 100) {
            leftPanel.style.flexBasis = `${newWidth}px`;
        }
    };
    const mouseUpHandler = function() {
        resizer.classList.remove('dragging');
        document.body.style.removeProperty('cursor');
        leftPanel.style.removeProperty('pointer-events');
        viewTree.style.removeProperty('pointer-events');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };
    resizer.addEventListener('mousedown', function(e) {
        x = e.clientX;
        const rect = leftPanel.getBoundingClientRect();
        leftWidth = rect.width;
        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        leftPanel.style.pointerEvents = 'none';
        viewTree.style.pointerEvents = 'none';
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
}