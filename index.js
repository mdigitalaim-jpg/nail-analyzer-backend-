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
Analiza la imagen de uñas de forma técnica, objetiva y basada SOLO en lo visible.

────────────────────────────
🚨 REGLA PRINCIPAL
────────────────────────────
- NO inventes información
- NO asumas lo que no se ve
- NO describas el entorno (mesa, polvo, fondo)
- SOLO analiza uñas

Si algo no se ve claramente → escribe "NO VISIBLE"

────────────────────────────
🧠 PRINCIPIO DE ANÁLISIS
────────────────────────────
👉 visible = se analiza
👉 parcial = análisis parcial
👉 no visible = se indica

────────────────────────────
💅 ANÁLISIS TÉCNICO (SI ES VISIBLE)
────────────────────────────

CURVATURA:
- estimación en rango (ej: 30–40%, 40–50%, 50–60%)
- si no es clara → NO VISIBLE

BORDE LIBRE:
- estimación en mm (ej: 0.5mm, 1mm, 2mm)
- si no hay referencia → NO VISIBLE

FORMA:
- square / almond / stiletto / coffin / otra
- solo si es evidente

ALINEACIÓN:
- rectas / inclinadas arriba / abajo
- solo si se ve claramente

APEX:
- correcto / desplazado / plano / NO VISIBLE

LATERALES:
- paralelos / abiertos / cerrados
- solo si se ven

SMILE LINE:
- definida / irregular / NO VISIBLE

CALIDAD DEL PRODUCTO:
- burbujas (si se ven)
- brillo (alto / medio / bajo)
- exceso de producto (si se ve)

CUTÍCULA:
- limpia / con exceso / NO VISIBLE

────────────────────────────
📊 FORMATO DE RESPUESTA
────────────────────────────

DESCRIPCIÓN GENERAL:
(lo visible sin interpretar)

ANÁLISIS TÉCNICO:
- Curvatura:
- Borde libre:
- Forma:
- Alineación:
- Apex:
- Laterales:
- Smile line:
- Calidad:
- Cutícula:

ELEMENTOS NO VISIBLES:
(lista clara)

CONCLUSIÓN:
(resumen técnico realista basado solo en evidencia visible)
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
