
let socket = io();
let myId = -1;

let spritesMap = new Map();
let players = []
let isStopped = true;


socket.on('move', function(p) {
  //set players to where they belong
  players = Array.from(p);
  //console.log(players)
  console.log(p)
})



//TODO: changeme
const BASE_SERVER_URL = "http://localhost:1234";

class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  //load assets
  preload() {
    this.load.setBaseURL(BASE_SERVER_URL)
    this.load.spritesheet(
      "player",
      "player",
      {
        frameWidth: 82,
        frameHeight: 107
      }
    )

  }

  //init vars, define animations + sounds, display assets
  create() {
    this.playerSpeed = 1.5;

    this.cursors = this.input.keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });


    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 10, end: 12 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'front',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 10,
      repeat: -1
    })

  }

  //update attr of game objects per game logic
  update() {
    this.publishInput()
    for (let player of players) {
      if (!spritesMap.has(player.id)) {
        let sprite = this.physics.add.sprite(player.positionX, player.positionY, 'player');
        spritesMap.set(player.id, sprite)
      } else {
        let curr = spritesMap.get(player.id)
        //        console.log(curr)
        //        curr.x = player.positionX;
        //       curr.y = player.positionY;
        curr.setPosition(player.positionX, player.positionY)

        switch (player.anim) {
          case "left":
            curr.anims.play('left', true)
            break;
          case "right":
            curr.anims.play('right', true)
            break;
          case "up":
            curr.anims.play('up', true)
            break;
          case "down":
            curr.anims.play('down', true)
            break;
          default:
            curr.anims.play('front', true)

        }

      }
    }
  }




  publishInput() {
    let move = {
      moveX: 0,
      moveY: 0
    }

    if (this.cursors.up.isDown) {
      move.moveY = -1;
      isStopped = false;
    }
    else if (this.cursors.down.isDown) {
      move.moveY = 1;
      isStopped = false;
    }
    if (this.cursors.left.isDown) {
      move.moveX = -1;
      isStopped = false;
    }
    else if (this.cursors.right.isDown) {
      move.moveX = 1;
      isStopped = false;
    }

    if (move.moveX != 0 || move.moveY != 0) {
      socket.emit('move', JSON.stringify(move));
    } else if (!isStopped) {
      socket.emit('move', JSON.stringify(move));
      isStopped = true;
    }
  }
}
const config = {
  type: Phaser.AUTO,
  width: 1400,
  height: 750,
  backgroundColor: "#FFFFF",
  parent: "gameContainer",
  scene: [GameScene],
  physics: {
    default: "arcade"
  },
};
const game = new Phaser.Game(config);
