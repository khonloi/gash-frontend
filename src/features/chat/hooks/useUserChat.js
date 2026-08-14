import { useEffect, useState, useRef, useCallback } from "react";
import Api from "../../../common/SummaryAPI";
import { useToast } from "../../../hooks/useToast";
import { getSocket, registerUserSocket } from "../../../common/socketManager";

const MAX_MESSAGE_LENGTH = 500;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const useUserChat = (userId) => {
    const { showToast } = useToast();
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

        registerUserSocket(userId);
        const sock = getSocket();
        socket.current = sock;

        const handleChatHistory = ({ conversation: convo, messages: history }) => {
            setConversation(convo || null);
            setMessages(history || []);
            if (convo && convo.id) {
                sock.emit("join_room", convo.id);
            }
        };

        const handleNewMessage = (msg) => {
            if (
                conversationRef.current &&
                msg.conversationId.toString() === conversationRef.current.id.toString()
            ) {
                setMessages((prev) => [...prev, msg]);
            }
        };

        const handleConversationClosed = ({ conversationId }) => {
            if (
                conversationRef.current &&
                conversationId.toString() === conversationRef.current.id.toString()
            ) {
                showToast("The conversation has ended", "info");
                setConversation(null);
                setMessages([]);
                setIsOpen(false);
            }
        };

        sock.emit("start_chat", { userId, messageText: "" });

        sock.on("chat_history", handleChatHistory);
        sock.on("new_message", handleNewMessage);
        sock.on("conversation_closed", handleConversationClosed);

        return () => {
            sock.off("chat_history", handleChatHistory);
            sock.off("new_message", handleNewMessage);
            sock.off("conversation_closed", handleConversationClosed);
        };
    }, [userId, showToast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startChat = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) return;
        if (trimmed.length > MAX_MESSAGE_LENGTH) {
            showToast(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`, "error");
            return;
        }
        socket.current.emit("start_chat", { userId, messageText: trimmed });
        setInput("");
    }, [input, userId, showToast]);

    const sendMessage = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed || !conversation) return;
        if (trimmed.length > MAX_MESSAGE_LENGTH) {
            showToast(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`, "error");
            return;
        }
        socket.current.emit("send_message", {
            conversationId: conversation.id,
            senderId: userId,
            messageText: trimmed,
            type: "text",
        });
        setInput("");
    }, [input, conversation, userId, showToast]);

    const handleImageUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!conversation) {
            showToast("Conversation is not active. Start a chat first.", "error");
            return;
        }
        if (!file.type || !file.type.startsWith("image/")) {
            showToast("Please upload a valid image file.", "error");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            showToast("Image is too large. Maximum allowed size is 5 MB.", "error");
            return;
        }

        try {
            const res = await Api.upload.image(file);
            const data = res.data;

            if (data?.success && (data.url || data.imageUrl)) {
                socket.current.emit("send_message", {
                    conversationId: conversation.id,
                    senderId: userId,
                    type: "image",
                    imageUrl: data.url || data.imageUrl,
                });
            } else {
                showToast("Failed to upload image", "error");
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Failed to upload image", "error");
        }
    }, [conversation, userId, showToast]);

    const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            conversation ? sendMessage() : startChat();
        }
    }, [conversation, sendMessage, startChat]);

    const handleEmojiClick = useCallback((emoji) => {
        setInput((prev) => (prev + emoji.emoji).slice(0, MAX_MESSAGE_LENGTH));
    }, []);

    return {
        conversation,
        messages,
        input,
        setInput,
        isOpen,
        setIsOpen,
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
    };
};
