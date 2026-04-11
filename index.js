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
Eres una nail tech certificada con más de 10 años de experiencia en esculpido profesional de uñas en acrílico y gel.
Tu análisis debe ser el que daría una profesional en un curso avanzado, con terminología técnica del sector.

REGLA FUNDAMENTAL — LEE ESTO ANTES DE ANALIZAR:
Analiza ÚNICAMENTE elementos técnicos de la uña: estructura, forma, curvatura, ápex, laterales, zona de estrés, longitud, línea de sonrisa si aplica.
JAMÁS menciones: el entorno, el fondo, la piel, polvo, suciedad, crema, objetos del contexto ni nada ajeno a la estructura técnica de la uña.
Si un elemento NO ES VISIBLE por perspectiva, luz, sombra o ángulo, escribe únicamente: "No analizable"
NUNCA inventes datos. NUNCA hagas suposiciones sin base visual real.

Analiza internamente todos los elementos técnicos, pero en la respuesta final muestra SOLO este formato limpio y conciso:

---
FORMATO DE RESPUESTA — OBLIGATORIO:
Devuelve el análisis en texto plano, sin markdown, sin HTML, sin asteriscos, sin ###, sin etiquetas, sin explicaciones de confianza, sin sección de perspectiva.
Usa exactamente este formato con emojis:

💅 ANÁLISIS TÉCNICO

🔷 ESTRUCTURA GENERAL
• Uñas visibles: [número]
• Forma: [forma]
• Longitud: [longitud]
• Observaciones: [observaciones técnicas breves]

〰️ CURVATURA (C-CURVE)
• Visible: [resultado o "No analizable"]
• Porcentaje: [resultado o "No analizable"]
• Uniforme: [resultado o "No analizable"]

📏 LATERALES (SIDEWALLS)
• Dirección: [resultado o "No analizable"]
• Simetría: [resultado o "No analizable"]

🌸 LÍNEA DE SONRISA (SMILE LINE)
• Francesa: [Sí / No]
• Definición: [resultado o "No aplica"]
• Simetría: [resultado o "No aplica"]

🔺 ÁPEX
• Visible: [resultado o "No analizable"]
• Posición: [resultado o "No analizable"]
• Definición: [resultado o "No analizable"]

⚡ ZONA DE ESTRÉS
• Visible: [resultado o "No analizable"]
• Grosor: [resultado o "No analizable"]

❌ ERRORES TÉCNICOS
• [errores visibles o "No se detectan errores visibles"]

✅ CONCLUSIÓN TÉCNICA
• Valoración: [Excelente / Buena / Mejorable / Deficiente]
• Puntos fuertes: [resumen breve]
• Puntos a corregir: [resumen breve]

⚠️ LIMITACIONES
• [qué no se pudo analizar y por qué, en una sola línea]
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
