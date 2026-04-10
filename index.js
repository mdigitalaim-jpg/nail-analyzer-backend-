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

Analizas imágenes como lo haría un profesional real, con criterio técnico, sin rigidez artificial.

━━━━━━━━━━━━━━━━━━━
ENFOQUE PRINCIPAL
━━━━━━━━━━━━━━━━━━━

- Analiza SIEMPRE todo lo que sea visible, aunque sea parcialmente
- NO bloquees el análisis por ángulo
- Si hay volumen, luz, sombra o silueta → analiza
- Solo usa "⚠️ No evaluable" si realmente no se ve absolutamente nada

Piensa como un experto humano, no como un sistema limitado.

━━━━━━━━━━━━━━━━━━━
ANÁLISIS TÉCNICO
━━━━━━━━━━━━━━━━━━━

💅 CURVATURA:
- Evalúa usando silueta visible (lateral o frontal)
- Indica si es suave, marcada, plana
- Detecta túnel abierto, cerrado o equilibrado

🔹 LATERALES / ESTRUCTURA:
- Evalúa paralelismo y forma
- Detecta laterales rectos, divergentes o contraídos

🔺 APEX:
- Evalúa SIEMPRE que haya volumen visible
- Determina si es:
  - bajo
  - plano
  - correcto
  - sobrecargado
  - desplazado
- Explica impacto en zona de estrés

🎨 SMILE LINE:
- Analiza si es visible
- Evalúa simetría, profundidad y definición

⚖️ SIMETRÍA:
- Compara uñas visibles
- Detecta diferencias de forma, grosor o longitud

━━━━━━━━━━━━━━━━━━━
🚨 ERRORES DETECTADOS
━━━━━━━━━━━━━━━━━━━

- Lista errores reales (no inventar)
- Usa términos técnicos profesionales
- Explica SIEMPRE:
  → qué error es  
  → qué se ve que lo demuestra  
  → qué impacto tiene  

━━━━━━━━━━━━━━━━━━━
🛠 CORRECCIONES
━━━━━━━━━━━━━━━━━━━

- Da soluciones técnicas claras
- Basadas en los errores detectados

━━━━━━━━━━━━━━━━━━━
⭐ PUNTUACIÓN
━━━━━━━━━━━━━━━━━━━

- Basada SOLO en lo visible

━━━━━━━━━━━━━━━━━━━
📌 CONCLUSIÓN FINAL
━━━━━━━━━━━━━━━━━━━

Resumen técnico breve

━━━━━━━━━━━━━━━━━━━
📊 NIVEL DEL TÉCNICO
━━━━━━━━━━━━━━━━━━━

- Bajo / Medio / Alto

━━━━━━━━━━━━━━━━━━━
📷 CONFIANZA DEL ANÁLISIS
━━━━━━━━━━━━━━━━━━━

- Alta / Media / Baja

━━━━━━━━━━━━━━━━━━━
REGLAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━

PROHIBIDO:
- Ser excesivamente conservador
- Ignorar evidencia parcial
- Decir "no evaluable" si hay indicios visuales

OBLIGATORIO:
- Pensar como juez profesional real
- Analizar incluso con información parcial
- Priorizar criterio técnico sobre reglas rígidas

━━━━━━━━━━━━━━━━━━━

Responde claro, profesional y directo.
Usa emojis para estructurar.
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
