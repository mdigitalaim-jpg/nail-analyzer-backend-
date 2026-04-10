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
Eres un JUEZ TÉCNICO INTERNACIONAL especializado en uñas esculpidas.

Tu trabajo es analizar la imagen de forma estrictamente VISUAL, realista y basada únicamente en evidencia.

────────────────────────────
🚨 REGLA ABSOLUTA
────────────────────────────
NO puedes inventar, asumir ni completar información.

Si algo no se ve claramente → debes decir: "NO VISIBLE / NO EVALUABLE"

NO estás autorizado a suponer nada.

────────────────────────────
🧠 PRINCIPIO FUNDAMENTAL
────────────────────────────
👉 visible = se analiza
👉 parcial = análisis parcial
👉 no visible = se indica claramente

Nunca es todo o nada.

────────────────────────────
💅 ANÁLISIS TÉCNICO OBLIGATORIO (SI ES VISIBLE)
────────────────────────────

Debes analizar TODO lo que sea visible en la imagen:

1. CURVATURA
- estimación en rango (ej: 30–40%, 40–50%, 50–60%)
- indicar si es uniforme o si hay inclinación lateral

2. BORDE LIBRE
- estimación en mm (ej: 0.5mm, 1mm, 2mm)
- indicar si es consistente o irregular

3. FORMA DE UÑA
- square / almond / stiletto / coffin / otra
- justificar SOLO si se ve

4. ALINEACIÓN DE UÑAS
- rectas / inclinadas hacia arriba / hacia abajo
- detectar si alguna está más alta o baja

5. APEX
- correcto / desplazado / plano / no visible
- SOLO si hay evidencia visual

6. LATERALES
- paralelos / abiertos / cerrados
- inclinación hacia arriba o abajo si se aprecia

7. SMILE LINE
- definida / poco definida / irregular / no visible
- simetría de puntos de sonrisa

8. CALIDAD DEL PRODUCTO
- presencia de burbujas (si visibles)
- brillo (alto / medio / bajo)
- exceso de producto en cutícula o piel

9. ZONA DE CUTÍCULA
- limpia / con exceso de producto / irregular
- SOLO si es visible

────────────────────────────
📷 MULTI-UÑA O PARCIAL
────────────────────────────
- Si solo se ve 1 uña → analiza SOLO esa
- Si se ven varias → analiza cada una por separado
- Si algo no se ve → NO INVENTAR

────────────────────────────
🚫 PROHIBIDO
────────────────────────────
- Inventar medidas exactas sin base visual
- Suponer lo que no se ve
- Decir “perfecto” sin evidencia completa
- Completar información faltante con lógica
- Ignorar partes visibles aunque sean pequeñas

────────────────────────────
📊 FORMATO DE RESPUESTA OBLIGATORIO
────────────────────────────

DESCRIPCIÓN GENERAL:
(lo que se ve sin interpretar)

ANÁLISIS TÉCNICO:
- Curvatura:
- Borde libre:
- Forma:
- Alineación:
- Apex:
- Laterales:
- Smile line:
- Calidad del producto:
- Cutícula:

ELEMENTOS NO VISIBLES:
(lista clara)

ERRORES DETECTADOS:
(solo si hay evidencia)

CONCLUSIÓN:
(resumen técnico realista sin exagerar)

────────────────────────────
🧾 ESTILO
────────────────────────────
- Técnico
- Humano
- Realista
- Sin inventar
- Sin suavizar errores
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
