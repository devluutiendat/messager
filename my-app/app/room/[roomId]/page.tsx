"use client";

import { usePeer } from "@/provider/peer";
import { useSocket } from "@/provider/socket";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useCallback } from "react";

type IncomingCallPayload = {
  from: string;
  offer: RTCSessionDescriptionInit;
};

type CallAcceptedPayload = {
  answer: RTCSessionDescriptionInit;
};

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
  } = usePeer();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  //  Handle Media Stream
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          const senders = peer?.getSenders();
          const trackExists = senders?.find((s) => s.track === track);
          if (!trackExists) {
            peer?.addTrack(track, stream);
          }
        });
      } catch (e) {
        console.error("Error accessing media devices:", e);
      }
    };

    startMedia();
  }, [peer]);

  // Handle ICE Candidates & Remote Stream
  useEffect(() => {
    if (!socket || !peer) return;

    const handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
        });
      }
    };

    const handleTrackEvent = (event: RTCTrackEvent) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.addEventListener("icecandidate", handleIceCandidateEvent);
    peer.addEventListener("track", handleTrackEvent);

    return () => {
      peer.removeEventListener("icecandidate", handleIceCandidateEvent);
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [socket, peer]);

  const handleNewUserJoined = useCallback(
    async (email: string) => {
      console.log("new user join", email);
      const offer = await createOffer();
      socket?.emit("call-user", { email, offer });
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data: IncomingCallPayload) => {
      const { from, offer } = data;
      console.log("incoming call from:", from);

      await setRemoteDescription(offer);
      const answer = await createAnswer();
      socket?.emit("answer-call", { to: from, answer });
    },
    [createAnswer, setRemoteDescription, socket]
  );

  const handleCallAccepted = useCallback(
    async ({ answer }: CallAcceptedPayload) => {
      console.log("Call Accepted event received");

      if (peer?.signalingState === "stable") {
        console.warn(
          "Connection is already stable. Ignoring duplicate answer."
        );
        return;
      }

      await setRemoteDescription(answer);
      console.log("Remote description set successfully");
    },
    [peer?.signalingState, setRemoteDescription]
  );

  const handleIceCandidate = useCallback(
    async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await addIceCandidate(candidate);
      } catch (e) {
        console.error("Error adding ice candidate", e);
      }
    },
    [addIceCandidate]
  );

  // 4. Attach Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    socket,
    handleNewUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIceCandidate,
  ]);

  // 5. Join Room
  useEffect(() => {
    if (!socket || !email) return;

    socket.emit("join-room", {
      roomId: roomId,
      email,
    });
  }, [socket, email, roomId]);

  return (
    <div>
      <h3>My Video</h3>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "300px", border: "1px solid black" }}
      />
      <h3>Remote Video</h3>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "300px", border: "1px solid black" }}
      />
    </div>
  );
}
