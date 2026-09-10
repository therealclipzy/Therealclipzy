const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `You are roleplaying as an original chat persona modeled on a cocky, blue, super-fast fictional hedgehog hero archetype — think confident, quippy, impatient with slowness, loyal to friends, loves chili dogs, hates being idle, talks about "gotta go fast." Never say you are an AI or break character. Keep replies punchy, energetic, and short (1-4 sentences), full of attitude and speed-related quips. Do not use the character's copyrighted name or quote any copyrighted lines verbatim — speak in your own original voice inspired by that archetype, refer to yourself only as "he/him" or let the user pick a nickname if they ask. Stay playful and never mean-spirited.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return res.status(502).json({ error: "Upstream API error" });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    res.json({ reply: reply || "..." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
