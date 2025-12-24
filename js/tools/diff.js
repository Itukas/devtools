export function render() {
    return `
        <div class="tool-box">
            <div class="btn-group">
                <button id="btn-compare">开始对比 (Compare)</button>
                <button id="btn-clr-diff" class="secondary">清空</button>
            </div>
            <div class="diff-container" style="height: 40%;">
                <textarea id="left-text" placeholder="旧代码/文本 (Original)"></textarea>
                <textarea id="right-text" placeholder="新代码/文本 (Modified)"></textarea>
            </div>
            <h4 style="margin:10px 0 5px;">对比结果：</h4>
            <div id="diff-output" class="diff-result"></div>
        </div>
    `;
}

export function init() {
    document.getElementById('btn-clr-diff').onclick = () => {
        document.getElementById('left-text').value = '';
        document.getElementById('right-text').value = '';
        document.getElementById('diff-output').innerHTML = '';
    };

    document.getElementById('btn-compare').onclick = () => {
        const text1 = document.getElementById('left-text').value;
        const text2 = document.getElementById('right-text').value;

        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');

        const output = document.getElementById('diff-output');
        output.innerHTML = ''; // 清空旧结果

        // 简单的行级对比算法 (LCS 的简化版实现，适合简单文本)
        // 为了保持代码轻量，这里使用逐行扫描对比，
        // 如果需要专业的 git diff 效果，建议引入 'diff' npm 包的 browser CDN

        // 这里演示一个最基础的对比逻辑：
        const maxLen = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLen; i++) {
            const l1 = lines1[i];
            const l2 = lines2[i];

            const lineDiv = document.createElement('span');

            if (l1 === l2) {
                // 相同
                lineDiv.className = 'diff-neutral';
                lineDiv.textContent = `  ${l1 || ''}`;
            } else if (l1 !== undefined && l2 !== undefined) {
                // 修改 (显示为删旧增新)
                const delSpan = document.createElement('span');
                delSpan.className = 'diff-removed';
                delSpan.textContent = `- ${l1}`;
                output.appendChild(delSpan);

                const addSpan = document.createElement('span');
                addSpan.className = 'diff-added';
                addSpan.textContent = `+ ${l2}`;
                output.appendChild(addSpan);
                continue;
            } else if (l1 !== undefined) {
                // 删除
                lineDiv.className = 'diff-removed';
                lineDiv.textContent = `- ${l1}`;
            } else if (l2 !== undefined) {
                // 新增
                lineDiv.className = 'diff-added';
                lineDiv.textContent = `+ ${l2}`;
            }

            output.appendChild(lineDiv);
        }

        if (output.innerHTML === '') {
            output.textContent = '两段文本完全一致。';
        }
    };
}