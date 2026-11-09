// ==================================================
// 麻雀21 - 麻雀エンジン
// 牌生成・手牌整理・和了形判定・基本役判定
// ==================================================

const Mahjong = (() => {

  const suits = ["m", "p", "s"];

  const honors = [
    "東", "南", "西", "北", "白", "發", "中"
  ];

  const dragons = ["白", "發", "中"];

  // ==================================================
  // 牌山作成
  // ==================================================

  function createWall() {

    const wall = [];

    for (const suit of suits) {

      for (let n = 1; n <= 9; n++) {

        for (let i = 0; i < 4; i++) {

          wall.push(suit + n);

        }

      }

    }

    for (const honor of honors) {

      for (let i = 0; i < 4; i++) {

        wall.push(honor);

      }

    }

    shuffle(wall);

    return wall;

  }

  // ==================================================
  // シャッフル
  // ==================================================

  function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];

    }

    return array;

  }

  // ==================================================
  // 牌の表示名
  // ==================================================

  function tileName(tile) {

    if (!tile) return "";

    if (honors.includes(tile)) {
      return tile;
    }

    const number = Number(tile.substring(1));

    if (tile[0] === "m") return number + "萬";

    if (tile[0] === "p") return number + "筒";

    if (tile[0] === "s") return number + "索";

    return tile;

  }

  // ==================================================
  // 手牌整理
  // ==================================================

  function tileOrder(tile) {

    if (tile.length === 1) {

      return 300 + honors.indexOf(tile);

    }

    const suitIndex = suits.indexOf(tile[0]);

    const number = Number(tile.substring(1));

    return suitIndex * 100 + number;

  }

  function sortHand(hand) {

    return hand.sort((a, b) => {

      return tileOrder(a) - tileOrder(b);

    });

  }

  // ==================================================
  // 牌の分類
  // ==================================================

  function isHonor(tile) {

    return honors.includes(tile);

  }

  function isTerminal(tile) {

    if (isHonor(tile)) return true;

    if (!tile || tile.length !== 2) return false;

    const number = Number(tile.substring(1));

    return number === 1 || number === 9;

  }

  function isTerminalOrHonor(tile) {

    return isTerminal(tile);

  }

  function isSimple(tile) {

    return !isTerminalOrHonor(tile);

  }

  // ==================================================
  // 牌の枚数カウント
  // ==================================================

  function countTiles(hand) {

    const counts = {};

    for (const tile of hand) {

      counts[tile] = (counts[tile] || 0) + 1;

    }

    return counts;

  }

  // ==================================================
  // 通常の和了形
  // 4面子1雀頭
  // ==================================================

  function isWinningHand(hand) {

    if (hand.length !== 14) return false;

    const counts = countTiles(hand);

    for (const tile in counts) {

      if (counts[tile] >= 2) {

        counts[tile] -= 2;

        if (canMakeMelds(counts, 4)) {

          counts[tile] += 2;

          return true;

        }

        counts[tile] += 2;

      }

    }

    return false;

  }

  // ==================================================
  // 面子構成判定
  // ==================================================

  function canMakeMelds(counts, remaining) {

    if (remaining === 0) {

      return Object.values(counts)
        .every(n => n === 0);

    }

    const tile = Object.keys(counts)
      .find(t => counts[t] > 0);

    if (!tile) return false;

    // 刻子
    if (counts[tile] >= 3) {

      counts[tile] -= 3;

      if (canMakeMelds(counts, remaining - 1)) {

        counts[tile] += 3;

        return true;

      }

      counts[tile] += 3;

    }

    // 順子
    if (
      tile.length === 2 &&
      suits.includes(tile[0])
    ) {

      const number = Number(tile.substring(1));

      if (number <= 7) {

        const t2 = tile[0] + (number + 1);

        const t3 = tile[0] + (number + 2);

        if (counts[t2] > 0 && counts[t3] > 0) {

          counts[tile]--;

          counts[t2]--;

          counts[t3]--;

          if (canMakeMelds(counts, remaining - 1)) {

            counts[tile]++;

            counts[t2]++;

            counts[t3]++;

            return true;

          }

          counts[tile]++;

          counts[t2]++;

          counts[t3]++;

        }

      }

    }

    return false;

  }

  // ==================================================
  // 七対子
  // ==================================================

  function isSevenPairs(hand) {

    if (hand.length !== 14) return false;

    const counts = countTiles(hand);

    const pairs = Object.values(counts)
      .filter(n => n === 2).length;

    return pairs === 7;

  }

  // ==================================================
  // 国士無双
  // ==================================================

  function isKokushi(hand) {

    if (hand.length !== 14) return false;

    const required = [
      "m1", "m9",
      "p1", "p9",
      "s1", "s9",
      "東", "南", "西", "北",
      "白", "發", "中"
    ];

    const counts = countTiles(hand);

    let pair = false;

    for (const tile of required) {

      if (!counts[tile]) {

        return false;

      }

      if (counts[tile] >= 2) {

        pair = true;

      }

    }

    return pair;

  }

  // ==================================================
  // 面子分解
  // ==================================================

  function getAllDecompositions(hand) {

    if (hand.length !== 14) return [];

    const counts = countTiles(hand);

    const results = [];

    for (const tile in counts) {

      if (counts[tile] >= 2) {

        counts[tile] -= 2;

        const melds = [];

        if (decompose(counts, melds)) {

          results.push({

            pair: tile,

            melds: melds.map(m => [...m])

          });

        }

        counts[tile] += 2;

      }

    }

    return results;

  }

  function decompose(counts, melds) {

    const tile = Object.keys(counts)
      .find(t => counts[t] > 0);

    if (!tile) {

      return melds.length === 4;

    }

    // 刻子
    if (counts[tile] >= 3) {

      counts[tile] -= 3;

      melds.push([tile, tile, tile]);

      if (decompose(counts, melds)) {

        counts[tile] += 3;

        melds.pop();

        return true;

      }

      counts[tile] += 3;

      melds.pop();

    }

    // 順子
    if (
      tile.length === 2 &&
      suits.includes(tile[0])
    ) {

      const number = Number(tile.substring(1));

      if (number <= 7) {

        const t2 = tile[0] + (number + 1);

        const t3 = tile[0] + (number + 2);

        if (counts[t2] > 0 && counts[t3] > 0) {

          counts[tile]--;

          counts[t2]--;

          counts[t3]--;

          melds.push([tile, t2, t3]);

          if (decompose(counts, melds)) {

            counts[tile]++;

            counts[t2]++;

            counts[t3]++;

            melds.pop();

            return true;

          }

          counts[tile]++;

          counts[t2]++;

          counts[t3]++;

          melds.pop();

        }

      }

    }

    return false;

  }

  // ==================================================
  // 役判定
  // ==================================================

  function checkYaku(hand, options = {}) {

    const yaku = [];

    if (hand.length !== 14) {

      return {

        winning: false,

        yaku: [],

        han: 0

      };

    }

    // 国士無双
    if (isKokushi(hand)) {

      return {

        winning: true,

        yaku: ["国士無双"],

        han: 13

      };

    }

    // 七対子
    if (isSevenPairs(hand)) {

      yaku.push("七対子");

    }

    // 通常和了
    const decompositions = getAllDecompositions(hand);

    if (
      !isSevenPairs(hand) &&
      decompositions.length === 0
    ) {

      return {

        winning: false,

        yaku: [],

        han: 0

      };

    }

    const counts = countTiles(hand);

    // タンヤオ
    if (hand.every(isSimple)) {

      yaku.push("タンヤオ");

    }

    // ツモ
    if (options.tsumo) {

      yaku.push("門前清自摸和");

    }

    // リーチ
    if (options.riichi) {

      yaku.push("リーチ");

    }

    // 役牌：三元牌
    for (const dragon of dragons) {

      if (counts[dragon] >= 3) {

        yaku.push("役牌：" + dragon);

      }

    }

    // 場風・自風
    const roundWind = options.roundWind || "東";

    const seatWind = options.seatWind || "東";

    if (counts[roundWind] >= 3) {

      yaku.push("場風：" + roundWind);

    }

    if (counts[seatWind] >= 3) {

      yaku.push("自風：" + seatWind);

    }

    // 七対子の追加判定
    if (isSevenPairs(hand)) {

      if (hand.every(isSimple)) {

        // タンヤオは既に追加済み

      }

    }

    // 通常形の役
    for (const decomposition of decompositions) {

      const melds = decomposition.melds;

      const pair = decomposition.pair;

      const allTiles = hand;

      // 対々和
      if (
        melds.every(m => m[0] === m[1] && m[1] === m[2])
      ) {

        yaku.push("対々和");

      }

      // 混一色
      const suitSet = new Set(
        allTiles
          .filter(t => t.length === 2)
          .map(t => t[0])
      );

      const hasHonors = allTiles.some(isHonor);

      if (suitSet.size === 1 && hasHonors) {

        yaku.push("混一色");

      }

      // 清一色
      if (suitSet.size === 1 && !hasHonors) {

        yaku.push("清一色");

      }

      // 一気通貫
      for (const suit of suits) {

        const has123 = melds.some(m =>
          m.join(",") === [
            suit + "1",
            suit + "2",
            suit + "3"
          ].join(",")
        );

        const has456 = melds.some(m =>
          m.join(",") === [
            suit + "4",
            suit + "5",
            suit + "6"
          ].join(",")
        );

        const has789 = melds.some(m =>
          m.join(",") === [
            suit + "7",
            suit + "8",
            suit + "9"
          ].join(",")
        );

        if (has123 && has456 && has789) {

          yaku.push("一気通貫");

        }

      }

      // 三色同順
      for (let n = 1; n <= 7; n++) {

        const sequence = [
          n,
          n + 1,
          n + 2
        ];

        const found = suits.every(suit => {

          return melds.some(m => {

            return m.join(",") === sequence
              .map(x => suit + x)
              .join(",");

          });

        });

        if (found) {

          yaku.push("三色同順");

        }

      }

      // 一盃口
      const sequenceCounts = {};

      for (const meld of melds) {

        if (meld[0] !== meld[1]) {

          const key = meld.join(",");

          sequenceCounts[key] =
            (sequenceCounts[key] || 0) + 1;

        }

      }

      if (
        Object.values(sequenceCounts)
          .some(n => n >= 2)
      ) {

        yaku.push("一盃口");

      }

    }

    // 役の重複除去
    const uniqueYaku = [...new Set(yaku)];

    // 翻数
    let han = 0;

    for (const item of uniqueYaku) {

      if (item === "国士無双") {

        han += 13;

      } else if (item === "清一色") {

        han += 6;

      } else if (item === "混一色") {

        han += 3;

      } else if (item === "七対子") {

        han += 2;

      } else if (
        item === "対々和" ||
        item === "三色同順" ||
        item === "一気通貫"
      ) {

        han += 2;

      } else if (
        item === "一盃口" ||
        item === "タンヤオ" ||
        item === "リーチ" ||
        item === "門前清自摸和"
      ) {

        han += 1;

      } else if (
        item.startsWith("役牌") ||
        item.startsWith("場風") ||
        item.startsWith("自風")
      ) {

        han += 1;

      }

    }

    return {

      winning: uniqueYaku.length > 0,

      yaku: uniqueYaku,

      han: han

    };

  }

  // ==================================================
  // 和了判定
  // ==================================================

  function isWinning(hand) {

    return (
      isWinningHand(hand) ||
      isSevenPairs(hand) ||
      isKokushi(hand)
    );

  }

  // ==================================================
  // 外部公開
  // ==================================================

  return {

    createWall,

    shuffle,

    tileName,

    sortHand,

    countTiles,

    isHonor,

    isTerminal,

    isTerminalOrHonor,

    isSimple,

    isWinning,

    isWinningHand,

    isSevenPairs,

    isKokushi,

    getAllDecompositions,

    checkYaku

  };

})();
