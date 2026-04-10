const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Convierte una URL de imagen a base64
async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";
  return {
    base64: buffer.toString("base64"),
    mediaType: contentType.split(";")[0]
  };
}

app.post("/analyze", async (req, res) => {
  const { image_url } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: "image_url es requerido" });
  }

  try {
    // Convertir imagen a base64 para evitar bloqueos de moderación por URL
    const { base64, mediaType } = await urlToBase64(image_url);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.1,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: `Eres una nail tech certificada con más de 10 años de experiencia en esculpido de uñas en acrílico y gel.
Tu función es realizar análisis técnicos exhaustivos y profesionales de uñas esculpidas.

REGLAS ABSOLUTAS:
1. Analiza SOLO elementos técnicos de la uña: estructura, forma, curvatura, ápex, laterales, longitud, línea de sonrisa si aplica, y errores técnicos.
2. JAMÁS menciones el entorno, el fondo, objetos ajenos a la uña, la piel, polvo ni el contexto de la imagen.
3. Si un elemento técnico NO es visible por el ángulo o la luz, escribe exactamente: "No analizable — [motivo]". Nunca inventes.
4. Usa terminología técnica del sector: C-curve, ápex, laterales, free edge, zona de estrés, tabla, placa ungueal, etc.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen de uñas con el siguiente formato técnico estricto.
Antes de empezar, identifica la perspectiva (lateral, dorsal, borde libre, mixta)
porque eso determina qué elementos son analizables.

---

### PERSPECTIVA DE LA IMAGEN
- Tipo de vista detectada:
- Elementos analizables desde esta perspectiva:
- Elementos NO analizables desde esta perspectiva:

---

### ANÁLISIS TÉCNICO

**ESTRUCTURA GENERAL:**
- Número de uñas visibles y analizables:
- Forma de la uña:
- Tipo de producto: (acrílico esculpido / gel / tip con overlay / uña natural / otro)
- Longitud aproximada:
- Observaciones técnicas generales:

**CURVATURA — C-CURVE:**
- Visibilidad desde esta perspectiva:
- Porcentaje estimado: (30% suave / 40% moderada / 50% pronunciada)
- Uniformidad entre uñas visibles:
- Confianza: ALTA / MEDIA / BAJA

**LATERALES (SIDEWALLS):**
- Visibilidad:
- Dirección: (rectos / flaring hacia afuera / pinching hacia adentro)
- Simetría:
- Confianza: ALTA / MEDIA / BAJA

**ÁPEX:**
- Visibilidad:
- Posición: (anterior / central / posterior)
- Definición: (marcado / suave / plano)
- Uniformidad entre uñas:
- Confianza: ALTA / MEDIA / BAJA

**LÍNEA DE SONRISA (SMILE LINE):**
- ¿Hay francesa? Si no: "No aplica"
- Si aplica: visibilidad, definición, simetría
- Confianza: ALTA / MEDIA / BAJA

**ZONA DE ESTRÉS:**
- Visibilidad:
- Grosor aparente:
- ¿Parece reforzada correctamente?
- Confianza: ALTA / MEDIA / BAJA

**ERRORES TÉCNICOS DETECTADOS:**
- Lista solo errores claramente visibles. Si no hay: "No se detectan errores visibles."

**CONCLUSIÓN TÉCNICA:**
- Valoración global: (Excelente / Buena / Mejorable / Deficiente)
- Puntos fuertes:
- Puntos a corregir:

---

**LIMITACIONES DEL ANÁLISIS:**
- Qué no se pudo analizar y por qué.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64}`,
                  detail: "high"
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Error OpenAI", details: data });
    }

    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      console.error("RESPUESTA VACÍA:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Respuesta vacía de OpenAI" });
    }

    // Segunda llamada: imagen anotada con DALL-E
    let annotatedImage = null;
    try {
      const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          size: "1024x1024",
          quality: "medium",
          prompt: `Technical nail diagram. Side view of a sculpted acrylic nail with clean red annotation arrows and white label boxes pointing to: apex, sidewalls, C-curve, stress zone. Clinical professional style on white background. No hands, no skin, only the nail structure with technical labels in English.`
        })
      });

      const imageData = await imageResponse.json();
      const rawImage = imageData.data?.[0]?.b64_json || imageData.data?.[0]?.url || null;
      annotatedImage = rawImage
        ? (rawImage.startsWith("data:") ? rawImage : rawImage.startsWith("http") ? rawImage : `data:image/png;base64,${rawImage}`)
        : null;
    } catch (imgErr) {
      console.warn("Imagen anotada no disponible:", imgErr.message);
    }

    res.json({
      result,
      image: annotatedImage
    });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
