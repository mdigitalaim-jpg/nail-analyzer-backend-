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
Analiza la imagen de uñas de forma estrictamente visual.

🚨 REGLAS:
- Solo usa lo visible en la imagen
- No inventes formas (stiletto, almond, etc)
- No inventes medidas en mm o porcentajes exactos
- No describas fondo ni entorno
- Si algo no es claro → "no determinado"

────────────────────────────
💅 ANÁLISIS OBLIGATORIO
────────────────────────────

- Curvatura: baja / media / alta (o no determinado)
- Borde libre: corto / medio / largo
- Forma: solo si es evidente
- Alineación: recta / inclinada
- Apex: visible / dudoso / no visible
- Laterales: paralelos / abiertos / cerrados si se ven
- Smile line: definida / parcial / no visible
- Calidad del producto: brillo, burbujas si se ven
- Cutícula: limpia / con exceso / no visible

────────────────────────────
📊 FORMATO
────────────────────────────

Descripción:
Análisis:
Observaciones:
Conclusión:
                `,
              },
              {
                type: "input_image",
                image_url: {
                  url: image_url
                }
              }
            ],
          },
        ],

        max_output_tokens: 1000,
      }),
    });

    const data = await response.json();

    // 🔥 EXTRACCIÓN ROBUSTA (ESTO ES LO QUE TE FALTABA)
    let contentText = "";

    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.text) {
              contentText += c.text;
            }
          }
        }
      }
    }

    if (!contentText) {
      console.error("Respuesta OpenAI vacía:", JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: "OpenAI no devolvió contenido",
      });
    }

    res.json({ result: contentText });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
