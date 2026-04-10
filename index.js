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
Analiza la imagen de uñas SOLO con base en lo visible.

REGLAS:
- No inventes información
- No uses conocimientos externos
- No añadas formas si no son claras
- No des porcentajes ni mm exactos si no se pueden ver
- Si algo no se ve: "no visible"

ANÁLISIS:

- Curvatura: baja / media / alta / no visible
- Borde libre: corto / medio / largo / no visible
- Forma: solo si es claramente evidente, si no "no determinada"
- Alineación: recta / inclinada
- Apex: visible / dudoso / no visible
- Laterales: paralelos / abiertos / cerrados (si se ven)
- Smile line: definida / parcial / no visible
- Calidad del producto: brillo, burbujas si se ven
- Cutícula: limpia / con exceso / no visible

FORMATO DE RESPUESTA:
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
            ]
          }
        ],
        max_output_tokens: 1000
      }),
    });

    const data = await response.json();

    let result = "";

    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.text) {
              result += c.text;
            }
          }
        }
      }
    }

    if (!result) {
      return res.status(500).json({
        error: "No se recibió respuesta de OpenAI",
        raw: data
      });
    }

    res.json({ result });

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
