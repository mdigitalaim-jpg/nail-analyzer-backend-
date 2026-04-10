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
        model: "gpt-4o-mini",
        temperature: 0.2,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Eres un ANALISTA TÉCNICO PROFESIONAL de uñas esculpidas.

REGLAS:
- Analiza SOLO lo visible en la imagen
- No inventes detalles que no existan
- PERO debes dar una mejor estimación cuando algo sea parcialmente visible
- Usa: ALTA / MEDIA / BAJA confianza
- Solo usa "NO VISIBLE" si realmente no se puede ver nada

FORMATO OBLIGATORIO:

CURVATURA:
- descripción
- nivel de confianza (ALTA / MEDIA / BAJA)

LATERALES:
- descripción
- nivel de confianza

APEX:
- descripción
- nivel de confianza

SMILE LINE:
- descripción
- nivel de confianza

ERRORES:
- solo errores visibles reales

LIMITACIONES:
- qué zonas no se ven claramente
`
              },
              {
                type: "input_image",
                image_url: image_url
              }
            ]
          }
        ],
        max_output_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Error OpenAI", details: data });
    }

    let result =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    result = result.trim();

    if (!result) {
      console.log("RESPUESTA VACÍA:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Respuesta vacía" });
    }

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        size: "1024x1024",
        prompt: `
You are a nail technician assistant.

Base image:
${image_url}

Analysis:
${result}

Draw red professional annotations ONLY based on the analysis:
- apex
- sidewalls
- smile line
- curvature

Do not invent anything.
`
      })
    });

    const imageData = await imageResponse.json();

    const image =
      imageData.data?.[0]?.url ||
      imageData.data?.[0]?.b64_json ||
      null;

    res.json({
      result,
      image: image?.startsWith("data:")
        ? image
        : imageData.data?.[0]?.url || null
    });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
