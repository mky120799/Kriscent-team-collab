import { useEffect, useState } from "react";
import { socket } from "@/socket";

type Message = {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

const ChatWindow = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  // 1️⃣ Fetch existing messages
  useEffect(() => {
    fetch("http://localhost:5555/api/messages", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(setMessages);
  }, []);

  // 2️⃣ Listen for realtime messages
  useEffect(() => {
    const handler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, []);

  // 3️⃣ Send message
  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("message:send", text);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((m) => (
          <div key={m._id}>
            <strong>{m.senderId.name}:</strong> {m.content}
          </div>
        ))}
      </div>

      <div className="p-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2"
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
