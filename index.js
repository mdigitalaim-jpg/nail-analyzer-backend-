const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/analyze", async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: "image_url es requerido" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Eres un analista técnico de uñas.

Devuelve:

1. ANÁLISIS TEXTO:
- curvatura
- laterales
- apex
- smile line
- errores
- limitaciones

2. JSON AL FINAL ENTRE TRIPLE BACKTICKS:

\`\`\`json
{
  "apex": { "x": 0.5, "y": 0.5 },
  "smileLine": [{ "x": 0.2, "y": 0.7 }],
  "sidewalls": {
    "left": [],
    "right": []
  },
  "errors": []
}
\`\`\`

REGLAS:
- SOLO lo visible
- coordenadas 0-1
`
              },
              {
                type: "input_image",
                image_url: { url: image_url }
              }
            ]
          }
        ],
        max_output_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: "OpenAI falló",
        details: data
      });
    }

    const text =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    // extraer JSON sin romper servidor
    let overlay = null;

    const match = text.match(/```json([\s\S]*?)```/);
    if (match) {
      try {
        overlay = JSON.parse(match[1]);
      } catch (e) {
        overlay = null;
      }
    }

    res.json({
      analysis: text,
      overlay: overlay
    });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({
      error: "Error interno",
      message: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING"));
