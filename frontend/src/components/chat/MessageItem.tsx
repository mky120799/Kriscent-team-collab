const MessageItem = ({ message }: any) => {
  return (
    <div className="bg-muted p-2 rounded max-w-xs">
      <p className="text-sm">{message.content}</p>
    </div>
  );
};

export default MessageItem;
