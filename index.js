//server setup
const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//game setup
//const p2 = require("p2");

const CANVAS_HEIGHT = 750;
const CANVAS_WIDTH = 1400;
const SHIP_PLATFORM = 718;
const PLAYER_VERTICAL_INCREMENT = 20;
const PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL = 1000;
const PLAYER_SCORE_INCREMENT = 5;
const P2_WORLD_TIME_STEP = 1 / 16;
const MIN_PLAYERS_TO_START_GAME = 3;
const GAME_TICKER_MS = 100;

let connections = 0
let players = new Map();
let playerChannels = {};
let gameRoom;
let gameTickerOn = false;

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + "/js/script.js")
})

io.on('connection', (socket) => {
  console.log("connected")
  socket.on('disconnect', () => {
    console.log("disconnected")
  })


  socket.on('move', (msg) => {
    let move = JSON.parse(msg);
    if (!players.has(move.player)) {
      let newPlayer = {
        position: 0
      }
      players.set(move.player, newPlayer);
    }
    let player = players.get(move.player)

    player['position'] += move.move
    io.emit('move', player)
    console.log("player " + move.player + " moved " + move.move)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
