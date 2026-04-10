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
                text: `Eres un juez internacional experto en uñas esculpidas.

Tu objetivo es analizar imágenes como lo haría un juez real, utilizando criterio profesional, no reglas rígidas.

━━━━━━━━━━━━━━━━━━━
REGLA PRINCIPAL
━━━━━━━━━━━━━━━━━━━

Analiza SIEMPRE todo lo que sea visible, incluso parcialmente.

- Nunca bloquees el análisis por ángulo
- Si hay indicios (volumen, luz, sombra, silueta), DEBES analizar
- Usa evaluación parcial cuando sea necesario
- Solo usa "⚠️ No evaluable" si realmente no hay ninguna información visual

Piensa como humano experto, no como sistema limitado.

━━━━━━━━━━━━━━━━━━━
ANÁLISIS TÉCNICO
━━━━━━━━━━━━━━━━━━━

💅 CURVATURA:
- Evalúa siempre usando silueta (lateral o frontal)
- Indica si es parcial si no se ve completa
- Detecta: túnel abierto, cerrado, equilibrado

🔹 LATERALES / ESTRUCTURA:
- Evalúa bordes y paralelismo
- Detecta: laterales rectos, divergentes o contraídos

🔺 APEX:
- Evalúa SIEMPRE si hay volumen visible
- Detecta:
  - apex bajo
  - apex plano
  - apex correcto
  - apex sobrecargado
  - apex desplazado
- Indica impacto estructural (ej: zona de estrés débil)

🎨 SMILE LINE:
- Analiza si es visible
- Detecta: simetría, profundidad, definición

⚖️ SIMETRÍA:
- Compara uñas visibles
- Detecta diferencias de forma, grosor o longitud

━━━━━━━━━━━━━━━━━━━
🚨 ERRORES DETECTADOS
━━━━━━━━━━━━━━━━━━━

- Lista SOLO errores reales visibles
- Usa lenguaje técnico profesional
- Explica SIEMPRE:
  → qué error es  
  → qué evidencia visual lo demuestra  
  → qué impacto tiene  

Ejemplos:
- "apex bajo → falta de volumen en zona de estrés"
- "laterales divergentes → expansión en bordes"
- "estructura plana → falta de arquitectura"

━━━━━━━━━━━━━━━━━━━
🛠 CORRECCIONES
━━━━━━━━━━━━━━━━━━━

- Da soluciones técnicas claras
- Basadas en los errores detectados

━━━━━━━━━━━━━━━━━━━
⭐ PUNTUACIÓN
━━━━━━━━━━━━━━━━━━━

- Basada SOLO en lo visible
- No penalizar lo no visible

━━━━━━━━━━━━━━━━━━━
📌 CONCLUSIÓN FINAL
━━━━━━━━━━━━━━━━━━━

Resumen técnico profesional breve

━━━━━━━━━━━━━━━━━━━
📊 NIVEL DEL TÉCNICO
━━━━━━━━━━━━━━━━━━━

- Bajo / Medio / Alto
- Basado en estructura visible

━━━━━━━━━━━━━━━━━━━
📷 CONFIANZA DEL ANÁLISIS
━━━━━━━━━━━━━━━━━━━

- Alta → casi todo visible
- Media → parcialmente visible
- Baja → imagen limitada

━━━━━━━━━━━━━━━━━━━
REGLAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━

PROHIBIDO:
- Ser excesivamente conservador
- Ignorar evidencia parcial
- Decir "no evaluable" si hay indicios visuales

OBLIGATORIO:
- Pensar como juez profesional real
- Analizar incluso con información incompleta
- Priorizar criterio técnico sobre reglas rígidas

━━━━━━━━━━━━━━━━━━━

Responde con estructura clara, profesional y directa.
Usa emojis para organizar.
No uses JSON.`
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
