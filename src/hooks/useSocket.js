import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../context/authStore.js";

export const useSocket = () => {
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);
  const [waStatus, setWaStatus] = useState("disconnected");
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    // Nettoyage de l'URL au cas où elle se termine par /api
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", user._id);
    });

    socket.on("wa:status", ({ status }) => {
      setWaStatus(status);
      // ✅ Sécurité : On vire le QR code dès que l'authentification commence
      // ou que le client est connecté pour éviter les artéfacts visuels.
      if (
        status === "connected" ||
        status === "authenticated" ||
        status === "loading"
      ) {
        setQrCode(null);
      }
    });

    socket.on("wa:qr", ({ qr }) => {
      setQrCode(qr);
      setWaStatus("qr_ready");
    });

    return () => {
      socket.emit("leave", user._id);
      socket.disconnect();
    };
  }, [token, user]);

  return { waStatus, qrCode, socket: socketRef.current };
};
