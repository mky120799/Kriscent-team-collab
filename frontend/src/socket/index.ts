import { io } from "socket.io-client";
import { auth } from "@/config/firebase";

export const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false, // don’t connect immediately
  transports: ["websocket"],
});

export const connectSocket = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;

  socket.auth = { token }; // send token to backend for verification
  socket.connect();
};
