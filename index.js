//server setup
const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


const CANVAS_HEIGHT = 750;
const CANVAS_WIDTH = 1400;
const SHIP_PLATFORM = 718;
const PLAYER_VERTICAL_INCREMENT = 20;
const PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL = 1000;
const PLAYER_SCORE_INCREMENT = 5;
const P2_WORLD_TIME_STEP = 1 / 16;
const GAME_TICKER_MS = 100;

const players = new Map();
let currId = 0;

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html")
  console.log("dd")
})

app.get('/js/script.js', (req, res) => {
  res.sendFile(__dirname + "/js/script.js")
})
app.get('/css/style.css', (req, res) => {
  res.sendFile(__dirname + "/css/style.css")
})

app.get('/avatarPengu', (req, res) => {
  res.sendFile(__dirname + "/assets/chinstrap.png")
})

app.get('/player', (req, res) => {
  res.sendFile(__dirname + "/assets/pixilart-sprite.png")
})

io.on('connection', (socket) => {
  let newPlayer = {
    id: currId += 1,
    positionX: 0,
    positionY: 0,
    anim: "front"
  }
  players.set(socket, newPlayer)
  io.emit('move', Array.from(players.values()))
  console.log("connected")

  socket.on('disconnect', () => {
    console.log("disconnected")
    players.delete(socket)
  })

  //TODO: FIX CONCURRENCY
  socket.emit('playerId', currId)


  socket.on('msg', (msg) => {
    io.emit('msg', msg)
    console.log("chat: " + msg)
  })

  const Y_SPEED = 10;
  const X_SPEED = 10;
  socket.on('move', (msg) => {
    let move = JSON.parse(msg);
    let player = players.get(socket)

    if (move.moveX === -1) {
      player.positionX -= X_SPEED
      player.anim = "left";
    } else if (move.moveX === 1) {
      player.positionX += X_SPEED
      player.anim = "right";
    }

    if (move.moveY === -1) {
      player.positionY -= Y_SPEED
      player.anim = "up";
    } else if (move.moveY === 1) {
      player.positionY += Y_SPEED
      player.anim = "down";
    }

    if (move.moveX === 0 && move.moveY === 0) {
      player.anim = "front"
    }

    io.emit('move', Array.from(players.values()))
    //    console.log("player " + player.id + " " + JSON.stringify(player));
  })
})

server.listen(3000, () => {
  console.log('listening on http://localhost:3000')
})
