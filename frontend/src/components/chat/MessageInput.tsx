import { useState } from "react";
import { useSendMessageMutation } from "@/store/services/message.api";

const MessageInput = ({ teamId }: { teamId: string }) => {
  const [text, setText] = useState("");
  const [sendMessage, { isLoading }] = useSendMessageMutation();

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;

    try {
      await sendMessage({ content: text.trim(), teamId }).unwrap();
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        className="flex-1 border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none"
        placeholder="Type a message..."
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !text.trim()}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "..." : "Send"}
      </button>
    </div>
  );
};

export default MessageInput;
