import ChatWindow from "@/components/chat/ChatWindow";

const Chat = () => {
  const teamId = "team-123"; // later from auth/context

  return (
    <div className="h-full">
      <ChatWindow teamId={teamId} />
    </div>
  );
};

export default Chat;
