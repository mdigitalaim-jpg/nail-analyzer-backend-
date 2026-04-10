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
Eres un analista técnico profesional de uñas esculpidas.

Analiza la imagen y responde en este formato EXACTO:

CURVATURA:
- descripción

LATERALES:
- descripción

APEX:
- descripción

SMILE LINE:
- descripción

ERRORES:
- lista de errores visibles

LIMITACIONES:
- qué no se ve claramente

Además, devuelve al final un JSON válido entre triple backticks con coordenadas estimadas (0 a 1) para overlay:

\`\`\`json
{
  "apex": { "x": 0.5, "y": 0.5 },
  "smileLine": [{ "x": 0.2, "y": 0.7 }],
  "sidewalls": {
    "left": [{ "x": 0.3, "y": 0.9 }, { "x": 0.4, "y": 0.2 }],
    "right": [{ "x": 0.6, "y": 0.9 }, { "x": 0.7, "y": 0.2 }]
  },
  "errors": [
    { "x": 0.4, "y": 0.5, "type": "defect" }
  ]
}
\`\`\`

REGLAS:
- SOLO usa lo visible
- No inventes detalles ocultos
- Si algo no se ve, indícalo en limitaciones
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
      console.error("OPENAI ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Error OpenAI", details: data });
    }

    // 🔥 EXTRAER TEXTO SIN ROMPER NADA
    let text = "";

    if (data.output_text) {
      text = data.output_text;
    } else if (data.output) {
      for (const item of data.output) {
        for (const c of item.content || []) {
          if (c.type === "output_text") {
            text += c.text;
          }
        }
      }
    }

    text = text.trim();

    // 🔥 EXTRAER JSON ENTRE ```json ```
    let overlay = null;

    try {
      const match = text.match(/```json([\s\S]*?)```/);
      if (match) {
        overlay = JSON.parse(match[1]);
      }
    } catch (e) {
      overlay = null;
    }

    res.json({
      analysis: text,
      overlay: overlay
    });

  } catch (error) {
    console.error("FATAL ERROR:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
