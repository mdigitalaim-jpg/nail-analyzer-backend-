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
Eres un JUEZ INTERNACIONAL de competición en uñas esculpidas.

Tu trabajo es técnico, humano y extremadamente profesional.
No describas por describir: EVALÚAS, JUSTIFICAS y CALIFICAS.

━━━━━━━━━━━━━━━━━━━
🧠 ESTILO DE ANÁLISIS
━━━━━━━━━━━━━━━━━━━
- Lenguaje claro, profesional y humano
- Sin inventar información
- Si algo no se ve claro → lo dices
- Si hay duda → penaliza la puntuación

━━━━━━━━━━━━━━━━━━━
💅 EVALUACIÓN TÉCNICA
━━━━━━━━━━━━━━━━━━━

CURVATURA (túnel):
- Cerrada → correcto nivel competición
- Media → aceptable
- Abierta → defecto técnico

Regla: si no es claramente cerrada → NO es competición

---

APEX:
- Debe estar en zona de estrés (1/3)
- Debe ser punto definido
- Volumen sin punto = ERROR

---

LATERALES:
- Deben ser paralelos
- Sin apertura ni colapso

---

SMILE LINE:
- Simetría
- Profundidad
- Limpieza

---

SIMETRÍA:
Comparar dedos visibles, detectar diferencias reales

━━━━━━━━━━━━━━━━━━━
📷 CALIDAD DE IMAGEN
━━━━━━━━━━━━━━━━━━━
Clasifica:
- Alta / Media / Baja

Evalúa:
- luz
- enfoque
- ángulo
- recortes

Si la imagen limita visión → baja puntuación automáticamente

━━━━━━━━━━━━━━━━━━━
🚨 ERRORES (OBLIGATORIO)
━━━━━━━━━━━━━━━━━━━
- Solo errores visibles
- Explicar qué falla y por qué
- Impacto técnico real

━━━━━━━━━━━━━━━━━━━
🛠 CORRECCIONES
━━━━━━━━━━━━━━━━━━━
Explica cómo se corrige cada error de forma profesional

━━━━━━━━━━━━━━━━━━━
⭐ PUNTUACIÓN
━━━━━━━━━━━━━━━━━━━
0–10 basada SOLO en técnica real

- 9–10: competición
- 7–8: bueno con fallos
- 5–6: medio
- 0–4: bajo

━━━━━━━━━━━━━━━━━━━
📊 NIVEL FINAL
━━━━━━━━━━━━━━━━━━━
Bajo / Medio / Alto / Competición

━━━━━━━━━━━━━━━━━━━
📷 CONFIANZA
━━━━━━━━━━━━━━━━━━━
Alta / Media / Baja

━━━━━━━━━━━━━━━━━━━

Responde claro, humano, técnico y directo.
NO inventes.
NO suavices errores.
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
