const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

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
Analiza esta uña como inspector técnico profesional.

DEVUELVE SOLO JSON.

Detecta y marca en coordenadas relativas (0 a 1):

{
  "curvature": {
    "value": "",
    "confidence": "",
    "area": "polygon or line points"
  },
  "apex": {
    "point": { "x": 0.5, "y": 0.3 },
    "confidence": ""
  },
  "sidewalls": {
    "left": [{"x":0,"y":0},{"x":0,"y":0}],
    "right": [{"x":0,"y":0},{"x":0,"y":0}]
  },
  "smileLine": {
    "curve": [{"x":0,"y":0}]
  },
  "errors": [
    {
      "type": "",
      "location": {"x":0,"y":0},
      "severity": ""
    }
  ]
}

REGLAS:
- SOLO usa lo visible
- Si no se ve algo, no lo incluyas
- Coordenadas normalizadas (0 a 1)
- Precisión máxima
`
              },
              {
                type: "input_image",
                image_url: image_url
              }
            ]
          }
        ],
        max_output_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI error",
        details: data
      });
    }

    const text =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "Respuesta no es JSON válido",
        raw: text
      });
    }

    res.json({
      image_url,
      overlay: json
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.listen(3000, () => console.log("Running"));
