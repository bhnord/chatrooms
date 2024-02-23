let socket = io();
let myId = -1;
let spritesMap = new Map();
let players = [];
let isStopped = true;
const chat = document.getElementById("chat");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const chatBox = document.getElementById("chatroom");

//TODO: changeme
const BASE_SERVER_URL = "http://localhost:3000";

socket.on("move", function (p) {
  //set players to where they belong
  players = Array.from(p);
  //console.log(players)
  console.log(p);
});

socket.on("msg", function (msg) {
  let message = document.createElement("li");
  message.textContent = msg;
  messages.appendChild(message);
  messages.scrollTo(0, messages.scrollHeight);
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
  update() {
    this.publishInput();
    for (let player of players) {
      if (!spritesMap.has(player.id)) {
        let sprite = this.physics.add.sprite(
          player.positionX,
          player.positionY,
          "player",
        );
        spritesMap.set(player.id, sprite);
      } else {
        //set sprite to correct location
        let curr = spritesMap.get(player.id);
        curr.setPosition(player.positionX, player.positionY);

        //set animations
        switch (player.anim) {
          case "left":
            curr.anims.play("left", true);
            break;
          case "right":
            curr.anims.play("right", true);
            break;
          case "up":
            curr.anims.play("up", true);
            break;
          case "down":
            curr.anims.play("down", true);
            break;
          default:
            curr.anims.play("front", true);
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
    mode: Phaser.Scale.FIT,
    parent: "game-container-inside",
  },
  backgroundColor: "#FFFFF",
  scene: [GameScene],
  physics: {
    default: "arcade",
  },
};

const game = new Phaser.Game(config);

document.body.addEventListener("click", function (event) {
  if (chatBox.contains(event.target)) {
    //    game.input.enabled = true;
    game.input.keyboard.enabled = false;
    console.log("in");
  } else {
    game.input.keyboard.enabled = true;
    //   game.input.enabled = false;
    console.log("out");
  }
});
