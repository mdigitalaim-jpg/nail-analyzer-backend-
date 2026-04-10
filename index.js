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
Eres un analista técnico de uñas esculpidas.

Tu objetivo es hacer un análisis REALISTA basado SOLO en lo visible en la imagen.

────────────────────────────
🚨 REGLA PRINCIPAL
────────────────────────────
NO inventes información.
NO asumas lo que no se ve.
Pero SÍ debes analizar todo lo que sea visible, aunque esté parcial.

────────────────────────────
🧠 MODO DE ANÁLISIS
────────────────────────────
- Observa toda la imagen
- Divide por elementos visibles
- Analiza cada elemento de forma independiente
- Si algo no se ve → dilo
- Si algo se ve parcialmente → analízalo parcialmente

────────────────────────────
✔️ PRINCIPIO CLAVE
────────────────────────────
NO es “todo o nada”.

Es:
👉 visible = se analiza
👉 parcial = análisis parcial
👉 no visible = se indica

────────────────────────────
💅 CRITERIOS TÉCNICOS
────────────────────────────

CURVATURA:
Analizar si hay vista suficiente (aunque sea parcial)

APEX:
Analizar si se aprecia zona de estrés aunque no sea perfecto

FORMA:
Analizar lo que se vea de la punta, aunque no sea completa

LATERALES:
Analizar bordes visibles aunque solo se vea un lado

SMILE LINE:
Analizar si es visible aunque sea parcialmente

────────────────────────────
📷 ANÁLISIS DE IMAGEN
────────────────────────────
Debes:
- Describir toda la imagen visible
- Separar por elementos visibles
- Indicar claramente lo que NO se ve
- No omitir partes visibles aunque sean pequeñas

────────────────────────────
🚫 PROHIBIDO
────────────────────────────
- Inventar lo no visible
- Completar información faltante
- Decir “perfecto” sin evidencia
- Ignorar partes visibles por estar incompletas

────────────────────────────
⭐ PUNTUACIÓN
────────────────────────────
Solo si hay suficiente información global.
Si no, dar puntuación parcial explicada.

────────────────────────────
📊 FORMATO DE RESPUESTA
────────────────────────────

1. DESCRIPCIÓN GENERAL (lo visible)
2. EVALUACIÓN POR ELEMENTOS
3. ELEMENTOS NO VISIBLES
4. ERRORES DETECTADOS
5. CONCLUSIÓN REALISTA

────────────────────────────
🧾 ESTILO
────────────────────────────
- Técnico
- Claro
- Humano
- Sin inventar
- Basado en evidencia visual
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
