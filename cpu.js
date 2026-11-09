// ======================================
// 麻雀21 - CPU AI
// ======================================

const CPU = (() => {

  // 牌の評価
  function evaluateTile(hand, tile, level) {

    const counts = Mahjong.countTiles(hand);

    let score = 0;

    // 孤立した牌は低評価
    if (!counts[tile] || counts[tile] === 1) {
      score -= 2;
    }

    // 対子・刻子を評価
    if (counts[tile] >= 2) {
      score += 4;
    }

    if (counts[tile] >= 3) {
      score += 6;
    }

    // 字牌
    if (Mahjong.isHonor(tile)) {

      if (counts[tile] === 1) {
        score -= level * 0.3;
      }

      if (counts[tile] >= 2) {
        score += level * 0.5;
      }

      return score;
    }

    // 数牌
    const number = Number(tile.substring(1));

    // 端牌は孤立しやすい
    if (number === 1 || number === 9) {
      score -= level * 0.1;
    }

    // 近くの牌を確認
    const suit = tile[0];

    const left = suit + (number - 1);
    const right = suit + (number + 1);

    if (counts[left]) score += level * 0.15;
    if (counts[right]) score += level * 0.15;

    // 両面・嵌張などの形を評価
    if (number >= 2 && number <= 8) {

      if (
        counts[suit + (number - 2)] &&
        counts[suit + (number - 1)]
      ) {
        score += level * 0.25;
      }

      if (
        counts[suit + (number + 1)] &&
        counts[suit + (number + 2)]
      ) {
        score += level * 0.25;
      }
    }

    return score;
  }

  // 捨てる牌を選択
  function chooseDiscard(hand, level) {

    if (level <= 3) {

      return Math.floor(Math.random() * hand.length);
    }

    let bestIndex = 0;
    let worstScore = Infinity;

    for (let i = 0; i < hand.length; i++) {

      const score = evaluateTile(
        hand,
        hand[i],
        level
      );

      // 高レベルほど判断のばらつきを小さくする
      const noise =
        Math.random() * (22 - level) * 0.1;

      const finalScore = score + noise;

      if (finalScore < worstScore) {

        worstScore = finalScore;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  // リーチ判断
  function shouldReach(hand, level) {

    if (level < 6) return false;

    if (hand.length !== 14) return false;

    return Mahjong.isWinning(hand);
  }

  // ロン判断
  function shouldRon(hand, tile, level) {

    const testHand = [...hand, tile];

    if (!Mahjong.isWinning(testHand)) {
      return false;
    }

    return level >= 2 || Math.random() < 0.5;
  }

  // ツモ判断
  function shouldTsumo(hand, level) {

    if (!Mahjong.isWinning(hand)) {
      return false;
    }

    return level >= 1;
  }

  return {
    chooseDiscard,
    shouldReach,
    shouldRon,
    shouldTsumo,
    evaluateTile
  };

})();
