"use client";

import { useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/provider/socket";
import { useWebRTC } from "@/hooks/useWebRTC";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { socket } = useSocket();
  const email = useSearchParams().get("email") ?? "Guest";

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    startMedia,
    createOffer,
    createAnswer,
    setRemoteDesc,
    remoteStream,
    addIceCandidate,
    cleanup,
  } = useWebRTC(socket);

  /* ---------- MEDIA ---------- */
  useEffect(() => {
    startMedia().then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    return cleanup;
  }, []);

  /* ---------- SOCKET ---------- */
  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", { roomId, email });

    socket.on("user-joined", async (remoteEmail) => {
      const offer = await createOffer();
      socket.emit("call-user", { email: remoteEmail, offer });
    });

    socket.on("incoming-call", async ({ from, offer }) => {
      await setRemoteDesc(offer);
      const answer = await createAnswer();
      socket.emit("answer-call", { to: from, answer });
    });

    socket.on("call-accepted", ({ answer }) => {
      setRemoteDesc(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      addIceCandidate(candidate);
    });

    return () => {
      socket.off("user-joined");
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
    };
  }, [socket]);

  /* ---------- REMOTE VIDEO ---------- */
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex gap-4 p-4">
      <div>
        <h3>Local: {email}</h3>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-72 bg-black border"
        />
      </div>

      <div>
        <h3>Remote</h3>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-72 bg-black border"
        />
      </div>
    </div>
  );
}
