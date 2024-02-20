
let socket = io();
let myId = -1;

let spritesMap = new Map();
let players = []


socket.on('move', function(p) {
  //set players to where they belong
  players = p;
  //console.log(players)
  console.log(p)
})

socket.on('playerId', function(id) {
  myId = id
  console.log(id)
})



//TODO: changeme
const BASE_SERVER_URL = "http://localhost:3000";




class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  //load assets
  preload() {
    this.load.setBaseURL(BASE_SERVER_URL)
    this.load.spritesheet(
      "avatarPengu",
      "avatarPengu",
      {
        frameWidth: 300,
        frameHeight: 300
      }
    )

  }

  //init vars, define animations + sounds, display assets
  create() {
    this.playerSpeed = 1.5;
    //    this.pengu = this.physics.add.sprite(400, 300, 'avatarPengu')



    this.cursors = this.input.keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });


  }

  //update attr of game objects per game logic
  update() {
    this.publishInput()
    for (let player of players) {
      if (!spritesMap.has(player.id)) {
        let sprite = this.physics.add.sprite(400, 300, 'avatarPengu');
        spritesMap.set(player.id, sprite)
      } else {
        let curr = spritesMap.get(player.id)
        //        console.log(curr)
        //        curr.x = player.positionX;
        //       curr.y = player.positionY;
        curr.setPosition(player.positionX, player.positionY)
        console.log(player)

        console.log(curr.x + ", " + curr.y)
      }
    }
  }




  publishInput() {
    let player = {
      id: myId,
      moveX: 0,
      moveY: 0
    }

    if (this.cursors.up.isDown) {
      player.moveY = -1;
    }
    else if (this.cursors.down.isDown) {
      player.moveY = 1;
    }
    if (this.cursors.left.isDown) {
      player.moveX = -1;
    }
    else if (this.cursors.right.isDown) {
      player.moveX = 1;
    }

    if (player.moveX != 0 || player.moveY != 0) {
      socket.emit('move', JSON.stringify(player))
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
