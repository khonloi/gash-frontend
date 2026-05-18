import React from "react";
import { SOCKET_URL } from "../../../common/axiosClient";
import EmojiPicker from "emoji-picker-react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import { motion, AnimatePresence } from "framer-motion";
import { useUserChat } from "../hooks/useUserChat";

// use shared SOCKET_URL (same as API base)

export default function UserChat({ userId }) {
  const {
    conversation,
    messages,
    input,
    setInput,
    isOpen,
    showEmoji,
    setShowEmoji,
    messagesEndRef,
    fileInputRef,
    startChat,
    sendMessage,
    handleImageUpload,
    toggleChat,
    handleKeyDown,
    handleEmojiClick,
    MAX_MESSAGE_LENGTH,
  } = useUserChat(userId);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        initial={false}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 ${isOpen
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        onClick={toggleChat}
        title={isOpen ? "Close chat" : "Open chat"}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <motion.div
          key={isOpen ? "close" : "chat"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <CloseIcon fontSize="medium" />
          ) : (
            <ChatBubbleOutlineIcon fontSize="medium" />
          )}
        </motion.div>
      </motion.button>

      {/* Chat popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-40 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <ChatBubbleOutlineIcon fontSize="small" className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Customer Support</h3>
                  <p className="text-amber-100 text-xs">
                    {conversation?.status === "closed" ? "Conversation ended" : "Online now"}
                  </p>
                </div>
              </div>
              <button
                className="text-white hover:text-amber-200 transition-colors"
                onClick={toggleChat}
                aria-label="Close chat"
              >
                <CloseIcon fontSize="small" />
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
                        ? "bg-amber-500 text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                        }`}
                    >
                      {msg.type === "image" ? (
                        <img
                          src={
                            (msg.imageUrl || msg.attachments)?.startsWith('http')
                              ? (msg.imageUrl || msg.attachments)
                              : `${SOCKET_URL}${(msg.imageUrl || msg.attachments)?.startsWith('/') ? '' : '/'}${msg.imageUrl || msg.attachments}`
                          }
                          alt="uploaded"
                          className="rounded-lg max-w-[200px] cursor-pointer hover:opacity-90"
                          onError={(e) => {
                            console.error("Image load error:", msg.imageUrl || msg.attachments);
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <p className="text-sm">{msg.messageText}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${isMe ? "text-amber-100" : "text-gray-400"
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
                {/* Upload image */}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="p-2 text-gray-500 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-50"
                  title="Upload image"
                  aria-label="Upload image"
                >
                  <PhotoCameraOutlinedIcon fontSize="small" />
                </button>

                {/* Emoji */}
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`p-2 text-gray-500 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-50 ${showEmoji ? 'bg-amber-50 text-amber-500' : ''}`}
                  title="Add emoji"
                  aria-label="Add emoji"
                >
                  <EmojiEmotionsOutlinedIcon fontSize="small" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={conversation?.status === "closed"}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                {/* Send button */}
                <button
                  onClick={conversation ? sendMessage : startChat}
                  disabled={conversation?.status === "closed" || !input.trim()}
                  className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                  title="Send message"
                  aria-label="Send message"
                >
                  <SendOutlinedIcon fontSize="small" />
                </button>
              </div>

              {/* Emoji Picker with close button */}
              {showEmoji && (
                <div
                  className="absolute bottom-16 right-0 z-50 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-2"
                  style={{ width: "350px", height: "450px" }}
                >
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-sm text-gray-600 font-medium">Choose emoji</span>
                    <button
                      onClick={() => setShowEmoji(false)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                      aria-label="Close emoji picker"
                    >
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                  <EmojiPicker
                    width="100%"
                    height="400px"
                    onEmojiClick={handleEmojiClick}
                  />
                </div>
              )}

              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}