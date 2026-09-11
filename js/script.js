let socket = io();
let myId = -1;
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1100;
let spritesMap = new Map();
let players = [];
let isStopped = true;
let timer = 0;
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const chatBox = document.getElementById("chatroom");
const drawingMessages = document.getElementById("drawing-messages");
const closeDrawing = document.getElementById("close-drawing");
const closeChat = document.getElementById("close-chat");
const canvas = document.getElementById("drawing-board");
const toolbar = document.getElementById("toolbar");
const ctx = canvas.getContext("2d");
const chatBadge = document.getElementById("chat-badge");
const drawBadge = document.getElementById("draw-badge");
let chatUnread = 0;
let drawUnread = 0;

function setBadge(badge, count) {
  if (count > 0) {
    badge.textContent = count;
    badge.classList.add("show");
  } else {
    badge.textContent = "";
    badge.classList.remove("show");
  }
}
const playerExit = new Set();
let lineWidth = 5;
let isPainting = false;
const BASE_SERVER_URL = window.location.href;

//scroll to bottom on new messages
const scrollToBottom = (el) => {
  el.scrollTop = el.scrollHeight;
};

const chatMutationObserver = new MutationObserver(() => {
  scrollToBottom(messages);
});
chatMutationObserver.observe(messages, { childList: true });

const drawMutationObserver = new MutationObserver(() => {
  scrollToBottom(drawingMessages);
});
drawMutationObserver.observe(drawingMessages, { childList: true });

closeDrawing.onclick = () => {
  drawingMessages.classList.toggle("closed");
  if (!drawingMessages.classList.contains("closed")) {
    drawUnread = 0;
    setBadge(drawBadge, drawUnread);
  }
};
closeChat.onclick = () => {
  messages.classList.toggle("closed");
  if (!messages.classList.contains("closed")) {
    chatUnread = 0;
    setBadge(chatBadge, chatUnread);
  }
};

//rate of sending info to server
const TICKRATE_MS = 25;
const SERVER_UPDATE_RATE = 100 + 10; //add 10 ms to smoothen movement

socket.on("move", function (p) {
  //set players to where they belong
  players = Array.from(p);
  playerExit.clear();
  console.log(players);
  console.log(spritesMap);
});

socket.on("msg", function (msg) {
  let message = document.createElement("li");
  message.textContent = msg;
  messages.appendChild(message);
  if (messages.classList.contains("closed")) {
    chatUnread++;
    setBadge(chatBadge, chatUnread);
  }
});

//TODO: fix remove container
socket.on("player_exit", function (id) {
  playerExit.add(id);
  spritesMap.get(id).destroy();
  spritesMap.delete(id);
});

socket.on("draw", function (imgURL) {
  const li = document.createElement("li");
  const img = new Image();
  img.src = imgURL;
  img.onload = () => {
    scrollToBottom(drawingMessages);
  };
  li.appendChild(img);
  drawingMessages.appendChild(li);
  li.onclick = (e) => {
    ctx.drawImage(e.target, 0, 0);
  };
  if (drawingMessages.classList.contains("closed")) {
    drawUnread++;
    setBadge(drawBadge, drawUnread);
  }
});

socket.on("playerId", function (id) {
  myId = id;
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("msg", input.value);
    input.value = "";
  }
});

class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  //load assets
  preload() {
    this.load.setBaseURL(BASE_SERVER_URL);
    this.load.spritesheet("player", "player.png", {
      frameWidth: 16,
      frameHeight: 32,
    });

    this.load.image("beer", "beer.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  //init vars, define animations + sounds, display assets
  create() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "front",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 10,
      repeat: -1,
    });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const bounds = this.add.graphics();
    bounds.lineStyle(3, 0xffffff, 0.3);
    bounds.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  //update attr of game objects per game logic
  update(_, delta) {
    //correct speed across devices
    timer += delta;
    if (timer < TICKRATE_MS) {
      return;
    }
    timer = 0;
    this.publishInput();

    //TODO: move to server side
    this.getBeer();

    //TODO: implement interpolation?
    if (myId !== -1) {
      const self = spritesMap.get(myId);
      if (self) {
        this.cameras.main.startFollow(self, true, 0.1, 0.1);
      }
    }
    for (let player of players) {
      if (playerExit.has(player.id)) {
        continue;
      }
      if (!spritesMap.has(player.id)) {
        const container = this.add.container(
          player.positionX,
          player.positionY,
        );
        const sprite = this.physics.add.sprite(0, 0, "player");
        sprite.setScale(3);
        const text = this.add.text(0, 65, player.displayName);
        text.setOrigin(0.5);

        container.add(sprite);
        container.add(text);

        spritesMap.set(player.id, container);
      } else {
        //set container to correct location
        const container = spritesMap.get(player.id);
        this.tweens.add({
          targets: container,
          x: player.positionX,
          y: player.positionY,
          ease: "Power1",
          duration: SERVER_UPDATE_RATE,
        });
        //        container.setPosition(player.positionX, player.positionY);

        //get sprite from container
        const sprite = container.list[0];

        //set sprite animations
        switch (player.anim) {
          case "left":
            sprite.anims.play("left", true);
            break;
          case "right":
            sprite.anims.play("right", true);
            break;
          case "up":
            sprite.anims.play("up", true);
            break;
          case "down":
            sprite.anims.play("down", true);
            break;
          default:
            sprite.anims.play("front", true);
        }
      }
    }
  }

  publishInput() {
    let move = {
      moveX: 0,
      moveY: 0,
    };

    if (document.activeElement === input) {
      if (!isStopped) {
        isStopped = true;
        socket.emit("move", JSON.stringify(move));
      }
      return;
    }

    if (this.cursors.up.isDown) {
      move.moveY = -1;
      isStopped = false;
    } else if (this.cursors.down.isDown) {
      move.moveY = 1;
      isStopped = false;
    }

    if (this.cursors.left.isDown) {
      move.moveX = -1;
      isStopped = false;
    } else if (this.cursors.right.isDown) {
      move.moveX = 1;
      isStopped = false;
    }

    if (move.moveX != 0 || move.moveY != 0) {
      socket.emit("move", JSON.stringify(move));
    } else if (!isStopped) {
      socket.emit("move", JSON.stringify(move));
      isStopped = true;
    }
  }

  getBeer() {
    //TODO: move logic
    if (this.cursors.space.isDown) {
      const beer = this.physics.add.image(
        Phaser.Math.Between(0, WORLD_WIDTH),
        Phaser.Math.Between(0, WORLD_HEIGHT),
        "beer",
      );
      beer.setScale(2);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container-inside",
    width: 2000,
    height: 1100,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: "#1e2030",
  scene: [GameScene],
  physics: {
    default: "arcade",
  },
  pixelArt: true,
};

const game = new Phaser.Game(config);

//drawing part
const getCursor = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return [x, y];
};

toolbar.addEventListener("click", (e) => {
  switch (e.target.id) {
    case "send":
      //send and clear
      const imgURL = canvas.toDataURL("image/png");
      socket.emit("draw", imgURL);

    case "clear":
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      break;
  }
});

toolbar.addEventListener("change", (e) => {
  switch (e.target.id) {
    case "stroke":
      ctx.strokeStyle = e.target.value;
      break;
    case "lineWidth":
      lineWidth = e.target.value;
      break;
  }
});

canvas.addEventListener("mousedown", (e) => {
  isPainting = true;
  //FIXME: get offsets for canvas
  [startX, startY] = getCursor(e);
});

canvas.addEventListener("mouseup", (e) => {
  isPainting = false;
  ctx.stroke();
  ctx.beginPath();
});

//FIXME: get offsets for canvas
const draw = (e) => {
  if (!isPainting) {
    return;
  }
  ctx.lineWidth = lineWidth;
  ctx.ineCap = "round";
  const [x, y] = getCursor(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

canvas.addEventListener("mousemove", draw);
ctx.imageSmoothingEnabled = false;
