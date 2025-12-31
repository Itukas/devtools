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
                gap: 5px;
                align-items: center;
                background: #f8fafc;
                padding: 8px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                transition: all 0.2s;
            }
            .filter-row:hover { border-color: #cbd5e1; background: #f1f5f9; }

            .input-key { flex: 2; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-family: monospace; min-width: 80px; }
            .select-op { flex: 1.5; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; background: #fff; cursor: pointer; min-width: 90px; color: #b45309; font-weight: 500; }
            .select-type { flex: 1.2; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; background: #fff; cursor: pointer; min-width: 80px; color: #059669; }
            .input-val { flex: 3; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-family: monospace; min-width: 100px; }
            
            .btn-del { 
                width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
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
                flex: 0 0 auto; /* 防止被挤压 */
                max-height: 300px;
                overflow-y: auto;
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
                <button id="btn-add-row" class="btn-add">+ 增加查询条件</button>
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

    // 数据类型
    const TYPES = {
        STRING: 'String',
        NUMBER: 'Number',
        BOOL: 'Boolean',
        OBJECTID: 'ObjectId',
        REGEX: 'RegExp',
        NULL: 'Null'
    };

    // 操作符定义
    const OPERATORS = {
        EQ: { label: '= (等于)', val: '$eq' },
        NE: { label: '!= ($ne)', val: '$ne' },
        GT: { label: '> ($gt)', val: '$gt' },
        GTE: { label: '>= ($gte)', val: '$gte' },
        LT: { label: '< ($lt)', val: '$lt' },
        LTE: { label: '<= ($lte)', val: '$lte' },
        IN: { label: 'In ($in)', val: '$in' },
        NIN: { label: 'Not In ($nin)', val: '$nin' },
        EXISTS: { label: 'Exists ($exists)', val: '$exists' },
        REGEX: { label: 'Regex ($regex)', val: '$regex' }
    };

    // --- 辅助：格式化单个值 ---
    const formatSingleValue = (val, type) => {
        switch (type) {
            case 'STRING': return `"${val}"`;
            case 'NUMBER': return val === '' ? '0' : val;
            case 'BOOL': return (val === 'true' || val === '1') ? 'true' : 'false';
            case 'OBJECTID': return `ObjectId("${val}")`;
            case 'REGEX': return `/${val}/`; // 简单正则字面量
            case 'NULL': return 'null';
            default: return `"${val}"`;
        }
    };

    // --- 核心逻辑：生成代码 ---
    const generate = () => {
        const coll = collInput.value.trim() || 'collection';
        const rows = container.querySelectorAll('.filter-row');

        const parts = [];

        rows.forEach(row => {
            const key = row.querySelector('.input-key').value.trim();
            const op = row.querySelector('.select-op').value;
            const type = row.querySelector('.select-type').value;
            const valInput = row.querySelector('.input-val');
            let rawVal = valInput ? valInput.value : '';

            if (!key) return; // 跳过空key

            let finalValueStr = '';

            // 特殊处理数组类型操作符 ($in, $nin)
            if (op === 'IN' || op === 'NIN') {
                // 按逗号分割，并分别格式化
                const arrValues = rawVal.split(/[,，]/).map(v => v.trim()).filter(v => v !== '');
                const formattedArr = arrValues.map(v => formatSingleValue(v, type)).join(', ');
                finalValueStr = `[${formattedArr}]`;
            }
            // 特殊处理 Exists
            else if (op === 'EXISTS') {
                // 如果用户输入了 true/false，尊重用户；否则默认 true
                const lowerVal = rawVal.toLowerCase();
                if (lowerVal === 'false' || lowerVal === '0') finalValueStr = 'false';
                else finalValueStr = 'true';
            }
            // 标准单值处理
            else {
                finalValueStr = formatSingleValue(rawVal, type);
            }

            // 组装最终条件字符串
            if (op === 'EQ') {
                // 简化写法: { key: value }
                parts.push(`    "${key}": ${finalValueStr}`);
            } else if (op === 'REGEX') {
                // 显式正则: { key: { $regex: 'val', $options: 'i' } }
                // 为了简单，这里还是推荐用 RegExp 类型配合 EQ，或者生成标准对象
                // 如果用户选了 Op=Regex，我们生成 { $regex: "val", $options: "i" }
                parts.push(`    "${key}": { "$regex": "${rawVal}", "$options": "i" }`);
            } else {
                // 标准操作符: { key: { $op: value } }
                parts.push(`    "${key}": { "${OPERATORS[op].val}": ${finalValueStr} }`);
            }
        });

        const queryBody = parts.length > 0 ? `\n${parts.join(',\n')}\n` : '';
        const finalStr = `db.${coll}.find({${queryBody}})`;

        resultCode.textContent = finalStr;
    };

    // --- 核心逻辑：添加行 ---
    const addRow = (key = '', val = '', defaultOp = 'EQ') => {
        const row = document.createElement('div');
        row.className = 'filter-row';

        // 1. 字段名
        const inputKey = document.createElement('input');
        inputKey.type = 'text';
        inputKey.className = 'input-key';
        inputKey.placeholder = '字段名';
        inputKey.value = key;
        inputKey.addEventListener('input', generate);

        // 2. 操作符选择
        const selectOp = document.createElement('select');
        selectOp.className = 'select-op';
        for (let op in OPERATORS) {
            const opt = document.createElement('option');
            opt.value = op;
            opt.textContent = OPERATORS[op].label;
            if (op === defaultOp) opt.selected = true;
            selectOp.appendChild(opt);
        }
        selectOp.addEventListener('change', () => {
            const op = selectOp.value;
            // 针对 In/Not In 修改占位符提示
            if (op === 'IN' || op === 'NIN') {
                inputValue.placeholder = '值1, 值2, ...';
            } else if (op === 'EXISTS') {
                inputValue.placeholder = 'true / false';
                inputValue.value = 'true'; // 默认填 true
            } else {
                inputValue.placeholder = '字段值';
            }
            generate();
        });

        // 3. 类型选择
        const selectType = document.createElement('select');
        selectType.className = 'select-type';
        for (let t in TYPES) {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = TYPES[t];
            selectType.appendChild(opt);
        }
        selectType.addEventListener('change', generate);

        // 4. 字段值
        const inputValue = document.createElement('input');
        inputValue.type = 'text';
        inputValue.className = 'input-val';
        inputValue.placeholder = '字段值';
        inputValue.value = val;
        inputValue.addEventListener('input', generate);

        // 5. 删除按钮
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-del';
        btnDel.innerHTML = '×';
        btnDel.title = '删除此条件';
        btnDel.onclick = () => {
            container.removeChild(row);
            generate();
        };

        row.appendChild(inputKey);
        row.appendChild(selectOp);
        row.appendChild(selectType);
        row.appendChild(inputValue);
        row.appendChild(btnDel);

        container.appendChild(row);

        // 自动聚焦
        inputKey.focus();
        generate();
    };

    // --- 事件绑定 ---
    btnAdd.onclick = () => addRow();
    collInput.addEventListener('input', generate);

    btnCopy.onclick = () => {
        navigator.clipboard.writeText(resultCode.textContent).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '已复制';
            setTimeout(() => btnCopy.textContent = old, 1000);
        });
    };

    // 初始化默认行
    addRow('_id', '', 'EQ');
}