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
    // 1. UN SOLO MODELO (visión + razonamiento)
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

1. Detecta:
- curvatura
- apex
- laterales
- smile line

2. Luego devuelve instrucciones EXACTAS de dibujo sobre la imagen:
- dónde poner líneas rojas
- dónde marcar errores
- qué zonas resaltar

IMPORTANTE:
- No inventes
- Si no se ve algo, no lo marques

RESPONDE EN FORMATO CLARO.
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
      return res.status(500).json({ error: data });
    }

    const analysis =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    // 2. GENERACIÓN DIRECTA DE IMAGEN ANOTADA
    const image = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        size: "1024x1024",
        prompt: `
Edit this nail image.

BASE IMAGE:
${image_url}

TECHNICAL ANALYSIS:
${analysis}

Draw professional red annotations directly on the nail:
- apex point
- sidewall lines
- smile line curve
- curvature guide

Keep it precise and realistic.
Do NOT invent structures not visible.
`
      })
    });

    const imgData = await image.json();

    const finalImage =
      imgData.data?.[0]?.url ||
      imgData.data?.[0]?.b64_json ||
      null;

    res.json({
      analysis,
      image: finalImage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

app.listen(3000, () => console.log("Running"));
