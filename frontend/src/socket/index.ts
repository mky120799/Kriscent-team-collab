import { io } from "socket.io-client";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Extract the base URL from VITE_API_URL (removes /api suffix if present)
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5555";
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return apiUrl.replace(/\/api$/, "");
  }
};

export const socket = io(getSocketUrl(), {
  autoConnect: false, // don’t connect immediately
  transports: ["websocket"],
});

export const connectSocket = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      socket.auth = { token };

      // Always disconnect first to ensure we refresh with the new token
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else {
      socket.disconnect();
    }
  });
};
