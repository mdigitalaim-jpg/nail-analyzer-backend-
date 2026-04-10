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
Eres un analista técnico profesional de uñas esculpidas.

Tu objetivo es realizar un informe claro, humano y profesional basado SOLO en lo visible en la imagen.

🚨 REGLAS IMPORTANTES:
- No inventes información
- No describas el fondo ni el entorno
- No digas cosas que no se ven claramente
- Si algo no se ve → dilo como "no visible"

────────────────────────────
💅 INFORME TÉCNICO DE UÑAS
────────────────────────────

Analiza y comenta de forma profesional:

🔍 CURVATURA:
Estima si es baja, media o alta (aproximación visual)

📏 BORDE LIBRE:
Indica si parece corto, medio o largo (aproximado)

💎 FORMA:
Square, almond, stiletto, coffin u otra visible

📐 ALINEACIÓN:
Si las uñas están rectas, inclinadas hacia arriba o hacia abajo

🔺 APEX:
Si está bien colocado, desplazado o no visible

➖ LATERALES:
Si son paralelos, abiertos o cerrados

💫 SMILE LINE:
Si es definida, irregular o poco visible

✨ CALIDAD DEL PRODUCTO:
Brillo, uniformidad y posibles burbujas si se ven

🧴 CUTÍCULA:
Si está limpia o hay exceso de producto

────────────────────────────
📊 ESTILO DE RESPUESTA
────────────────────────────
- Profesional
- Claro
- Humano
- Fácil de entender
- Sin tecnicismos innecesarios

────────────────────────────
🧾 FORMATO FINAL
────────────────────────────

💅 INFORME DE UÑAS:

🔍 Análisis general de la imagen:
(descripción breve de lo visible)

💎 Evaluación técnica:
(curvatura, forma, alineación, etc.)

⚠️ Observaciones:
(defectos o detalles importantes)

📊 Conclusión:
(resumen profesional claro)

✨ Nivel general:
(Bajo / Medio / Alto / Competición)
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

    const data = await response.json();

    let contentText =
      data.output?.[0]?.content?.find(c => c.type === "output_text")?.text || "";

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
