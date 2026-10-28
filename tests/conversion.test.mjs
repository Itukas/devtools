import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const load = async path => import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(path, import.meta.url))).toString('base64')}`);
const { planPageSlices } = await load('../js/tools/file_convert.js');
const { normalizeCrop } = await load('../js/tools/video_gif.js');

test('pagination moves a break above a text line, without losing any source pixels', () => {
    const boxes = Array.from({ length: 100 }, (_, i) => ({ top: 30 + i * 23, bottom: 49 + i * 23 }));
    const slices = planPageSlices({ height: 2400, pageHeight: 800, topMargin: 40, bottomMargin: 40, boxes });
    assert.ok(slices.length >= 3);
    assert.equal(slices[0].start, 0);
    for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        assert.ok(slice.end > slice.start);
        assert.ok(slice.end - slice.start + slice.offset <= 800);
        if (i) assert.equal(slice.start, slices[i - 1].end);
        assert.ok(boxes.every(box => !(box.top < slice.end && box.bottom > slice.end)));
    }
    assert.equal(slices.at(-1).end, boxes.at(-1).bottom);
});

test('a normal table row moves as a whole; an oversized row can split between lines', () => {
    const boxes = [{ top: 700, bottom: 900 }, { top: 1000, bottom: 2300 }];
    const slices = planPageSlices({ height: 2400, pageHeight: 800, topMargin: 40, bottomMargin: 40, boxes });
    assert.equal(slices[0].end, 698);
    assert.ok(slices.length >= 3);
});

test('existing one-page sections retain footer and do not produce a blank extra page', () => {
    assert.deepEqual(planPageSlices({ height: 1123, pageHeight: 1122.5, topMargin: 96, bottomMargin: 96, boxes: [{ top: 1050, bottom: 1090 }] }), [{ start: 0, end: 1123, offset: 0 }]);
});

test('touching table rows do not force a break above the entire table', () => {
    const blocks = Array.from({ length: 8 }, (_, i) => ({ top: i * 200, bottom: (i + 1) * 200 }));
    const slices = planPageSlices({ height: 1600, pageHeight: 800, topMargin: 40, bottomMargin: 40,
        boxes: blocks, blocks, safeBreak: end => Math.floor(end) });
    assert.equal(slices[0].end, 598);
    assert.equal(slices[1].start, 598);
    assert.equal(slices.at(-1).end, 1600);
});

test('crop dimensions and coordinates stay inside the original video', () => {
    assert.deepEqual(normalizeCrop({ x: 600, y: -4, width: 200, height: 100 }, 640, 360), { x: 440, y: 0, width: 200, height: 100 });
    assert.deepEqual(normalizeCrop({ x: NaN, y: Infinity, width: 900, height: -1 }, 640, 360), { x: 0, y: 0, width: 640, height: 1 });
    assert.deepEqual(normalizeCrop({ x: 21, y: 10, width: 200, height: 100 }, 640, 360), { x: 21, y: 10, width: 200, height: 100 });
});
