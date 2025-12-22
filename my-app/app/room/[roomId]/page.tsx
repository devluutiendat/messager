"use client";

import { usePeer } from "@/provider/peer";
import { useSocket } from "@/provider/socket";
import { useEffect } from "react";

type UserJoinedPayload = {
  emailId: string;
};

type IncomingCallPayload = {
  from: string;
  offer: RTCSessionDescriptionInit;
};

type CallAcceptedPayload = {
  answer: RTCSessionDescriptionInit;
};

const Page = () => {
  const { socket } = useSocket();
  const { peer, createOffer, createAnswer, setRemoteDescription } = usePeer();

  const handleNewUserJoined = async (data: UserJoinedPayload) => {
    const { emailId } = data;
    console.log("new user join");

    const offer = await createOffer();
    socket?.emit("call-user", { emailId, offer });
  };

  const handleIncomingCall = async (data: IncomingCallPayload) => {
    const { from, offer } = data;
    await setRemoteDescription(offer);
    console.log("incoming call from:", from);

    const answer = await createAnswer();
    socket?.emit("answer-call", { answer });
  };

  const handleCallAccepted = async ({ answer }: CallAcceptedPayload) => {
    await setRemoteDescription(answer);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket]);

  return <div>page</div>;
};

export default Page;
