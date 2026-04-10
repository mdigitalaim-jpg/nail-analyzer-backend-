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

REGLAS ABSOLUTAS — LEE ANTES DE ANALIZAR:
1. Analiza EXCLUSIVAMENTE elementos técnicos de la uña. JAMÁS menciones: el entorno, el fondo, la piel, polvo, suciedad, objetos del entorno ni nada ajeno a la estructura de la uña.
2. Si un elemento NO ES VISIBLE por perspectiva, luz o ángulo, escribe: "No analizable — [motivo]". NUNCA inventes datos.
3. Usa siempre terminología técnica profesional: C-curve, ápex, laterales, free edge, zona de estrés, tabla, placa ungueal, sidewalls, smile line.
4. El análisis debe ser el que daría una profesional en un curso avanzado, no una descripción casual.

---

PASO 0 — PERSPECTIVA DE LA IMAGEN (analiza esto primero):
- Tipo de vista: (lateral del dedo / dorsal-frontal / borde libre / mixta)
- Elementos analizables desde esta perspectiva:
- Elementos NO analizables desde esta perspectiva:

---

ANÁLISIS TÉCNICO:

**ESTRUCTURA GENERAL:**
- Número de uñas visibles y analizables:
- Forma de la uña: (square / oval / almendra / coffin / stiletto / squoval / ballerina)
- Tipo de producto: (acrílico esculpido / gel / tip con overlay / uña natural)
- Longitud aproximada: (corta / media / larga / extra larga)
- Observaciones técnicas generales:

**CURVATURA — C-CURVE:**
- Visibilidad desde esta perspectiva:
- Porcentaje estimado: (30% suave / 40% moderada / 50% pronunciada)
- ¿Es uniforme entre todas las uñas visibles?
- Confianza: ALTA / MEDIA / BAJA

**LATERALES (SIDEWALLS):**
- Visibilidad:
- Dirección: (rectos y paralelos / flaring hacia afuera / pinching hacia adentro)
- Simetría entre ambos lados:
- Confianza: ALTA / MEDIA / BAJA

**ÁPEX:**
- Visibilidad:
- Posición: (anterior — cerca punta / central / posterior — cerca cutícula)
- Definición: (marcado y bien construido / suave / apenas perceptible / plano)
- ¿Es uniforme entre todas las uñas?
- Confianza: ALTA / MEDIA / BAJA

**LÍNEA DE SONRISA (SMILE LINE):**
- ¿Hay francesa? Si no: "No aplica"
- Si aplica: visibilidad, definición, simetría, uniformidad entre uñas
- Confianza: ALTA / MEDIA / BAJA

**ZONA DE ESTRÉS:**
- Visibilidad:
- Grosor aparente en la zona de estrés:
- ¿Parece reforzada correctamente o hay riesgo de rotura?
- Confianza: ALTA / MEDIA / BAJA

**ERRORES TÉCNICOS DETECTADOS:**
- Lista SOLO errores claramente visibles. Si no hay: "No se detectan errores visibles."
- Evalúa: ápex mal posicionado, flaring en laterales, C-curve inexistente o excesiva, longitud desigual, zona de estrés débil, forma asimétrica, free edge desnivelado.

**CONCLUSIÓN TÉCNICA:**
- Valoración global: (Excelente / Buena / Mejorable / Deficiente)
- Puntos fuertes:
- Puntos a corregir:

**LIMITACIONES DEL ANÁLISIS:**
- Qué no se pudo analizar y por qué (ángulo, luz, resolución). Obligatorio aunque sea breve.
`
              },
              {
                type: "input_image",
                image_url: image_url
              }
            ]
          }
        ],
        max_output_tokens: 1500
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
Technical nail diagram. Side view of a sculpted acrylic nail with clean red annotation arrows and white label boxes pointing to: apex, sidewalls, C-curve, stress zone. Clinical professional style on white background. No hands, no skin, only the nail structure with technical labels in English.
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

