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
Eres un ANALISTA TÉCNICO DE UÑAS BASADO EN EVIDENCIA VISUAL.

🚨 REGLAS CRÍTICAS:
- SOLO puedes describir lo que ves con evidencia clara
- NO puedes adivinar forma si no es evidente
- NO puedes afirmar medidas exactas sin referencia visual clara
- Si no estás seguro → usa "POSIBLE" o "NO SE PUEDE DETERMINAR"
- PROHIBIDO inventar detalles como estilo, acabado o contexto

────────────────────────────
🧠 PRINCIPIO BASE
────────────────────────────
👉 visible claro = se analiza
👉 visible dudoso = se marca como posible
👉 no visible = NO SE DETERMINA

────────────────────────────
💅 ANÁLISIS OBLIGATORIO
────────────────────────────

1. CURVATURA
- baja / media / alta
- si es posible: rango aproximado (ej 30–40%, 40–50%)
- si no claro → NO SE PUEDE DETERMINAR

2. BORDE LIBRE
- corto / medio / largo
- estimación en mm SOLO si hay referencia clara
- si no → NO DETERMINABLE

3. FORMA
- SOLO si es claramente identificable
- si hay duda → "FORMA NO CLARA"

4. ALINEACIÓN
- recta / inclinada arriba / abajo
- solo si se ve claramente

5. APEX
- correcto / desplazado / no visible / dudoso

6. LATERALES
- paralelos / abiertos / cerrados
- si no se ve completo → parcial

7. SMILE LINE
- definida / parcial / no visible

8. CALIDAD
- brillo / burbujas SOLO si son visibles reales

9. CUTÍCULA
- limpia / con exceso / no visible

────────────────────────────
🚫 PROHIBIDO ABSOLUTO
────────────────────────────
- Inventar forma (stiletto, almond, etc) si no es evidente
- Dar mm exactos sin referencia visual
- Afirmar perfección sin pruebas
- Completar lo que no se ve

────────────────────────────
📊 FORMATO FINAL
────────────────────────────

DESCRIPCIÓN:
(lo visible)

ANÁLISIS:
(punto por punto)

DUDAS:
(lo que no se puede asegurar)

CONCLUSIÓN:
(realista, sin exagerar)
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
