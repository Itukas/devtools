/**
 * 麻将番种配置文件
 * 用户可以在这里添加或修改番种逻辑
 * * 参数说明:
 * - hand: 手牌列表 [{suit:'m', val:1}, ...]
 * - partition: 牌型拆解结果 (可能为 null，表示特殊牌型如七对子)
 * 结构: { pair: [t, t], sets: [ {type:'shun', tiles:[]}, {type:'ke', tiles:[]} ... ] }
 * - counts: 各张牌的计数数组 (0-33)
 * - context: 上下文 (如场风、自风等，本工具暂默认为东风东家)
 */

// === 辅助函数 ===
const HELPERS = {
    // 是否全是么九牌 (1, 9, 字)
    isAllYaoJiu: (tiles) => tiles.every(t => t.suit === 'z' || t.val === 1 || t.val === 9),
    // 是否全是中张牌 (2-8)
    isAllZhongZhang: (tiles) => tiles.every(t => t.suit !== 'z' && t.val >= 2 && t.val <= 8),
    // 获取牌组类型计数
    getSetCounts: (partition) => {
        let shun = 0, ke = 0, anke = 0; // 默认为门清，所有刻子视为暗刻
        partition.sets.forEach(s => {
            if (s.type === 'shun') shun++;
            else if (s.type === 'ke') { ke++; anke++; }
        });
        return { shun, ke, anke };
    },
    // 检查是否有特定字牌刻子
    hasFanPai: (partition, val) => {
        return partition.sets.some(s => s.type === 'ke' && s.tiles[0].suit === 'z' && s.tiles[0].val === val);
    }
};

// === 🇯🇵 日麻番种配置 (Riichi) ===
export const RIICHI_YAKU = [
    // --- 1番 ---
    {
        id: 'tanyao', name: '断幺九 (Tanyao)', score: 1,
        check: (hand, partition) => {
            if (!partition) return false; // 必须是标准型
            return HELPERS.isAllZhongZhang(hand);
        }
    },
    {
        id: 'yakuhai_haku', name: '役牌：白', score: 1,
        check: (h, p) => p && HELPERS.hasFanPai(p, 5)
    },
    {
        id: 'yakuhai_hatsu', name: '役牌：发', score: 1,
        check: (h, p) => p && HELPERS.hasFanPai(p, 6)
    },
    {
        id: 'yakuhai_chun', name: '役牌：中', score: 1,
        check: (h, p) => p && HELPERS.hasFanPai(p, 7)
    },
    {
        id: 'pinfu', name: '平和 (Pinfu)', score: 1,
        check: (h, p) => {
            if (!p) return false;
            // 4个顺子
            if (HELPERS.getSetCounts(p).shun !== 4) return false;
            // 雀头不是役牌 (简单处理: 雀头不能是三元牌或场自风)
            const pairTile = p.pair[0];
            if (pairTile.suit === 'z' && pairTile.val >= 5) return false; // 白发中
            // 听牌需两面听 (本工具为静态算分，暂忽略听牌型判断，默认满足)
            return true;
        }
    },
    {
        id: 'iipeiko', name: '一杯口', score: 1,
        check: (h, p) => {
            if (!p) return false;
            // 找两个完全相同的顺子
            let shuns = p.sets.filter(s => s.type === 'shun').map(s => `${s.tiles[0].suit}${s.tiles[0].val}`);
            shuns.sort();
            for (let i = 0; i < shuns.length - 1; i++) {
                if (shuns[i] === shuns[i+1]) return true;
            }
            return false;
        }
    },

    // --- 2番 ---
    {
        id: 'sanshoku', name: '三色同顺', score: 2,
        check: (h, p) => {
            if (!p) return false;
            // 检查是否有同数字的万筒索顺子
            const sM = p.sets.filter(s => s.type === 'shun' && s.tiles[0].suit === 'm').map(s => s.tiles[0].val);
            const sP = p.sets.filter(s => s.type === 'shun' && s.tiles[0].suit === 'p').map(s => s.tiles[0].val);
            const sS = p.sets.filter(s => s.type === 'shun' && s.tiles[0].suit === 's').map(s => s.tiles[0].val);
            return sM.some(v => sP.includes(v) && sS.includes(v));
        }
    },
    {
        id: 'itsu', name: '一气通贯', score: 2,
        check: (h, p) => {
            if (!p) return false;
            const suits = ['m', 'p', 's'];
            for (let suit of suits) {
                const vals = p.sets.filter(s => s.type === 'shun' && s.tiles[0].suit === suit).map(s => s.tiles[0].val);
                if (vals.includes(1) && vals.includes(4) && vals.includes(7)) return true;
            }
            return false;
        }
    },
    {
        id: 'toitoi', name: '对对和', score: 2,
        check: (h, p) => p && HELPERS.getSetCounts(p).ke === 4
    },
    {
        id: 'sanankou', name: '三暗刻', score: 2,
        check: (h, p) => p && HELPERS.getSetCounts(p).anke >= 3
    },
    {
        id: 'chiitoi', name: '七对子', score: 2,
        check: (h, p) => p === null && h.length === 14 // 特殊牌型 logic 在引擎处理
    },
    {
        id: 'honrou', name: '混老头', score: 2,
        check: (h, p) => p && HELPERS.isAllYaoJiu(h) && h.some(t => t.suit === 'z') // 必须带字牌，否则是清老头
    },
    {
        id: 'chanta', name: '混全带幺九', score: 2,
        check: (h, p) => {
            if (!p) return false;
            if (HELPERS.isAllYaoJiu(h)) return false; // 那是混老头或清老头
            // 每个面子和雀头都包含幺九
            const hasYao = (tiles) => tiles.some(t => t.suit === 'z' || t.val === 1 || t.val === 9);
            if (!hasYao(p.pair)) return false;
            return p.sets.every(s => hasYao(s.tiles));
        }
    },

    // --- 3番及以上 ---
    {
        id: 'honitsu', name: '混一色', score: 3,
        check: (h, p) => {
            const hasZ = h.some(t => t.suit === 'z');
            const suits = new Set(h.filter(t => t.suit !== 'z').map(t => t.suit));
            return hasZ && suits.size === 1;
        }
    },
    {
        id: 'junchan', name: '纯全带幺九', score: 3,
        check: (h, p) => {
            if (!p) return false;
            if (h.some(t => t.suit === 'z')) return false; // 不能有字
            const hasYao = (tiles) => tiles.some(t => t.val === 1 || t.val === 9);
            if (!hasYao(p.pair)) return false;
            return p.sets.every(s => hasYao(s.tiles));
        }
    },
    {
        id: 'ryanpeiko', name: '二杯口', score: 3,
        check: (h, p) => {
            if (!p) return false;
            let shuns = p.sets.filter(s => s.type === 'shun').map(s => `${s.tiles[0].suit}${s.tiles[0].val}`);
            shuns.sort();
            // 简单的 AABB 检查
            return shuns.length === 4 && shuns[0] === shuns[1] && shuns[2] === shuns[3];
        }
    },
    {
        id: 'chinitsu', name: '清一色', score: 6,
        check: (h, p) => !h.some(t => t.suit === 'z') && new Set(h.map(t => t.suit)).size === 1
    },

    // --- 役满 ---
    {
        id: 'kokushi', name: '国士无双', score: '役满',
        check: (h, p) => false // 引擎单独处理，若需要可在此扩展
    },
    {
        id: 'suuankou', name: '四暗刻', score: '役满',
        check: (h, p) => p && HELPERS.getSetCounts(p).anke === 4
    },
    {
        id: 'daisangen', name: '大三元', score: '役满',
        check: (h, p) => p && HELPERS.hasFanPai(p, 5) && HELPERS.hasFanPai(p, 6) && HELPERS.hasFanPai(p, 7)
    },
    {
        id: 'tsuiisou', name: '字一色', score: '役满',
        check: (h, p) => h.every(t => t.suit === 'z')
    }
];

// === 🇨🇳 国标番种配置 (MCR) - 示例 ===
export const GUOBIAO_YAKU = [
    {
        id: 'gb_88_1', name: '大四喜', score: 88,
        check: (h, p) => p && [1,2,3,4].every(v => HELPERS.hasFanPai(p, v))
    },
    {
        id: 'gb_88_2', name: '大三元', score: 88,
        check: (h, p) => p && [5,6,7].every(v => HELPERS.hasFanPai(p, v))
    },
    {
        id: 'gb_88_3', name: '九莲宝灯', score: 88,
        check: (h, p) => {
            if (!p || h.some(t => t.suit === 'z') || new Set(h.map(t => t.suit)).size !== 1) return false;
            const counts = new Array(10).fill(0);
            h.forEach(t => counts[t.val]++);
            return counts[1]>=3 && counts[9]>=3 && [2,3,4,5,6,7,8].every(v => counts[v]>=1);
        }
    },
    {
        id: 'gb_64_1', name: '小四喜', score: 64,
        check: (h, p) => p && [1,2,3,4].filter(v => HELPERS.hasFanPai(p, v)).length === 3 && p.pair[0].suit === 'z' && p.pair[0].val <= 4
    },
    {
        id: 'gb_64_2', name: '字一色', score: 64,
        check: (h, p) => h.every(t => t.suit === 'z')
    },
    {
        id: 'gb_24_1', name: '七对', score: 24,
        check: (h, p) => p === null && h.length === 14
    },
    {
        id: 'gb_24_2', name: '清一色', score: 24,
        check: (h, p) => !h.some(t => t.suit === 'z') && new Set(h.map(t => t.suit)).size === 1
    },
    {
        id: 'gb_16_1', name: '三色同顺', score: 8, // 国标三色是8番
        check: (h, p) => RIICHI_YAKU.find(y => y.id === 'sanshoku').check(h, p)
    },
    {
        id: 'gb_12_1', name: '大于五', score: 12,
        check: (h, p) => h.every(t => t.suit !== 'z' && t.val > 5)
    },
    {
        id: 'gb_12_2', name: '小于五', score: 12,
        check: (h, p) => h.every(t => t.suit !== 'z' && t.val < 5)
    },
    {
        id: 'gb_6_1', name: '碰碰和', score: 6,
        check: (h, p) => RIICHI_YAKU.find(y => y.id === 'toitoi').check(h, p)
    },
    {
        id: 'gb_6_2', name: '混一色', score: 6,
        check: (h, p) => RIICHI_YAKU.find(y => y.id === 'honitsu').check(h, p)
    },
    {
        id: 'gb_1_1', name: '缺一门', score: 1,
        check: (h, p) => {
            const suits = new Set(h.filter(t => t.suit !== 'z').map(t => t.suit));
            return suits.size === 2;
        }
    },
    {
        id: 'gb_1_2', name: '无字', score: 1,
        check: (h, p) => !h.some(t => t.suit === 'z')
    }
];