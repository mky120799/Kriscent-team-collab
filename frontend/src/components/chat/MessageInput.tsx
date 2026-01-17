import { useState } from "react";
import { useSendMessageMutation } from "@/store/services/message.api";

const MessageInput = ({ teamId }: { teamId: string }) => {
  const [text, setText] = useState("");
  const [sendMessage] = useSendMessageMutation();

  const handleSend = async () => {
    if (!text.trim()) return;

    await sendMessage({
      content: text,
      teamId,
      senderId: "u1", // from auth later
    });

    setText("");
  };

  return (
    <div className="flex gap-2 p-3 border-t">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
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
