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
        model: "gpt-4o",
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

REGLA FUNDAMENTAL:
Analiza ÚNICAMENTE elementos técnicos de la uña.
JAMÁS menciones: el entorno, el fondo, la piel, polvo, suciedad, crema, objetos del contexto.
Si algo ES CLARAMENTE VISIBLE, analízalo aunque el ángulo no sea perfecto.
Solo escribe "No analizable" cuando sea IMPOSIBLE determinarlo por el ángulo o luz.
NUNCA inventes. NUNCA seas tan restrictivo que ignores lo que sí se ve claramente.

IDENTIFICACIÓN DE FORMA:
Observa el free edge y los laterales con atención:
- Square: borde libre recto, esquinas a 90 grados, laterales rectos y paralelos
- Squoval: borde libre recto, esquinas ligeramente redondeadas
- Oval: borde redondeado, más estrecho que la base
- Almendra: laterales que se estrechan hacia punta redondeada
- Coffin/Ballerina: laterales que SE ESTRECHAN hacia una punta PLANA y recta
- Stiletto: laterales que terminan en punta afilada
IMPORTANTE: Square y Coffin NO son lo mismo. Coffin tiene laterales que se estrechan. Square no.
Si la vista lateral muestra la C-curve pero no el free edge, indica la forma que se puede deducir o escribe "No analizable".

ANÁLISIS TÉCNICO:

ESTRUCTURA GENERAL:
- Número de uñas visibles y analizables
- Forma de la uña
- Longitud aproximada (corta, media, larga, extra larga)
- Observaciones técnicas generales

CURVATURA (C-CURVE):
- ¿Es visible? — En vista lateral SÍ es visible y analizable
- Porcentaje aproximado (30% suave, 40% moderada, 50% pronunciada)
- ¿Uniforme entre uñas?
- Confianza: ALTA / MEDIA / BAJA

LATERALES (SIDEWALLS):
- ¿Son visibles?
- Dirección: rectos / flaring / pinching
- Simetría
- Confianza: ALTA / MEDIA / BAJA

LÍNEA DE SONRISA (SMILE LINE):
- ¿Hay francesa? Si no: "No aplica"
- Si aplica: definición, simetría, uniformidad
- Confianza: ALTA / MEDIA / BAJA

ÁPEX:
- ¿Es visible?
- Posición: anterior / central / posterior
- Definición: marcado / suave / plano
- Confianza: ALTA / MEDIA / BAJA

ZONA DE ESTRÉS:
- ¿Es visible?
- Grosor aparente
- ¿Correctamente reforzada?
- Confianza: ALTA / MEDIA / BAJA

ERRORES TÉCNICOS DETECTADOS:
- Solo errores claramente visibles
- Si no hay: "No se detectan errores visibles"

CONCLUSIÓN TÉCNICA:
- Valoración global: Excelente / Buena / Mejorable / Deficiente
- Puntos fuertes:
- Puntos a corregir:

LIMITACIONES:
- Qué no se pudo analizar y por qué

---
FORMATO DE RESPUESTA OBLIGATORIO:
Texto plano, sin markdown, sin HTML, sin asteriscos.
CADA PUNTO EN SU PROPIA LÍNEA, separado por salto de línea.
CADA SECCIÓN separada por línea en blanco.
Usa este formato exacto:

💅 ANÁLISIS TÉCNICO

🔷 ESTRUCTURA GENERAL
• Uñas visibles: ...
• Forma: ...
• Longitud: ...
• Observaciones: ...

〰️ CURVATURA (C-CURVE)
• Visible: ...
• Porcentaje: ...
• Uniforme: ...

📏 LATERALES (SIDEWALLS)
• Dirección: ...
• Simetría: ...

🌸 LÍNEA DE SONRISA (SMILE LINE)
• Francesa: ...
• Definición: ...
• Simetría: ...

🔺 ÁPEX
• Visible: ...
• Posición: ...
• Definición: ...

⚡ ZONA DE ESTRÉS
• Visible: ...
• Grosor: ...

❌ ERRORES TÉCNICOS
• ...

✅ CONCLUSIÓN TÉCNICA
• Valoración: ...
• Puntos fuertes: ...
• Puntos a corregir: ...

⚠️ LIMITACIONES
• ...
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

    // Forzar salto de línea antes de cada punto y entre secciones
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
