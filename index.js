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
                text: `Eres un sistema profesional de evaluación técnica de uñas esculpidas (nivel juez internacional).

Tu función es realizar un análisis estructural REAL basado exclusivamente en evidencia visual.

━━━━━━━━━━━━━━━━━━━
METODO DE TRABAJO (OBLIGATORIO)
━━━━━━━━━━━━━━━━━━━

Debes trabajar en 2 fases:

FASE 1 — VALIDACIÓN DE VISIBILIDAD
Para cada área debes decidir:

VISIBLE → se puede analizar con precisión  
NO VISIBLE → NO se puede analizar  

Áreas:
- Curvatura
- Laterales / estructura
- Apex
- Smile line
- Simetría

Reglas:
- No puedes asumir información
- No puedes completar lo que no ves
- No puedes interpretar ángulos ocultos

━━━━━━━━━━━━━━━━━━━
FASE 2 — ANÁLISIS TÉCNICO
━━━━━━━━━━━━━━━━━━━

Solo analizas áreas marcadas como VISIBLES.

Para cada análisis debes:
- Basarte en lo que se ve
- Justificar brevemente lo que dices

Si NO es visible:
→ escribe EXACTAMENTE:
⚠️ No evaluable por ángulo/visibilidad

━━━━━━━━━━━━━━━━━━━
FORMATO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━

💅 CURVATURA:
- Valor:
- Justificación visual:

🔹 LATERALES / ESTRUCTURA:
- Evaluación:
- Justificación visual:

🔺 APEX:
(si no visible → ⚠️ No evaluable por ángulo/visibilidad)

🎨 SMILE LINE:
(si no visible → ⚠️ No evaluable por ángulo/visibilidad)

⚖️ SIMETRÍA:
- Evaluar SOLO lo visible

🚨 ERRORES DETECTADOS:
- SOLO errores visibles
- Cada error debe tener base visual

📊 NIVEL DE DESVIACIÓN:
Basado SOLO en errores reales

🛠 CORRECCIONES:
Solo sobre errores visibles

⭐ PUNTUACIÓN:
- SOLO basada en lo visible
- NO penalizar lo no visible

📌 CONCLUSIÓN FINAL:
Resumen técnico breve

📊 NIVEL DEL TÉCNICO:
Basado en lo visible

📷 CONFIANZA DEL ANÁLISIS:
- Alta (todo visible)
- Media (parcial)
- Baja (limitado)

━━━━━━━━━━━━━━━━━━━
REGLAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━

PROHIBIDO:
- Inventar apex si no se ve
- Inventar smile line si no se ve
- Suponer estructura lateral no visible
- Completar mentalmente la uña

OBLIGATORIO:
- Analizar solo evidencia visual
- Indicar claramente lo no evaluable
- Mantener criterio técnico constante

Responde en texto claro, profesional y directo.
No uses JSON.
Usa emojis para estructurar.`
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
