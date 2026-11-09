// ======================================
// 麻雀21 - ゲーム本体
// ======================================

const Game = (() => {

  let wall = [];
  let players = [];
  let currentPlayer = 0;
  let remaining = 0;
  let round = 1;
  let started = false;
  let playerHasDrawn = false;
  let playerReach = false;
  let busy = false;

  const $ = id => document.getElementById(id);

  // プレイヤー作成
  function createPlayers() {

    const level = Number($("cpuLevel").value);

    return [
      {
        name: "あなた",
        human: true,
        hand: [],
        river: [],
        score: 25000,
        reach: false
      },
      {
        name: "CPU 東",
        human: false,
        level,
        hand: [],
        river: [],
        score: 25000,
        reach: false
      },
      {
        name: "CPU 西",
        human: false,
        level,
        hand: [],
        river: [],
        score: 25000,
        reach: false
      },
      {
        name: "CPU 北",
        human: false,
        level,
        hand: [],
        river: [],
        score: 25000,
        reach: false
      }
    ];
  }

  // メッセージ
  function message(text) {
    $("message").textContent = text;
  }

  // 対局開始
  function startGame() {

    wall = Mahjong.createWall();

    players = createPlayers();

    currentPlayer = 0;
    round = 1;
    remaining = wall.length;
    started = true;
    playerHasDrawn = false;
    playerReach = false;
    busy = false;

    // 配牌
    for (let i = 0; i < 13; i++) {
      for (const player of players) {
        player.hand.push(wall.pop());
      }
    }

    remaining = wall.length;

    Mahjong.sortHand(players[0].hand);

    render();

    message("対局開始！あなたの番です。ツモを押してください。");
  }

  // ツモ
  function draw() {

    if (!started || busy) return;

    if (currentPlayer !== 0) return;

    if (playerHasDrawn) {
      message("すでにツモっています。牌を選んで打牌してください。");
      return;
    }

    if (!wall.length) {
      endGame();
      return;
    }

    const tile = wall.pop();

    players[0].hand.push(tile);

    remaining = wall.length;

    playerHasDrawn = true;

    Mahjong.sortHand(players[0].hand);

    render();

    if (Mahjong.isWinning(players[0].hand)) {

      message("ツモ和了できます！ツモ和了ボタンを押してください。");

    } else {

      message("ツモしました。捨てる牌を選んでください。");
    }
  }

  // 打牌
  function discard(index) {

    if (!started || busy) return;

    if (currentPlayer !== 0) return;

    if (!playerHasDrawn) {

      message("先にツモをしてください。");
      return;
    }

    const player = players[0];

    const tile = player.hand.splice(index, 1)[0];

    player.river.push(tile);

    playerHasDrawn = false;

    playerReach = false;

    Mahjong.sortHand(player.hand);

    render();

    message("あなた：" + Mahjong.tileName(tile) + "を捨てました。");

    currentPlayer = 1;

    setTimeout(cpuTurn, 500);
  }

  // CPU対戦
  function cpuTurn() {

    if (!started || busy) return;

    if (!wall.length) {

      endGame();
      return;
    }

    const player = players[currentPlayer];

    // CPUツモ
    player.hand.push(wall.pop());

    remaining = wall.length;

    // ツモ和了
    if (CPU.shouldTsumo(player.hand, player.level)) {

      player.score += 1000;

      message(player.name + "がツモ和了しました！");

      render();

      setTimeout(nextTurn, 1200);

      return;
    }

    // CPU打牌
    const index = CPU.chooseDiscard(
      player.hand,
      player.level
    );

    const tile = player.hand.splice(index, 1)[0];

    player.river.push(tile);

    render();

    message(
      player.name +
      "（Lv." + player.level + "）が" +
      Mahjong.tileName(tile) +
      "を捨てました。"
    );

    // 次のCPUまたはプレイヤー
    setTimeout(nextTurn, 500);
  }

  // 次のプレイヤー
  function nextTurn() {

    if (!started) return;

    currentPlayer++;

    if (currentPlayer >= 4) {
      currentPlayer = 0;
    }

    if (currentPlayer === 0) {

      playerHasDrawn = false;

      render();

      message("あなたの番です。ツモを押してください。");

    } else {

      cpuTurn();
    }
  }

  // リーチ
  function reach() {

    if (!started || busy) return;

    const player = players[0];

    if (!playerHasDrawn) {

      message("ツモ後にリーチを宣言してください。");
      return;
    }

    if (player.hand.length !== 14) return;

    player.reach = true;

    playerReach = true;

    message("リーチを宣言しました！");
  }

  // ロン
  function ron() {

    message("ロン判定は次の正式ルール実装で追加します。");
  }

  // ツモ和了
  function tsumo() {

    if (!started || busy) return;

    const player = players[0];

    if (!playerHasDrawn) {

      message("先にツモをしてください。");
      return;
    }

    if (!Mahjong.isWinning(player.hand)) {

      message("まだ和了できません。");
      return;
    }

    player.score += 1000;

    message("ツモ和了！");

    render();

    setTimeout(endGame, 1500);
  }

  // 手牌整理
  function sortHand() {

    Mahjong.sortHand(players[0].hand);

    render();
  }

  // 局終了
  function endGame() {

    started = false;

    const ranking = [...players].sort(
      (a, b) => b.score - a.score
    );

    let text = "対局終了！順位：";

    ranking.forEach((p, i) => {

      text +=
        (i + 1) + "位 " +
        p.name + " " +
        p.score + "点 / ";
    });

    message(text);

    render();
  }

  // 画面更新
  function render() {

    if (!players.length) return;

    $("remaining").textContent = remaining;

    $("playerScore").textContent =
      players[0].score + "点";

    $("scoreEast").textContent =
      players[1].score + "点";

    $("scoreWest").textContent =
      players[2].score + "点";

    $("scoreNorth").textContent =
      players[3].score + "点";

    $("round").textContent = "東" + round + "局";

    // 手牌
    const area = $("playerHand");

    area.innerHTML = "";

    players[0].hand.forEach((tile, index) => {

      const button = document.createElement("button");

      button.className = "tile";

      button.textContent = Mahjong.tileName(tile);

      button.onclick = () => discard(index);

      area.appendChild(button);
    });

    // CPU手牌は伏せる
    $("handEast").textContent =
      "🀫".repeat(players[1].hand.length);

    $("handWest").textContent =
      "🀫".repeat(players[2].hand.length);

    $("handNorth").textContent =
      "🀫".repeat(players[3].hand.length);

    // 河
    const rivers = [];

    players.forEach(p => {

      rivers.push(
        p.name + "：" +
        p.river.map(Mahjong.tileName).join(" ")
      );
    });

    $("river").textContent = rivers.join(" ｜ ");
  }

  return {
    startGame,
    draw,
    discard,
    reach,
    ron,
    tsumo,
    sortHand
  };

})();

// CPUレベル選択
for (let i = 1; i <= 21; i++) {

  const option = document.createElement("option");

  option.value = i;

  option.textContent = "Lv." + i;

  $("cpuLevel").appendChild(option);
}

// ボタン
$("startBtn").onclick = Game.startGame;

$("resetBtn").onclick = Game.startGame;

$("drawBtn").onclick = Game.draw;

$("reachBtn").onclick = Game.reach;

$("ronBtn").onclick = Game.ron;

$("tsumoBtn").onclick = Game.tsumo;

$("sortBtn").onclick = Game.sortHand;

// 初期画面
$("cpuLevel").value = 5;
