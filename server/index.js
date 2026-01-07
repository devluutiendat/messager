const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, email }) => {
    emailToSocketMapping.set(email, socket.id);
    socketToEmailMapping.set(socket.id, email);
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", email);
  });

  socket.on("call-user", ({ email, offer }) => {
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(email);
    if (socketId) {
      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const socketId = emailToSocketMapping.get(to);
    if (socketId) {
      socket.to(socketId).emit("call-accepted", { answer });
    }
  });

  socket.on("ice-candidate", ({ candidate }) => {
    // Relay candidate to everyone else in the room
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(roomId => {
      socket.to(roomId).emit("ice-candidate", { candidate });
    });
  });

  socket.on("send-message", ({ roomId, message, sender }) => {
    io.to(roomId).emit("receive-message", { message, sender });
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMapping.get(socket.id);
    emailToSocketMapping.delete(email);
    socketToEmailMapping.delete(socket.id);
  });
});

server.listen(8000);