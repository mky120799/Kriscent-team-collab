import { io } from "socket.io-client";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ROOT_URL } from "@/config/api";

export const socket = io(ROOT_URL, {
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
