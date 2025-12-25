export function render() {
    return `
        <style>
            .convert-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            .btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 10px; }
            .action-btn {
                padding: 8px; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px;
                cursor: pointer; font-size: 13px; color: #475569; transition: all 0.2s;
            }
            .action-btn:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }
            
            .text-area {
                flex: 1; padding: 15px; border: 1px solid #cbd5e1; border-radius: 8px;
                font-family: 'Menlo', monospace; font-size: 13px; resize: none; outline: none;
            }
            .text-area:focus { border-color: #3b82f6; }
            
            .group-label { font-size: 12px; font-weight: bold; color: #94a3b8; margin: 10px 0 5px 0; }
        </style>

        <div class="tool-box convert-container">
            <textarea id="txt-input" class="text-area" placeholder="输入文本或变量名 (例如: user_id, helloWorld)..."></textarea>
            
            <div>
                <div class="group-label">变量命名转换</div>
                <div class="btn-grid">
                    <button class="action-btn" data-act="camel">驼峰 (camelCase)</button>
                    <button class="action-btn" data-act="pascal">大驼峰 (Pascal)</button>
                    <button class="action-btn" data-act="snake">下划线 (snake_)</button>
                    <button class="action-btn" data-act="kebab">中划线 (kebab-)</button>
                    <button class="action-btn" data-act="screaming">常量 (UPPER_CASE)</button>
                    <button class="action-btn" data-act="space">分词 (Start Case)</button>
                </div>

                <div class="group-label">文本处理</div>
                <div class="btn-grid">
                    <button class="action-btn" data-act="upper">全部大写</button>
                    <button class="action-btn" data-act="lower">全部小写</button>
                    <button class="action-btn" data-act="trim">去除空行/空格</button>
                    <button class="action-btn" data-act="dedupe">行去重</button>
                    <button class="action-btn" data-act="sort">行排序 (A-Z)</button>
                    <button class="action-btn" data-act="reverse">行反转</button>
                </div>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button id="btn-copy" style="background:#10b981; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer;">复制结果</button>
                <button id="btn-clear" style="background:#ef4444; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer;">清空</button>
            </div>
        </div>
    `;
}

export function init() {
    const input = document.getElementById('txt-input');
    const btns = document.querySelectorAll('.action-btn');

    // 核心转换逻辑
    const convert = (type) => {
        const val = input.value;
        if (!val) return;

        // 针对变量名转换，我们需要把字符串拆分成单词数组
        // 正则拆分：支持驼峰、下划线、中划线、空格
        const splitWords = (str) => {
            return str.replace(/([a-z])([A-Z])/g, '$1 $2') // 拆驼峰
                .replace(/[_-]/g, ' ')               // 拆符号
                .toLowerCase()
                .split(/\s+/)
                .filter(w => w);
        };

        const processVariable = (str, mode) => {
            const words = splitWords(str);
            if (words.length === 0) return str;

            switch (mode) {
                case 'camel': // userId
                    return words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
                case 'pascal': // UserId
                    return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
                case 'snake': // user_id
                    return words.join('_');
                case 'kebab': // user-id
                    return words.join('-');
                case 'screaming': // USER_ID
                    return words.join('_').toUpperCase();
                case 'space': // User Id
                    return words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                default: return str;
            }
        };

        // 判断是处理多行文本还是单个变量
        // 如果包含换行符，则按行处理
        const lines = val.split('\n');

        const result = lines.map(line => {
            if (!line.trim()) return line;

            // 变量名转换类
            if (['camel', 'pascal', 'snake', 'kebab', 'screaming', 'space'].includes(type)) {
                return processVariable(line, type);
            }

            // 纯文本处理类
            switch (type) {
                case 'upper': return line.toUpperCase();
                case 'lower': return line.toLowerCase();
                case 'trim': return line.trim();
                default: return line;
            }
        });

        // 整体数组操作 (去重、排序等)
        let finalLines = result;
        if (type === 'dedupe') finalLines = [...new Set(result.map(l=>l.trim()))].filter(l=>l);
        if (type === 'sort') finalLines = result.sort();
        if (type === 'reverse') finalLines = result.reverse();
        if (type === 'trim') finalLines = result.filter(l => l.trim());

        input.value = finalLines.join('\n');
    };

    btns.forEach(btn => {
        btn.onclick = () => convert(btn.dataset.act);
    });

    document.getElementById('btn-copy').onclick = () => {
        navigator.clipboard.writeText(input.value);
    };
    document.getElementById('btn-clear').onclick = () => {
        input.value = '';
    };
}