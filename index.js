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

REGLAS ABSOLUTAS:
1. Analiza EXCLUSIVAMENTE la estructura técnica de la uña. JAMÁS menciones el entorno, fondo, piel, polvo, objetos del contexto ni nada ajeno a la uña.
2. Si un elemento NO ES VISIBLE escribe: "No analizable — [motivo]". NUNCA inventes.
3. Usa terminología técnica: C-curve, ápex, laterales, free edge, zona de estrés, tabla, placa ungueal.
4. Nivel de análisis: curso avanzado de nail tech, no descripción casual.

PASO 0 — PERSPECTIVA:
- Tipo de vista detectada: (lateral / dorsal-frontal / borde libre / mixta)
- Elementos analizables:
- Elementos NO analizables:

ANÁLISIS TÉCNICO:

**ESTRUCTURA GENERAL:**
- Nº de uñas visibles:
- Forma: (square / oval / almendra / coffin / stiletto / squoval)
- Producto: (acrílico esculpido / gel / tip con overlay / natural)
- Longitud: (corta / media / larga / extra larga)
- Observaciones técnicas:

**C-CURVE:**
- Visibilidad:
- Porcentaje: (30% suave / 40% moderada / 50% pronunciada)
- Uniformidad entre uñas:
- Confianza: ALTA / MEDIA / BAJA

**LATERALES (SIDEWALLS):**
- Visibilidad:
- Dirección: (rectos / flaring / pinching)
- Simetría:
- Confianza: ALTA / MEDIA / BAJA

**ÁPEX:**
- Visibilidad:
- Posición: (anterior / central / posterior)
- Definición: (marcado / suave / plano)
- Uniformidad:
- Confianza: ALTA / MEDIA / BAJA

**SMILE LINE:**
- ¿Hay francesa? Si no: "No aplica"
- Si aplica: definición, simetría, uniformidad
- Confianza: ALTA / MEDIA / BAJA

**ZONA DE ESTRÉS:**
- Visibilidad:
- Grosor aparente:
- ¿Correctamente reforzada?
- Confianza: ALTA / MEDIA / BAJA

**ERRORES TÉCNICOS:**
- Solo errores claramente visibles. Si no hay: "No se detectan errores visibles."

**CONCLUSIÓN:**
- Valoración: (Excelente / Buena / Mejorable / Deficiente)
- Puntos fuertes:
- Puntos a corregir:

**LIMITACIONES:**
- Qué no se pudo analizar y por qué.
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
Base image: ${image_url}
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
