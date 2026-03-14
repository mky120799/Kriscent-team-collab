import { useEffect, useRef } from "react";
import { useGetMessagesQuery } from "@/store/services/message.api";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { socket } from "@/socket";

const ChatWindow = ({ teamId }: { teamId: string }) => {
  const { data: messages = [], refetch } = useGetMessagesQuery({ teamId });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("new-message", () => {
      refetch();
    });

    return () => {
      socket.off("new-message");
    };
  }, [refetch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold">Team Chat</h2>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <MessageItem key={msg._id} message={msg} />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No messages yet. Say hello!</p>
        )}
      </div>
      <div className="p-4 border-t bg-gray-50">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;
