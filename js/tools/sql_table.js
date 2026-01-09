export function render() {
    return `
        <style>
            .sql-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            
            /* 工具栏 */
            .action-bar {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
                background: #f8fafc;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }

            /* 输入区 */
            .input-area {
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                white-space: pre;
                overflow: auto;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px;
                height: 150px; /* 固定高度 */
                resize: vertical;
            }

            /* 配置行（新增） */
            .config-row {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 13px;
                color: #475569;
            }
            .table-name-input {
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                padding: 4px 8px;
                width: 150px;
                font-family: monospace;
            }

            /* 输出表格区 */
            .table-wrapper {
                flex: 1;
                overflow: auto;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: #fff;
                position: relative;
            }
            
            .result-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                font-family: sans-serif;
                min-width: 600px;
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
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                color: #94a3b8; font-size: 14px; text-align: center;
            }

            /* 按钮样式 */
            .btn {
                padding: 6px 12px;
                border-radius: 4px;
                border: 1px solid #cbd5e1;
                background: #fff;
                cursor: pointer;
                font-size: 12px;
                color: #334155;
                transition: all 0.1s;
            }
            .btn:hover { background: #f1f5f9; border-color: #94a3b8; }
            .btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
            .btn.primary:hover { background: #1d4ed8; }
            .btn.danger { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
            .btn.danger:hover { background: #fecaca; }

        </style>

        <div class="tool-box sql-container">
            <div style="font-weight:bold; color:#555;">粘贴 MySQL/MariaDB 查询结果 (ASCII 格式):</div>
            
            <textarea id="sql-input" class="input-area" placeholder="+-----+-------------+\n| id  | name        |\n+-----+-------------+\n| 1   | Example     |\n+-----+-------------+"></textarea>

            <div class="action-bar">
                <div class="config-row">
                    <span>表名:</span>
                    <input type="text" id="table-name" class="table-name-input" value="my_table" placeholder="table_name">
                </div>
                <div style="width: 1px; height: 20px; background: #e2e8f0; margin: 0 5px;"></div>
                
                <button id="btn-copy-csv" class="btn">📄 CSV</button>
                <button id="btn-copy-json" class="btn">📦 JSON</button>
                <button id="btn-copy-insert" class="btn primary">📥 复制 Insert</button>
                
                <button id="btn-clear" class="btn danger" style="margin-left:auto;">清空</button>
            </div>
            
            <div style="font-size:12px; color:#64748b; margin-top:-10px; margin-bottom:5px;">
                * 自动识别数字和字符串，空值视为 NULL
            </div>

            <div id="output-area" class="table-wrapper">
                <div class="empty-tip">等待输入...</div>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('sql-input');
    const outputDiv = document.getElementById('output-area');
    const tableNameInput = document.getElementById('table-name');

    const btnCsv = document.getElementById('btn-copy-csv');
    const btnJson = document.getElementById('btn-copy-json');
    const btnInsert = document.getElementById('btn-copy-insert');
    const btnClear = document.getElementById('btn-clear');

    let parsedData = { headers: [], rows: [] };

    // --- 核心解析逻辑 ---
    const parseASCII = (text) => {
        if (!text.trim()) return null;

        const lines = text.trim().split('\n');
        const headers = [];
        const rows = [];

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
            outputDiv.innerHTML = '<div class="empty-tip">无法识别表格格式<br>请确保包含分隔符 |</div>';
            return;
        }

        let html = '<table class="result-table"><thead><tr>';
        data.headers.forEach(h => html += `<th>${escapeHtml(h)}</th>`);
        html += '</tr></thead><tbody>';

        data.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                let displayContent = escapeHtml(cell);
                // 简单 JSON 检测
                if ((cell.startsWith('{') && cell.endsWith('}')) || (cell.startsWith('[') && cell.endsWith(']'))) {
                    try { JSON.parse(cell); displayContent = `<div class="json-cell">${escapeHtml(cell)}</div>`; } catch(e) {}
                }
                if (cell === '' || cell === 'NULL') {
                    displayContent = '<span style="color:#94a3b8; font-style:italic;">NULL</span>';
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

    // --- 自动处理 ---
    const handleParse = () => {
        const text = input.value;
        const result = parseASCII(text);
        if (result) {
            parsedData = result;
            renderTable(result);
        } else {
            parsedData = { headers: [], rows: [] };
            if(text.trim()) outputDiv.innerHTML = '<div class="empty-tip">格式错误</div>';
            else outputDiv.innerHTML = '<div class="empty-tip">等待输入...</div>';
        }
    };

    let timer = null;
    input.addEventListener('input', () => {
        if(timer) clearTimeout(timer);
        timer = setTimeout(handleParse, 300);
    });

    btnClear.onclick = () => {
        input.value = '';
        parsedData = { headers: [], rows: [] };
        outputDiv.innerHTML = '<div class="empty-tip">等待输入...</div>';
    };

    // --- 复制功能封装 ---
    const copyToClipboard = (text, btn) => {
        if (!text) return alert("没有内容可复制");
        navigator.clipboard.writeText(text).then(() => {
            const originText = btn.textContent;
            btn.textContent = '✅ 已复制';
            btn.style.borderColor = '#16a34a';
            btn.style.color = '#16a34a';
            setTimeout(() => {
                btn.textContent = originText;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 1000);
        });
    };

    // 1. CSV
    btnCsv.onclick = () => {
        if (parsedData.headers.length === 0) return;
        let content = parsedData.headers.join(',') + '\n';
        parsedData.rows.forEach(row => {
            content += row.map(cell => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',') + '\n';
        });
        copyToClipboard(content, btnCsv);
    };

    // 2. JSON
    btnJson.onclick = () => {
        if (parsedData.headers.length === 0) return;
        const arr = parsedData.rows.map(row => {
            let obj = {};
            parsedData.headers.forEach((k, i) => {
                let val = row[i];
                if (val === 'NULL') val = null;
                // 尝试转数字
                if (!isNaN(val) && val !== '' && val !== null && !val.startsWith('0')) val = Number(val);
                // 尝试转JSON对象
                try { if(val && (val.startsWith('{')||val.startsWith('['))) val = JSON.parse(val); } catch(e){}
                obj[k] = val;
            });
            return obj;
        });
        copyToClipboard(JSON.stringify(arr, null, 2), btnJson);
    };

    // 3. Insert 语句 (核心功能)
    btnInsert.onclick = () => {
        if (parsedData.headers.length === 0) return;

        const tableName = tableNameInput.value.trim() || 'my_table';
        const cols = parsedData.headers.map(h => `\`${h}\``).join(', '); // 加反引号防关键字

        // 生成批量 Insert 语句
        // 格式: INSERT INTO `table` (`col1`, `col2`) VALUES (val1, val2), (val3, val4);

        let sql = `INSERT INTO \`${tableName}\` (${cols}) VALUES\n`;

        const valueRows = parsedData.rows.map(row => {
            const values = row.map(cell => {
                // 处理 NULL
                if (cell === 'NULL' || cell === undefined) return 'NULL';

                // 处理数字 (简单的判断：纯数字且不以0开头(除非是0本身))
                // 注意：身份证号、电话号码等长数字可能被当成数字处理，导致精度丢失或格式错误。
                // 保险起见，只有非常像数字的才转，或者默认全字符串？
                // 这里采用一个折中方案：如果是纯数字且长度<16，视为数字；否则视为字符串。

                const isNum = /^-?\d+(\.\d+)?$/.test(cell) && cell.length < 16 && !(cell.length > 1 && cell.startsWith('0') && !cell.startsWith('0.'));

                if (isNum) {
                    return cell;
                } else {
                    // 字符串：转义单引号
                    return `'${cell.replace(/'/g, "\\'")}'`;
                }
            });
            return `(${values.join(', ')})`;
        });

        sql += valueRows.join(',\n') + ';';

        copyToClipboard(sql, btnInsert);
    };
}