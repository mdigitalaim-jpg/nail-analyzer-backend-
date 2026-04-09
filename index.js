const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Asegúrate de que está instalado en tu proyecto

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
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analiza la(s) uña(s) de esta imagen desde un punto de vista técnico profesional de manicura.
                
Quiero que evalúes:

1. Curvatura (C-curve):
- Estima el porcentaje aproximado (30%, 40%, 50%, 60%, etc.)
- Explica brevemente por qué

2. Inclinación:
- Indica si la uña está recta, hacia arriba o hacia abajo
- Especifica si la inclinación es leve, moderada o pronunciada

3. Simetría:
- Evalúa si la curvatura está equilibrada en ambos lados
- Indica si hay colapso lateral o desbalance

4. Uniformidad (si hay varias uñas):
- Compara entre ellas y menciona diferencias

5. Conclusión:
- Resume en valores claros (curvatura %, inclinación, calidad general)

IMPORTANTE:
- Da estimaciones visuales profesionales, no genéricas
- Sé preciso, directo y técnico
- Responde SOLO en JSON válido con esta estructura:

{
  "curvatura": { "porcentaje": number, "explicacion": string },
  "inclinacion": { "direccion": "recta" | "arriba" | "abajo", "grado": "leve" | "moderada" | "pronunciada" },
  "simetria": { "estado": string, "detalle": string },
  "uniformidad": string,
  "conclusion": string
}`
              },
              {
                type: "input_image",
                image_url: image_url,
              },
            ],
          },
        ],
        max_output_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return res.status(500).json({ error: "Error al analizar la imagen" });
    }

    const data = await response.json();
    const content = data.output_text || "";

    // Manejo seguro: intenta extraer JSON aunque haya texto extra
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("Error parsing JSON de OpenAI:", content);
      return res.status(500).json({ error: "Respuesta inválida de OpenAI" });
    }

    if (!result) {
      return res.status(500).json({ error: "Respuesta inválida de OpenAI" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error interno del servidor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
