import { useEffect, useRef } from "react";
import { useGetMessagesQuery } from "@/store/services/message.api";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { socket } from "@/socket";

const ChatWindow = ({ teamId }: { teamId: string }) => {
  const { data: messages = [], isLoading } = useGetMessagesQuery({ teamId });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teamId) {
      console.log("🔌 Emitting join-room for:", teamId);
      socket.emit("join-room", teamId);
    }
  }, [teamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] border rounded">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded bg-background shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h2 className="font-semibold">Team Chat</h2>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-1"
      >
        {messages.map((msg) => (
          <MessageItem key={msg._id} message={msg} />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">
            No messages yet. Say hello!
          </p>
        )}
      </div>
      <div className="p-4 border-t bg-muted/10">
        <MessageInput teamId={teamId} />
      </div>
    </div>
  );
};

export default ChatWindow;
