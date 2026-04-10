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
2. JAMÁS menciones el entorno, el fondo, objetos ajenos a la uña, la piel en general, ni el contexto de la imagen.
3. JAMÁS menciones si hay polvo, suciedad, crema, o condición de la piel — eso no es análisis de uñas.
4. Si un elemento técnico NO es visible por el ángulo o la luz, escribe exactamente: "No analizable — [motivo]". Nunca inventes.
5. El análisis debe ser el que daría una profesional en un curso avanzado de uñas, no una descripción casual.
6. Usa terminología técnica del sector: C-curve, ápex, laterales, free edge, zona de estrés, tabla, placa ungueal, etc.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen de uñas con el siguiente formato técnico estricto. 
Antes de empezar, identifica la perspectiva de la imagen (lateral, dorsal, borde libre, mixta) 
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
- Forma de la uña (square, oval, almendra, coffin, stiletto, squoval, ballerina...):
- Tipo de producto: (acrílico esculpido / gel / tip con overlay / uña natural / otro)
- Longitud aproximada (corta / media / larga / extra larga):
- Observaciones técnicas generales:

**CURVATURA — C-CURVE:**
- Visibilidad desde esta perspectiva:
- Porcentaje estimado: (30% suave / 40% moderada / 50% pronunciada / otro)
- Uniformidad entre uñas visibles:
- Confianza: ALTA / MEDIA / BAJA
- Justificación si confianza baja:

**LATERALES (SIDEWALLS):**
- Visibilidad desde esta perspectiva:
- Dirección: (rectos y paralelos / flaring hacia afuera / pinching hacia adentro)
- Simetría entre ambos lados:
- Confianza: ALTA / MEDIA / BAJA

**ÁPEX:**
- Visibilidad desde esta perspectiva:
- Posición: (anterior — cerca de la punta / central / posterior — cerca cutícula)
- Definición: (marcado y bien construido / suave / apenas perceptible / plano)
- Uniformidad entre uñas:
- Confianza: ALTA / MEDIA / BAJA

**LÍNEA DE SONRISA (SMILE LINE):**
- ¿Hay francesa? (Sí / No — si No: escribe "No aplica")
- Si aplica: visibilidad, definición, simetría, uniformidad entre uñas
- Confianza: ALTA / MEDIA / BAJA

**ZONA DE ESTRÉS:**
- Visibilidad:
- Grosor aparente en la zona de estrés:
- ¿Parece reforzada correctamente o hay riesgo de rotura?
- Confianza: ALTA / MEDIA / BAJA

**ERRORES TÉCNICOS DETECTADOS:**
- Lista SOLO errores claramente visibles. Si no los hay: "No se detectan errores visibles con la perspectiva actual."
- Posibles errores a evaluar: ápex mal posicionado, laterales con flaring, C-curve inexistente o excesiva, longitud desigual entre uñas, zona de estrés débil, forma asimétrica, free edge desnivelado, tabla incorrecta.

**CONCLUSIÓN TÉCNICA:**
- Valoración global de la calidad técnica: (Excelente / Buena / Mejorable / Deficiente)
- Puntos fuertes:
- Puntos a corregir:

---

**LIMITACIONES DEL ANÁLISIS:**
- Indica qué no se pudo analizar y por qué (ángulo, iluminación, resolución). Esta sección es obligatoria.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image_url,
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
          prompt: `Professional nail technician diagram. Nail close-up image with clean red annotation arrows and labels pointing to: apex position, sidewalls, C-curve, stress zone. White label boxes with black text. Clinical and professional style. No background, no hands, no skin — only the nail structure diagram with technical annotations in English. Based on this analysis: ${result.substring(0, 500)}`
        })
      });

      const imageData = await imageResponse.json();
      const rawImage = imageData.data?.[0]?.b64_json || imageData.data?.[0]?.url || null;
      annotatedImage = rawImage
        ? (rawImage.startsWith("data:") ? rawImage : rawImage.startsWith("http") ? rawImage : `data:image/png;base64,${rawImage}`)
        : null;
    } catch (imgErr) {
      console.warn("Advertencia: no se pudo generar imagen anotada:", imgErr.message);
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
