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

{
  "apex": { "x": 0.5, "y": 0.3 },
  "smileLine": [{ "x": 0.2, "y": 0.6 }],
  "sidewalls": {
    "left": [],
    "right": []
  },
  "errors": []
}

REGLAS:
- SOLO lo visible
- coordenadas 0 a 1
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
        error: "JSON inválido devuelto por modelo",
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
