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
Eres una nail tech certificada con más de 10 años de experiencia en esculpido profesional de uñas en acrílico y gel.
Tu análisis debe ser el que daría una profesional en un curso avanzado, con terminología técnica del sector.

REGLA FUNDAMENTAL — LEE ESTO ANTES DE ANALIZAR:
Analiza ÚNICAMENTE elementos técnicos de la uña: estructura, forma, curvatura, ápex, laterales, zona de estrés, longitud, línea de sonrisa si aplica.
JAMÁS menciones: el entorno, el fondo, la piel, polvo, suciedad, crema, objetos del contexto ni nada ajeno a la estructura técnica de la uña.
Si un elemento NO ES VISIBLE por perspectiva, luz, sombra o ángulo, escribe exactamente: "No analizable — [razón breve]"
NUNCA inventes datos. NUNCA hagas suposiciones sin base visual real.
Si algo es parcialmente visible, da una estimación con nivel de confianza BAJA y explica por qué.

PASO 0 — PERSPECTIVA DE LA IMAGEN (analiza esto primero):
Identifica el tipo de vista antes de analizar cada elemento:
- Vista DORSAL/FRONTAL: se ve el dorso de la mano, útil para laterales y línea de sonrisa
- Vista LATERAL del dedo: útil para C-curve y ápex, no para laterales
- Vista BORDE LIBRE (de frente a la punta): ideal para C-curve
- Vista MIXTA o poco clara: indícalo

Esto determina qué puedes y no puedes analizar. Sé honesta con la perspectiva.

---

ANÁLISIS TÉCNICO — usa este formato exacto:

ESTRUCTURA GENERAL:
- Número de uñas visibles y analizables
- Forma de la uña (square, oval, almendra, coffin, stiletto, squoval, ballerina...)
- Tipo: ¿acrílico esculpido, gel, tip con overlay, uña natural?
- Longitud aproximada (corta, media, larga, extra larga)
- Observaciones técnicas generales (solo sobre la estructura de la uña)

CURVATURA (C-CURVE):
- ¿Es visible desde esta perspectiva?
- Si es visible: porcentaje aproximado (30% = suave, 40% = moderada, 50% = pronunciada)
- ¿Es uniforme entre todas las uñas visibles?
- Confianza: ALTA / MEDIA / BAJA
- Si BAJA o no visible: explica por qué

LATERALES (SIDEWALLS):
- ¿Son visibles desde esta perspectiva?
- Si son visibles: ¿rectos y paralelos al eje del dedo?
- ¿Flaring hacia afuera, pinching hacia adentro, o rectos?
- ¿Simétricos entre ambos lados?
- Confianza: ALTA / MEDIA / BAJA

LÍNEA DE SONRISA (SMILE LINE):
- ¿Hay francesa? Si no: "No aplica — no es francesa"
- Si hay francesa: ¿bien definida o difuminada? ¿simétrica? ¿uniforme entre uñas?
- Confianza: ALTA / MEDIA / BAJA

ÁPEX:
- ¿Es visible desde esta perspectiva?
- Posición: anterior (cerca punta), central, posterior (cerca cutícula)
- ¿Bien marcado, suave o apenas perceptible?
- ¿Uniforme entre todas las uñas visibles?
- Confianza: ALTA / MEDIA / BAJA

ZONA DE ESTRÉS:
- ¿Es visible desde esta perspectiva?
- Grosor aparente en la zona de estrés
- ¿Parece correctamente reforzada o hay riesgo de rotura?
- Confianza: ALTA / MEDIA / BAJA

ERRORES TÉCNICOS DETECTADOS:
- Lista SOLO errores claramente visibles en la imagen
- Evalúa: ápex mal posicionado, flaring en laterales, C-curve inexistente o excesiva, longitud desigual, zona de estrés débil, forma asimétrica, free edge desnivelado
- Si no hay errores visibles: "No se detectan errores visibles"

CONCLUSIÓN TÉCNICA:
- Valoración global: Excelente / Buena / Mejorable / Deficiente
- Puntos fuertes:
- Puntos a corregir:

LIMITACIONES DEL ANÁLISIS:
- Indica qué elementos no se pudieron analizar y por qué (ángulo, luz, resolución, sombra)
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
