import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../common/axiosClient";
import EmojiPicker from "emoji-picker-react";

// use shared SOCKET_URL (same as API base)

export default function UserChat({ userId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const conversationRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    if (!userId) {
      console.error("userId is required");
      return;
    }

    socket.current = io(SOCKET_URL, { transports: ["websocket"] });

    socket.current.on("connect", () => {
      console.log("✅ User connected:", userId);
      socket.current.emit("start_chat", { userId, messageText: "" });
    });

    socket.current.on("chat_history", ({ conversation: convo, messages: history }) => {
      setConversation(convo);
      setMessages(history || []);
      if (convo && convo.id) {
        socket.current.emit("join_room", convo.id);
      }
    });

    socket.current.on("new_message", (msg) => {
      if (
        conversationRef.current &&
        msg.conversationId.toString() === conversationRef.current.id.toString()
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.current.on("conversation_closed", ({ conversationId }) => {
      if (
        conversationRef.current &&
        conversationId.toString() === conversationRef.current.id.toString()
      ) {
        alert("💬 Cuộc trò chuyện đã kết thúc.");
        setConversation(null);
        setMessages([]);
        setIsOpen(false);
      }
    });

    return () => socket.current && socket.current.disconnect();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = () => {
    if (!input.trim()) return;
    socket.current.emit("start_chat", { userId, messageText: input });
    setInput("");
  };

  const sendMessage = () => {
    if (!input.trim() || !conversation) return;
    socket.current.emit("send_message", {
      conversationId: conversation.id,
      senderId: userId,
      messageText: input,
      type: "text",
    });
    setInput("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !conversation) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${SOCKET_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.success && data.url) {
        socket.current.emit("send_message", {
          conversationId: conversation.id,
          senderId: userId,
          type: "image",
          imageUrl: data.url,
        });
      } else {
        alert("Upload thất bại!");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Lỗi khi upload ảnh");
    }
  };

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      conversation ? sendMessage() : startChat();
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-110"
          }`}
        onClick={toggleChat}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Customer Support</h3>
                <p className="text-yellow-100 text-xs">
                  {conversation?.status === "closed" ? "Conversation ended" : "Online now"}
                </p>
              </div>
            </div>
            <button className="text-white hover:text-yellow-200" onClick={toggleChat}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => {
              const isMe = msg.senderId?.toString() === userId?.toString();
              return (
                <div key={msg._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${isMe
                      ? "bg-yellow-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                      }`}
                  >
                    {msg.type === "image" ? (
                      <img
                        src={msg.imageUrl}
                        alt="uploaded"
                        className="rounded-lg max-w-[200px] cursor-pointer hover:opacity-90"
                      />
                    ) : (
                      <p className="text-sm">{msg.messageText}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${isMe ? "text-yellow-100" : "text-gray-400"
                        }`}
                    >
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-gray-200 relative">
            <div className="flex items-center space-x-2">
              {/* Upload ảnh */}
              <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-yellow-500">
                📷
              </button>

              {/* Emoji */}
              <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-500 hover:text-yellow-500">
                😊
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={conversation?.status === "closed"}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              {/* Nút gửi */}
              <button
                onClick={conversation ? sendMessage : startChat}
                disabled={conversation?.status === "closed" || !input.trim()}
                className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Emoji Picker lớn hơn và có nút tắt */}
            {showEmoji && (
              <div
                className="absolute bottom-16 right-0 z-50 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-2"
                style={{ width: "350px", height: "450px" }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500 ml-2">Choose emoji</span>
                  <button
                    onClick={() => setShowEmoji(false)}
                    className="text-gray-400 hover:text-red-500 text-sm font-semibold"
                  >
                    ✕
                  </button>
                </div>
                <EmojiPicker
                  width="100%"
                  height="400px"
                  onEmojiClick={(emoji) => setInput((prev) => prev + emoji.emoji)}
                />
              </div>
            )}

            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
          </div>
        </div>
      )}
    </>
  );
}