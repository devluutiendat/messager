const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
var cors = require("cors");

const app = express();

const server = http.createServer(app);

app.use(bodyParser.json());
app.use(cors);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ roomId, email }) => {
    console.log(`User ${email} joined room ${roomId}`);

    emailToSocketMapping.set(email, socket.id);
    socketToEmailMapping.set(socket.id, email);

    socket.join(roomId);

    socket.to(roomId).emit("user-joined", email);
  });

  socket.on("disconnect", () => {
    for (const [email, socketId] of emailToSocketMapping.entries()) {
      if (socketId === socket.id) {
        emailToSocketMapping.delete(email);
        socketToEmailMapping.delete(socket.id);
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });

  socket.on("call-user", (data) => {
    const { email, offer } = data;

    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(email);

    if (fromEmail) {

      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    }
  });

  socket.on("answer-call", (answer) => {
    const fromEmail = socketToEmailMapping.get(socket.id);

    for (const [email, socketId] of emailToSocketMapping.entries()) {
      if (email !== fromEmail) {
        socket.to(socketId).emit("call-accepted", { answer });
      }
    }
  })
});

server.listen(8000, () => {
  console.log("Server + Socket running on http 8000");
});
