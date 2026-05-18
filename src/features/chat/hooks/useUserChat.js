import { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../../../common/axiosClient";
import { useToast } from "../../../hooks/useToast";

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

        socket.current = io(SOCKET_URL, { transports: ["websocket"] });

        socket.current.on("connect", () => {
            socket.current.emit("start_chat", { userId, messageText: "" });
        });

        socket.current.on("chat_history", ({ conversation: convo, messages: history }) => {
            setConversation(convo || null);
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
                showToast("The conversation has ended", "info");
                setConversation(null);
                setMessages([]);
                setIsOpen(false);
            }
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
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
                showToast("Upload thất bại!", "error");
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Lỗi khi upload ảnh", "error");
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
