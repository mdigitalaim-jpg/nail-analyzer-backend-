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

VISIBLE → se puede analizar claramente  
PARCIAL → hay evidencia visual suficiente para un análisis técnico aproximado  
NO VISIBLE → no hay información suficiente  

Áreas:
- Curvatura
- Laterales / estructura
- Apex
- Smile line
- Simetría

Reglas:
- No puedes asumir información inexistente
- No puedes completar lo que no ves completamente
- PERMITIDO análisis parcial basado en evidencia visual (luz, sombra, volumen, ángulo)
- Si hay volumen o perfil visible → considerar PARCIAL

━━━━━━━━━━━━━━━━━━━
FASE 2 — ANÁLISIS TÉCNICO Y DIAGNÓSTICO
━━━━━━━━━━━━━━━━━━━

Solo analizas áreas marcadas como VISIBLE o PARCIAL.

Si el área es PARCIAL:
- Realiza análisis técnico basado en indicios visibles
- Indica que es una evaluación parcial

Para cada análisis debes:
- Basarte en lo que se ve
- Justificar brevemente lo que dices
- Identificar si existe un error técnico concreto
- Explicar el impacto estructural o estético del error

Si NO es visible:
→ escribe EXACTAMENTE:
⚠️ No evaluable por ángulo/visibilidad

━━━━━━━━━━━━━━━━━━━
FORMATO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━

💅 CURVATURA:
- Valor:
- Diagnóstico:
- Justificación visual:

🔹 LATERALES / ESTRUCTURA:
- Evaluación:
- Diagnóstico:
- Justificación visual:

🔺 APEX:
(si no visible → ⚠️ No evaluable por ángulo/visibilidad)
(si visible o parcial → incluir diagnóstico técnico)

🎨 SMILE LINE:
(si no visible → ⚠️ No evaluable por ángulo/visibilidad)

⚖️ SIMETRÍA:
- Evaluar SOLO lo visible
- Indicar posibles desviaciones

🚨 ERRORES DETECTADOS:
- SOLO errores visibles o parcialmente visibles
- Nombrar errores técnicos específicos (ej: apex bajo, túnel abierto, laterales divergentes, estructura plana)
- Explicar brevemente el impacto de cada error

📊 NIVEL DE DESVIACIÓN:
Basado SOLO en errores reales

🛠 CORRECCIONES:
- Específicas y técnicas
- Basadas en los errores detectados

⭐ PUNTUACIÓN:
- SOLO basada en lo visible
- NO penalizar lo no visible

📌 CONCLUSIÓN FINAL:
Resumen técnico breve con enfoque profesional

📊 NIVEL DEL TÉCNICO:
Basado en precisión estructural visible

📷 CONFIANZA DEL ANÁLISIS:
- Alta (todo visible)
- Media (parcial)
- Baja (limitado)

━━━━━━━━━━━━━━━━━━━
REGLAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━

PROHIBIDO:
- Inventar apex sin evidencia visual
- Inventar smile line sin evidencia visual
- Suponer estructura lateral no visible
- Completar mentalmente la uña

PERMITIDO:
- Evaluar apex si hay indicios como volumen, luz, sombra o perfil lateral
- Diagnosticar errores basados en evidencia visible o parcial

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
