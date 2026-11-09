// ======================================
// 麻雀21 - 麻雀基本エンジン
// ======================================

const Mahjong = (() => {

  const suits = ["m", "p", "s"];

  const honors = [
    "東", "南", "西", "北",
    "白", "發", "中"
  ];

  // 136枚の牌を作成
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

    // シャッフル
    for (let i = wall.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wall[i], wall[j]] = [wall[j], wall[i]];
    }

    return wall;
  }

  // 牌の表示
  function tileName(tile) {

    if (typeof tile !== "string") return "";

    if (tile.length === 1) {
      return tile;
    }

    const number = Number(tile.substring(1));

    if (tile[0] === "m") return number + "萬";
    if (tile[0] === "p") return number + "筒";
    if (tile[0] === "s") return number + "索";

    return tile;
  }

  // 牌の種類を判定
  function isHonor(tile) {
    return honors.includes(tile);
  }

  function isTerminal(tile) {
    if (isHonor(tile)) return true;

    if (tile.length !== 2) return false;

    const number = Number(tile.substring(1));

    return number === 1 || number === 9;
  }

  // 手牌を整理
  function sortHand(hand) {

    const order = [
      "m", "p", "s",
      "東", "南", "西", "北", "白", "發", "中"
    ];

    return hand.sort((a, b) => {

      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);

      if (ai !== bi) return ai - bi;

      return Number(a.substring(1)) -
             Number(b.substring(1));
    });
  }

  // 牌の数を数える
  function countTiles(hand) {

    const counts = {};

    for (const tile of hand) {
      counts[tile] = (counts[tile] || 0) + 1;
    }

    return counts;
  }

  // ======================================
  // 通常の4面子1雀頭の和了判定
  // ======================================

  function isWinningHand(hand) {

    if (hand.length !== 14) return false;

    const counts = countTiles(hand);

    for (const tile in counts) {

      if (counts[tile] >= 2) {

        counts[tile] -= 2;

        if (canMakeMelds(counts, 4)) {
          return true;
        }

        counts[tile] += 2;
      }
    }

    return false;
  }

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
        return true;
      }

      counts[tile] += 3;
    }

    // 順子
    if (
      tile.length === 2 &&
      ["m", "p", "s"].includes(tile[0])
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

  // ======================================
  // 七対子判定
  // ======================================

  function isSevenPairs(hand) {

    if (hand.length !== 14) return false;

    const counts = countTiles(hand);

    return Object.values(counts)
      .filter(n => n === 2).length === 7;
  }

  // ======================================
  // 国士無双判定
  // ======================================

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

      if (!counts[tile]) return false;

      if (counts[tile] >= 2) pair = true;
    }

    return pair;
  }

  function isWinning(hand) {

    return isWinningHand(hand) ||
           isSevenPairs(hand) ||
           isKokushi(hand);
  }

  return {
    createWall,
    tileName,
    sortHand,
    countTiles,
    isHonor,
    isTerminal,
    isWinning,
    isSevenPairs,
    isKokushi
  };

})();
