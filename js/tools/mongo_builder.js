export function render() {
    return `
        <style>
            .builder-container { display: flex; flex-direction: column; height: 100%; gap: 10px; }
            
            /* 通用容器样式 */
            .section-box {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .section-title {
                font-size: 12px; font-weight: bold; color: #64748b; 
                text-transform: uppercase; letter-spacing: 0.5px;
                display: flex; justify-content: space-between; align-items: center;
            }

            /* 顶部集合名 */
            .collection-row { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 14px; }
            .coll-input { 
                border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-family: monospace; 
                color: #2563eb; font-weight: bold; width: 150px;
            }

            /* 列表区域 (Filter & Sort) */
            .dynamic-list { display: flex; flex-direction: column; gap: 8px; }
            
            /* 单行样式 */
            .row-item {
                display: flex; gap: 5px; align-items: center;
                background: #f8fafc; padding: 6px; border-radius: 4px;
                border: 1px solid #e2e8f0;
            }
            .row-item:hover { border-color: #cbd5e1; }

            /* 输入控件 */
            .input-key { flex: 2; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; min-width: 80px; }
            .select-op { flex: 1.5; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; cursor: pointer; color: #b45309; }
            .select-type { flex: 1.2; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; cursor: pointer; color: #059669; }
            .input-val { flex: 3; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; }
            
            /* 排序特有 */
            .select-sort-dir { width: 100px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; cursor: pointer; }

            /* 按钮 */
            .btn-del { 
                width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
                border: none; background: #fee2e2; color: #ef4444; border-radius: 4px; cursor: pointer; font-weight: bold;
            }
            .btn-add { 
                background: #eff6ff; color: #2563eb; border: 1px dashed #3b82f6; 
                padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
                width: fit-content;
            }
            .btn-add:hover { background: #dbeafe; }

            /* 分页行 */
            .pagination-row { display: flex; gap: 15px; align-items: center; }
            .page-input { width: 80px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; }

            /* 结果框 */
            .result-box {
                flex: 1; /* 占据剩余高度 */
                background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px;
                font-family: 'Menlo', 'Monaco', monospace; font-size: 13px; line-height: 1.6;
                white-space: pre-wrap; word-break: break-all; overflow-y: auto;
                position: relative; min-height: 100px;
            }
            
            /* 右上角按钮组 */
            .result-actions {
                position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;
            }
            .action-btn {
                padding: 4px 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: #fff; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;
            }
            .action-btn:hover { background: rgba(255,255,255,0.2); }
        </style>

        <div class="tool-box builder-container">
            <div class="collection-row">
                <span>db.</span>
                <input type="text" id="coll-name" class="coll-input" value="users">
                <span>.find(...) 查询构建</span>
            </div>

            <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:5px;">
                
                <div class="section-box">
                    <div class="section-title">
                        <span>🔍 筛选条件 (Filter)</span>
                        <button id="btn-add-filter" class="btn-add">+ 添加条件</button>
                    </div>
                    <div id="filter-container" class="dynamic-list"></div>
                </div>

                <div class="section-box">
                    <div class="section-title">
                        <span>🔃 排序 (Sort)</span>
                        <button id="btn-add-sort" class="btn-add">+ 添加排序</button>
                    </div>
                    <div id="sort-container" class="dynamic-list"></div>
                </div>

                <div class="section-box">
                    <div class="section-title"><span>🔢 分页限制 (Limit / Skip)</span></div>
                    <div class="pagination-row">
                        <div style="display:flex; align-items:center; gap:5px;">
                            <span style="font-size:12px;">Limit:</span>
                            <input type="number" id="input-limit" class="page-input" placeholder="无">
                        </div>
                        <div style="display:flex; align-items:center; gap:5px;">
                            <span style="font-size:12px;">Skip:</span>
                            <input type="number" id="input-skip" class="page-input" placeholder="无">
                        </div>
                    </div>
                </div>

            </div>

            <div class="result-box">
                <div id="result-code">db.users.find({})</div>
                <div class="result-actions">
                    <button id="btn-compress" class="action-btn" title="压缩为单行">压缩</button>
                    <button id="btn-copy" class="action-btn">复制</button>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const collInput = document.getElementById('coll-name');
    const filterContainer = document.getElementById('filter-container');
    const sortContainer = document.getElementById('sort-container');
    const resultCode = document.getElementById('result-code');
    const btnCopy = document.getElementById('btn-copy');
    const btnCompress = document.getElementById('btn-compress');

    // 按钮
    const btnAddFilter = document.getElementById('btn-add-filter');
    const btnAddSort = document.getElementById('btn-add-sort');

    // 分页
    const inputLimit = document.getElementById('input-limit');
    const inputSkip = document.getElementById('input-skip');

    // 数据类型定义
    const TYPES = {
        STRING: 'String',
        NUMBER: 'Number',
        BOOL: 'Boolean',
        DATE: 'Date (ISODate)',
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
        EXISTS: { label: 'Exists', val: '$exists' },
        REGEX: { label: 'Regex', val: '$regex' }
    };

    // --- 核心：格式化值 ---
    const formatValue = (val, type) => {
        switch (type) {
            case 'STRING': return `"${val}"`;
            case 'NUMBER': return val === '' ? '0' : val;
            case 'BOOL': return (val === 'true' || val === '1') ? 'true' : 'false';
            case 'OBJECTID': return `ObjectId("${val}")`;
            case 'DATE': return `ISODate("${val}")`;
            case 'REGEX': return `/${val}/`;
            case 'NULL': return 'null';
            default: return `"${val}"`;
        }
    };

    // --- 核心：生成代码 ---
    const generate = () => {
        const coll = collInput.value.trim() || 'collection';

        // 1. 构建 Filter
        const filterRows = filterContainer.querySelectorAll('.row-item');
        const filterParts = [];
        filterRows.forEach(row => {
            const key = row.querySelector('.input-key').value.trim();
            if (!key) return;

            const op = row.querySelector('.select-op').value;
            const type = row.querySelector('.select-type').value;
            const rawVal = row.querySelector('.input-val').value;

            let valStr = '';

            // 数组处理 (In/Nin)
            if (op === 'IN' || op === 'NIN') {
                const arr = rawVal.split(/[,，]/).map(v => v.trim()).filter(v => v!=='');
                const fmtArr = arr.map(v => formatValue(v, type)).join(', ');
                valStr = `[${fmtArr}]`;
            }
            // Exists 处理
            else if (op === 'EXISTS') {
                const lower = rawVal.toLowerCase();
                valStr = (lower === 'false' || lower === '0') ? 'false' : 'true';
            }
            // 标准处理
            else {
                valStr = formatValue(rawVal, type);
            }

            if (op === 'EQ') {
                filterParts.push(`    "${key}": ${valStr}`);
            } else if (op === 'REGEX') {
                filterParts.push(`    "${key}": { "$regex": "${rawVal}", "$options": "i" }`);
            } else {
                filterParts.push(`    "${key}": { "${OPERATORS[op].val}": ${valStr} }`);
            }
        });

        const filterObj = filterParts.length > 0 ? `{\n${filterParts.join(',\n')}\n}` : '{}';

        // 2. 构建 Sort
        const sortRows = sortContainer.querySelectorAll('.row-item');
        const sortParts = [];
        sortRows.forEach(row => {
            const key = row.querySelector('.input-key').value.trim();
            if (!key) return;
            const dir = row.querySelector('.select-sort-dir').value;
            sortParts.push(`"${key}": ${dir}`);
        });

        // 3. 组合链式调用
        let finalStr = `db.${coll}.find(${filterObj})`;

        if (sortParts.length > 0) {
            finalStr += `.sort({ ${sortParts.join(', ')} })`;
        }

        const limit = inputLimit.value.trim();
        if (limit) finalStr += `.limit(${limit})`;

        const skip = inputSkip.value.trim();
        if (skip) finalStr += `.skip(${skip})`;

        resultCode.textContent = finalStr;
    };

    // --- UI：添加筛选行 ---
    const addFilterRow = (key='', val='', defaultOp='EQ') => {
        const row = document.createElement('div');
        row.className = 'row-item';

        const keyInput = createInput('text', 'input-key', '字段名', key);
        const valInput = createInput('text', 'input-val', '值', val);

        // Operator Select
        const opSelect = document.createElement('select');
        opSelect.className = 'select-op';
        for (let k in OPERATORS) {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = OPERATORS[k].label;
            if (k === defaultOp) opt.selected = true;
            opSelect.appendChild(opt);
        }
        opSelect.onchange = () => {
            const op = opSelect.value;
            if (op === 'IN' || op === 'NIN') valInput.placeholder = '值1, 值2...';
            else if (op === 'EXISTS') valInput.placeholder = 'true/false';
            else if (op === 'DATE') valInput.placeholder = 'YYYY-MM-DD';
            else valInput.placeholder = '值';
            generate();
        };

        // Type Select
        const typeSelect = document.createElement('select');
        typeSelect.className = 'select-type';
        for (let k in TYPES) {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = TYPES[k];
            typeSelect.appendChild(opt);
        }
        typeSelect.onchange = () => {
            if (typeSelect.value === 'DATE') valInput.placeholder = 'YYYY-MM-DD...';
            generate();
        };

        const btnDel = createDelBtn(() => {
            filterContainer.removeChild(row);
            generate();
        });

        row.append(keyInput, opSelect, typeSelect, valInput, btnDel);
        filterContainer.appendChild(row);
        keyInput.focus();
        generate();
    };

    // --- UI：添加排序行 ---
    const addSortRow = () => {
        const row = document.createElement('div');
        row.className = 'row-item';

        const keyInput = createInput('text', 'input-key', '排序字段', '');

        const dirSelect = document.createElement('select');
        dirSelect.className = 'select-sort-dir';
        dirSelect.innerHTML = `<option value="1">升序 (1)</option><option value="-1">降序 (-1)</option>`;
        dirSelect.onchange = generate;

        const btnDel = createDelBtn(() => {
            sortContainer.removeChild(row);
            generate();
        });

        row.append(keyInput, dirSelect, btnDel);
        sortContainer.appendChild(row);
        keyInput.focus();
        generate();
    };

    // --- 辅助创建函数 ---
    function createInput(type, cls, ph, val) {
        const input = document.createElement('input');
        input.type = type;
        input.className = cls;
        input.placeholder = ph;
        input.value = val;
        input.addEventListener('input', generate);
        return input;
    }

    function createDelBtn(onClick) {
        const btn = document.createElement('button');
        btn.className = 'btn-del';
        btn.innerHTML = '×';
        btn.onclick = onClick;
        return btn;
    }

    // --- 事件绑定 ---
    btnAddFilter.onclick = () => addFilterRow();
    btnAddSort.onclick = () => addSortRow();
    collInput.addEventListener('input', generate);
    inputLimit.addEventListener('input', generate);
    inputSkip.addEventListener('input', generate);

    // 复制功能
    btnCopy.onclick = () => {
        navigator.clipboard.writeText(resultCode.textContent).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '已复制';
            setTimeout(() => btnCopy.textContent = old, 1000);
        });
    };

    // 压缩功能
    btnCompress.onclick = () => {
        const originalText = resultCode.textContent;
        // 去除换行符和多余空格
        // 正则解释：\s*[\r\n]+\s* 匹配所有换行符及其前后的空格
        const compressed = originalText.replace(/\s*[\r\n]+\s*/g, '');
        resultCode.textContent = compressed;
    };

    // 初始化默认行
    addFilterRow('_id', '', 'EQ');
}
