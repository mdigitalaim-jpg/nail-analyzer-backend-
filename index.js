const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Asegúrate de tener node-fetch instalado

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para analizar la uña
app.post("/analyze", async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: "image_url es requerido" });
  }

  try {
    // Llamada a OpenAI GPT-4o con capacidades de visión
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // modelo GPT con visión
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  'Analiza la curvatura de la uña en esta imagen y responde SOLO con JSON válido: {"curvatura": número entre 0 y 100, "nivel": "baja" | "media" | "alta", "descripcion": "breve explicación profesional"}',
              },
              {
                type: "input_image",
                image_url: image_url,
              },
            ],
          },
        ],
        max_output_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", response.status, err);
      return res.status(500).json({ error: "Error al analizar la imagen" });
    }

    const data = await response.json();
    const content = data.output_text || ""; // extraemos la respuesta de texto

    // Extraer JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Respuesta inválida de OpenAI" });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.json({ resultado: result });
  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint raíz para probar que el servidor funciona
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
