import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const MODEL_ID = process.env.MODEL_ID || "gemini-2.0-flash-001"; // swap if you have access to 2.5
// Model catalog reference: https://ai.google.dev/gemini-api/docs/models

// Simple, non-streaming endpoint
app.post("/api/teach", async (req, res) => {
    try {
        const { topic, level = "beginner", style = "simple", question, history = [] } = req.body;

        // Build a short persona via system instructions (supported in config)
        const systemInstruction = [
            "You are a patient, friendly teacher for a CS student from Pakistan.",
            "Always explain in simple language first, then go step by step.",
            "Use short sections, bullet points, and a tiny example.",
            "End with 3-question mini-quiz (with answers).",
            `Target level: ${level}. Style: ${style}.`,
            "If the user asks for code, provide idiomatic, commented code."
        ].join(" ");

        // Convert chat history to contents
        const contents = [
            { role: "user", parts: [{ text: `Topic: ${topic || "general learning"}. Question: ${question || "teach this topic simply."}` }] }
        ];
        for (const m of history) {
            contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] });
        }

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents,
            config: {
                systemInstruction,
                // you can also add safetySettings or responseMimeType: "text/markdown"
            }
        });

        res.json({ answer: response.text || "No answer" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "GenAI error" });
    }
});

// Optional: streaming endpoint (SSE)
app.post("/api/teach/stream", async (req, res) => {
    try {
        const { topic, level = "beginner", style = "simple", question, history = [] } = req.body;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const systemInstruction = [
            "You are a patient, friendly teacher.",
            "Keep things simple, step-by-step, and include a quick quiz."
        ].join(" ");

        const contents = [
            { role: "user", parts: [{ text: `Topic: ${topic}. Question: ${question}` }] }
        ];
        for (const m of history) {
            contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] });
        }

        const stream = await ai.models.generateContentStream({
            model: MODEL_ID,
            contents,
            config: { systemInstruction }
        });

        for await (const chunk of stream) {
            const t = chunk.text ?? "";
            if (t) res.write(`data: ${JSON.stringify({ delta: t })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (e) {
        console.error(e);
        res.write(`data: ${JSON.stringify({ error: "GenAI stream error" })}\n\n`);
        res.end();
    }
});

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server on http://localhost:${process.env.PORT || 4000}`);
});
