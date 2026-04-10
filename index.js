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
    const analysisPrompt = `
Eres un ANALISTA TÉCNICO PROFESIONAL en uñas esculpidas.

REGLAS:
- Analiza SOLO lo visible en la imagen
- PROHIBIDO inventar
- Si algo no se ve claramente → indícalo como limitación
- Sé técnico, directo y preciso

ANÁLISIS:

CURVATURA:
- Estima porcentaje aproximado entre 0% y 50%
- Justifica según lo visible

LATERALES:
- Rectos y paralelos
- Inclinados hacia dentro
- Abiertos hacia fuera

APEX:
- Alto / bajo / inexistente
- Posición (centrado, adelantado, retrasado)

SMILE LINE:
- Profunda / media / plana
- Simetría si es visible

LIMITACIONES:
- Qué no se puede evaluar y por qué

FORMATO EXACTO:

CURVATURA:
...

LATERALES:
...

APEX:
...

SMILE LINE:
...

LIMITACIONES:
...
`;

    const analysisResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        temperature: 0.2,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: analysisPrompt },
              { type: "input_image", image_url: { url: image_url } }
            ]
          }
        ],
        max_output_tokens: 800
      })
    });

    const analysisData = await analysisResponse.json();

    if (!analysisResponse.ok) {
      console.log("OPENAI ERROR:", analysisData);
      return res.status(500).json({
        error: "Error en análisis OpenAI",
        details: analysisData
      });
    }

    let analysisText = "";

    const output = analysisData.output || [];

    for (const item of output) {
      if (!item.content) continue;

      for (const c of item.content) {
        if (c.type === "output_text" && c.text) {
          analysisText += c.text;
        }
      }
    }

    analysisText = analysisText.trim();

    if (!analysisText) {
      console.log("RESPUESTA COMPLETA:", JSON.stringify(analysisData, null, 2));

      return res.status(500).json({
        error: "Análisis vacío",
        raw: analysisData
      });
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
You are editing a nail image.

This is the analysis of the nail:
${analysisText}

Recreate the same nail image and add red technical annotations based only on the analysis.

Rules:
- Do not invent anything not in the analysis
- Do not distort the finger or nail
- Use red lines, arrows and labels
- Mark apex, sidewalls, smile line and curvature based strictly on analysis

Base image: ${image_url}
`
      })
    });

    const imageData = await imageResponse.json();

    res.json({
      analysis: analysisText,
      image: imageData.data?.[0]?.url || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
