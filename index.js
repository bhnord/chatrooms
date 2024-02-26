//server setup
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const Y_SPEED = 10;
const X_SPEED = 10;
const CANVAS_HEIGHT = 750;
const CANVAS_WIDTH = 1400;
const TICKRATE_MS = 100;

const players = new Map();
let currId = 0;
let change = false;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  console.log("dd");
});

app.get("/js/script.js", (req, res) => {
  res.sendFile(__dirname + "/js/script.js");
});
app.get("/css/style.css", (req, res) => {
  res.sendFile(__dirname + "/css/style.css");
});

app.get("/avatarPengu", (req, res) => {
  res.sendFile(__dirname + "/assets/chinstrap.png");
});

app.get("/player", (req, res) => {
  res.sendFile(__dirname + "/assets/pixilart-sprite.png");
});

io.on("connection", (socket) => {
  let newPlayer = {
    id: currId,
    displayName: "Player " + (currId++),
    positionX: 0,
    positionY: 0,
    anim: "front",
  };
  players.set(socket, newPlayer);
  io.emit("move", Array.from(players.values()));
  console.log("connected");
  change = true;

  socket.on("disconnect", () => {
    console.log("disconnected");
    players.delete(socket);
    change = true;
  });

  //TODO: FIX CONCURRENCY
  socket.emit("playerId", currId);

  socket.on("msg", (msg) => {
    io.emit("msg", players.get(socket).displayName + ": " + msg);
    console.log("chat: " + msg);
  });

  socket.on("draw", (imgURL) => {
    io.emit("draw", imgURL);
    console.log("drawing: " + imgURL);
  });


  socket.on("move", (msg) => {
    let move = JSON.parse(msg);
    let player = players.get(socket);

    if (move.moveX === -1) {
      player.positionX -= X_SPEED;
      player.anim = "left";
    } else if (move.moveX === 1) {
      player.positionX += X_SPEED;
      player.anim = "right";
    }

    if (move.moveY === -1) {
      player.positionY -= Y_SPEED;
      player.anim = "up";
    } else if (move.moveY === 1) {
      player.positionY += Y_SPEED;
      player.anim = "down";
    }

    if (move.moveX === 0 && move.moveY === 0) {
      player.anim = "front";
    }
    change = true;
  });
});

setInterval(function() {
  if (change) {
    io.emit("move", Array.from(players.values()));
    change = false;
  }
}, TICKRATE_MS);

server.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
