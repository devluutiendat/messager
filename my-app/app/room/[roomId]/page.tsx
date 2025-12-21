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

const Page = () => {
  const { socket } = useSocket();
  const { peer, createOffer } = usePeer();

  const handleNewUserJoined = async (data: UserJoinedPayload) => {
    const { emailId } = data;
    console.log("new user join");

    const offer = await createOffer();
    socket?.emit("call-user", { emailId, offer });
  };

  const handleIncomingCall = async (data: IncomingCallPayload) => {
    const { from, offer } = data;
    console.log("incoming call from:", from);

    await peer.setRemoteDescription(offer);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [socket]);

  return <div>page</div>;
};

export default Page;
