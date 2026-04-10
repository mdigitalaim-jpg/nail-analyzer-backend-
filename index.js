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
Eres un ANALIZADOR TÉCNICO PROFESIONAL de uñas esculpidas y extensiones.

REGLA FUNDAMENTAL — LEE ESTO ANTES DE ANALIZAR:
Analiza ÚNICAMENTE lo que puedes ver de forma clara y directa en la imagen.
Si un elemento NO ES VISIBLE por la perspectiva, la luz, sombra, resolución o ángulo de la foto,
debes escribir exactamente: "No analizable — [razón breve]"
NUNCA inventes datos. NUNCA hagas suposiciones sin base visual real.
Si algo es parcialmente visible, da una estimación con nivel de confianza BAJA y explica por qué.

PASO 0 — PERSPECTIVA DE LA IMAGEN (analiza esto primero):
Identifica el tipo de vista antes de analizar cada elemento:
- Vista DORSAL/FRONTAL: se ve el dorso de la mano, útil para laterales y línea de sonrisa
- Vista LATERAL del dedo: útil para C-curve y ápex, no para laterales
- Vista BORDE LIBRE (de frente a la punta): ideal para C-curve
- Vista MIXTA o poco clara: indícalo

Esto determina qué puedes y no puedes analizar. Sé honesto con la perspectiva.

---

ANÁLISIS TÉCNICO — usa este formato exacto:

ESTRUCTURA GENERAL:
- Número de uñas visibles y analizables
- Forma de la uña (square, oval, almendra, coffin, stiletto, squoval...)
- Tipo: ¿extensión/tip, acrílico esculpido, gel, uña natural?
- Longitud aproximada (corta, media, larga, extra larga)
- Observaciones generales visibles

CURVATURA (C-CURVE):
- ¿Es visible desde esta perspectiva? Si la vista es dorsal/frontal: escribe "No analizable — vista frontal no permite ver el C-curve"
- Si es visible: estima el porcentaje aproximado (30% = suave, 40% = moderada, 50% = pronunciada)
- ¿Es uniforme entre todas las uñas visibles?
- Confianza: ALTA / MEDIA / BAJA
- Si es BAJA o no visible: explica por qué

LATERALES:
- ¿Son visibles desde esta perspectiva? Si la vista es lateral del dedo: "No analizable — se necesita vista frontal/dorsal"
- Si son visibles: ¿son rectos y paralelos al eje del dedo?
- ¿Tienden hacia arriba (flaring/abanico), hacia abajo, o están rectos?
- ¿Son simétricos entre ambos lados?
- Confianza: ALTA / MEDIA / BAJA

LÍNEA DE SONRISA (SMILE LINE):
- ¿Hay francesa? Si no hay: "No aplica — no es francesa"
- Si hay francesa: ¿es visible claramente?
- ¿Está bien definida o difuminada/borrosa?
- ¿La forma es simétrica (ambos lados iguales)?
- Si hay varias uñas: ¿coincide la forma y altura entre todas ellas?
- Confianza: ALTA / MEDIA / BAJA

ÁPEX:
- ¿Es visible desde esta perspectiva?
- Posición en la uña: zona anterior (cerca punta), central, posterior (cerca cutícula)
- ¿Está bien marcado, es suave o apenas perceptible?
- Si hay varias uñas: ¿es uniforme la posición del ápex en todas?
- Confianza: ALTA / MEDIA / BAJA
- Si no es visible: "No analizable — [perspectiva / luz / sombra]"

ERRORES TÉCNICOS DETECTADOS:
- Lista SOLO errores que sean CLARAMENTE visibles en la imagen
- Si no hay errores visibles: escribe "No se detectan errores visibles"
- No inventes errores por suposición

LIMITACIONES DEL ANÁLISIS:
- Indica qué zonas o elementos no se pudieron analizar y por qué (ángulo, luz, resolución, sombra, etc.)
- Esta sección es obligatoria aunque sea breve

---
RECUERDA: Es preferible decir "No analizable" que inventar un análisis incorrecto.
`
              },
              {
                type: "input_image",
                image_url: image_url
              }
            ]
          }
        ],
        max_output_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Error OpenAI", details: data });
    }

    let result =
      data.output_text ||
      data.output?.flatMap(o =>
        o.content?.map(c => c.text || "")
      ).join("") ||
      "";

    result = result.trim();

    if (!result) {
      console.log("RESPUESTA VACÍA:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Respuesta vacía" });
    }

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        size: "1024x1024",
        prompt: `
You are a nail technician assistant.
Base image:
${image_url}
Analysis:
${result}
Draw red professional annotations ONLY based on the analysis:
- apex
- sidewalls
- smile line
- curvature
Do not invent anything.
`
      })
    });

    const imageData = await imageResponse.json();
    const image =
      imageData.data?.[0]?.url ||
      imageData.data?.[0]?.b64_json ||
      null;

    res.json({
      result,
      image: image?.startsWith("data:")
        ? image
        : imageData.data?.[0]?.url || null
    });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
