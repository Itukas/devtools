export function render() {
    return `
        <style>
            .diff-container { display: flex; flex-direction: column; height: 100%; gap: 15px; }
            .editors-row { display: flex; gap: 10px; height: 45%; min-height: 250px; }
            .editor-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
            .editor-header { font-weight: bold; color: #555; margin-bottom: 5px; display: flex; justify-content: space-between; font-size: 13px; }
            
            .code-wrapper {
                flex: 1;
                display: flex;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                background: #fff;
                overflow: hidden;
                position: relative;
            }

            .line-gutter {
                width: 45px;
                background-color: #f1f5f9;
                border-right: 1px solid #e2e8f0;
                color: #94a3b8;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 20px;
                text-align: right;
                padding: 10px 8px 10px 0;
                user-select: none;
                overflow: hidden;
                white-space: pre;
            }

            .code-input {
                flex: 1;
                border: none;
                resize: none;
                outline: none;
                padding: 10px;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 20px;
                white-space: pre;
                overflow: auto;
                background: transparent;
                color: #334155;
            }

            .diff-result-box {
                flex: 1;
                background: #fff;
                border: 1px solid #d0d7de;
                border-radius: 6px;
                overflow: auto;
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.5;
            }
            
            .diff-line { display: flex; width: max-content; min-width: 100%; }
            .diff-num {
                width: 40px; text-align: right; padding-right: 10px; color: #6e7781;
                background-color: #f6f8fa; border-right: 1px solid #d0d7de; flex-shrink: 0;
                user-select: none;
            }
            .diff-code { padding-left: 10px; white-space: pre; flex: 1; }
            
            .diff-added { background-color: #e6ffec; }
            .diff-added .diff-num { background-color: #ccffd8; }
            .diff-removed { background-color: #ffebe9; }
            .diff-removed .diff-num { background-color: #ffd7d5; }
            
            .status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
            .dot-green { background-color: #10b981; }
            .dot-gray { background-color: #cbd5e1; }
            .dot-orange { background-color: #f59e0b; }
        </style>

        <div class="tool-box diff-container">
            <div class="btn-group">
                <button id="btn-sample" class="secondary" style="font-size:12px;">填充示例</button>
                <button id="btn-clear-diff" style="background:#ef4444;">清空</button>
                <div style="margin-left:auto; font-size:12px; color:#666; display:flex; align-items:center;">
                    <span id="diff-status"><span class="status-dot dot-orange"></span>正在初始化引擎...</span>
                </div>
            </div>

            <div class="editors-row">
                <div class="editor-col">
                    <div class="editor-header">🔴 旧版本 (Original)</div>
                    <div class="code-wrapper">
                        <div id="gutter-left" class="line-gutter">1</div>
                        <textarea id="input-left" class="code-input" spellcheck="false" placeholder="输入代码..."></textarea>
                    </div>
                </div>

                <div class="editor-col">
                    <div class="editor-header">🟢 新版本 (Modified)</div>
                    <div class="code-wrapper">
                        <div id="gutter-right" class="line-gutter">1</div>
                        <textarea id="input-right" class="code-input" spellcheck="false" placeholder="输入代码..."></textarea>
                    </div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; flex:1; min-height:0;">
                <div class="editor-header">🔎 实时对比结果</div>
                <div id="diff-output" class="diff-result-box">
                    <div style="padding:20px; text-align:center; color:#999;">等待输入...</div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // 1. 动态加载依赖库 (比 import 更稳定)
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(); // 已经加载过
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // 2. 动态加载 CSS
    if (!document.getElementById('hljs-style')) {
        const link = document.createElement('link');
        link.id = 'hljs-style';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css';
        document.head.appendChild(link);
    }

    const status = document.getElementById('diff-status');
    let libsLoaded = false;

    // 并行加载 Diff 和 Highlight.js
    Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js'),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js')
    ]).then(() => {
        libsLoaded = true;
        status.innerHTML = '<span class="status-dot dot-gray"></span>引擎就绪';
    }).catch(err => {
        status.innerHTML = '<span class="status-dot dot-orange"></span>引擎加载失败，请检查网络';
        console.error("Lib load failed", err);
    });

    // --- DOM 获取 ---
    const leftInput = document.getElementById('input-left');
    const rightInput = document.getElementById('input-right');
    const leftGutter = document.getElementById('gutter-left');
    const rightGutter = document.getElementById('gutter-right');
    const output = document.getElementById('diff-output');

    let debounceTimer = null;
    let isSyncing = false;

    const updateLines = (input, gutter) => {
        const lineCount = input.value.split('\n').length;
        const lines = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
        if (gutter.textContent !== lines) gutter.textContent = lines;
    };

    const runDiff = () => {
        if (!libsLoaded) {
            output.innerHTML = '<div style="padding:20px; text-align:center; color:#e6a23c;">正在下载对比组件，请稍等...</div>';
            return;
        }

        const oldVal = leftInput.value;
        const newVal = rightInput.value;

        if (!oldVal && !newVal) {
            output.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">等待输入...</div>';
            status.innerHTML = '<span class="status-dot dot-gray"></span>引擎就绪';
            return;
        }

        // 调用全局 Diff 对象 (由 script 标签注入)
        const diff = window.Diff.diffLines(oldVal, newVal);
        const fragment = document.createDocumentFragment();

        let oldLine = 1;
        let newLine = 1;
        let addedCount = 0;
        let removedCount = 0;

        diff.forEach((part) => {
            if (part.added) addedCount += part.count;
            if (part.removed) removedCount += part.count;

            const colorClass = part.added ? 'diff-added' : (part.removed ? 'diff-removed' : '');

            let rawValue = part.value;
            // 兼容性处理：防止多余空行
            if (rawValue.endsWith('\n') && rawValue.length > 1) {
                // rawValue = rawValue.slice(0, -1);
            }

            const lines = rawValue.split('\n');
            if (lines.length > 1 && lines[lines.length - 1] === '') {
                lines.pop();
            }

            lines.forEach(line => {
                const row = document.createElement('div');
                row.className = `diff-line ${colorClass}`;

                const numBox = document.createElement('div');
                numBox.className = 'diff-num';

                if (part.removed) {
                    numBox.textContent = oldLine++;
                } else if (part.added) {
                    numBox.textContent = newLine++;
                } else {
                    numBox.textContent = newLine;
                    oldLine++;
                    newLine++;
                }

                const codeBox = document.createElement('div');
                codeBox.className = 'diff-code';

                // 高亮处理
                if (line.trim() && window.hljs) {
                    try {
                        codeBox.innerHTML = window.hljs.highlightAuto(line).value;
                    } catch(e) {
                        codeBox.textContent = line;
                    }
                } else {
                    codeBox.innerHTML = line || '&nbsp;'; // 保留空格
                }

                row.appendChild(numBox);
                row.appendChild(codeBox);
                fragment.appendChild(row);
            });
        });

        output.innerHTML = '';
        output.appendChild(fragment);
        status.innerHTML = `<span class="status-dot dot-green"></span> -${removedCount} / +${addedCount}`;
    };

    const handleInput = (source) => {
        if (source === 'left') updateLines(leftInput, leftGutter);
        if (source === 'right') updateLines(rightInput, rightGutter);

        status.innerHTML = '<span class="status-dot dot-orange"></span>计算中...';
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runDiff, 300);
    };

    leftInput.addEventListener('input', () => handleInput('left'));
    rightInput.addEventListener('input', () => handleInput('right'));

    // 同步滚动
    const syncScroll = (scroller, others) => {
        if (!isSyncing) {
            isSyncing = true;
            others.forEach(el => {
                el.scrollTop = scroller.scrollTop;
                el.scrollLeft = scroller.scrollLeft;
            });
            setTimeout(() => isSyncing = false, 10);
        }
    };

    leftInput.addEventListener('scroll', () => {
        syncScroll(leftInput, [rightInput, leftGutter, rightGutter]);
    });
    rightInput.addEventListener('scroll', () => {
        syncScroll(rightInput, [leftInput, leftGutter, rightGutter]);
    });

    document.getElementById('btn-clear-diff').onclick = () => {
        leftInput.value = '';
        rightInput.value = '';
        updateLines(leftInput, leftGutter);
        updateLines(rightInput, rightGutter);
        output.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">已清空</div>';
        status.innerHTML = '<span class="status-dot dot-gray"></span>就绪';
    };

    document.getElementById('btn-sample').onclick = () => {
        leftInput.value = `function hello() {\n  console.log("Hello World");\n  return true;\n}`;
        rightInput.value = `function hello(name) {\n  console.log("Hello " + name);\n  // Added a comment\n  return true;\n}`;
        updateLines(leftInput, leftGutter);
        updateLines(rightInput, rightGutter);
        runDiff();
    };
}