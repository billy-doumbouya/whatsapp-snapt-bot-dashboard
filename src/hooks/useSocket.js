import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../context/authStore.js";
import api from "../services/api.js";

export const useSocket = () => {
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);
  const [waStatus, setWaStatus] = useState("disconnected");
  const [qrCode, setQrCode] = useState(null);
  const [botEnabled, setBotEnabled] = useState(false); // ← ajouté

  useEffect(() => {
    if (!token || !user) return;

    // Sync initial : récupère l'état RÉEL du client au chargement,
    // au lieu d'attendre un futur événement socket qu'on aurait pu manquer
    api
      .get("/whatsapp/status")
      .then(({ data }) => {
        setWaStatus(data.status);
        if (data.qr) setQrCode(data.qr);
        setBotEnabled(!!data.botEnabled); // ← ajouté
      })
      .catch(() => {
        // silencieux : le socket ou le POST /connect prendra le relais
      });

    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", user._id);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
    });

    socket.on("wa:status", ({ status }) => {
      setWaStatus(status);
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

    // ← ajouté : se resynchronise si l'utilisateur envoie "stop"/"start"
    // depuis WhatsApp lui-même, ou si le toggle est fait depuis un autre onglet
    socket.on("bot:status", ({ botEnabled }) => {
      setBotEnabled(!!botEnabled);
    });

    return () => {
      socket.emit("leave", user._id);
      socket.disconnect();
    };
  }, [token, user]);

  return {
    waStatus,
    qrCode,
    botEnabled, // ← ajouté
    setWaStatus,
    setQrCode,
    setBotEnabled, // ← ajouté (pour mise à jour optimiste)
    socket: socketRef.current,
  };
};
