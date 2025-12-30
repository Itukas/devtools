export function render() {
    return `
        <style>
            .json-editor-area { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; resize: none; outline: none; }
            
            /* 状态栏样式 */
            .status-ok { color: #16a34a; font-weight: 500; font-size: 12px; transition: color 0.3s; }
            .status-err { color: #dc2626; font-weight: 500; font-size: 12px; transition: color 0.3s; }

            /* 视图切换 Tabs */
            .view-tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; overflow: hidden; }
            .view-tab { padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; background: transparent; border: none; border-right: 1px solid #e2e8f0; transition: all 0.2s; }
            .view-tab:hover { background: #e2e8f0; color: #334155; }
            .view-tab.active { background: #fff; color: #2563eb; border-bottom: 2px solid #2563eb; margin-bottom: -1px; }

            /* --- JSON 树形视图核心样式 --- */
            .json-tree-container {
                flex: 1;
                overflow: auto;
                padding: 10px;
                background-color: #fff;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.6;
                white-space: nowrap;
            }
            
            details > summary { list-style: none; cursor: pointer; outline: none; }
            details > summary::-webkit-details-marker { display: none; }
            details > summary::before {
                content: '▶'; display: inline-block; font-size: 10px; width: 14px; transition: transform 0.2s; color: #94a3b8;
            }
            details[open] > summary::before { transform: rotate(90deg); }

            /* 语法高亮 */
            .j-key { color: #7c3aed; font-weight: 600; } /* 紫色 Key */
            .j-str { color: #059669; } /* 绿色 String */
            .j-num { color: #2563eb; } /* 蓝色 Number */
            .j-bool { color: #db2777; font-weight: 600; } /* 粉色 Bool */
            .j-null { color: #94a3b8; font-weight: 600; } /* 灰色 Null */
            .j-syntax { color: #475569; }
            .j-meta { color: #cbd5e1; font-size: 12px; margin-left: 5px; user-select: none; }

            details div { padding-left: 18px; border-left: 1px solid #f1f5f9; }
            summary:hover { background-color: #f1f5f9; border-radius: 4px; }

            /* --- 布局样式优化 --- */
            .tool-box { height: 100%; display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }

            .btn-group { 
                flex-shrink: 0; padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 8px; flex-wrap: wrap; 
            }
            .btn-group button {
                padding: 4px 10px; font-size: 12px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer; background: #fff; color: #334155; transition: all 0.1s;
            }
            .btn-group button:hover { background: #f1f5f9; border-color: #94a3b8; }
            .btn-group button.primary { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; }
            .btn-group button.primary:hover { background: #1d4ed8; }

            .main-container {
                display: flex;
                flex: 1;
                min-height: 0;
                overflow: hidden; /* 防止溢出 */
            }

            /* --- 关键修改：Resizer 样式 --- */
            .resizer {
                width: 1px; /* 视觉上只有1px宽的线 */
                background-color: #e2e8f0; /* 分割线颜色 */
                cursor: col-resize;
                position: relative; /* 为了定位 hover 区域 */
                transition: background-color 0.2s;
                z-index: 10;
                flex-shrink: 0; /* 防止被挤压 */
            }
            
            /* 增大鼠标感应区域，但视觉上保持纤细 */
            .resizer::after {
                content: '';
                position: absolute;
                top: 0; bottom: 0;
                left: -4px; right: -4px; /* 左右各扩充4px感应区 */
                z-index: 10;
            }

            .resizer:hover, .resizer.dragging {
                background-color: #2563eb; /* 激活时变蓝 */
                width: 2px; /* 稍微变粗一点点提示用户 */
            }

            .panel-left {
                flex: 0 0 40%;
                display: flex;
                flex-direction: column;
                min-width: 150px;
                background: #fff;
            }

            .panel-right {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 150px;
                background: #fff;
                overflow: hidden;
            }

            /* 输入框样式微调 */
            textarea.json-editor-area {
                flex: 1; border: none; padding: 10px; background: #fff; color: #334155;
            }
            textarea.json-editor-area:focus { outline: none; background: #fafafa; }
            
            .panel-header {
                padding: 5px 10px; font-size: 12px; font-weight: bold; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
                display: flex; justify-content: space-between; align-items: center;
            }

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
                    <textarea id="json-input" class="json-editor-area" placeholder="在此粘贴 JSON..."></textarea>
                </div>

                <div class="resizer" id="dragMe"></div>

                <div class="panel-right" id="panel-right">
                    <div class="view-tabs">
                        <div style="padding:6px 10px; font-size:12px; font-weight:bold; color:#64748b; margin-right:auto; align-self:center;">结果</div>
                        <button class="view-tab active" data-view="tree">🌲 树形</button>
                        <button class="view-tab" data-view="raw">📝 源码</button>
                    </div>
                    
                    <div id="view-tree" class="json-tree-container">
                        <div style="color:#cbd5e1; text-align:center; margin-top:40px; font-size:12px;">等待输入...</div>
                    </div>
                    
                    <textarea id="view-raw" class="json-editor-area" style="display:none; padding:10px; background:#f8fafc;" readonly></textarea>
                </div>
            </div>

            <div style="padding: 4px 10px; border-top: 1px solid #e2e8f0; background: #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <div id="status-bar" class="status-ok">就绪</div>
                <div style="font-size:10px; color:#cbd5e1;">JSON Viewer</div>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('json-input');
    const viewTree = document.getElementById('view-tree');
    const viewRaw = document.getElementById('view-raw');
    const status = document.getElementById('status-bar');
    const tabs = document.querySelectorAll('.view-tab');

    // 拖拽相关
    const resizer = document.getElementById('dragMe');
    const leftPanel = document.getElementById('panel-left');
    const container = document.getElementById('main-container');

    // --- 拖拽逻辑 (保持不变) ---
    let x = 0;
    let leftWidth = 0;

    const mouseDownHandler = function(e) {
        x = e.clientX;
        const rect = leftPanel.getBoundingClientRect();
        leftWidth = rect.width;

        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        leftPanel.style.pointerEvents = 'none'; // 拖拽时禁用内部事件，防止卡顿
        viewTree.style.pointerEvents = 'none';

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function(e) {
        const dx = e.clientX - x;
        const newWidth = leftWidth + dx;
        // 限制拖拽范围
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
    resizer.addEventListener('mousedown', mouseDownHandler);

    // --- 核心工具函数 ---
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

    const switchView = (mode) => {
        currentMode = mode;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.view === mode));
        if (mode === 'tree') {
            viewTree.style.display = 'block';
            viewRaw.style.display = 'none';
        } else {
            viewTree.style.display = 'none';
            viewRaw.style.display = 'block';
        }
    };

    tabs.forEach(tab => {
        tab.onclick = () => {
            switchView(tab.dataset.view);
            if (tab.dataset.view === 'tree') autoProcess();
        };
    });

    // --- 生成 Tree HTML ---
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

    const escapeHtml = (str) => {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    const autoProcess = () => {
        const val = input.value.trim();
        if (!val) {
            viewTree.innerHTML = '<div style="color:#cbd5e1; text-align:center; margin-top:40px; font-size:12px;">等待输入...</div>';
            viewRaw.value = '';
            updateStatus("就绪");
            return;
        }
        try {
            const obj = JSON.parse(val);
            updateStatus("JSON 有效 ✅");
            viewRaw.value = JSON.stringify(obj, null, 4);
            if (currentMode === 'tree') viewTree.innerHTML = buildTreeHtml(obj);
        } catch (e) {
            if (currentMode === 'tree') viewTree.innerHTML = `<div style="color:#dc2626; padding:10px;">🚫 解析错误:<br>${e.message}</div>`;
            updateStatus(`❌ 语法错误`, true);
        }
    };

    // --- 事件监听 ---
    input.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoProcess, 300);
    });

    document.getElementById('btn-fmt').onclick = () => { switchView('tree'); autoProcess(); };
    document.getElementById('btn-compress').onclick = () => { const obj = getJson(); if (obj) { viewRaw.value = JSON.stringify(obj); switchView('raw'); updateStatus("已压缩"); } };
    document.getElementById('btn-escape').onclick = () => { const val = input.value; if (!val) return; viewRaw.value = JSON.stringify(val).slice(1, -1); switchView('raw'); updateStatus("已转义"); };
    document.getElementById('btn-unescape').onclick = () => { try { const val = input.value; viewRaw.value = JSON.parse(`"${val}"`); switchView('raw'); updateStatus("去转义成功"); } catch (e) { updateStatus("去转义失败", true); } };
    document.getElementById('btn-copy').onclick = () => {
        let text = viewRaw.value || input.value;
        if(!text) return;
        navigator.clipboard.writeText(text).then(() => updateStatus("已复制 ✅"));
    };
    document.getElementById('btn-clear').onclick = () => { input.value = ''; viewRaw.value = ''; viewTree.innerHTML = ''; autoProcess(); updateStatus("已清空"); };
}