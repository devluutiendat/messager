import { useRef, useState, useCallback, useEffect } from "react";

export function useWebRTC(socket: any) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const getPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onicecandidate = (e) =>
      e.candidate && socket?.emit("ice-candidate", { candidate: e.candidate });

    peerRef.current = pc;
    return pc;
  }, [socket]);

  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    const pc = getPeer();

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    return stream;
  };

  const createOffer = async () => {
    const pc = getPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async () => {
    const pc = getPeer();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  const setRemoteDesc = async (desc: RTCSessionDescriptionInit) => {
    const pc = getPeer();
    if (pc.signalingState !== "closed") {
      await pc.setRemoteDescription(desc);
    }
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
  const pc = getPeer();
  if (pc.remoteDescription) {
    await pc.addIceCandidate(candidate);
  }
};

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
  };

  return {
    addIceCandidate,
    startMedia,
    createOffer,
    createAnswer,
    setRemoteDesc,
    remoteStream,
    localStreamRef,
    cleanup,
  };
}
