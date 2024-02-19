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


class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  //load assets
  preload() {
    this.load.spritesheet(
      "avatarPengu",
    )

  }

  //init vars, define animations + sounds, display assets
  create() {

  }

  //update attr of game objects per game logic
  update() {

  }
}
