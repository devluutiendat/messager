import { useRef, useState, useCallback } from "react";

export function useWebRTC(socket: any) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  // Ref to store candidates that arrive before the remote description is set
  const candidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const getPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(" Remote track received");
      setRemoteStream(event.streams[0]);
    };

    peerRef.current = pc;
    return pc;
  }, [socket]);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      const pc = getPeer();

      // Add tracks to the peer connection before signaling begins
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      return stream;
    } catch (error) {
      console.error("Media access error:", error);
      return null;
    }
  };

  const createOffer = async () => {
    const pc = getPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async () => {
    const pc = getPeer();
    if (pc.signalingState !== "have-remote-offer") return null;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  const setRemoteDesc = async (desc: RTCSessionDescriptionInit) => {
    const pc = getPeer();
    if (pc.signalingState === "closed") return;

    await pc.setRemoteDescription(new RTCSessionDescription(desc));
    
    // Process any candidates that were queued while waiting for the description
    if (candidatesQueue.current.length > 0) {
      for (const candidate of candidatesQueue.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      candidatesQueue.current = [];
    }
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = getPeer();
    // Only add candidate if remote description is ready, otherwise queue it
    if (pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      candidatesQueue.current.push(candidate);
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    candidatesQueue.current = [];
  };

  return {
    startMedia,
    createOffer,
    createAnswer,
    setRemoteDesc,
    addIceCandidate,
    remoteStream,
    cleanup,
  };
}