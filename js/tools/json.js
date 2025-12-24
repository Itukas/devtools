export function render() {
    return `
        <style>
            /* 增加一些工具独有的样式 */
            .json-editor-area { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; }
            /* 简单的高亮样式 */
            .hljs-string { color: #067d17; }
            .hljs-number { color: #0000ff; }
            .hljs-boolean { color: #d00b0b; font-weight: bold; }
            .hljs-null { color: #808080; font-weight: bold; }
            .hljs-key { color: #a11; font-weight: bold; }
            
            /* 模态框样式 */
            .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.4); }
            .modal-content { background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-height: 80%; overflow: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .close-modal { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
            .close-modal:hover { color: black; }
        </style>

        <div class="tool-box">
            <div class="btn-group">
                <button id="btn-fmt">格式化 (Pretty)</button>
                <button id="btn-compress">压缩 (Minify)</button>
                <button id="btn-escape" class="secondary">转义</button>
                <button id="btn-compress-escape" style="background:#8b5cf6;">压缩并转义</button>
                <button id="btn-unescape" class="secondary">去转义</button>
                <button id="btn-view-highlight" style="background:#f59e0b;">👀 高亮预览</button>
                
                <button id="btn-copy" style="margin-left:auto; background:#10b981;">复制结果</button>
                <button id="btn-clear" style="background:#ef4444;">清空</button>
            </div>
            
            <div style="display: flex; gap: 15px; flex: 1; min-height: 0;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #555;">原始 JSON (Input)</div>
                    <textarea id="json-input" class="json-editor-area" placeholder="在此粘贴原始 JSON..."></textarea>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #555;">处理结果 (Output)</div>
                    <textarea id="json-output" class="json-editor-area" placeholder="结果将显示在这里..." style="background-color: #f8fafc; border-color: #cbd5e1;"></textarea>
                </div>
            </div>

            <div id="status-bar" style="height: 30px; color: #666; font-size: 14px; display:flex; align-items:center; margin-top: 10px;">就绪</div>
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

    const showMsg = (msg, isError = false) => {
        status.textContent = msg;
        status.style.color = isError ? '#dc2626' : '#16a34a';
    };

    const getJson = () => {
        try {
            const val = input.value.trim();
            if (!val) throw new Error("输入内容为空");
            return JSON.parse(val);
        } catch (e) {
            showMsg(`JSON 解析失败: ${e.message}`, true);
            return null;
        }
    };

    // 1. 格式化
    document.getElementById('btn-fmt').onclick = () => {
        const obj = getJson();
        if (obj) {
            output.value = JSON.stringify(obj, null, 4);
            showMsg("格式化成功");
        }
    };

    // 2. 压缩
    document.getElementById('btn-compress').onclick = () => {
        const obj = getJson();
        if (obj) {
            output.value = JSON.stringify(obj);
            showMsg("压缩成功");
        }
    };

    // 3. 转义 (仅对字符串转义)
    document.getElementById('btn-escape').onclick = () => {
        const val = input.value;
        if (!val) return showMsg("请输入内容", true);
        output.value = JSON.stringify(val).slice(1, -1);
        showMsg("转义成功");
    };

    // 4. [新功能] 压缩并转义
    document.getElementById('btn-compress-escape').onclick = () => {
        const obj = getJson(); // 先解析确保 JSON 合法
        if (obj) {
            const minified = JSON.stringify(obj); // 先压缩
            // 再转义: 将压缩后的字符串作为值再次 stringify，然后去掉前后的引号
            output.value = JSON.stringify(minified).slice(1, -1);
            showMsg("压缩并转义成功");
        }
    };

    // 5. 去转义
    document.getElementById('btn-unescape').onclick = () => {
        try {
            const val = input.value;
            if (!val) return showMsg("请输入内容", true);
            output.value = JSON.parse(`"${val}"`);
            showMsg("去转义成功");
        } catch (e) {
            showMsg("去转义失败，格式不正确", true);
        }
    };

    // 6. [新功能] 高亮预览
    document.getElementById('btn-view-highlight').onclick = () => {
        const obj = getJson();
        if (!obj) return; // 如果解析失败就不弹窗

        // 简单的语法高亮逻辑
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
    };

    // 模态框关闭逻辑
    document.querySelector('.close-modal').onclick = () => {
        modal.style.display = "none";
    };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // 7. 复制 & 清空
    document.getElementById('btn-copy').onclick = () => {
        if (!output.value) return showMsg("结果为空", true);
        navigator.clipboard.writeText(output.value).then(() => {
            showMsg("结果已复制到剪贴板");
        });
    };

    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
        output.value = '';
        showMsg("已清空");
    };
}