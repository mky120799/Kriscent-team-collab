import { useGetMessagesQuery } from "@/store/services/MessageApi";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

const ChatWindow = ({ teamId }: { teamId: string }) => {
  const { data: messages = [] } = useGetMessagesQuery(teamId);

  return (
    <div className="flex flex-col h-full border rounded">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageItem key={msg._id} message={msg} />
        ))}
      </div>
      <MessageInput teamId={teamId} />
    </div>
  );
};

export default ChatWindow;
