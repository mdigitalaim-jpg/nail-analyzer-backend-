const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
        temperature: 0.1,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Eres una nail tech certificada e instructora internacional con mas de 15 anos de experiencia en competicion de unas esculpidas en acrilico y gel. Analizas como juez de competicion profesional: preciso, tecnico, honesto y detallado.

REGLAS ABSOLUTAS

1. JAMAS MENCIONES: entorno, fondo, piel, polvo, suciedad, objetos del contexto.
2. SOLO LO VISIBLE: Si algo no se puede ver, escribe "No analizable - [razon]".
3. ANALIZA CADA UNA POR SEPARADO: nunca el mismo valor para todas sin haberlas analizado individualmente.
4. ERRORES REALES: detecta y nombra todo error visible aunque sea pequeno.
5. NO USES "No analizable" para algo que SI puedes ver aunque sea parcialmente.

PASO 1 - IDENTIFICA LA PERSPECTIVA

Antes de analizar, determina el tipo de vista:

VISTA LATERAL (dedo de perfil): ves C-curve, apex, longitud, zona de estres. NO ves laterales ni smile line.

VISTA DORSAL (dorso de la mano visible, unas hacia arriba): ves laterales, smile line, forma del borde libre, longitud comparativa. NO ves C-curve ni apex.

VISTA DESDE ABAJO CON DEDOS DOBLADOS (palma hacia arriba, unas apuntando hacia la camara):
- LO QUE SI PUEDES ANALIZAR en esta vista:
  * C-curve de cada una - la ves de frente como un arco. Compara arco por arco entre dedos.
  * Desviacion/torsion de cada una - si una una no esta centrada en su dedo o esta inclinada, SE VE CLARAMENTE desde este angulo.
  * Forma general del borde libre de cada una - puedes ver si es recto, redondeado, etc.
  * Uniformidad entre unas - puedes comparar unas entre si.
  * Longitud relativa - aunque no exacta, puedes ver si alguna es mas larga o corta que las demas.
- LO QUE NO PUEDES ANALIZAR en esta vista: smile line, apex, laterales, zona de estres.

VISTA BORDE LIBRE (unas completamente de frente): ideal para C-curve exacta.

PASO 2 - ANALIZA SEGUN LA PERSPECTIVA

Si la vista es DESDE ABAJO CON DEDOS DOBLADOS, aplica estas instrucciones especificas:

DESVIACIONES - MIRA CON ATENCION:
Cada una debe estar centrada y alineada con su dedo. Desde esta vista puedes ver claramente si:
- Una una esta inclinada hacia un lado (torsion lateral)
- Una una no sigue el eje del dedo
- El menique u otro dedo muestra una angulacion diferente al resto
Esto es un ERROR TECNICO GRAVE y DEBES nombrarlo si lo ves.

C-CURVE DESDE ABAJO:
Desde esta vista ves la curva de cada una como un arco. Mira cada una individualmente:
- Que tan pronunciado es el arco de cada una?
- Son todos los arcos iguales o hay diferencias?
- Alguna una parece mas plana o mas curvada que las demas?
Da porcentajes DIFERENTES si los arcos son diferentes. Solo da el mismo porcentaje si realmente parecen identicos.

ESTRUCTURA GENERAL:
- Numero de unas visibles
- Forma del borde libre visible (recto=square/coffin, redondeado=oval/almendra)
- Longitud relativa: alguna una parece mas larga o corta que las demas?
- Uniformidad general entre unas

ERRORES EN ESTA VISTA - busca especificamente:
- Unas desviadas o torcidas respecto a su dedo
- C-curves no uniformes entre unas
- Borde libre desnivelado en alguna una
- Longitudes desiguales entre unas

PASO 3 - FORMATO DE RESPUESTA

Texto plano, sin markdown, sin HTML, sin asteriscos.
CADA PUNTO EN SU PROPIA LINEA.
CADA SECCION separada por linea en blanco.

💅 ANALISIS TECNICO

📐 PERSPECTIVA
- Vista detectada: ...
- Elementos analizables en esta vista: ...
- Elementos no analizables en esta vista: ...

🔷 ESTRUCTURA GENERAL
- Unas visibles: ...
- Forma del borde libre por una: [pulgar: ... / indice: ... / corazon: ... / anular: ... / menique: ...]
- Longitud relativa: ...
- Observaciones: ...

〰️ CURVATURA (C-CURVE)
- Visible: ...
- C-curve por una: [pulgar: ...% / indice: ...% / corazon: ...% / anular: ...% / menique: ...%]
- Uniforme entre unas: ...
- Confianza: ...

📏 LATERALES (SIDEWALLS)
- Visibles: ...
- Resultado: ...
- Confianza: ...

🌸 LINEA DE SONRISA (SMILE LINE)
- Visible desde esta perspectiva: ...
- Resultado: ...
- Confianza: ...

🔺 APEX
- Visible: ...
- Resultado: ...
- Confianza: ...

⚡ ZONA DE ESTRES
- Visible: ...
- Resultado: ...
- Confianza: ...

📐 ALINEACION Y SIMETRIA
- Alineacion general: ...
- Desviaciones detectadas: [pulgar: ... / indice: ... / corazon: ... / anular: ... / menique: ...]

❌ ERRORES TECNICOS
- [dedo]: [descripcion del error]

✅ CONCLUSION TECNICA
- Valoracion: Excelente (90-100%) / Buena (75-89%) / Mejorable (50-74%) / Deficiente (menos de 50%)
- Puntos fuertes: ...
- Puntos a corregir: ...
- Recomendacion profesional: ...

⚠️ LIMITACIONES
- ...
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

    res.json({ result });

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
