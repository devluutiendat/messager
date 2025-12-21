"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/provider/socket";

export default function LoginForm() {
  const { socket, connect } = useSocket();

  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    connect();

    socket?.emit("join-room", {
      email,
      roomId,
    });

    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center flex-col bg-gray-100 space-y-4">
      <h1 className="text-black text-3xl">Join room</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <input
          type="email"
          placeholder="enter Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          required
          placeholder="enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          className="w-full px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Join Room
        </button>
      </form>
    </main>
  );
}
