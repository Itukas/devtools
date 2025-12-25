export function render() {
    return `
        <style>
            .json-editor-area { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; }
            .status-ok { color: #16a34a; font-weight: 500; transition: color 0.3s; }
            .status-err { color: #dc2626; font-weight: 500; transition: color 0.3s; }
            
            /* 高亮样式 */
            .hljs-string { color: #067d17; }
            .hljs-number { color: #0000ff; }
            .hljs-boolean { color: #d00b0b; font-weight: bold; }
            .hljs-null { color: #808080; font-weight: bold; }
            .hljs-key { color: #a11; font-weight: bold; }
            
            .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.4); }
            .modal-content { background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-height: 80%; overflow: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .close-modal { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
            .close-modal:hover { color: black; }
        </style>

        <div class="tool-box">
            <div class="btn-group">
                <button id="btn-fmt" title="通常会自动执行，点击强制格式化">手动格式化</button>
                <button id="btn-compress">压缩</button>
                <button id="btn-escape" class="secondary">转义</button>
                <button id="btn-compress-escape" style="background:#8b5cf6;">压缩并转义</button>
                <button id="btn-unescape" class="secondary">去转义</button>
                <button id="btn-view-highlight" style="background:#f59e0b;">👀 高亮预览</button>
                
                <button id="btn-copy" style="margin-left:auto; background:#10b981;">复制结果</button>
                <button id="btn-clear" style="background:#ef4444;">清空</button>
            </div>
            
            <div style="display: flex; gap: 15px; flex: 1; min-height: 0;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #555;">原始 JSON (实时监听输入)</div>
                    <textarea id="json-input" class="json-editor-area" placeholder="在此输入或粘贴 JSON，右侧会自动格式化..."></textarea>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #555;">格式化结果</div>
                    <textarea id="json-output" class="json-editor-area" placeholder="结果将自动显示..." style="background-color: #f8fafc; border-color: #cbd5e1;"></textarea>
                </div>
            </div>

            <div id="status-bar" style="height: 30px; font-size: 14px; display:flex; align-items:center; margin-top: 10px;" class="status-ok">就绪</div>
        </div>

        <div id="highlight-modal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>JSON 高亮预览</h3>
                <pre id="highlight-content" style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace;"></pre>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    const status = document.getElementById('status-bar');
    const modal = document.getElementById('highlight-modal');
    const highlightContent = document.getElementById('highlight-content');

    let debounceTimer = null; // 用于防抖

    // --- 核心工具函数 ---

    const updateStatus = (msg, isError = false) => {
        status.textContent = msg;
        status.className = isError ? 'status-err' : 'status-ok';
    };

    const getJson = (silent = false) => {
        try {
            const val = input.value.trim();
            if (!val) {
                if(!silent) updateStatus("等待输入...", false);
                return null;
            }
            // 尝试解析
            const obj = JSON.parse(val);
            if(!silent) updateStatus("JSON 格式有效 ✅", false);
            return obj;
        } catch (e) {
            if(!silent) updateStatus(`JSON 语法错误: ${e.message}`, true);
            return null;
        }
    };

    // --- 自动格式化逻辑 ---

    const autoFormat = () => {
        const val = input.value.trim();
        if (!val) {
            output.value = '';
            updateStatus("就绪");
            return;
        }

        try {
            const obj = JSON.parse(val);
            // 解析成功：自动格式化并输出
            output.value = JSON.stringify(obj, null, 4);
            updateStatus("JSON 有效 - 已自动格式化 ✅");
        } catch (e) {
            // 解析失败：不清除右侧（方便对比），只报错
            // 或者你可以选择 output.value = '';
            updateStatus(`输入中... (语法错误: ${e.message})`, true);
        }
    };

    // --- 事件监听 ---

    // 1. 监听输入事件 (实现自动处理)
    input.addEventListener('input', () => {
        // 清除上一次的定时器
        if (debounceTimer) clearTimeout(debounceTimer);

        // 设置新的定时器 (300ms 后执行)
        debounceTimer = setTimeout(() => {
            autoFormat();
        }, 300);
    });

    // 2. 按钮功能 (保留按钮用于特定需求)

    // 手动格式化 (虽然有自动，但保留一个按钮用于强制刷新)
    document.getElementById('btn-fmt').onclick = () => {
        autoFormat();
    };

    // 压缩
    document.getElementById('btn-compress').onclick = () => {
        const obj = getJson();
        if (obj) {
            output.value = JSON.stringify(obj);
            updateStatus("已压缩");
        }
    };

    // 转义
    document.getElementById('btn-escape').onclick = () => {
        const val = input.value;
        if (!val) return;
        output.value = JSON.stringify(val).slice(1, -1);
        updateStatus("已转义");
    };

    // 压缩并转义
    document.getElementById('btn-compress-escape').onclick = () => {
        const obj = getJson();
        if (obj) {
            const minified = JSON.stringify(obj);
            output.value = JSON.stringify(minified).slice(1, -1);
            updateStatus("已压缩并转义");
        }
    };

    // 去转义
    document.getElementById('btn-unescape').onclick = () => {
        try {
            const val = input.value;
            if (!val) return;
            output.value = JSON.parse(`"${val}"`);
            updateStatus("已去转义");
        } catch (e) {
            updateStatus("去转义失败，格式不正确", true);
        }
    };

    // 高亮预览
    document.getElementById('btn-view-highlight').onclick = () => {
        // 这里我们优先取 output 的内容(如果已经被压缩了就看压缩的)，
        // 如果 output 空则重新解析 input
        let content = output.value || input.value;
        if (!content) return;

        try {
            const obj = JSON.parse(content);
            const jsonStr = JSON.stringify(obj, null, 4);
            const html = jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'hljs-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'hljs-key';
                    } else {
                        cls = 'hljs-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'hljs-boolean';
                } else if (/null/.test(match)) {
                    cls = 'hljs-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
            highlightContent.innerHTML = html;
            modal.style.display = "block";
        } catch (e) {
            updateStatus("无法预览：内容不是有效的 JSON", true);
        }
    };

    // 模态框关闭
    document.querySelector('.close-modal').onclick = () => {
        modal.style.display = "none";
    };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // 复制与清空
    document.getElementById('btn-copy').onclick = () => {
        if (!output.value) return updateStatus("结果为空", true);
        navigator.clipboard.writeText(output.value).then(() => {
            updateStatus("已复制到剪贴板");
        });
    };

    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
        output.value = '';
        updateStatus("已清空");
    };
}