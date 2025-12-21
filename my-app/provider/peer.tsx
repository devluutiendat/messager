"use client";

import { createContext, useContext, useRef } from "react";

type PeerContextType = {
  peer: RTCPeerConnection;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
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

  if (!peerRef.current) {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  }

  const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    const offer = await peerRef.current!.createOffer();
    await peerRef.current!.setLocalDescription(offer);
    return offer;
  };

  return (
    <PeerContext.Provider
      value={{
        peer: peerRef.current,
        createOffer,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
