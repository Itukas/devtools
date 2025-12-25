export function render() {
    return `
        <style>
            .sql-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            .action-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
            
            /* 输入区 */
            .input-area {
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                white-space: pre;
                overflow: auto;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px;
                min-height: 150px;
                resize: vertical;
            }

            /* 输出表格区 */
            .table-wrapper {
                flex: 1;
                overflow: auto;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: #fff;
            }
            
            .result-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                font-family: sans-serif;
            }
            .result-table th, .result-table td {
                border: 1px solid #e2e8f0;
                padding: 8px 12px;
                text-align: left;
                vertical-align: top;
            }
            .result-table th {
                background-color: #f8fafc;
                font-weight: 600;
                color: #334155;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            .result-table tr:nth-child(even) { background-color: #fcfcfc; }
            .result-table tr:hover { background-color: #f1f5f9; }

            /* JSON 内容简单高亮 */
            .json-cell {
                font-family: monospace;
                font-size: 12px;
                color: #059669;
                max-width: 300px;
                word-break: break-all;
                white-space: pre-wrap;
            }
            
            .empty-tip {
                text-align: center;
                color: #94a3b8;
                margin-top: 50px;
                font-size: 14px;
            }
        </style>

        <div class="tool-box sql-container">
            <div style="font-weight:bold; color:#555;">粘贴 MySQL/MariaDB 查询结果 (ASCII 格式):</div>
            
            <textarea id="sql-input" class="input-area" placeholder="+-----+-------------+\n| id  | name        |\n+-----+-------------+\n| 1   | Example     |\n+-----+-------------+"></textarea>

            <div class="action-bar">
                <button id="btn-parse" style="background:#2563eb;">⚡ 解析并预览</button>
                <button id="btn-copy-csv" class="secondary">📄 复制 CSV</button>
                <button id="btn-copy-json" class="secondary">📦 复制 JSON</button>
                <button id="btn-clear" class="secondary" style="background:#ef4444; margin-left:auto;">清空</button>
            </div>

            <div id="output-area" class="table-wrapper">
                <div class="empty-tip">等待解析...</div>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('sql-input');
    const outputDiv = document.getElementById('output-area');
    const btnParse = document.getElementById('btn-parse');
    const btnCsv = document.getElementById('btn-copy-csv');
    const btnJson = document.getElementById('btn-copy-json');

    let parsedData = { headers: [], rows: [] };

    // --- 核心解析逻辑 ---
    const parseASCII = (text) => {
        if (!text.trim()) return null;

        const lines = text.trim().split('\n');
        const headers = [];
        const rows = [];
        let isHeaderFound = false;

        // 过滤掉边框行 (以 + 开头)
        const contentLines = lines.filter(line => !line.trim().startsWith('+'));

        if (contentLines.length === 0) return null;

        contentLines.forEach((line, index) => {
            // 移除首尾的 |
            const cleanLine = line.trim().replace(/^\||\|$/g, '');
            // 按 | 分割
            const cols = cleanLine.split('|').map(col => col.trim());

            if (index === 0) {
                // 第一行认为是表头
                headers.push(...cols);
            } else {
                // 数据行
                rows.push(cols);
            }
        });

        return { headers, rows };
    };

    // --- 渲染表格 ---
    const renderTable = (data) => {
        if (!data || data.headers.length === 0) {
            outputDiv.innerHTML = '<div class="empty-tip">无法识别表格格式，请确保包含边框(+---+)或分隔符(|)</div>';
            return;
        }

        let html = '<table class="result-table"><thead><tr>';

        // 渲染表头
        data.headers.forEach(h => {
            html += `<th>${escapeHtml(h)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // 渲染数据
        data.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                // 尝试检测是否为 JSON 字符串，如果是，美化显示
                let displayContent = escapeHtml(cell);
                if (cell.startsWith('{') && cell.endsWith('}')) {
                    try {
                        // 校验是否为有效JSON
                        JSON.parse(cell);
                        displayContent = `<div class="json-cell">${escapeHtml(cell)}</div>`;
                    } catch(e) {}
                }
                html += `<td>${displayContent}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        outputDiv.innerHTML = html;
    };

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    // --- 事件处理 ---

    const handleParse = () => {
        const text = input.value;
        const result = parseASCII(text);
        if (result) {
            parsedData = result;
            renderTable(result);
        } else {
            parsedData = { headers: [], rows: [] };
            outputDiv.innerHTML = '<div class="empty-tip">请输入有效的内容</div>';
        }
    };

    // 自动解析 (防抖)
    let timer = null;
    input.addEventListener('input', () => {
        if(timer) clearTimeout(timer);
        timer = setTimeout(handleParse, 500);
    });

    btnParse.onclick = handleParse;

    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
        parsedData = { headers: [], rows: [] };
        outputDiv.innerHTML = '<div class="empty-tip">等待解析...</div>';
    };

    // 导出 CSV
    btnCsv.onclick = () => {
        if (parsedData.headers.length === 0) return alert("没有数据可复制");

        let csvContent = parsedData.headers.join(',') + '\n';
        parsedData.rows.forEach(row => {
            // 处理包含逗号的内容，包裹引号
            const processedRow = row.map(cell => {
                if (cell.includes(',') || cell.includes('"')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            });
            csvContent += processedRow.join(',') + '\n';
        });

        navigator.clipboard.writeText(csvContent).then(() => {
            const originText = btnCsv.textContent;
            btnCsv.textContent = '✅ 已复制';
            setTimeout(() => btnCsv.textContent = originText, 1000);
        });
    };

    // 导出 JSON
    btnJson.onclick = () => {
        if (parsedData.headers.length === 0) return alert("没有数据可复制");

        const jsonArr = parsedData.rows.map(row => {
            let obj = {};
            parsedData.headers.forEach((key, i) => {
                // 尝试解析单元格内的 JSON 字符串，变成真正的对象
                let val = row[i];
                try {
                    if (val.startsWith('{') || val.startsWith('[')) {
                        val = JSON.parse(val);
                    }
                } catch(e) {}
                obj[key] = val;
            });
            return obj;
        });

        const jsonStr = JSON.stringify(jsonArr, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            const originText = btnJson.textContent;
            btnJson.textContent = '✅ 已复制';
            setTimeout(() => btnJson.textContent = originText, 1000);
        });
    };
}