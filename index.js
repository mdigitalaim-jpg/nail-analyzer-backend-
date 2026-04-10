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
Eres un analista visual de uñas.

🚨 REGLAS CRÍTICAS:
- NO inventes formas (stiletto, almond, etc) si no es 100% evidente
- NO inventes medidas (mm o % exactos)
- NO completes información faltante
- SOLO describe evidencia visual

────────────────────────────
💅 ANALIZA SOLO ESTO:
────────────────────────────

- Curvatura: baja / media / alta (sin porcentajes obligatorios)
- Borde libre: corto / medio / largo
- Forma: SOLO si es claramente evidente, si no "no determinada"
- Alineación: recta / inclinada
- Apex: visible / no visible / dudoso
- Laterales: paralelos / abiertos / cerrados si se ven
- Smile line: visible / parcial / no visible
- Calidad del producto: brillo / burbujas SOLO si se ven
- Cutícula: limpia / con exceso / no visible

────────────────────────────
🚫 PROHIBIDO ABSOLUTO:
────────────────────────────
- Inventar estilos de uñas
- Inventar medidas exactas
- Suponer detalles invisibles
- Completar información

────────────────────────────
📊 RESPUESTA CLARA:
────────────────────────────
Descripción:
Análisis:
Dudas:
Conclusión:
                `,
              },
              {
                type: "input_image",
                image_url: {
                  url: image_url
                }
              }
            ],
          },
        ],

        max_output_tokens: 1000,
      }),
    });

    const data = await response.json();

    let contentText =
      data.output?.[0]?.content?.find(c => c.type === "output_text")?.text || "";

    // 🔥 VALIDACIÓN SIMPLE ANTI-INVENTOS
    const banned = ["stiletto", "almond", "coffin", "1mm", "30%", "40%", "50%"];

    let cleaned = contentText;

    banned.forEach(word => {
      const regex = new RegExp(word, "gi");
      cleaned = cleaned.replace(regex, "[NO VALIDADO]");
    });

    res.json({
      result: cleaned
    });

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
