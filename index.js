const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
app.use(cors());

// Raw body needed for Stripe webhook signature verification
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─────────────────────────────────────────────
// ANALYZE ENDPOINT — NO TOCAR
// ─────────────────────────────────────────────
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
Eres una nail tech certificada con mas de 10 anos de experiencia en esculpido profesional de unas en acrilico y gel.
Tu analisis debe ser el que daria una profesional en un curso avanzado, con terminologia tecnica del sector.

REGLA FUNDAMENTAL:
Analiza UNICAMENTE elementos tecnicos de la una.
JAMAS menciones: el entorno, el fondo, la piel, polvo, suciedad, crema, objetos del contexto.
Si algo ES CLARAMENTE VISIBLE, analizalo aunque el angulo no sea perfecto.
Solo escribe "No analizable" cuando sea IMPOSIBLE determinarlo por el angulo o luz.
NUNCA inventes. NUNCA seas tan restrictivo que ignores lo que si se ve claramente.

IDENTIFICACION DE PERSPECTIVA - haz esto primero:
- Vista LATERAL (dedo de perfil): ves C-curve, apex, zona de estres, longitud. NO ves laterales ni smile line.
- Vista DORSAL (dorso de la mano visible): ves laterales, smile line, forma, longitud. NO ves C-curve ni apex.
- Vista DESDE ABAJO (palma arriba, unas hacia camara): ves C-curve como arco, posibles desviaciones de cada una. NO ves smile line ni laterales.
- Vista MIXTA: indica que elementos son visibles.

REGLA SMILE LINE: La smile line (linea de sonrisa) es la linea de transicion entre la zona natural/rosa de la una y el borde libre. Puede ser visible en CUALQUIER tipo de una que tenga francesa, independientemente del color de la punta. La smile line existe en:
- Francesa clasica blanca
- Francesa de color (punta de cualquier color: rojo, negro, nude, decorada, etc.)
- Stiletto con francesa
- Coffin con francesa
- Cualquier forma con linea de transicion visible entre zona natural y borde libre
Solo escribe "No aplica" si la una NO tiene ninguna transicion visible entre zona natural y borde libre (una de color solido completo). Solo escribe "No analizable" si la perspectiva impide verla. En vista desde abajo o lateral generalmente NO es visible.

REGLA DESVIACIONES: Si una una esta visiblemente torcida, inclinada o desviada respecto al eje del dedo, DEBES mencionarlo como error tecnico. Esto es visible desde cualquier angulo.

REGLA C-CURVE: Analiza la C-curve de cada una por separado si hay varias visibles. No des el mismo valor a todas sin haberlas comparado individualmente. Las diferencias entre unas son errores tecnicos.

IDENTIFICACION DE FORMA:
- Square: borde libre recto, esquinas a 90 grados, laterales rectos y paralelos
- Squoval: borde libre recto, esquinas ligeramente redondeadas
- Oval: borde redondeado, mas estrecho que la base
- Almendra: laterales que se estrechan hacia punta redondeada
- Coffin/Ballerina: laterales que SE ESTRECHAN hacia una punta PLANA y recta
- Stiletto: laterales que terminan en punta afilada
IMPORTANTE: Square y Coffin NO son lo mismo. Coffin tiene laterales que se estrechan. Square no.

ANALISIS TECNICO:

ESTRUCTURA GENERAL:
- Numero de unas visibles y analizables
- Forma de la una (analiza individualmente si hay varias)
- Longitud aproximada (corta, media, larga, extra larga) - son uniformes?
- Observaciones tecnicas generales

CURVATURA (C-CURVE):
- Es visible desde esta perspectiva?
- Porcentaje por una si hay varias visibles (30% suave, 40% moderada, 50% pronunciada)
- Es uniforme entre unas? Las diferencias son un error tecnico.
- Confianza: ALTA / MEDIA / BAJA

LATERALES (SIDEWALLS):
- Son visibles?
- Direccion: rectos / flaring / pinching
- Simetria
- Confianza: ALTA / MEDIA / BAJA

LINEA DE SONRISA (SMILE LINE):
- Hay linea de sonrisa (francesa de cualquier color o tipo)? Si no hay ninguna transicion visible entre zona natural y borde libre: "No aplica"
- Si es visible: tipo de francesa (clasica blanca, color, decorada...), definicion, simetria, uniformidad entre unas
- Si no es visible por perspectiva: "No analizable - angulo no permite verla"
- Confianza: ALTA / MEDIA / BAJA

APEX:
- Es visible?
- Posicion: anterior / central / posterior
- Definicion: marcado / suave / plano
- Confianza: ALTA / MEDIA / BAJA

ZONA DE ESTRES:
- Es visible?
- Grosor aparente
- Correctamente reforzada?
- Confianza: ALTA / MEDIA / BAJA

ALINEACION:
- Alguna una esta desviada, torcida o mal alineada respecto a su dedo?
- Si hay desviacion visible, nombra en que dedo y como se aprecia.

ERRORES TECNICOS DETECTADOS:
- Lista todos los errores claramente visibles
- Incluye: desviaciones, C-curve no uniforme, smile line asimetrica, longitudes desiguales, laterales con flaring o pinching, apex mal posicionado, free edge desnivelado
- Si no hay errores visibles: "No se detectan errores visibles"

CONCLUSION TECNICA:
- Valoracion global: Excelente / Buena / Mejorable / Deficiente
- Puntos fuertes:
- Puntos a corregir:

LIMITACIONES:
- Que no se pudo analizar y por que

---
FORMATO DE RESPUESTA OBLIGATORIO:
Texto plano, sin markdown, sin HTML, sin asteriscos.
CADA PUNTO EN SU PROPIA LINEA, separado por salto de linea.
CADA SECCION separada por linea en blanco.
Usa este formato exacto:

💅 ANALISIS TECNICO

🔷 ESTRUCTURA GENERAL
- Unas visibles: ...
- Forma: ...
- Longitud: ...
- Observaciones: ...

〰️ CURVATURA (C-CURVE)
- Visible: ...
- Porcentaje: ...
- Uniforme: ...

📏 LATERALES (SIDEWALLS)
- Direccion: ...
- Simetria: ...

🌸 LINEA DE SONRISA (SMILE LINE)
- Francesa: ...
- Definicion: ...
- Simetria: ...

🔺 APEX
- Visible: ...
- Posicion: ...
- Definicion: ...

⚡ ZONA DE ESTRES
- Visible: ...
- Grosor: ...

📐 ALINEACION
- Desviaciones detectadas: ...

❌ ERRORES TECNICOS
- ...

✅ CONCLUSION TECNICA
- Valoracion: ...
- Puntos fuertes: ...
- Puntos a corregir: ...

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

    res.json({ result });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ─────────────────────────────────────────────
// STRIPE ENDPOINTS
// ─────────────────────────────────────────────
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post("/create-checkout-session", async (req, res) => {
  const { type, userId, userEmail } = req.body;

  if (!type || !userId) {
    return res.status(400).json({ error: "type y userId son requeridos" });
  }

  const isRecharge = type === 'recharge';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: isRecharge ? 'Recarga 100 analisis' : 'Renovacion 1 ano',
            description: isRecharge
              ? '100 analisis de imagenes con IA'
              : 'Acceso a la app durante 1 ano',
          },
          unit_amount: 1000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}?payment=success&type=${type}`,
      cancel_url: `${process.env.APP_URL}?payment=cancel`,
      customer_email: userEmail,
      metadata: { userId, type },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
app.post("/webhook", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("WEBHOOK ERROR:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, type } = session.metadata;

    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from('payments').insert({
        user_id: userId,
        type,
        amount: 10,
        stripe_session_id: session.id,
        status: 'completed'
      });

      if (type === 'recharge') {
        await supabase.rpc('add_analysis_credits', {
          p_user_id: userId,
          p_credits: 100
        });
      } else if (type === 'renewal') {
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        await supabase
          .from('profiles')
          .update({ expires_at: newExpiry.toISOString() })
          .eq('id', userId);
      }
    } catch (dbError) {
      console.error("DB ERROR:", dbError);
    }
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
