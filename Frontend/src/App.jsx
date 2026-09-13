import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!message.trim() || loading) return;

  const userMessage = message;

  const newUserMessage = {
    role: "user",
    text: userMessage,
  };

  // Previous messages + current user message
  const updatedMessages = [...messages, newUserMessage];

  // Screen par user message show karo
  setMessages(updatedMessages);

  setMessage("");
  setLoading(true);

  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    // AI response screen par show karo
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: data.reply,
      },
    ]);

  } catch (error) {
    console.error("Error:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Sorry, something went wrong. Please try again.",
      },
    ]);

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">N</div>
          <span>Nexora AI</span>
        </div>

        <button className="new-chat-btn">
          + New Chat
        </button>

        <div className="chat-history">
          <p className="history-title">Recent Chats</p>

          <div className="chat-item">
            <span>💬</span>
            <span>Introduction to React</span>
          </div>

          <div className="chat-item">
            <span>💬</span>
            <span>Learn JavaScript</span>
          </div>

          <div className="chat-item">
            <span>💬</span>
            <span>MERN Project Ideas</span>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button>⚙️ Settings</button>
          <button>❓ Help</button>
        </div>

      </aside>


      {/* Main */}
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

          <button className="menu-btn">⋮</button>
        </header>


        {/* Chat Area */}
        <section className="chat-area">

          {messages.length === 0 ? (

            <div className="welcome">

              <div className="welcome-icon">N</div>

              <h1>How can I help you today?</h1>

              <p>
                Ask me anything. I can help you learn, code,
                write, analyze and explore ideas.
              </p>

            </div>

          ) : (

            <div className="messages">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className={`message ${
                    msg.role === "user"
                      ? "user-message"
                      : "ai-message"
                  }`}
                >

                  <div className="message-avatar">
                    {msg.role === "user" ? "U" : "N"}
                  </div>

                  <div className="message-content">
                    <p>{msg.text}</p>
                  </div>

                </div>

              ))}


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


          {/* Suggestions only before first message */}
          {messages.length === 0 && (

            <div className="suggestions">

              <button
                onClick={() =>
                  setMessage("Explain React hooks")
                }
              >
                <strong>💻 Explain React hooks</strong>
                <span>Learn React in a simple way</span>
              </button>

              <button
                onClick={() =>
                  setMessage("Give me a MERN project idea")
                }
              >
                <strong>🚀 Give me a MERN project idea</strong>
                <span>Build something impressive</span>
              </button>

              <button
                onClick={() =>
                  setMessage("Help me debug my code")
                }
              >
                <strong>🐛 Help me debug my code</strong>
                <span>Find and fix programming errors</span>
              </button>

              <button
                onClick={() =>
                  setMessage("Explain JavaScript promises")
                }
              >
                <strong>📚 Explain JavaScript promises</strong>
                <span>Understand concepts easily</span>
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
                setMessage(e.target.value)
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
            Nexora AI can make mistakes. Check important
            information.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;