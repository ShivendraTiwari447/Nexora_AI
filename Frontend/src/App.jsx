import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);

    const [loading, setLoading] = useState(false);

    // ==================================================
    // LOAD ALL CHATS
    // ==================================================

    const loadChats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/chats`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load chats");
            }

            setChats(data);

            // If chats exist and no chat is active
            if (data.length > 0 && !activeChatId) {
                loadChat(data[0]._id);
            }
        } catch (error) {
            console.error("Load Chats Error:", error);
        }
    };

    // ==================================================
    // LOAD SINGLE CHAT
    // ==================================================

    const loadChat = async (chatId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/chats/${chatId}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to load chat"
                );
            }

            setActiveChatId(data._id);
            setMessages(data.messages || []);
            setMessage("");
        } catch (error) {
            console.error("Load Chat Error:", error);
        }
    };

    // ==================================================
    // CREATE NEW CHAT
    // ==================================================

    const createNewChat = async () => {
        try {
            const response = await fetch(`${API_URL}/api/chats`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to create chat"
                );
            }

            // Add new chat at beginning
            setChats((prev) => [data, ...prev]);

            // Make it active
            setActiveChatId(data._id);

            // Clear messages
            setMessages([]);

            // Clear input
            setMessage("");
        } catch (error) {
            console.error("Create Chat Error:", error);
        }
    };

    // ==================================================
    // RENAME CHAT
    // ==================================================

    const handleRename = async (chatId, oldTitle) => {
        const newTitle = window.prompt(
            "Enter new chat name:",
            oldTitle
        );

        // User cancelled
        if (newTitle === null) {
            return;
        }

        // Empty title
        if (!newTitle.trim()) {
            alert("Chat name cannot be empty.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/chats/${chatId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: newTitle.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to rename chat"
                );
            }

            // Update sidebar immediately
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === chatId
                        ? {
                              ...chat,
                              title: data.chat.title,
                          }
                        : chat
                )
            );
        } catch (error) {
            console.error("Rename Chat Error:", error);
            alert("Failed to rename chat.");
        }
    };

    // ==================================================
    // DELETE CHAT
    // ==================================================

    const handleDelete = async (chatId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this chat?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/chats/${chatId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to delete chat"
                );
            }

            // Remove chat from sidebar
            setChats((prevChats) =>
                prevChats.filter((chat) => chat._id !== chatId)
            );

            // If current chat was deleted
            if (activeChatId === chatId) {
                setActiveChatId(null);
                setMessages([]);
                setMessage("");
            }
        } catch (error) {
            console.error("Delete Chat Error:", error);
            alert("Failed to delete chat.");
        }
    };

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        loadChats();
    }, []);

    // ==================================================
    // SEND MESSAGE
    // ==================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim() || loading) {
            return;
        }

        let currentChatId = activeChatId;

        // ==========================================
        // If no chat exists, automatically create one
        // ==========================================

        if (!currentChatId) {
            try {
                const response = await fetch(
                    `${API_URL}/api/chats`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const newChat = await response.json();

                if (!response.ok) {
                    throw new Error(
                        newChat.error ||
                            "Failed to create chat"
                    );
                }

                currentChatId = newChat._id;

                setActiveChatId(currentChatId);

                setChats((prev) => [
                    newChat,
                    ...prev,
                ]);
            } catch (error) {
                console.error(
                    "Create Chat Error:",
                    error
                );
                return;
            }
        }

        const userMessage = message.trim();

        const newUserMessage = {
            role: "user",
            text: userMessage,
        };

        // Previous messages + current user message
        const updatedMessages = [
            ...messages,
            newUserMessage,
        ];

        // Show user message immediately
        setMessages(updatedMessages);

        // Clear input
        setMessage("");

        // Loading
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        chatId: currentChatId,
                        messages: updatedMessages,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Something went wrong"
                );
            }

            // ==========================================
            // SHOW AI RESPONSE
            // ==========================================

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text: data.reply,
                },
            ]);

            // ==========================================
            // REFRESH SIDEBAR
            // ==========================================

            const chatsResponse = await fetch(
                `${API_URL}/api/chats`
            );

            const chatsData =
                await chatsResponse.json();

            if (chatsResponse.ok) {
                setChats(chatsData);
            }
        } catch (error) {
            console.error("Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text:
                        "Sorry, something went wrong. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="app">

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="sidebar">

                <div className="logo">
                    <div className="logo-icon">
                        N
                    </div>

                    <span>Nexora AI</span>
                </div>

                {/* New Chat */}

                <button
                    className="new-chat-btn"
                    onClick={createNewChat}
                >
                    + New Chat
                </button>

                {/* Chat History */}

                <div className="chat-history">

                    <p className="history-title">
                        Recent Chats
                    </p>

                    {chats.length === 0 ? (
                        <p className="empty-history">
                            No chats yet
                        </p>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`chat-item ${
                                    activeChatId ===
                                    chat._id
                                        ? "active-chat"
                                        : ""
                                }`}
                            >
                                {/* Chat title */}

                                <div
                                    className="chat-title"
                                    onClick={() =>
                                        loadChat(
                                            chat._id
                                        )
                                    }
                                >
                                    <span>💬</span>

                                    <span>
                                        {chat.title}
                                    </span>
                                </div>

                                {/* Chat Actions */}

                                <div className="chat-actions">

                                    {/* Rename */}

                                    <button
                                        className="chat-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            handleRename(
                                                chat._id,
                                                chat.title
                                            );
                                        }}
                                        title="Rename chat"
                                    >
                                        ✏️
                                    </button>

                                    {/* Delete */}

                                    <button
                                        className="chat-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            handleDelete(
                                                chat._id
                                            );
                                        }}
                                        title="Delete chat"
                                    >
                                        🗑️
                                    </button>

                                </div>
                            </div>
                        ))
                    )}

                </div>

                <div className="sidebar-bottom">

                    <button>
                        ⚙️ Settings
                    </button>

                    <button>
                        ❓ Help
                    </button>

                </div>

            </aside>

            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="main">

                {/* Header */}

                <header className="header">

                    <div>

                        <h2>Nexora AI</h2>

                        <span className="status">

                            <span className="status-dot"></span>

                            Gemini AI

                        </span>

                    </div>

                    <button className="menu-btn">
                        ⋮
                    </button>

                </header>

                {/* Chat Area */}

                <section className="chat-area">

                    {messages.length === 0 ? (

                        <div className="welcome">

                            <div className="welcome-icon">
                                N
                            </div>

                            <h1>
                                How can I help you today?
                            </h1>

                            <p>
                                Ask me anything. I can
                                help you learn, code,
                                write, analyze and explore
                                ideas.
                            </p>

                        </div>

                    ) : (

                        <div className="messages">

                            {messages.map(
                                (msg, index) => (

                                    <div
                                        key={index}
                                        className={`message ${
                                            msg.role ===
                                            "user"
                                                ? "user-message"
                                                : "ai-message"
                                        }`}
                                    >

                                        <div className="message-avatar">

                                            {msg.role ===
                                            "user"
                                                ? "U"
                                                : "N"}

                                        </div>

                                        <div className="message-content">

                                            <p>
                                                {msg.text}
                                            </p>

                                        </div>

                                    </div>

                                )
                            )}

                            {loading && (

                                <div className="message ai-message">

                                    <div className="message-avatar">
                                        N
                                    </div>

                                    <div className="message-content">

                                        <p className="typing">
                                            Nexora is thinking...
                                        </p>

                                    </div>

                                </div>

                            )}

                        </div>

                    )}

                    {/* Suggestions */}

                    {messages.length === 0 && (

                        <div className="suggestions">

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Explain React hooks"
                                    )
                                }
                            >
                                <strong>
                                    💻 Explain React hooks
                                </strong>

                                <span>
                                    Learn React in a simple way
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Give me a MERN project idea"
                                    )
                                }
                            >
                                <strong>
                                    🚀 Give me a MERN project idea
                                </strong>

                                <span>
                                    Build something impressive
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Help me debug my code"
                                    )
                                }
                            >
                                <strong>
                                    🐛 Help me debug my code
                                </strong>

                                <span>
                                    Find and fix programming errors
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Explain JavaScript promises"
                                    )
                                }
                            >
                                <strong>
                                    📚 Explain JavaScript promises
                                </strong>

                                <span>
                                    Understand concepts easily
                                </span>
                            </button>

                        </div>

                    )}

                </section>

                {/* Input */}

                <div className="input-container">

                    <form
                        onSubmit={handleSubmit}
                        className="chat-form"
                    >

                        <input
                            type="text"
                            placeholder="Message Nexora AI..."
                            value={message}
                            onChange={(e) =>
                                setMessage(
                                    e.target.value
                                )
                            }
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            ↑
                        </button>

                    </form>

                    <p className="disclaimer">
                        Nexora AI can make mistakes.
                        Check important information.
                    </p>

                </div>

            </main>

        </div>
    );
}

export default App;