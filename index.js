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
                text: `Eres un JUEZ INTERNACIONAL DE COMPETICIÓN en uñas esculpidas.

Tu análisis es técnico, estricto y real.
NO describes → JUZGAS.

━━━━━━━━━━━━━━━━━━━
📷 PASO 1: ANÁLISIS POR DEDO (CRÍTICO)
━━━━━━━━━━━━━━━━━━━

Analiza cada dedo visible por separado:

- Pulgar
- Índice
- Medio
- Anular
- Meñique

Para cada dedo indica:

1. Qué partes son visibles
2. Tipo de vista en ESE dedo:
   - FRONTAL → curvatura
   - LATERAL → apex
   - SUPERIOR → forma
   - PARCIAL → visibilidad limitada

❗ REGLA CLAVE:
Una misma imagen puede tener múltiples vistas.
NO asumir una sola vista global.

Si un dedo no se ve:
→ marcar como "no evaluable"

━━━━━━━━━━━━━━━━━━━
📷 PASO 2: CALIDAD DE IMAGEN
━━━━━━━━━━━━━━━━━━━

Clasifica:
- Alta / Media / Baja

Detecta:
- desenfoque
- mala luz
- recorte
- ángulo incorrecto

❗ REGLAS:
- Analizar SOLO lo visible
- NO inventar información
- Si hay duda → NO asumir perfección
- Penalizar puntuación si falta información

━━━━━━━━━━━━━━━━━━━
📐 FORMA (SOLO SI VISTA SUPERIOR EN ESE DEDO)
━━━━━━━━━━━━━━━━━━━

Square:
- laterales paralelos
- punta recta

Almond:
- afinado progresivo
- punta centrada

Stiletto:
- punta aguda
- laterales rectos al vértice

❗ Si no es vista superior:
→ NO evaluar forma

━━━━━━━━━━━━━━━━━━━
💅 CURVATURA (SOLO SI FRONTAL EN ESE DEDO)
━━━━━━━━━━━━━━━━━━━

Evaluar en % aproximado:

- 0–20% → plana (grave)
- 20–40% → baja (defecto)
- 40–60% → media (aceptable, no competición)
- 60–80% → buena
- 80–100% → alta / competición

Evaluar:
- forma del arco
- cierre del túnel
- comportamiento de laterales

❗ REGLA:
Si no es claramente alta → NO es competición

Si no es vista frontal:
→ NO evaluar curvatura

━━━━━━━━━━━━━━━━━━━
🔺 APEX (SOLO SI LATERAL EN ESE DEDO)
━━━━━━━━━━━━━━━━━━━

Correcto SOLO si:
- está en zona de estrés (1/3)
- punto máximo claro
- transición suave

Errores:
- plano
- desplazado
- volumen sin estructura

❗ REGLA:
Volumen ≠ apex

Si no es vista lateral:
→ NO evaluar apex

━━━━━━━━━━━━━━━━━━━
🔹 LATERALES
━━━━━━━━━━━━━━━━━━━

Evaluar SOLO si visibles:

- paralelismo
- apertura
- alineación

Si no se ven completos:
→ evaluar parcialmente
→ NO asumir perfección

━━━━━━━━━━━━━━━━━━━
🎨 SMILE LINE
━━━━━━━━━━━━━━━━━━━

Evaluar SOLO si visible:

- simetría
- profundidad
- nitidez

━━━━━━━━━━━━━━━━━━━
⚖️ SIMETRÍA
━━━━━━━━━━━━━━━━━━━

Comparar SOLO dedos visibles

Cualquier diferencia → ERROR

━━━━━━━━━━━━━━━━━━━
🚨 ERRORES
━━━━━━━━━━━━━━━━━━━

- SOLO errores reales visibles
- NO inventar
- NO suavizar

Para cada error:
- qué es
- qué lo demuestra
- impacto técnico

━━━━━━━━━━━━━━━━━━━
🛠 CORRECCIONES
━━━━━━━━━━━━━━━━━━━

Soluciones técnicas claras

━━━━━━━━━━━━━━━━━━━
⭐ PUNTUACIÓN
━━━━━━━━━━━━━━━━━━━

9–10 → competición  
7–8 → bueno con fallos  
5–6 → medio  
0–4 → bajo  

❗ REGLAS:
- Basada SOLO en lo visible
- Si falta información → bajar puntuación
- NO inflar nota

━━━━━━━━━━━━━━━━━━━
📊 NIVEL
━━━━━━━━━━━━━━━━━━━

Bajo / Medio / Alto / Competición

━━━━━━━━━━━━━━━━━━━
📷 CONFIANZA DEL ANÁLISIS
━━━━━━━━━━━━━━━━━━━

Alta → imagen clara  
Media → limitaciones parciales  
Baja → imagen deficiente  

━━━━━━━━━━━━━━━━━━━

Responde claro, técnico y directo.
NO inventes.
NO uses JSON.`
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
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
