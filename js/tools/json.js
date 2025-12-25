export function render() {
    return `
        <style>
            .json-editor-area { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; resize: none; }
            
            /* 状态栏样式 */
            .status-ok { color: #16a34a; font-weight: 500; transition: color 0.3s; }
            .status-err { color: #dc2626; font-weight: 500; transition: color 0.3s; }

            /* 视图切换 Tabs */
            .view-tabs { display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 0; background: #f1f5f9; border-top-left-radius: 6px; border-top-right-radius: 6px; overflow: hidden; }
            .view-tab { padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: bold; color: #64748b; background: transparent; border: none; border-right: 1px solid #e2e8f0; transition: all 0.2s; }
            .view-tab:hover { background: #e2e8f0; }
            .view-tab.active { background: #fff; color: #2563eb; border-bottom: 2px solid #2563eb; }

            /* --- JSON 树形视图核心样式 --- */
            .json-tree-container {
                flex: 1;
                overflow: auto;
                padding: 15px;
                background-color: #fff; /* 改为白色背景更清爽 */
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.6;
                border: 1px solid #cbd5e1;
                border-top: none;
                border-bottom-left-radius: 6px;
                border-bottom-right-radius: 6px;
            }
            
            /* 隐藏原生的 details 三角形 */
            details > summary { list-style: none; cursor: pointer; outline: none; }
            details > summary::-webkit-details-marker { display: none; }
            
            /* 自定义箭头 */
            details > summary::before {
                content: '▶';
                display: inline-block;
                font-size: 10px;
                width: 14px;
                transition: transform 0.2s;
                color: #94a3b8;
            }
            details[open] > summary::before { transform: rotate(90deg); }

            /* 语法高亮配色 (IntelliJ IDEA Light 风格) */
            .j-key { color: #800080; font-weight: bold; } /* Key 紫色 */
            .j-str { color: #067d17; } /* String 绿色 */
            .j-num { color: #0000ff; } /* Number 蓝色 */
            .j-bool { color: #b22222; font-weight: bold; } /* Bool 红色 */
            .j-null { color: #808080; font-weight: bold; } /* Null 灰色 */
            .j-syntax { color: #333; } /* 标点符号 */
            .j-meta { color: #94a3b8; font-size: 12px; margin-left: 5px; user-select: none; } /* 元数据(如 Array[3]) */

            /* 缩进线辅助 (可选) */
            details div { padding-left: 20px; border-left: 1px solid #f1f5f9; }
            
            /* 鼠标悬停高亮行 */
            summary:hover { background-color: #f8fafc; }
        </style>

        <div class="tool-box">
            <div class="btn-group">
                <button id="btn-fmt" title="格式化并查看树形结构">🌲 格式化 (Tree)</button>
                <button id="btn-compress">压缩</button>
                <button id="btn-escape" class="secondary">转义</button>
                <button id="btn-compress-escape" style="background:#8b5cf6;">压缩并转义</button>
                <button id="btn-unescape" class="secondary">去转义</button>
                
                <button id="btn-copy" style="margin-left:auto; background:#10b981;">复制结果</button>
                <button id="btn-clear" style="background:#ef4444;">清空</button>
            </div>
            
            <div style="display: flex; gap: 15px; flex: 1; min-height: 0;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #555;">输入 (Input)</div>
                    <textarea id="json-input" class="json-editor-area" style="flex:1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px;" placeholder="在此输入或粘贴 JSON，右侧自动解析..."></textarea>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="margin-bottom: 5px; font-weight: bold; color: #555;">结果 (Output)</div>
                        <div class="view-tabs">
                            <button class="view-tab active" data-view="tree">🌲 树形视图</button>
                            <button class="view-tab" data-view="raw">📝 源码视图</button>
                        </div>
                    </div>
                    
                    <div id="view-tree" class="json-tree-container">
                        <div style="color:#94a3b8; text-align:center; margin-top:20px;">等待输入...</div>
                    </div>
                    
                    <textarea id="view-raw" class="json-editor-area" style="display:none; flex:1; background-color: #f8fafc; border: 1px solid #cbd5e1; border-top:none; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 10px;" readonly></textarea>
                </div>
            </div>

            <div id="status-bar" style="height: 30px; font-size: 14px; display:flex; align-items:center; margin-top: 10px;" class="status-ok">就绪</div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('json-input');
    const viewTree = document.getElementById('view-tree');
    const viewRaw = document.getElementById('view-raw');
    const status = document.getElementById('status-bar');
    const tabs = document.querySelectorAll('.view-tab');

    let debounceTimer = null;
    let currentMode = 'tree'; // 'tree' or 'raw'

    // --- 核心工具函数 ---

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

    // --- 切换视图逻辑 ---
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
            // 切换时重新渲染当前内容
            if (tab.dataset.view === 'tree') autoProcess();
            // 如果切到 raw，内容通常已经同步，或者是压缩后的内容，无需重置
        };
    });

    // --- 🌳 递归生成 JSON 树 HTML ---
    // 这是实现折叠/展开的核心
    const buildTreeHtml = (data) => {
        if (data === null) return `<span class="j-null">null</span>`;
        if (typeof data === 'boolean') return `<span class="j-bool">${data}</span>`;
        if (typeof data === 'number') return `<span class="j-num">${data}</span>`;
        if (typeof data === 'string') return `<span class="j-str">"${escapeHtml(data)}"</span>`;

        // 处理数组
        if (Array.isArray(data)) {
            if (data.length === 0) return `<span class="j-syntax">[]</span>`;

            let html = `<details open><summary><span class="j-syntax">[</span><span class="j-meta">Array(${data.length})</span></summary><div>`;
            data.forEach((item, index) => {
                html += `<div>${buildTreeHtml(item)}${index < data.length - 1 ? '<span class="j-syntax">,</span>' : ''}</div>`;
            });
            html += `</div><span class="j-syntax">]</span></details>`;
            return html;
        }

        // 处理对象
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length === 0) return `<span class="j-syntax">{}</span>`;

            let html = `<details open><summary><span class="j-syntax">{</span><span class="j-meta">Object{${keys.length}}</span></summary><div>`;
            keys.forEach((key, index) => {
                html += `<div>
                    <span class="j-key">"${escapeHtml(key)}"</span><span class="j-syntax">: </span>
                    ${buildTreeHtml(data[key])}
                    ${index < keys.length - 1 ? '<span class="j-syntax">,</span>' : ''}
                </div>`;
            });
            html += `</div><span class="j-syntax">}</span></details>`;
            return html;
        }

        return String(data);
    };

    const escapeHtml = (str) => {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    // --- 自动处理逻辑 ---
    const autoProcess = () => {
        const val = input.value.trim();
        if (!val) {
            viewTree.innerHTML = '<div style="color:#94a3b8; text-align:center; margin-top:20px;">等待输入...</div>';
            viewRaw.value = '';
            updateStatus("就绪");
            return;
        }

        try {
            const obj = JSON.parse(val);
            updateStatus("JSON 有效 ✅");

            // 1. 更新 Raw View (始终保持格式化文本，方便复制)
            // 如果用户之前做了压缩，这里输入变动后，Raw View 也会变回 Pretty 格式
            // 除非我们在 Raw 模式下不自动刷新? 还是保持统一比较好
            const prettyJson = JSON.stringify(obj, null, 4);
            viewRaw.value = prettyJson;

            // 2. 更新 Tree View (仅在 Tree 模式下渲染以节省性能，或者总是渲染)
            if (currentMode === 'tree') {
                viewTree.innerHTML = buildTreeHtml(obj);
            }
        } catch (e) {
            // 解析失败
            if (currentMode === 'tree') {
                // 树形图显示错误提示
                viewTree.innerHTML = `<div style="color:#dc2626;">解析错误: ${e.message}</div>`;
            }
            // Raw view 保持显示原始文本 (或者不更新)
            updateStatus(`语法错误: ${e.message}`, true);
        }
    };

    // --- 事件监听 ---

    input.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoProcess, 300);
    });

    // 格式化按钮 (强制刷新树形视图)
    document.getElementById('btn-fmt').onclick = () => {
        switchView('tree');
        autoProcess();
    };

    // 压缩 (自动切到 Raw 视图)
    document.getElementById('btn-compress').onclick = () => {
        const obj = getJson();
        if (obj) {
            viewRaw.value = JSON.stringify(obj);
            switchView('raw'); // 压缩结果只能在文本模式看
            updateStatus("已压缩 (切换到源码视图)");
        }
    };

    // 转义 (自动切到 Raw 视图)
    document.getElementById('btn-escape').onclick = () => {
        const val = input.value;
        if (!val) return;
        viewRaw.value = JSON.stringify(val).slice(1, -1);
        switchView('raw');
        updateStatus("已转义");
    };

    document.getElementById('btn-compress-escape').onclick = () => {
        const obj = getJson();
        if (obj) {
            const minified = JSON.stringify(obj);
            viewRaw.value = JSON.stringify(minified).slice(1, -1);
            switchView('raw');
            updateStatus("已压缩并转义");
        }
    };

    document.getElementById('btn-unescape').onclick = () => {
        try {
            const val = input.value;
            viewRaw.value = JSON.parse(`"${val}"`); // 简易去转义
            // 尝试解析一下去转义后的内容，如果是 JSON，则可以让用户切回树形
            try {
                const innerObj = JSON.parse(viewRaw.value);
                // 此时 input 没变，但 output 变了。如果用户想看 Tree，应该把 output 反填回 input?
                // 这是一个常见 UX 问题。这里我们简单处理：只显示在 Raw View
                updateStatus("去转义成功 (结果在源码视图)");
                switchView('raw');
            } catch(e) {
                switchView('raw');
                updateStatus("去转义成功 (纯文本)");
            }
        } catch (e) {
            updateStatus("去转义失败", true);
        }
    };

    // 复制 (复制 Raw View 的内容，因为那是文本)
    document.getElementById('btn-copy').onclick = () => {
        // 如果当前是 Tree 模式，我们复制的是背后的 Pretty JSON
        let textToCopy = viewRaw.value;

        // 如果 raw 为空(可能从未切换过)，但 tree 有内容，重新生成一下
        if (!textToCopy && input.value) {
            try {
                textToCopy = JSON.stringify(JSON.parse(input.value), null, 4);
            } catch(e) {}
        }

        if (!textToCopy) return updateStatus("结果为空", true);

        navigator.clipboard.writeText(textToCopy).then(() => {
            updateStatus("已复制结果");
        });
    };

    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
        viewRaw.value = '';
        viewTree.innerHTML = '<div style="color:#94a3b8; text-align:center; margin-top:20px;">等待输入...</div>';
        updateStatus("已清空");
    };
}