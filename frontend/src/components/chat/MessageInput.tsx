import { useState } from "react";
import { socket } from "@/socket";

const MessageInput = () => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    // Check if socket is connected
    if (!socket.connected) {
      console.error("Socket not connected");
      return;
    }

    // Send via socket for real-time delivery
    socket.emit("send-message", text.trim());
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 border rounded px-3 py-2"
        placeholder="Type a message..."
      />
      <button
        onClick={handleSend}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
