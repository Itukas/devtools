export function render() {
    return `
        <style>
            .builder-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            
            /* 顶部集合名输入 */
            .collection-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
            }
            .prefix-label { font-family: monospace; font-weight: bold; color: #64748b; font-size: 14px; }
            .coll-input { 
                border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-family: monospace; 
                color: #2563eb; font-weight: bold; width: 200px;
            }
            .coll-input:focus { border-color: #3b82f6; outline: none; }

            /* 查询条件列表区 */
            .filter-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding-right: 5px; 
            }
            
            /* 单行条件样式 */
            .filter-row {
                display: flex;
                gap: 8px;
                align-items: center;
                background: #f8fafc;
                padding: 8px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                transition: all 0.2s;
            }
            .filter-row:hover { border-color: #cbd5e1; background: #f1f5f9; }

            .input-key { flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-family: monospace; }
            .select-type { width: 90px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; background: #fff; cursor: pointer; }
            .input-val { flex: 2; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-family: monospace; }
            
            .btn-del { 
                width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                border: none; background: #fee2e2; color: #ef4444; border-radius: 4px; cursor: pointer; font-weight: bold;
            }
            .btn-del:hover { background: #fecaca; }

            /* 底部操作与结果 */
            .action-area { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
            .btn-add { 
                background: #eff6ff; color: #2563eb; border: 1px dashed #3b82f6; 
                padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
                transition: all 0.2s;
            }
            .btn-add:hover { background: #dbeafe; }

            .result-box {
                margin-top: 15px;
                background: #1e293b;
                color: #e2e8f0;
                padding: 15px;
                border-radius: 8px;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6;
                white-space: pre-wrap;
                word-break: break-all;
                position: relative;
            }
            .copy-btn {
                position: absolute; top: 10px; right: 10px;
                padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: #fff; border-radius: 4px; font-size: 12px; cursor: pointer;
            }
            .copy-btn:hover { background: rgba(255,255,255,0.2); }
        </style>

        <div class="tool-box builder-container">
            <div class="collection-row">
                <span class="prefix-label">db.</span>
                <input type="text" id="coll-name" class="coll-input" value="users" placeholder="collection">
                <span class="prefix-label">.find({</span>
            </div>

            <div id="filter-container" class="filter-list">
                </div>

            <div class="action-area">
                <button id="btn-add-row" class="btn-add">+ 增加查询条件 (Field)</button>
            </div>

            <div class="collection-row" style="border:none; padding-top:10px; padding-bottom:0;">
                <span class="prefix-label">})</span>
            </div>

            <div class="result-box">
                <div id="result-code">db.users.find({})</div>
                <button id="btn-copy" class="copy-btn">复制</button>
            </div>
        </div>
    `;
}

export function init() {
    const collInput = document.getElementById('coll-name');
    const container = document.getElementById('filter-container');
    const btnAdd = document.getElementById('btn-add-row');
    const resultCode = document.getElementById('result-code');
    const btnCopy = document.getElementById('btn-copy');

    // 类型定义
    const TYPES = {
        STRING: 'String',
        NUMBER: 'Number',
        BOOL: 'Boolean',
        OBJECTID: 'ObjectId',
        REGEX: 'RegExp (模糊)',
        NULL: 'Null'
    };

    // --- 核心逻辑：生成代码 ---
    const generate = () => {
        const coll = collInput.value.trim() || 'collection';
        const rows = container.querySelectorAll('.filter-row');

        const parts = [];

        rows.forEach(row => {
            const key = row.querySelector('.input-key').value.trim();
            const type = row.querySelector('.select-type').value;
            const valInput = row.querySelector('.input-val');
            let val = valInput ? valInput.value : ''; // Null类型没有input

            if (!key) return; // 跳过空key

            let formattedVal;

            switch (type) {
                case 'STRING':
                    formattedVal = `"${val}"`;
                    break;
                case 'NUMBER':
                    formattedVal = val === '' ? '0' : val; // 简单处理
                    break;
                case 'BOOL':
                    formattedVal = (val === 'true' || val === '1') ? 'true' : 'false';
                    break;
                case 'OBJECTID':
                    formattedVal = `ObjectId("${val}")`;
                    break;
                case 'REGEX':
                    // 简单的模糊查询生成 /val/
                    formattedVal = `/${val}/`;
                    break;
                case 'NULL':
                    formattedVal = 'null';
                    break;
                default:
                    formattedVal = `"${val}"`;
            }

            parts.push(`    "${key}": ${formattedVal}`);
        });

        const queryBody = parts.length > 0 ? `\n${parts.join(',\n')}\n` : '';
        const finalStr = `db.${coll}.find({${queryBody}})`;

        resultCode.textContent = finalStr;
    };

    // --- 核心逻辑：添加行 ---
    const addRow = (key = '', val = '') => {
        const row = document.createElement('div');
        row.className = 'filter-row';

        // 字段名输入
        const inputKey = document.createElement('input');
        inputKey.type = 'text';
        inputKey.className = 'input-key';
        inputKey.placeholder = '字段名 (key)';
        inputKey.value = key;
        inputKey.addEventListener('input', generate);

        // 类型选择
        const selectType = document.createElement('select');
        selectType.className = 'select-type';
        for (let t in TYPES) {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = TYPES[t];
            selectType.appendChild(opt);
        }
        selectType.addEventListener('change', () => {
            // 类型改变时，可能需要改变值的输入控件（比如 Boolean 变成下拉，Null 隐藏输入）
            // 这里为了简化代码，除了 Null 外统一用 Text 输入，但在 generate 里处理
            if (selectType.value === 'NULL') {
                inputValue.style.visibility = 'hidden';
            } else if (selectType.value === 'BOOL') {
                inputValue.placeholder = 'true / false';
                inputValue.style.visibility = 'visible';
            } else {
                inputValue.placeholder = '字段值';
                inputValue.style.visibility = 'visible';
            }
            generate();
        });

        // 字段值输入
        const inputValue = document.createElement('input');
        inputValue.type = 'text';
        inputValue.className = 'input-val';
        inputValue.placeholder = '字段值';
        inputValue.value = val;
        inputValue.addEventListener('input', generate);

        // 删除按钮
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-del';
        btnDel.innerHTML = '×';
        btnDel.title = '删除此条件';
        btnDel.onclick = () => {
            container.removeChild(row);
            generate();
        };

        row.appendChild(inputKey);
        row.appendChild(selectType);
        row.appendChild(inputValue);
        row.appendChild(btnDel);

        container.appendChild(row);

        // 自动聚焦新行的key
        inputKey.focus();

        generate(); // 刷新一次
    };

    // --- 事件绑定 ---
    btnAdd.onclick = () => addRow();
    collInput.addEventListener('input', generate);

    // 复制功能
    btnCopy.onclick = () => {
        navigator.clipboard.writeText(resultCode.textContent).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '已复制';
            setTimeout(() => btnCopy.textContent = old, 1000);
        });
    };

    // 初始化：默认加一行空的
    addRow('_id', '');
}