import { useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import type { Message } from "@/store/services/message.api";
import { cn } from "@/lib/utils";

const MessageItem = ({ message }: { message: Message }) => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isMe = message.senderId?._id?.toString() === user?._id?.toString();

  return (
    <div
      className={cn("flex w-full mb-3", isMe ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex max-w-[75%] gap-2",
          isMe ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Only show avatar for others */}
        {!isMe && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
            {message.senderId?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-0.5",
            isMe ? "items-end" : "items-start",
          )}
        >
          {!isMe && (
            <p className="text-[10px] font-bold text-slate-500 px-1 mb-0.5">
              {message.senderId?.name}
            </p>
          )}

          <div
            className={cn(
              "px-3 py-2 rounded-xl shadow-sm text-sm break-words relative",
              isMe
                ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none"
                : "bg-white text-slate-800 border border-slate-200 rounded-tl-none",
            )}
          >
            <p className="leading-relaxed">{message.content}</p>
            <div
              className={cn(
                "flex justify-end items-center gap-1 mt-1 opacity-50",
                isMe ? "ml-auto" : "",
              )}
            >
              <span className="text-[9px]">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
