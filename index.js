const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: "image_url es requerido" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Analiza la curvatura de la uña en la imagen. Responde SOLO con JSON válido, sin markdown ni explicaciones extra: {"curvatura": número entre 0 y 100, "nivel": "baja" | "media" | "alta", "descripcion": "breve explicación profesional"}',
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", response.status, err);
      return res.status(500).json({ error: "Error al analizar la imagen" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extraer JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Respuesta inválida de OpenAI" });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.json({ result });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
