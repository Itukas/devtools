export function render() {
    return `
        <div class="tool-box" style="justify-content: flex-start;">
            <h3>当前时间</h3>
            <div class="row">
                <input type="text" id="now-ts" readonly style="font-size:1.2rem; font-weight:bold; color:#2563eb;">
                <button id="btn-copy-now">复制</button>
                <button id="btn-pause">暂停/继续</button>
            </div>
            
            <hr style="width:100%; border:0; border-top:1px solid #eee; margin:20px 0;">

            <h3>时间戳转日期</h3>
            <div class="row">
                <input type="text" id="input-ts" placeholder="输入 10位(秒) 或 13位(毫秒) 时间戳">
                <button id="btn-to-date">转换 &rarr;</button>
            </div>
            <div class="row">
                <input type="text" id="output-date" readonly placeholder="结果将显示在这里..." style="background:#f9fafb;">
            </div>

            <h3>日期转时间戳</h3>
            <div class="row">
                <input type="datetime-local" id="input-date" step="1">
                <button id="btn-to-ts">转换 &rarr;</button>
            </div>
             <div class="row">
                <input type="text" id="output-ts" readonly placeholder="结果 (13位/10位)..." style="background:#f9fafb;">
            </div>
        </div>
    `;
}

export function init() {
    let timer = null;
    let isPaused = false;

    // 实时更新当前时间戳
    const updateNow = () => {
        if (isPaused) return;
        document.getElementById('now-ts').value = Date.now();
    };
    timer = setInterval(updateNow, 1000);
    updateNow();

    document.getElementById('btn-pause').onclick = () => {
        isPaused = !isPaused;
    };

    document.getElementById('btn-copy-now').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('now-ts').value);
    };

    // 时间戳 -> 日期
    document.getElementById('btn-to-date').onclick = () => {
        let ts = document.getElementById('input-ts').value.trim();
        if (!ts) return;

        // 只有数字
        ts = parseInt(ts);
        // 简单的位数判定：如果是10位（秒），乘1000补齐为毫秒
        if (ts.toString().length === 10) ts *= 1000;

        const date = new Date(ts);
        if (isNaN(date.getTime())) {
            document.getElementById('output-date').value = "无效的时间戳";
        } else {
            // 输出格式：YYYY-MM-DD HH:mm:ss
            const str = date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
            document.getElementById('output-date').value = str;
        }
    };

    // 日期 -> 时间戳
    document.getElementById('btn-to-ts').onclick = () => {
        const val = document.getElementById('input-date').value;
        if (!val) return;
        const ts = new Date(val).getTime();
        document.getElementById('output-ts').value = `ms: ${ts} / s: ${Math.floor(ts/1000)}`;
    };
}