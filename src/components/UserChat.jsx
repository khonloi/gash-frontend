import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import "../styles/UserChat.css";

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
      <button className="chat-toggle" onClick={toggleChat}>
        {isOpen ? "×" : "💬"}
      </button>

      {isOpen && (
        <div className="chat-popup">
          <div className="chat-header">
            <span className="chat-title">💬 Hỗ trợ khách hàng</span>
            <button className="close-btn" onClick={toggleChat}>
              ×
            </button>
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <div className="chat-placeholder">
                Xin chào 👋<br />Nhập tin nhắn để bắt đầu trò chuyện!
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={msg._id || i}
                className={`chat-bubble ${
                  msg.senderId.toString() === userId.toString() ? "me" : "staff"
                }`}
              >
                {msg.messageText}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-footer">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              disabled={conversation?.status === "closed"}
            />
            <button
              onClick={conversation ? sendMessage : startChat}
              disabled={conversation?.status === "closed"}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
