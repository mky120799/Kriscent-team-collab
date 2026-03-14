import type { Message } from "@/store/services/message.api";

const MessageItem = ({ message }: { message: Message }) => {
  return (
    <div className="bg-muted p-2 rounded max-w-xs">
      <p className="text-xs font-semibold text-muted-foreground mb-1">
        {message.senderId?.name || "Unknown"}
      </p>
      <p className="text-sm">{message.content}</p>
      {message.createdAt && (
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default MessageItem;
