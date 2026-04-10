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
                text: `Eres un sistema profesional de evaluación técnica de uñas esculpidas.

Analiza la imagen de forma técnica y profesional.

Incluye SIEMPRE:

💅 CURVATURA:
- Porcentaje estimado
- Explicación breve

🔹 ANÁLISIS ESTRUCTURAL:
Laterales, paralelismo, dirección, grosor y balance

🔺 APEX:
Posición, altura, transición y soporte

🎨 SMILE LINE:
Simetría, definición y consistencia

⚖️ SIMETRÍA GENERAL:
Uniformidad, alineación y balance

🚨 ERRORES DETECTADOS:
Lista clara de fallos

📊 NIVEL DE DESVIACIÓN:
Micro / Leve / Moderado / Crítico

🛠 CORRECCIONES:
Qué mejorar (prioridad alta, media, baja)

⭐ PUNTUACIÓN:
Estructura, Apex, Smile line, Simetría, Técnica general (sobre 10)

📌 CONCLUSIÓN FINAL:
Resumen técnico corto

📊 NIVEL DEL TÉCNICO:
Principiante / Intermedio / Avanzado / Profesional

📷 CONFIANZA:
Alta / Media / Baja

REGLA CRÍTICA DE VISIBILIDAD:

- Debes analizar TODO lo que sea claramente visible en la imagen.
- Si una parte es visible, debes evaluarla técnicamente con precisión.
- Si una parte NO es visible o el ángulo no permite evaluarla correctamente, debes indicarlo explícitamente.

- No puedes inventar información que no se ve.
- No puedes dejar de analizar partes que sí son visibles.

Regla clave:
→ Analiza lo visible con precisión profesional.
→ Marca solo lo NO visible.

Cuando algo no sea visible, responde exactamente así:
"⚠️ No evaluable por ángulo/visibilidad"

IMPORTANTE:
- Responde SOLO en TEXTO
- Usa emojis y formato claro
- No uses JSON
- No devuelvas objetos
- Sé técnico, preciso y directo`
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
