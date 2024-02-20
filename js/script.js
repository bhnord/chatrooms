
var socket = io();

socket.on('move', function(players) {
  //set players to where they belong
  console.log(players)
})

//temporary
document.addEventListener('keydown', function(event) {
  let player = {
    player: 1,
    move: 0
  }
  if (event.key == "w") {
    player['move'] = 1
  }
  else if (event.key == "s") {
    player['move'] = -1
  }
  socket.emit('move', JSON.stringify(player))
});
/**
const config = {
  width: 1400,
  height: 750,
  backgroundColor: "#FFFFF",
  parent: "gameContainer",
  scene: [GameScene],
  physics: {
    default: "arcade"
  }
};
**/
const BASE_SERVER_URL = "http://localhost:3000";

class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  //load assets
  preload() {
    this.load.spritesheet(
      "avatarPengu",
      "https://github.com/bhnord/chatrooms/blob/main/assets/chinstrap.png?raw=true",
      {
        frameWidth: 48,
        frameHeight: 32
      }
    )

  }

  //init vars, define animations + sounds, display assets
  create() {

  }

  //update attr of game objects per game logic
  update() {

  }




  publishInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left)) {
      let player = {
        player: 1,
        move: 1
      }
      socket.emit('move', JSON.stringify(player))


    } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right)) {

    }
  }
}
