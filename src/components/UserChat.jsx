import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export default function UserChat({ userId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const conversationRef = useRef(null);

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
      // Gọi start_chat để lấy history (messageText='' nghĩa là không tạo message)
      socket.current.emit("start_chat", { userId, messageText: "" });
    });

    // Nhận history (khi reload hoặc lần đầu có convo)
    socket.current.on("chat_history", ({ conversation: convo, messages: history }) => {
      setConversation(convo);
      setMessages(history || []);
      // đảm bảo join room
      if (convo && convo.id) {
        socket.current.emit("join_room", convo.id);
        console.log("📥 User join room (from chat_history):", convo.id);
      }
    });

    // Nhận tin nhắn mới realtime
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
    });
    setInput("");
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
      {/* Chat Toggle Button */}
      <button
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-110'
          }`}
        onClick={toggleChat}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Customer Support</h3>
                <p className="text-yellow-100 text-xs">
                  {conversation?.status === "closed" ? "Conversation ended" : "Online now"}
                </p>
              </div>
            </div>
            <button
              className="text-white hover:text-yellow-200 transition-colors"
              onClick={toggleChat}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-gray-700 font-medium mb-2">Hello! 👋</h4>
                <p className="text-gray-500 text-sm">How can we help you today?</p>
                <p className="text-gray-400 text-xs mt-1">Type a message to start chatting</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMe = msg.senderId.toString() === userId.toString();
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${isMe
                    ? 'bg-yellow-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                    }`}>
                    <p className="text-sm">{msg.messageText}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-yellow-100' : 'text-gray-400'
                      }`}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Chat Footer */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={conversation?.status === "closed"}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={conversation ? sendMessage : startChat}
                disabled={conversation?.status === "closed" || !input.trim()}
                className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {conversation?.status === "closed" && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                This conversation has ended
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
