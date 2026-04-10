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
Eres un sistema profesional de análisis técnico de uñas.

🚨 REGLAS CRÍTICAS:
- Ignora fondo, mesa, luz, piel alrededor (NO ES OBJETO DE ANÁLISIS)
- Analiza SOLO uñas
- NO digas "no visible" si hay suficiente evidencia para estimar
- SIEMPRE intenta estimar si hay forma visible
- Nunca inventes, pero sí aproxima cuando sea posible

────────────────────────────
🧠 OBJETIVO
────────────────────────────
Detectar y analizar cada uña visible de forma independiente.

Si hay varias uñas:
→ analizar cada una por separado

Si solo hay una:
→ analizar solo esa

────────────────────────────
💅 PARÁMETROS OBLIGATORIOS
────────────────────────────

- curvatura (% estimado: ej 30–40, 40–50, 50–60)
- borde_libre (mm estimado: ej 0.5, 1, 2)
- forma (square, almond, stiletto, coffin, otra)
- alineacion (recta, inclinada arriba, inclinada abajo)
- apex (correcto, desplazado, plano)
- laterales (paralelos, abiertos, cerrados)
- smile_line (definida, irregular, parcial)
- calidad_producto (buena, media, baja + burbujas si hay)
- cuticula (limpia, exceso, irregular)

────────────────────────────
📷 REGLA DE ANÁLISIS VISUAL
────────────────────────────
- Si algo es visible parcialmente → ANALIZA PARCIALMENTE
- Si no hay certeza total → da rango
- Solo usa "no visible" si es imposible estimar

────────────────────────────
🚫 PROHIBIDO
────────────────────────────
- Hablar de entorno (mesa, polvo, fondo)
- Ignorar uñas visibles
- Evitar análisis por duda leve
- Decir "no se puede" si hay evidencia parcial

────────────────────────────
📊 FORMATO OBLIGATORIO (JSON)
────────────────────────────

Responde SOLO en JSON válido:

{
  "unhas": [
    {
      "id": 1,
      "curvatura": "",
      "borde_libre": "",
      "forma": "",
      "alineacion": "",
      "apex": "",
      "laterales": "",
      "smile_line": "",
      "calidad_producto": "",
      "cuticula": "",
      "notas": ""
    }
  ],
  "resumen_general": "",
  "confianza": ""
}

────────────────────────────
🧾 ESTILO
────────────────────────────
- técnico
- directo
- sin adornos
- basado en evidencia visual
                `,
              },
              {
                type: "input_image",
                image_url: image_url,
              },
            ],
          },
        ],

        max_output_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(err);
      return res.status(500).json({ error: "Error OpenAI" });
    }

    const data = await response.json();

    let contentText = "";
    if (data.output && data.output.length > 0 && data.output[0].content) {
      for (const c of data.output[0].content) {
        if (c.type === "output_text") {
          contentText += c.text;
        }
      }
    }

    res.json({ result: contentText });

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
