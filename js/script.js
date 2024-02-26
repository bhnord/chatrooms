let socket = io();
let myId = -1;
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
let lineWidth = 5;
let isPainting = false;



//scroll to bottom on new messages
const chatMutationObserver = new MutationObserver(() => {
  messages.scrollTo(0, messages.scrollHeight);
});
chatMutationObserver.observe(messages, { childList: true });

const drawMutationObserver = new MutationObserver(() => {
  drawingMessages.scrollTo(0, drawingMessages.scrollHeight);
});
drawMutationObserver.observe(drawingMessages, { childList: true });

closeDrawing.onclick = () => {
  drawingMessages.classList.toggle("closed");
};
closeChat.onclick = () => {
  messages.classList.toggle("closed");
};


//rate of sending info to server
const TICKRATE_MS = 25;
const SERVER_UPDATE_RATE = 100;

//TODO: changeme
const BASE_SERVER_URL = "http://localhost:3000";

socket.on("move", function(p) {
  //set players to where they belong
  players = Array.from(p);
});

socket.on("msg", function(msg) {
  let message = document.createElement("li");
  message.textContent = msg;
  messages.appendChild(message);

  //TODO: use DOM mutation observer?
  messages.scrollTo(0, messages.scrollHeight);
});

socket.on("draw", function(imgURL) {
  const li = document.createElement("li");
  const img = new Image();
  img.src = imgURL;
  li.appendChild(img);
  drawingMessages.appendChild(li);
  li.onclick = (e) => {
    ctx.drawImage(e.target, 0, 0);
  }
});

form.addEventListener("submit", function(e) {
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
    this.load.spritesheet("player", "player", {
      frameWidth: 82,
      frameHeight: 107,
    });
  }

  //init vars, define animations + sounds, display assets
  create() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("player", { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 10, end: 12 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "front",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 10,
      repeat: -1,
    });
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

    //TODO: implement interpolation?
    for (let player of players) {
      if (!spritesMap.has(player.id)) {
        const container = this.add.container(
          player.positionX,
          player.positionY,
        );
        const sprite = this.physics.add.sprite(0, 0, "player");
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
          ease: 'Power1',
          duration: SERVER_UPDATE_RATE
        })
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
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: "game-container-inside",
  },
  backgroundColor: "#FFFFF",
  scene: [GameScene],
  physics: {
    default: "arcade",
  },
};

const game = new Phaser.Game(config);

document.body.addEventListener("click", function(event) {
  if (chatBox.contains(event.target)) {
    game.input.keyboard.enabled = false;
  } else {
    game.input.keyboard.enabled = true;
  }
});

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
