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

ANÁLISIS OBLIGATORIO:

CURVATURA:
- porcentaje estimado
- explicación técnica

LATERALES:
- paralelos / abiertos / cerrados

APEX:
- posición y calidad estructural

SMILE LINE:
- forma y simetría

ERRORES:
- solo visibles

LIMITACIONES:
- qué no se ve

AL FINAL DEL TODO DEVUELVE ESTE JSON ENTRE TRIPLE BACKTICKS:

\`\`\`json
{
  "apex": { "x": 0.5, "y": 0.5 },
  "smileLine": [
    { "x": 0.2, "y": 0.7 },
    { "x": 0.5, "y": 0.8 }
  ],
  "sidewalls": {
    "left": [
      { "x": 0.3, "y": 0.9 },
      { "x": 0.4, "y": 0.2 }
    ],
    "right": [
      { "x": 0.6, "y": 0.9 },
      { "x": 0.7, "y": 0.2 }
    ]
  },
  "errors": [
    { "x": 0.4, "y": 0.5, "type": "defect" }
  ]
}
\`\`\`

REGLAS:
- SOLO lo visible
- NO inventes
- Si no se ve algo, dilo en limitaciones
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
      return res.status(500).json({
        error: "OpenAI error",
        details: data
      });
    }

    let text =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    text = text.trim();

    let overlay = null;

    const match = text.match(/```json([\s\S]*?)```/);

    if (match) {
      try {
        overlay = JSON.parse(match[1].trim());
      } catch (e) {
        overlay = null;
      }
    }

    return res.json({
      analysis: text,
      overlay: overlay
    });

  } catch (error) {
    console.error("FATAL ERROR:", error);
    return res.status(500).json({
      error: "Error interno",
      message: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING"));
