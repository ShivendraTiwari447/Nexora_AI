const mongoose = require("mongoose");

// ================= MESSAGE SCHEMA =================

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "ai"],
            required: true,
        },

        text: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
);

// ================= CHAT SCHEMA =================

const chatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "New Chat",
        },

        messages: {
            type: [messageSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// ================= MODEL =================

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
