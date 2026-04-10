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

═══════════════════════════════════════════════
REGLA ABSOLUTA — ANTES DE ESCRIBIR CUALQUIER COSA:
═══════════════════════════════════════════════
Solo puedes afirmar algo si lo ves con claridad en la imagen.
Si no lo ves con claridad: escribe "No analizable — [motivo exacto]"
PROHIBIDO inventar, suponer, o rellenar con lógica lo que no ves visualmente.
PROHIBIDO escribir análisis de algo que esté tapado, fuera de foco, o no visible por el ángulo.

═══════════════════════════════════════════════
PASO 1 — IDENTIFICA LA PERSPECTIVA (hazlo antes de todo):
═══════════════════════════════════════════════

Mira la imagen y decide cuál es:

TIPO A — LATERAL: Los dedos se ven de perfil. Las uñas apuntan hacia un lado.
  → C-curve: SÍ visible (el arco que forma la uña vista de lado)
  → Ápex: SOLO si cada uña se ve individualmente y sin que otra la tape. Si los dedos están juntos y las uñas se superponen unas sobre otras, el ápex NO es analizable porque no puedes ver el perfil completo de cada uña por separado.
  → Laterales: NO visibles
  → Smile line: NO visible

TIPO B — DORSAL: Se ve el dorso de la mano. Las uñas miran hacia la cámara.
  → Laterales: SÍ visibles
  → Smile line: SÍ visible si hay francesa
  → C-curve: NO visible
  → Ápex: NO visible

TIPO C — BORDE LIBRE: La cámara apunta de frente a la punta de la uña (como mirar dentro de un tubo).
  → C-curve: SÍ visible, es la mejor vista para ello
  → Todo lo demás: NO visible

TIPO D — MIXTA: Indica qué partes se ven y de qué tipo.

═══════════════════════════════════════════════
PASO 2 — ANÁLISIS (usa exactamente este formato):
═══════════════════════════════════════════════

PERSPECTIVA DETECTADA:
- Tipo (A/B/C/D) y una frase describiendo lo que se ve en la imagen

ESTRUCTURA GENERAL:
- Cuántas uñas son visibles y analizables
- Forma: square / oval / almendra / coffin / stiletto / squoval
- Tipo: acrílico esculpido / tip con gel / gel puro / uña natural
- Longitud: corta / media / larga / extra larga
- Observaciones visibles relevantes

CURVATURA (C-CURVE):
- Tipo B (dorsal): escribe exactamente → "No analizable — la vista dorsal no permite ver el C-curve"
- Tipo A (lateral) o Tipo C (borde libre): describe el arco visible
  · Porcentaje estimado: 30% plana/suave · 40% moderada · 50% pronunciada/cerrada
  · ¿Es uniforme en todas las uñas visibles?
  · Confianza: ALTA / MEDIA / BAJA + motivo si no es ALTA

LATERALES:
- Tipo A (lateral): escribe exactamente → "No analizable — se necesita vista dorsal"
- Tipo B (dorsal): describe lo que ves
  · ¿Son rectos y paralelos al eje del dedo?
  · ¿Van hacia arriba (flaring), hacia abajo, o rectos?
  · ¿Son simétricos ambos lados?
  · Confianza: ALTA / MEDIA / BAJA + motivo si no es ALTA

LÍNEA DE SONRISA (SMILE LINE):
- Si no hay francesa: escribe exactamente → "No aplica — no es francesa"
- Si hay francesa y es vista B (dorsal):
  · ¿Está bien definida o difuminada?
  · ¿Es simétrica (ambos lados iguales)?
  · Si hay varias uñas: ¿coincide la forma y altura entre ellas?
  · Confianza: ALTA / MEDIA / BAJA + motivo si no es ALTA
- Si hay francesa pero la vista no permite verla: "No analizable — [motivo]"

ÁPEX:
- Tipo B (dorsal): escribe exactamente → "No analizable — la vista dorsal no muestra el perfil volumétrico"
- Tipo A (lateral) con dedos juntos y uñas superpuestas: escribe exactamente → "No analizable — las uñas se superponen entre sí y no se puede ver el perfil individual de cada una"
- Tipo A (lateral) con uñas individuales claramente visibles:
  · Posición: anterior (cerca punta) / central / posterior (cerca cutícula)
  · ¿Está bien marcado o es suave?
  · ¿Es uniforme en todas las uñas?
  · Confianza: ALTA / MEDIA / BAJA + motivo si no es ALTA

ERRORES TÉCNICOS DETECTADOS:
- Solo errores CLARAMENTE visibles. Si no hay ninguno: "No se detectan errores visibles desde esta perspectiva"
- No escribas errores que no puedas ver directamente

LIMITACIONES DEL ANÁLISIS:
- Lista qué no se pudo analizar y el motivo exacto (perspectiva, uñas tapadas, luz, sombra, resolución)
- Esta sección es siempre obligatoria
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
