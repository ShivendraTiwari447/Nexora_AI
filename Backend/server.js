const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

const Chat = require("./models/Chat");

dotenv.config();

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// GEMINI
// ===============================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.send("Nexora AI Backend running on http://localhost:5000");
});

// ==================================================
// CREATE NEW CHAT
// ==================================================

app.post("/api/chats", async (req, res) => {
  try {
    const newChat = new Chat({
      title: "New Chat",
      messages: [],
    });

    await newChat.save();

    res.status(201).json(newChat);
  } catch (error) {
    console.error("Create Chat Error:", error);

    res.status(500).json({
      error: "Failed to create chat",
    });
  }
});

// ==================================================
// GET ALL CHATS
// ==================================================

app.get("/api/chats", async (req, res) => {
  try {
    const chats = await Chat.find()
      .select("_id title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Get Chats Error:", error);

    res.status(500).json({
      error: "Failed to load chats",
    });
  }
});

// ==================================================
// GET SINGLE CHAT
// ==================================================

app.get("/api/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    res.json(chat);
  } catch (error) {
    console.error("Get Chat Error:", error);

    res.status(500).json({
      error: "Failed to load chat",
    });
  }
});

// ==================================================
// RENAME CHAT
// ==================================================

app.patch("/api/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Chat title is required",
      });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        title: title.trim(),
      },
      {
        new: true,
      }
    );

    if (!updatedChat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    res.json({
      message: "Chat renamed successfully",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Rename Chat Error:", error);

    res.status(500).json({
      error: "Failed to rename chat",
    });
  }
});

// ==================================================
// DELETE CHAT
// ==================================================

app.delete("/api/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const deletedChat = await Chat.findByIdAndDelete(chatId);

    if (!deletedChat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    res.json({
      message: "Chat deleted successfully",
      chatId,
    });
  } catch (error) {
    console.error("Delete Chat Error:", error);

    res.status(500).json({
      error: "Failed to delete chat",
    });
  }
});

// ==================================================
// SEND MESSAGE TO GEMINI
// ==================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { chatId, messages } = req.body;

    if (!chatId) {
      return res.status(400).json({
        error: "Chat ID is required",
      });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    // Find chat
    const chatDocument = await Chat.findById(chatId);

    if (!chatDocument) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    // ==========================================
    // GEMINI HISTORY
    // ==========================================

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [
        {
          text: msg.text,
        },
      ],
    }));

    // ==========================================
    // CURRENT USER MESSAGE
    // ==========================================

    const latestMessage = messages[messages.length - 1];

    // ==========================================
    // GEMINI CHAT
    // ==========================================

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      history: history,
    });

    const response = await chat.sendMessage({
      message: latestMessage.text,
    });

    const aiReply = response.text;

    // ==========================================
    // SAVE USER MESSAGE
    // ==========================================

    chatDocument.messages.push({
      role: "user",
      text: latestMessage.text,
    });

    // ==========================================
    // SAVE AI MESSAGE
    // ==========================================

    chatDocument.messages.push({
      role: "ai",
      text: aiReply,
    });

    // ==========================================
    // AUTOMATIC TITLE
    // ==========================================

    if (
      chatDocument.title === "New Chat" &&
      chatDocument.messages.length === 2
    ) {
      chatDocument.title = latestMessage.text.substring(0, 30);

      if (latestMessage.text.length > 30) {
        chatDocument.title += "...";
      }
    }

    await chatDocument.save();

    res.json({
      reply: aiReply,
      chatId: chatDocument._id,
    });
  } catch (error) {
    console.error("Chat Error:", error);

    res.status(500).json({
      error: "Failed to get AI response",
    });
  }
});

// ==================================================
// SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nexora AI Backend running on http://localhost:${PORT}`);
});