// Pinned browser dependencies are loaded only when a conversion starts.
const CDN = 'https://cdn.jsdelivr.net/npm/';
const PDFJS = `${CDN}pdfjs-dist@6.4.299/`;
const scripts = new Map();

function loadScript(url, ready) {
    if (ready()) return Promise.resolve();
    if (scripts.has(url)) return scripts.get(url);
    const pending = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => finish(new Error('依赖加载超时，请检查网络后重试。')), 45000);
        function finish(error) {
            clearTimeout(timer);
            script.onload = script.onerror = null;
            if (error) { script.remove(); reject(error); } else resolve();
        }
        script.src = url;
        script.onload = () => finish(ready() ? null : new Error('转换组件未能初始化，请重试。'));
        script.onerror = () => finish(new Error('无法加载转换组件，请检查网络后重试。'));
        document.head.appendChild(script);
    });
    scripts.set(url, pending);
    pending.catch(() => scripts.delete(url));
    return pending;
}

export function render() {
    return `
    <style>
        .fc-tool { height:100%; overflow:auto; padding:28px; box-sizing:border-box; background:#fff; color:#1f2937; }
        .fc-tool h2 { margin-top:0; }
        .fc-tool .fc-intro, .fc-tool .fc-note { color:#64748b; line-height:1.8; }
        .fc-tool .fc-form { max-width:800px; display:grid; gap:20px; }
        .fc-tool label { display:grid; gap:8px; font-weight:600; }
        .fc-tool select, .fc-tool input { padding:12px; border:1px solid #cbd5e1; border-radius:6px; background:#fff; color:#1f2937; max-width:100%; box-sizing:border-box; }
        .fc-tool .fc-note { padding:16px; background:#f8fafc; border-radius:8px; font-size:14px; }
        .fc-tool button { justify-self:start; }
        .fc-tool button:disabled { opacity:.5; cursor:wait; }
        .fc-tool [hidden] { display:none; }
        .fc-tool .fc-status { white-space:pre-wrap; line-height:1.8; overflow-wrap:anywhere; }
        .fc-tool .fc-status[data-error="true"] { color:#b91c1c; }
        .fc-tool .fc-download { display:inline-block; padding:12px 18px; border-radius:6px; background:#16a34a; color:white; text-decoration:none; }
    </style>
    <section class="fc-tool" id="fc-tool">
        <h2>📄 PDF / Word 文件转换</h2>
        <p class="fc-intro">选择本地文件，转换后下载。文件内容在浏览器中处理，不上传服务器；首次转换需联网加载组件与字体数据。</p>
        <div class="fc-form">
            <label>转换方向
                <select id="fc-direction">
                    <option value="pdf-docx">PDF → Word（.docx）</option>
                    <option value="docx-pdf">Word（.docx）→ PDF</option>
                </select>
            </label>
            <label id="fc-mode-label">PDF 转 Word 模式
                <select id="fc-mode">
                    <option value="text">可编辑文字：提取文字，按原 PDF 分页</option>
                    <option value="image">保留外观：每页转成图片，文字不可编辑</option>
                </select>
            </label>
            <div class="fc-note" id="fc-hint"></div>
            <label>选择文件（最大 30 MB）
                <input id="fc-file" type="file" accept=".pdf,application/pdf">
            </label>
            <button id="fc-start" type="button">转换并生成下载文件</button>
            <div id="fc-status" class="fc-status" role="status" aria-live="polite"></div>
            <div id="fc-result" hidden><a id="fc-download" class="fc-download">下载转换结果</a></div>
        </div>
    </section>`;
}

// Keep PDF content-stream order; detect visual line changes when hasEOL is absent.
export function textLines(items) {
    const lines = [];
    let line = '', last = null;
    for (const item of items) {
        if (typeof item.str !== 'string') continue;
        if (last && Math.abs(item.transform[5] - last.transform[5]) > Math.max(2, Math.abs(item.transform[3]) * 0.4)) {
            if (line) lines.push(line);
            line = '';
        }
        if (line && last && item.transform[4] - (last.transform[4] + last.width) > Math.max(1, Math.abs(item.transform[0]) * 0.15)) line += ' ';
        line += item.str;
        if (item.hasEOL) { lines.push(line); line = ''; last = null; }
        else last = item;
    }
    if (line) lines.push(line);
    return lines;
}

async function pdfToWord(file, mode, status) {
    status('正在加载 PDF 和 Word 转换组件…');
    const [pdfjs, word] = await Promise.all([
        import(`${PDFJS}build/pdf.mjs`),
        import(`${CDN}docx@9.15.0/+esm`)
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}build/pdf.worker.mjs`;
    const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        cMapUrl: `${PDFJS}cmaps/`, cMapPacked: true,
        standardFontDataUrl: `${PDFJS}standard_fonts/`,
        wasmUrl: `${PDFJS}wasm/`, isEvalSupported: false
    });
    // Password entry is intentionally unsupported; avoid leaving the UI waiting.
    task.onPassword = () => { task.destroy(); };
    let pdf;
    try {
        pdf = await task.promise;
        if (pdf.numPages > 100) throw new Error('最多支持 100 页 PDF，请先拆分文件。');
        const sections = [];
        const emptyPages = [];
        for (let n = 1; n <= pdf.numPages; n++) {
            status(`正在转换 PDF 第 ${n} / ${pdf.numPages} 页…`);
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale: 1 });
            const children = [];
            if (mode === 'text') {
                const lines = textLines((await page.getTextContent()).items);
                if (!lines.some(line => line.trim())) emptyPages.push(n);
                for (const line of lines) children.push(new word.Paragraph({
                    children: [new word.TextRun({ text: line, font: 'Arial', size: 22 })],
                    spacing: { after: 80 }
                }));
                if (!children.length) children.push(new word.Paragraph('（此页没有可提取文字，请使用保留外观模式或 OCR 工具。）'));
            } else {
                const scale = Math.min(1.5, 2400 / Math.max(viewport.width, viewport.height));
                const view = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(view.width); canvas.height = Math.ceil(view.height);
                try {
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise;
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (!blob) throw new Error('无法生成页面图片，请尝试较小的 PDF。');
                    children.push(new word.Paragraph({ children: [new word.ImageRun({
                        type: 'png', data: new Uint8Array(await blob.arrayBuffer()),
                        transformation: { width: Math.max(1, viewport.width * 96 / 72 - 4), height: Math.max(1, viewport.height * 96 / 72 - 4) }
                    })], spacing: { before: 0, after: 0, line: 1 } }));
                } finally { canvas.width = canvas.height = 0; }
            }
            sections.push({
                properties: { type: word.SectionType.NEXT_PAGE, page: {
                    size: { width: Math.round(viewport.width * 20), height: Math.round(viewport.height * 20) },
                    margin: mode === 'image' ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 720, right: 720, bottom: 720, left: 720 }
                } }, children
            });
            page.cleanup();
        }
        if (mode === 'text' && emptyPages.length === pdf.numPages) throw new Error('PDF 没有可提取文字，可能是扫描件。请选择“保留外观”模式；需要可编辑文字时请先进行 OCR。');
        status('正在生成 Word 文件…');
        return {
            blob: await word.Packer.toBlob(new word.Document({ sections })),
            warning: emptyPages.length ? `第 ${emptyPages.join('、')} 页没有可提取文字，已在 Word 中标注。` : ''
        };
    } catch (error) {
        if (/password|worker was destroyed|loading aborted/i.test(error.message)) throw new Error('暂不支持加密 PDF，请先解除密码后重试。');
        throw error;
    } finally { await task.destroy(); }
}

// Coordinates are canvas pixels. Preserve table rows/images that fit a page;
// for oversized blocks use the individual text-line boxes instead.
export function planPageSlices({ height, pageHeight, topMargin, bottomMargin, boxes, blocks = [], safeBreak }) {
    const capacity = pageHeight - topMargin - bottomMargin;
    if (capacity <= 0) throw new Error('文档页边距超过页面高度。');
    const protectedBoxes = (safeBreak ? blocks : boxes).filter(box => box.bottom - box.top <= capacity - 4);
    const contentEnd = Math.min(height, Math.max(1, ...boxes.map(box => box.bottom)));
    // Already paginated Word sections may contain a footer inside the margin.
    // Preserve a section that fits one page, including its original whitespace.
    if (height <= pageHeight + 2 && contentEnd <= pageHeight + 2) {
        return [{ start: 0, end: Math.ceil(Math.min(height, pageHeight)), offset: 0 }];
    }
    const slices = [];
    let start = 0;
    while (start < contentEnd) {
        const offset = slices.length ? topMargin : 0;
        let end = Math.min(contentEnd, start + pageHeight - offset - bottomMargin);
        // Moving a break above a row may land inside another overlapping line.
        // Repeat until every protected interval is clear of the boundary.
        let crossing;
        const edgeTolerance = safeBreak ? 4 : 0;
        while ((crossing = protectedBoxes.find(box => box.top + edgeTolerance < end && box.bottom - edgeTolerance > end))) {
            end = Math.floor(crossing.top - 2);
        }
        if (safeBreak && end < contentEnd) end = safeBreak(end, start, protectedBoxes);
        if (end <= start) throw new Error('有内容超过单页可用高度，请缩小图片或字号后重试。');
        slices.push({ start, end: Math.ceil(end), offset });
        start = Math.ceil(end);
        if (slices.length > 100) throw new Error('最多支持导出 100 页 PDF，请先拆分文档。');
    }
    return slices;
}

function pageLayout(page, scale, pageHeight) {
    const doc = page.ownerDocument;
    const origin = page.getBoundingClientRect().top;
    const style = doc.defaultView.getComputedStyle(page);
    const boxes = [];
    const add = rect => {
        if (rect.width > 0 && rect.height > 0) boxes.push({
            top: Math.max(0, (rect.top - origin) * scale),
            bottom: (rect.bottom - origin) * scale
        });
    };
    const walker = doc.createTreeWalker(page, 4 /* SHOW_TEXT */);
    const range = doc.createRange();
    while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        if (walker.currentNode.parentElement.closest('style,script')) continue;
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) add(rect);
    }
    const firstBlock = boxes.length;
    page.querySelectorAll('img,svg,tr').forEach(element => add(element.getBoundingClientRect()));
    const blocks = boxes.slice(firstBlock);
    // A blank document still exports one page.
    if (!boxes.length) boxes.push({ top: 0, bottom: 1 });
    return { boxes, blocks, pageHeight: pageHeight * scale,
        topMargin: (parseFloat(style.paddingTop) || 0) * scale,
        bottomMargin: (parseFloat(style.paddingBottom) || 0) * scale };
}

// DOM line rectangles can overlap when Word uses tight line spacing. Check the
// actual raster for a two-pixel gap instead. Continuous vertical table rules
// are ignored, while glyph strokes and horizontal rules remain protected.
function blankBreakFinder(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return (limit, start, blocks) => {
        const bottom = Math.min(canvas.height - 1, Math.floor(limit));
        const top = Math.max(Math.ceil(start) + 1, bottom - 600);
        const sampleTop = Math.max(0, top - 32), sampleBottom = Math.min(canvas.height, bottom + 33);
        const { data } = ctx.getImageData(0, sampleTop, canvas.width, sampleBottom - sampleTop);
        const pixel = (x, y) => ((y - sampleTop) * canvas.width + x) * 4;
        const ink = i => data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240;
        let empty = 0;
        for (let y = bottom; y >= top; y--) {
            // Collapsed table borders touch adjacent rows. Allow the narrow
            // border/padding band so a break does not move above the whole table.
            let clear = !blocks.some(block => block.top + 12 < y && block.bottom - 12 > y);
            for (let x = 0; clear && x < canvas.width; x++) {
                const i = pixel(x, y);
                if (!ink(i)) continue;
                let verticalRule = y - 30 >= sampleTop && y + 30 < sampleBottom;
                // Require continuous ink over a long column, not just a
                // glyph's vertical stem. This permits breaking inside tall rows.
                let matches = 0;
                for (let dy = -30; verticalRule && dy <= 30; dy++) {
                    const j = pixel(x, y + dy);
                    if (ink(j)) matches++;
                }
                verticalRule = verticalRule && matches >= 52;
                if (!verticalRule) clear = false;
            }
            empty = clear ? empty + 1 : 0;
            if (empty >= 2) return y + 1;
        }
        throw new Error('未找到安全的分页空隙，请增加行距、缩小图片或在 Word 中插入分页符后重试。');
    };
}

async function wordToPdf(file, root, status) {
    status('正在加载 Word 和 PDF 转换组件…');
    await loadScript(`${CDN}jszip@3.10.2/dist/jszip.min.js`, () => !!window.JSZip);
    await Promise.all([
        loadScript(`${CDN}docx-preview@0.4.1/dist/docx-preview.min.js`, () => !!window.docx?.renderAsync),
        loadScript(`${CDN}html2canvas@1.4.1/dist/html2canvas.min.js`, () => !!window.html2canvas),
        loadScript(`${CDN}jspdf@4.2.1/dist/jspdf.umd.min.js`, () => !!window.jspdf?.jsPDF)
    ]);
    // The sandbox and CSP prevent active document content and external resource requests.
    const frame = document.createElement('iframe');
    frame.title = '转换中的文档';
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1200px;height:900px;border:0;pointer-events:none;';
    root.appendChild(frame);
    try {
        const doc = frame.contentDocument;
        doc.open();
        doc.write(`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data: blob:;"><style>body{margin:0}section.docx{box-shadow:none!important;margin:0!important}a{pointer-events:none}</style></head><body><div id="pages"></div></body></html>`);
        doc.close();
        const target = doc.getElementById('pages');
        status('正在排版 Word 文档…');
        await window.docx.renderAsync(await file.arrayBuffer(), target, target, {
            inWrapper: false, breakPages: true, ignoreLastRenderedPageBreak: false,
            renderHeaders: true, renderFooters: true, renderFootnotes: true,
            renderEndnotes: true, renderAltChunks: false, useBase64URL: true
        });
        await doc.fonts.ready;
        await Promise.all([...target.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
        const pages = [...target.querySelectorAll('section.docx')];
        if (!pages.length) throw new Error('文档没有可转换的页面，请确认文件是有效的 .docx。');
        const { jsPDF } = window.jspdf;
        let result, count = 0;
        for (const [index, page] of pages.entries()) {
            status(`正在转换 Word 第 ${index + 1} / ${pages.length} 个分节…`);
            const width = page.getBoundingClientRect().width;
            const pageHeight = parseFloat(frame.contentWindow.getComputedStyle(page).minHeight) || 1122.52;
            const height = Math.max(page.scrollHeight, pageHeight);
            if (!width || height > 16000) throw new Error('文档分节过长，请在 Word 中插入分页符后重试（每节最多约 14 页）。');
            const canvas = await window.html2canvas(page, {
                scale: 1.5, backgroundColor: '#ffffff', logging: false,
                width: Math.ceil(width), height: Math.ceil(height), windowWidth: 1200
            });
            try {
                const scale = canvas.width / width;
                const slices = planPageSlices({
                    ...pageLayout(page, scale, pageHeight), height: canvas.height,
                    safeBreak: blankBreakFinder(canvas)
                });
                for (const { start, end, offset } of slices) {
                    if (++count > 100) throw new Error('最多支持导出 100 页 PDF，请先拆分文档。');
                    const mmWidth = width * 25.4 / 96, mmHeight = pageHeight * 25.4 / 96;
                    const options = { orientation: mmWidth > mmHeight ? 'landscape' : 'portrait', unit: 'mm', format: [mmWidth, mmHeight], compress: true };
                    if (!result) result = new jsPDF(options);
                    else result.addPage([mmWidth, mmHeight], options.orientation);
                    const slice = document.createElement('canvas');
                    slice.width = canvas.width; slice.height = end - start;
                    slice.getContext('2d').drawImage(canvas, 0, start, slice.width, slice.height, 0, 0, slice.width, slice.height);
                    result.addImage(slice.toDataURL('image/jpeg', 0.94), 'JPEG', 0, offset / scale * 25.4 / 96, mmWidth, slice.height / canvas.width * mmWidth);
                    slice.width = slice.height = 0;
                }
            } finally { canvas.width = canvas.height = 0; }
        }
        return { blob: result.output('blob'), warning: 'PDF 以图片页面导出，文字不可搜索或复制。请检查分页，尤其是长表格和跨页段落。' };
    } finally { frame.remove(); }
}

export function init() {
    const root = document.getElementById('fc-tool');
    const direction = root.querySelector('#fc-direction');
    const mode = root.querySelector('#fc-mode');
    const input = root.querySelector('#fc-file');
    const start = root.querySelector('#fc-start');
    const status = root.querySelector('#fc-status');
    const result = root.querySelector('#fc-result');
    const download = root.querySelector('#fc-download');
    let url;
    function reset() {
        if (url) URL.revokeObjectURL(url);
        url = null;
        download.removeAttribute('href');
        result.hidden = true;
        status.textContent = '';
        status.dataset.error = 'false';
    }
    function update() {
        reset();
        const isPdf = direction.value === 'pdf-docx';
        input.value = '';
        input.accept = isPdf ? '.pdf,application/pdf' : '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        root.querySelector('#fc-mode-label').hidden = !isPdf;
        root.querySelector('#fc-hint').textContent = isPdf
            ? '可编辑文字模式仅提取文字，不还原图片、表格和多栏排版，也不执行 OCR。扫描件可选保留外观模式，每页以图片插入 Word。最多 100 页。'
            : '支持 .docx，旧版 .doc 请先另存为 .docx。自动避开文字行分页，并尽量保持表格行和图片完整。复杂排版与字体可能变化，超高表格行会按文字行拆分。导出的 PDF 是图片页面，文字不可搜索或复制。最多 100 页。';
    }
    direction.addEventListener('change', update);
    mode.addEventListener('change', reset);
    input.addEventListener('change', reset);
    // Release download URLs when this tool is replaced by another navigation item.
    const observer = new MutationObserver(() => {
        if (!root.isConnected) { if (url) URL.revokeObjectURL(url); observer.disconnect(); }
    });
    observer.observe(root.parentNode, { childList: true });
    start.addEventListener('click', async () => {
        reset();
        const file = input.files[0];
        const isPdf = direction.value === 'pdf-docx';
        const controls = [start, direction, mode, input];
        try {
            if (!file) throw new Error('请先选择需要转换的文件。');
            if (!(isPdf ? /\.pdf$/i : /\.docx$/i).test(file.name)) throw new Error(isPdf ? '请选择 .pdf 文件。' : '请选择 .docx 文件，暂不支持旧版 .doc。');
            if (!file.size || file.size > 30 * 1024 * 1024) throw new Error('请选择非空且不超过 30 MB 的文件。');
            controls.forEach(control => { control.disabled = true; });
            const report = message => { status.textContent = message; };
            const converted = isPdf ? await pdfToWord(file, mode.value, report) : await wordToPdf(file, root, report);
            if (!root.isConnected) return;
            url = URL.createObjectURL(converted.blob);
            download.href = url;
            download.download = file.name.replace(/\.[^.]+$/, '') + (isPdf ? '.docx' : '.pdf');
            download.textContent = `下载 ${download.download}`;
            result.hidden = false;
            report(`转换完成。${converted.warning ? '\n' + converted.warning : ''}`);
        } catch (error) {
            status.dataset.error = 'true';
            status.textContent = `转换失败：${error.message || '文件可能损坏或浏览器不支持，请尝试其他文件。'}`;
        } finally { controls.forEach(control => { control.disabled = false; }); }
    });
    update();
}
