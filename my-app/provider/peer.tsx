"use client";

import { createContext, useContext, useRef } from "react";

type PeerContextType = {
  peer: RTCPeerConnection | null;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: () => Promise<RTCSessionDescriptionInit>;
  setRemoteDescription: (desc: RTCSessionDescriptionInit) => Promise<void>;
};

const PeerContext = createContext<PeerContextType | null>(null);

export const usePeer = () => {
  const ctx = useContext(PeerContext);
  if (!ctx) {
    throw new Error("usePeer must be used inside PeerProvider");
  }
  return ctx;
};

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const peerRef = useRef<RTCPeerConnection | null>(null);

  if (typeof window !== "undefined" && !peerRef.current) {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  }

  const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    const offer = await peerRef.current!.createOffer();
    await peerRef.current!.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async () => {
    const answer = await peerRef.current!.createAnswer();
    await peerRef.current!.setLocalDescription(answer);
    return answer;
  };

  const setRemoteDescription = async (desc: RTCSessionDescriptionInit) => {
    await peerRef.current!.setRemoteDescription(desc);
  };

  return (
    <PeerContext.Provider
      value={{
        peer: peerRef.current,
        createOffer,
        createAnswer,
        setRemoteDescription,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
