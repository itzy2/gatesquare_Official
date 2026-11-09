/* =====================================================
   MAHJONG21 - app.js
   CPUレベル1～21対応
   ===================================================== */

(() => {
  "use strict";

  /* =========================
     DOM取得
  ========================= */

  const $ = (id) => document.getElementById(id);

  const cpuLevelSelect = $("cpuLevel");
  const startBtn = $("startBtn");
  const resetBtn = $("resetBtn");
  const drawBtn = $("drawBtn");
  const reachBtn = $("reachBtn");
  const ronBtn = $("ronBtn");
  const tsumoBtn = $("tsumoBtn");
  const sortBtn = $("sortBtn");

  const playerHandElement = $("playerHand");
  const handNorthElement = $("handNorth");
  const handWestElement = $("handWest");
  const handEastElement = $("handEast");

  const remainingElement = $("remaining");
  const roundElement = $("round");
  const turnInfoElement = $("turnInfo");
  const riverElement = $("river");
  const messageElement = $("message");

  /* =========================
     ゲーム設定
  ========================= */

  const PLAYER_COUNT = 4;
  const INITIAL_HAND_SIZE = 13;

  const GameState = {
    started: false,
    busy: false,

    players: [],
    wall: [],
    rivers: [[], [], [], []],

    currentPlayer: 0,
    remaining: 0,

    round: 1,
    turn: 0,

    lastDraw: null,
    lastDiscard: null,

    reached: false
  };

  /* =========================
     CPUレベル設定
  ========================= */

  function setupCpuLevels() {
    if (!cpuLevelSelect) return;

    cpuLevelSelect.innerHTML = "";

    for (let level = 1; level <= 21; level++) {
      const option = document.createElement("option");

      option.value = String(level);

      let label = "";

      if (level === 1) label = "（入門）";
      if (level === 5) label = "（初級）";
      if (level === 10) label = "（中級）";
      if (level === 15) label = "（上級）";
      if (level === 20) label = "（強豪）";
      if (level === 21) label = "（最強）";

      option.textContent = `CPU Lv.${level}${label}`;

      cpuLevelSelect.appendChild(option);
    }

    cpuLevelSelect.value = "1";
  }

  function getCpuLevel() {
    const level = Number(cpuLevelSelect?.value || 1);

    return Math.max(1, Math.min(21, level));
  }

  /* =========================
     プレイヤー作成
  ========================= */

  function createPlayers() {
    const level = getCpuLevel();

    return [
      {
        name: "あなた",
        type: "human",
        level: 0,
        hand: [],
        score: 25000,
        reached: false,
        discards: []
      },
      {
        name: "CPU北",
        type: "cpu",
        level,
        hand: [],
        score: 25000,
        reached: false,
        discards: []
      },
      {
        name: "CPU西",
        type: "cpu",
        level,
        hand: [],
        score: 25000,
        reached: false,
        discards: []
      },
      {
        name: "CPU東",
        type: "cpu",
        level,
        hand: [],
        score: 25000,
        reached: false,
        discards: []
      }
    ];
  }

  /* =========================
     メッセージ表示
  ========================= */

  function message(text) {
    if (messageElement) {
      messageElement.textContent = text;
    }
  }

  /* =========================
     牌山作成
  ========================= */

  function createWall() {
    if (typeof Mahjong !== "undefined" &&
        typeof Mahjong.createWall === "function") {
      const wall = Mahjong.createWall();

      if (typeof Mahjong.shuffle === "function") {
        Mahjong.shuffle(wall);
      }

      return wall;
    }

    throw new Error(
      "Mahjong.createWall() が見つかりません。mahjong.jsを確認してください。"
    );
  }

  /* =========================
     ゲーム開始
  ========================= */

  function startGame() {
    try {
      GameState.started = true;
      GameState.busy = false;

      GameState.players = createPlayers();
      GameState.wall = createWall();

      GameState.rivers = [[], [], [], []];

      GameState.currentPlayer = 0;
      GameState.remaining = GameState.wall.length;

      GameState.turn = 0;
      GameState.lastDraw = null;
      GameState.lastDiscard = null;
      GameState.reached = false;

      // 全員に13枚配る
      for (let i = 0; i < PLAYER_COUNT; i++) {
        GameState.players[i].hand = [];

        for (let j = 0; j < INITIAL_HAND_SIZE; j++) {
          GameState.players[i].hand.push(drawTileFromWall());
        }
      }

      // 最初はプレイヤーがツモる
      GameState.currentPlayer = 0;

      renderAll();

      message(
        `ゲーム開始！ CPUレベル ${getCpuLevel()} で対戦します。`
      );

      drawBtn && (drawBtn.disabled = false);
      reachBtn && (reachBtn.disabled = false);
      ronBtn && (ronBtn.disabled = false);
      tsumoBtn && (tsumoBtn.disabled = false);

      // プレイヤーの最初のツモ
      playerDraw();

    } catch (error) {
      console.error(error);
      message("ゲーム開始エラー：" + error.message);
    }
  }

  /* =========================
     牌山からツモ
  ========================= */

  function drawTileFromWall() {
    if (GameState.wall.length === 0) {
      return null;
    }

    const tile = GameState.wall.pop();

    GameState.remaining = GameState.wall.length;

    return tile;
  }

  /* =========================
     プレイヤーツモ
  ========================= */

  function playerDraw() {
    if (!GameState.started || GameState.busy) return;

    if (GameState.currentPlayer !== 0) return;

    if (GameState.remaining <= 0) {
      endGame();
      return;
    }

    const player = GameState.players[0];

    const tile = drawTileFromWall();

    if (tile === null) {
      endGame();
      return;
    }

    player.hand.push(tile);

    GameState.lastDraw = tile;
    GameState.turn++;

    renderAll();

    message("ツモ！ 牌を選んで捨ててください。");

    checkTsumoButton();
  }

  /* =========================
     プレイヤー打牌
  ========================= */

  function playerDiscard(index) {
    if (!GameState.started || GameState.busy) return;

    if (GameState.currentPlayer !== 0) return;

    const player = GameState.players[0];

    if (index < 0 || index >= player.hand.length) return;

    const tile = player.hand.splice(index, 1)[0];

    GameState.rivers[0].push(tile);
    GameState.lastDiscard = tile;

    GameState.reached = false;

    renderAll();

    message("あなた：" + tileName(tile) + " を捨てました。");

    // CPUの順番へ
    GameState.currentPlayer = 1;

    cpuTurn();
  }

  /* =========================
     CPUターン
  ========================= */

  async function cpuTurn() {
    if (!GameState.started || GameState.busy) return;

    GameState.busy = true;

    try {
      for (let seat = 1; seat <= 3; seat++) {
        if (GameState.remaining <= 0) {
          endGame();
          return;
        }

        GameState.currentPlayer = seat;

        const cpu = GameState.players[seat];

        message(cpu.name + " がツモっています…");

        renderAll();

        await delay(500);

        // CPUがツモ
        const draw = drawTileFromWall();

        if (draw === null) {
          endGame();
          return;
        }

        cpu.hand.push(draw);

        GameState.lastDraw = draw;

        renderAll();

        await delay(500);

        // CPUが打牌
        const discardIndex = chooseCpuDiscard(cpu);

        const discard = cpu.hand.splice(discardIndex, 1)[0];

        GameState.rivers[seat].push(discard);

        GameState.lastDiscard = discard;

        renderAll();

        message(
          cpu.name + " が " + tileName(discard) + " を捨てました。"
        );

        await delay(500);
      }

      // プレイヤーの番
      GameState.currentPlayer = 0;

      GameState.busy = false;

      message("あなたの番です。ツモしてください。");

      playerDraw();

    } catch (error) {
      console.error(error);

      GameState.busy = false;

      message("CPU処理エラー：" + error.message);
    }
  }

  /* =========================
     CPU打牌判断
  ========================= */

  function chooseCpuDiscard(cpu) {
    if (
      typeof CPU !== "undefined" &&
      typeof CPU.chooseDiscard === "function"
    ) {
      const index = CPU.chooseDiscard(
        cpu.hand,
        cpu.level
      );

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < cpu.hand.length
      ) {
        return index;
      }
    }

    // CPU.jsが使えない場合
    return Math.floor(Math.random() * cpu.hand.length);
  }

  /* =========================
     プレイヤーの手牌表示
  ========================= */

  function renderPlayerHand() {
    if (!playerHandElement) return;

    playerHandElement.innerHTML = "";

    const player = GameState.players[0];

    if (!player) return;

    player.hand.forEach((tile, index) => {
      const button = document.createElement("button");

      button.className = "tile";

      button.textContent = tileName(tile);

      button.dataset.index = String(index);

      button.disabled =
        GameState.busy ||
        GameState.currentPlayer !== 0 ||
        player.hand.length !== 14;

      button.addEventListener("click", () => {
        playerDiscard(index);
      });

      playerHandElement.appendChild(button);
    });
  }

  /* =========================
     CPU手牌表示
  ========================= */

  function renderCpuHands() {
    const elements = [
      handNorthElement,
      handWestElement,
      handEastElement
    ];

    for (let i = 0; i < 3; i++) {
      const element = elements[i];

      if (!element) continue;

      element.innerHTML = "";

      const cpu = GameState.players[i + 1];

      if (!cpu) continue;

      cpu.hand.forEach(() => {
        const tile = document.createElement("span");

        tile.className = "tile hidden-tile";

        tile.textContent = "■";

        element.appendChild(tile);
      });
    }
  }

  /* =========================
     河の表示
  ========================= */

  function renderRiver() {
    if (!riverElement) return;

    riverElement.innerHTML = "";

    GameState.rivers.forEach((river, seat) => {
      const section = document.createElement("div");

      section.className = "river-section";

      const title = document.createElement("div");

      title.className = "river-title";

      title.textContent =
        seat === 0 ? "あなたの河" :
        seat === 1 ? "CPU北の河" :
        seat === 2 ? "CPU西の河" :
        "CPU東の河";

      section.appendChild(title);

      const tiles = document.createElement("div");

      tiles.className = "river-tiles";

      river.forEach((tile) => {
        const span = document.createElement("span");

        span.className = "river-tile";

        span.textContent = tileName(tile);

        tiles.appendChild(span);
      });

      section.appendChild(tiles);

      riverElement.appendChild(section);
    });
  }

  /* =========================
     スコア表示
  ========================= */

  function renderScores() {
    const scoreElements = [
      $("playerScore"),
      $("scoreNorth"),
      $("scoreWest"),
      $("scoreEast")
    ];

    GameState.players.forEach((player, index) => {
      if (scoreElements[index]) {
        scoreElements[index].textContent =
          player.score.toLocaleString();
      }
    });
  }

  /* =========================
     残り牌・局表示
  ========================= */

  function renderStatus() {
    if (remainingElement) {
      remainingElement.textContent =
        String(GameState.remaining);
    }

    if (roundElement) {
      roundElement.textContent =
        String(GameState.round);
    }

    if (turnInfoElement) {
      const player = GameState.players[
        GameState.currentPlayer
      ];

      turnInfoElement.textContent =
        player ? player.name + "の番" : "";
    }
  }

  /* =========================
     全画面更新
  ========================= */

  function renderAll() {
    renderPlayerHand();
    renderCpuHands();
    renderRiver();
    renderScores();
    renderStatus();
  }

  /* =========================
     牌の名称
  ========================= */

  function tileName(tile) {
    if (tile === null || tile === undefined) {
      return "";
    }

    if (
      typeof Mahjong !== "undefined" &&
      typeof Mahjong.tileName === "function"
    ) {
      return Mahjong.tileName(tile);
    }

    return String(tile);
  }

  /* =========================
     手牌整理
  ========================= */

  function sortHand() {
    const player = GameState.players[0];

    if (!player) return;

    if (
      typeof Mahjong !== "undefined" &&
      typeof Mahjong.sortHand === "function"
    ) {
      player.hand = Mahjong.sortHand(player.hand);
    } else {
      player.hand.sort((a, b) =>
        String(a).localeCompare(String(b))
      );
    }

    renderAll();

    message("手牌を整理しました。");
  }

  /* =========================
     リーチ
  ========================= */

  function reach() {
    const player = GameState.players[0];

    if (!player) return;

    if (player.hand.length !== 14) {
      message("リーチするにはツモ後の14枚が必要です。");
      return;
    }

    if (player.reached) {
      message("すでにリーチしています。");
      return;
    }

    player.reached = true;

    GameState.reached = true;

    message("リーチ！");
  }

  /* =========================
     ツモ判定
  ========================= */

  function checkTsumoButton() {
    const player = GameState.players[0];

    if (!player || !tsumoBtn) return;

    tsumoBtn.disabled = !isWinningHand(player.hand);
  }

  function isWinningHand(hand) {
    if (
      typeof Mahjong !== "undefined" &&
      typeof Mahjong.isWinningHand === "function"
    ) {
      return Mahjong.isWinningHand(hand);
    }

    if (
      typeof Mahjong !== "undefined" &&
      typeof Mahjong.isWinning === "function"
    ) {
      return Mahjong.isWinning(hand);
    }

    return false;
  }

  /* =========================
     ツモ
  ========================= */

  function tsumo() {
    const player = GameState.players[0];

    if (!player) return;

    if (!isWinningHand(player.hand)) {
      message("まだツモ和了できません。");
      return;
    }

    message("ツモ！ あなたの勝利です！");

    player.score += 1000;

    renderAll();

    endGame("あなたのツモ和了！");
  }

  /* =========================
     ロン
  ========================= */

  function ron() {
    const player = GameState.players[0];

    if (!player) return;

    if (!GameState.lastDiscard) {
      message("ロンできる牌がありません。");
      return;
    }

    const testHand = player.hand.concat(
      GameState.lastDiscard
    );

    if (!isWinningHand(testHand)) {
      message("ロンできません。");
      return;
    }

    player.score += 1000;

    renderAll();

    endGame("あなたのロン和了！");
  }

  /* =========================
     ゲーム終了
  ========================= */

  function endGame(reason = "流局") {
    GameState.started = false;
    GameState.busy = false;

    drawBtn && (drawBtn.disabled = true);
    reachBtn && (reachBtn.disabled = true);
    ronBtn && (ronBtn.disabled = true);
    tsumoBtn && (tsumoBtn.disabled = true);

    message("ゲーム終了：" + reason);
  }

  /* =========================
     リセット
  ========================= */

  function resetGame() {
    GameState.started = false;
    GameState.busy = false;

    GameState.players = [];
    GameState.wall = [];

    GameState.rivers = [[], [], [], []];

    GameState.currentPlayer = 0;
    GameState.remaining = 0;

    GameState.lastDraw = null;
    GameState.lastDiscard = null;

    GameState.reached = false;

    if (playerHandElement) {
      playerHandElement.innerHTML = "";
    }

    if (handNorthElement) {
      handNorthElement.innerHTML = "";
    }

    if (handWestElement) {
      handWestElement.innerHTML = "";
    }

    if (handEastElement) {
      handEastElement.innerHTML = "";
    }

    if (riverElement) {
      riverElement.innerHTML = "";
    }

    renderStatus();

    message("リセットしました。CPUレベルを選択して開始してください。");
  }

  /* =========================
     待機
  ========================= */

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* =========================
     ボタン設定
  ========================= */

  function setupEvents() {
    startBtn?.addEventListener("click", startGame);

    resetBtn?.addEventListener("click", resetGame);

    drawBtn?.addEventListener("click", playerDraw);

    reachBtn?.addEventListener("click", reach);

    ronBtn?.addEventListener("click", ron);

    tsumoBtn?.addEventListener("click", tsumo);

    sortBtn?.addEventListener("click", sortHand);
  }

  /* =========================
     初期化
  ========================= */

  function initialize() {
    setupCpuLevels();
    setupEvents();

    resetGame();

    console.log("MAHJONG21 app.js 読み込み完了");
  }

  /* =========================
     公開API
  ========================= */

  window.Game = {
    startGame,
    resetGame,
    draw: playerDraw,
    discard: playerDiscard,
    reach,
    ron,
    tsumo,
    sortHand,

    getState() {
      return GameState;
    },

    getCpuLevel
  };

  /* =========================
     起動
  ========================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

})();

alert("MAHJONG21 app.js 読み込み成功！");
