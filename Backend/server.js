const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const Chat = require("./models/Chat");

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());


// ================= MONGODB =================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected ✅");
    })
    .catch((error) => {
        console.error("MongoDB Connection Error ❌", error);
    });


// ================= GEMINI AI =================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ================= HOME ROUTE =================

app.get("/", (req, res) => {
    res.send("Nexora AI Backend Running 🚀");
});


// ================= CHAT API =================

app.post("/api/chat", async (req, res) => {
    try {

        const { messages } = req.body;

        // Check messages
        if (!messages || messages.length === 0) {
            return res.status(400).json({
                error: "Messages are required"
            });
        }


        // ================= GEMINI HISTORY =================

        const history = messages
            .slice(0, -1)
            .map((msg) => ({
                role: msg.role === "ai" ? "model" : "user",

                parts: [
                    {
                        text: msg.text
                    }
                ]
            }));


        // ================= CREATE CHAT =================

        const chat = ai.chats.create({
            model: "gemini-3.6-flash",
            history: history
        });


        // Latest user message
        const latestMessage =
            messages[messages.length - 1].text;


        // ================= SEND TO GEMINI =================

        const response = await chat.sendMessage({
            message: latestMessage
        });


        const aiReply = response.text;


        // ================= SAVE TO MONGODB =================

        let chatDocument = await Chat.findOne();

        if (!chatDocument) {

            chatDocument = new Chat({
                title: latestMessage.substring(0, 30),
                messages: []
            });

        }


        // Save user message
        chatDocument.messages.push({
            role: "user",
            text: latestMessage
        });


        // Save AI message
        chatDocument.messages.push({
            role: "ai",
            text: aiReply
        });


        await chatDocument.save();


        // ================= RESPONSE =================

        res.status(200).json({
            reply: aiReply
        });


    } catch (error) {

        console.error("Gemini Error ❌", error);

        res.status(500).json({
            error: error.message
        });

    }
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Nexora AI Backend running on http://localhost:${PORT}`
    );
});