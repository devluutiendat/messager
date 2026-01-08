"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/provider/socket";

interface ChatProps {
  roomId: string;
  sender: string;
}

interface ChatMessage {
  sender: string;
  message: string;
}

export default function Chat({ roomId, sender }: ChatProps) {
  const { socket } = useSocket();

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handler = ({ message, sender }: ChatMessage) => {
      setChat((prev) => [...prev, { sender, message }]);
    };

    socket.on("receive-message", handler);

    return () => {
      socket.off("receive-message", handler);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim()) return;

    socket.emit("send-message", {
      roomId,
      sender,
      message,
    });

    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gray-100 space-y-4">
      <h1 className="text-black text-3xl">Chat</h1>

      <div className="w-full max-w-sm bg-white p-4 rounded-lg shadow space-y-2">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded ${
              msg.sender === sender
                ? "bg-indigo-500 text-white self-end"
                : "bg-gray-200 text-black"
            }`}
          >
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <input
          type="text"
          required
          placeholder="enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          className="w-full px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
