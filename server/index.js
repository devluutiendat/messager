const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
var cors = require('cors')

const app = express();

const server = http.createServer(app);

app.use(bodyParser.json());
app.use(cors)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const emailToSocketMapping = new Map();


io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-room", ({ roomId, email }) => {
        console.log(`User ${email} joined room ${roomId}`);

        emailToSocketMapping.set(email, socket.id);
        socket.join(roomId);

        socket.to(roomId).emit("user-joined", email);
    });

    socket.on("disconnect", () => {
        for (const [email, socketId] of emailToSocketMapping.entries()) {
            if (socketId === socket.id) {
                emailToSocketMapping.delete(email);
                break;
            }
        }
        console.log("Socket disconnected:", socket.id);
    });
});

server.listen(8000, () => {
    console.log("Server + Socket running on http 8000");
})