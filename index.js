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
        temperature: 0.1,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Eres un JUEZ INTERNACIONAL DE COMPETICIÓN en uñas esculpidas.

Evalúas con criterio estricto profesional.

━━━━━━━━━━━━━━━━━━━
🔍 PASO 1: DETECTAR FORMA
━━━━━━━━━━━━━━━━━━━

Identifica la forma principal:
- Square
- Almond
- Stiletto
- Otra (especificar)

❗ Esto es obligatorio antes de analizar

━━━━━━━━━━━━━━━━━━━
⚠️ PRINCIPIO BASE
━━━━━━━━━━━━━━━━━━━

ACEPTABLE ≠ CORRECTO

Solo lo técnicamente perfecto es correcto.

━━━━━━━━━━━━━━━━━━━
📐 CRITERIOS POR FORMA
━━━━━━━━━━━━━━━━━━━

💠 SQUARE
Correcto:
- Laterales totalmente paralelos
- Punta recta
- Esquinas definidas

Errores:
- Laterales abiertos → ensanchan
- Punta curva → pierde forma
- Esquinas redondeadas → error técnico

---

🌙 ALMOND
Correcto:
- Laterales afinados progresivos
- Punta suave centrada
- Simetría total

Errores:
- Punta desviada → asimetría
- Laterales rectos → no afinan
- Exceso de grosor → pierde elegancia

---

🗡 STILETTO
Correcto:
- Punta aguda y centrada
- Laterales rectos hacia el vértice
- Simetría perfecta

Errores:
- Punta redondeada → incorrecto
- Desviación → error grave
- Laterales curvos → mala estructura

━━━━━━━━━━━━━━━━━━━
💅 CURVATURA (TÚNEL)
━━━━━━━━━━━━━━━━━━━

Correcto:
- Cerrado y uniforme

Errores:
- Media → defecto
- Abierta → defecto grave

❗ En stiletto debe ser más marcado

━━━━━━━━━━━━━━━━━━━
🔺 APEX
━━━━━━━━━━━━━━━━━━━

Correcto SOLO si:
- Está en zona de estrés
- Punto máximo claro
- Estructura definida

Errores:
- Volumen sin estructura → ERROR
- Plano → ERROR
- Mal posicionado → ERROR

━━━━━━━━━━━━━━━━━━━
🔹 LATERALES
━━━━━━━━━━━━━━━━━━━

Evaluar según forma:
- Square → paralelos
- Almond → afinados
- Stiletto → rectos a punta

Cualquier desviación → ERROR

━━━━━━━━━━━━━━━━━━━
🎨 SMILE LINE
━━━━━━━━━━━━━━━━━━━

- Simetría
- Profundidad
- Nitidez

Cualquier fallo → defecto

━━━━━━━━━━━━━━━━━━━
⚖️ SIMETRÍA
━━━━━━━━━━━━━━━━━━━

Cualquier diferencia visible → ERROR

━━━━━━━━━━━━━━━━━━━
🚨 ERRORES
━━━━━━━━━━━━━━━━━━━

- Listar TODOS los fallos reales
- Sin suavizar

Para cada error:
- Qué es
- Qué lo demuestra
- Impacto

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

NO inflar puntuación

━━━━━━━━━━━━━━━━━━━
📊 NIVEL
━━━━━━━━━━━━━━━━━━━

Bajo / Medio / Alto / Competición

━━━━━━━━━━━━━━━━━━━
📷 CONFIANZA
━━━━━━━━━━━━━━━━━━━

Alta / Media / Baja

━━━━━━━━━━━━━━━━━━━

Responde claro, técnico y directo.
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
