import { useAppSelector } from "@/store/hooks";
import ChatWindow from "@/components/chat/ChatWindow";

const Chat = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user?.teamId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No team assigned</p>
      </div>
    );
  }

  return <ChatWindow teamId={user.teamId} />;
};

export default Chat;
