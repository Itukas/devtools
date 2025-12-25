export function render() {
    return `
        <style>
            .jwt-container { display: flex; flex-direction: column; gap: 20px; height: 100%; }
            .jwt-input {
                width: 100%; height: 80px; padding: 10px; font-family: monospace; font-size: 13px;
                border: 2px solid #cbd5e1; border-radius: 8px; resize: none; color: #334155;
            }
            .jwt-input:focus { border-color: #8b5cf6; outline: none; }
            
            .parts-container { display: flex; gap: 20px; flex: 1; min-height: 0; }
            .part-box { flex: 1; display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .part-header { 
                padding: 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 14px; 
                display: flex; justify-content: space-between; align-items: center;
            }
            .part-content { 
                flex: 1; padding: 15px; overflow: auto; font-family: 'Menlo', monospace; font-size: 13px; white-space: pre; color: #334155; 
            }
            
            /* JWT Color Coding */
            .jwt-header { color: #dc2626; }
            .jwt-payload { color: #7c3aed; }
            .jwt-signature { color: #059669; }

            .hl-key { color: #800080; font-weight: bold; }
            .hl-str { color: #067d17; }
            .hl-num { color: #0000ff; }
            .hl-val { color: #b22222; font-weight: bold; } /* Enhanced value highlight */
        </style>

        <div class="tool-box jwt-container">
            <div>
                <div style="margin-bottom:5px; font-weight:bold; color:#555;">Encoded Token:</div>
                <textarea id="jwt-input" class="jwt-input" placeholder="Paste JWT here (e.g. eyJhbGciOi...)"></textarea>
            </div>

            <div class="parts-container">
                <div class="part-box" style="border-top: 3px solid #dc2626;">
                    <div class="part-header">
                        <span style="color:#dc2626;">HEADER</span>
                        <span style="font-size:11px; color:#94a3b8;">Algorithm & Token Type</span>
                    </div>
                    <div id="out-header" class="part-content"></div>
                </div>

                <div class="part-box" style="border-top: 3px solid #7c3aed;">
                    <div class="part-header">
                        <span style="color:#7c3aed;">PAYLOAD</span>
                        <span style="font-size:11px; color:#94a3b8;">Data (Time converted)</span>
                    </div>
                    <div id="out-payload" class="part-content"></div>
                </div>
            </div>
            
            <div style="font-size:12px; color:#64748b; text-align:center;">
                🔒 此工具纯前端解析，Token 不会发送到任何服务器，请放心粘贴。
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('jwt-input');
    const outHeader = document.getElementById('out-header');
    const outPayload = document.getElementById('out-payload');

    // Base64URL Decode
    const b64Decode = (str) => {
        try {
            // Replace standard Base64 chars to Base64URL
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            // Pad
            const pad = str.length % 4;
            if (pad) str += '='.repeat(4 - pad);

            return decodeURIComponent(escape(window.atob(str)));
        } catch (e) {
            throw new Error("Invalid Base64");
        }
    };

    // JSON Highlight & Date Convert
    const prettyJson = (obj) => {
        if (!obj) return '';
        // 自动转换时间戳字段
        const timeKeys = ['exp', 'iat', 'nbf', 'auth_time', 'updated_at'];

        let json = JSON.stringify(obj, null, 4);

        // 简单的语法高亮正则
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'hl-num';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'hl-key';
                } else {
                    cls = 'hl-str';
                }
            } else if (/true|false/.test(match)) cls = 'hl-val';
            else if (/null/.test(match)) cls = 'hl-null';

            // 检查是否是时间戳 (如果是数字且 Key 是时间相关)
            // 这是一个简单的后处理 Hack
            return `<span class="${cls}">${match}</span>`;
        }).replace(/"(exp|iat|nbf|auth_time)"\s*:\s*<span class="hl-num">(\d+)<\/span>/g, (match, key, ts) => {
            // 在时间戳后面追加人类可读时间
            const date = new Date(ts * 1000);
            return `"${key}": <span class="hl-num">${ts}</span> <span style="color:#94a3b8; font-style:italic;">// ${date.toLocaleString()}</span>`;
        });
    };

    const parseJwt = () => {
        const token = input.value.trim();
        if (!token) {
            outHeader.innerHTML = '';
            outPayload.innerHTML = '';
            return;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            outHeader.innerHTML = '<span style="color:red">无效的 JWT 格式 (应包含3部分)</span>';
            outPayload.innerHTML = '';
            return;
        }

        try {
            const header = JSON.parse(b64Decode(parts[0]));
            const payload = JSON.parse(b64Decode(parts[1]));

            outHeader.innerHTML = prettyJson(header);
            outPayload.innerHTML = prettyJson(payload);
        } catch (e) {
            outHeader.innerHTML = '<span style="color:red">解析失败: ' + e.message + '</span>';
        }
    };

    input.addEventListener('input', parseJwt);
}