const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    const chunks = [];
    req.on('data', (chunk) => { chunks.push(chunk); });
    req.on('end', () => { req.rawBody = Buffer.concat(chunks); next(); });
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PROMPT_ES = `
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
`;

const PROMPT_EN = `
You are a certified nail tech with over 10 years of experience in professional acrylic and gel nail sculpting.
Your analysis must be the one a professional would give in an advanced course, using technical terminology of the sector.

FUNDAMENTAL RULE:
Analyse ONLY technical elements of the nail.
NEVER mention: the environment, background, skin, dust, dirt, cream, or context objects.
If something IS CLEARLY VISIBLE, analyse it even if the angle is not perfect.
Only write "Not analysable" when it is IMPOSSIBLE to determine due to angle or light.
NEVER invent. NEVER be so restrictive that you ignore what is clearly visible.

PERSPECTIVE IDENTIFICATION - do this first:
- LATERAL view (finger in profile): you can see C-curve, apex, stress zone, length. You CANNOT see sidewalls or smile line.
- DORSAL view (back of hand visible): you can see sidewalls, smile line, shape, length. You CANNOT see C-curve or apex.
- FROM BELOW view (palm up, nails toward camera): you can see C-curve as an arc, possible deviations of each nail. You CANNOT see smile line or sidewalls.
- MIXED view: indicate which elements are visible.

SMILE LINE RULE: The smile line is the transition line between the natural/pink area of the nail and the free edge. It can be visible on ANY type of nail that has a french, regardless of the tip colour. The smile line exists in:
- Classic white french
- Coloured french (tip of any colour: red, black, nude, decorated, etc.)
- Stiletto with french
- Coffin with french
- Any shape with a visible transition between natural area and free edge
Only write "Not applicable" if the nail has NO visible transition between natural area and free edge (solid colour nail). Only write "Not analysable" if the perspective prevents seeing it. In below or lateral views it is generally NOT visible.

DEVIATIONS RULE: If a nail is visibly twisted, tilted or deviated from the finger axis, you MUST mention it as a technical error. This is visible from any angle.

C-CURVE RULE: Analyse the C-curve of each nail separately if several are visible. Do not give the same value to all without having compared them individually. Differences between nails are technical errors.

SHAPE IDENTIFICATION:
- Square: straight free edge, 90-degree corners, straight parallel sidewalls
- Squoval: straight free edge, slightly rounded corners, straight sidewalls
- Oval: rounded free edge, narrower than the base
- Almond: sidewalls that taper toward a rounded tip
- Coffin/Ballerina: sidewalls that TAPER toward a FLAT straight tip
- Stiletto: sidewalls ending in a sharp point
IMPORTANT: Square and Coffin are NOT the same. Coffin has tapering sidewalls. Square does not.

TECHNICAL ANALYSIS:

GENERAL STRUCTURE:
- Number of nails visible and analysable
- Shape of each nail (analyse individually if several)
- Approximate length (short, medium, long, extra long) - are they uniform?
- General technical observations

CURVATURE (C-CURVE):
- Is it visible from this perspective?
- Percentage per nail if several visible (30% gentle, 40% moderate, 50% pronounced)
- Is it uniform across nails? Differences are a technical error.
- Confidence: HIGH / MEDIUM / LOW

SIDEWALLS:
- Are they visible?
- Direction: straight / flaring / pinching
- Symmetry
- Confidence: HIGH / MEDIUM / LOW

SMILE LINE:
- Is there a smile line (french of any colour or type)? If there is no visible transition between natural area and free edge: "Not applicable"
- If visible: type of french (classic white, coloured, decorated...), definition, symmetry, uniformity across nails
- If not visible due to perspective: "Not analysable - angle does not allow viewing"
- Confidence: HIGH / MEDIUM / LOW

APEX:
- Is it visible?
- Position: anterior / central / posterior
- Definition: well defined / soft / flat
- Confidence: HIGH / MEDIUM / LOW

STRESS ZONE:
- Is it visible?
- Apparent thickness
- Correctly reinforced?
- Confidence: HIGH / MEDIUM / LOW

ALIGNMENT:
- Is any nail deviated, twisted or misaligned relative to its finger?
- If a visible deviation exists, name which finger and how it appears.

TECHNICAL ERRORS DETECTED:
- List ALL clearly visible errors
- Include: deviations, non-uniform C-curve, asymmetric smile line, unequal lengths, sidewalls with flaring or pinching, mispositioned apex, uneven free edge
- If no errors visible: "No visible errors detected"

TECHNICAL CONCLUSION:
- Overall assessment: Excellent / Good / Needs improvement / Poor
- Strengths:
- Points to correct:

LIMITATIONS:
- What could not be analysed and why

---
MANDATORY RESPONSE FORMAT:
Plain text, no markdown, no HTML, no asterisks.
EACH POINT ON ITS OWN LINE, separated by line break.
EACH SECTION separated by blank line.
Use this exact format:

💅 TECHNICAL ANALYSIS

🔷 GENERAL STRUCTURE
- Nails visible: ...
- Shape: ...
- Length: ...
- Observations: ...

〰️ CURVATURE (C-CURVE)
- Visible: ...
- Percentage: ...
- Uniform: ...

📏 SIDEWALLS
- Direction: ...
- Symmetry: ...

🌸 SMILE LINE
- French: ...
- Definition: ...
- Symmetry: ...

🔺 APEX
- Visible: ...
- Position: ...
- Definition: ...

⚡ STRESS ZONE
- Visible: ...
- Thickness: ...

📐 ALIGNMENT
- Deviations detected: ...

❌ TECHNICAL ERRORS
- ...

✅ TECHNICAL CONCLUSION
- Assessment: ...
- Strengths: ...
- Points to correct: ...

⚠️ LIMITATIONS
- ...
`;

app.post("/analyze", async (req, res) => {
  const { image_url, language } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: "image_url es requerido" });
  }

  const prompt = language === 'en' ? PROMPT_EN : PROMPT_ES;

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
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image_url }
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
      data.output?.flatMap(o => o.content?.map(c => c.text || "")).join("") ||
      "";

    result = result.trim();
    if (!result) {
      return res.status(500).json({ error: "Respuesta vacía" });
    }

    res.json({ result });

  } catch (error) {
    console.error("FATAL:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/create-checkout-session", async (req, res) => {
  const { type, userId, userEmail } = req.body;
  if (!type || !userId) {
    return res.status(400).json({ error: "type y userId son requeridos" });
  }
  const prices = { initial: 4800, recharge: 1000, renewal: 1000 };
  const names = {
    initial: 'Acceso inicial - Nails Training',
    recharge: 'Recarga 100 analisis',
    renewal: 'Renovacion 1 ano',
  };
  const descriptions = {
    initial: 'Acceso completo a la app durante 1 ano + 100 analisis de imagenes con IA',
    recharge: '100 analisis de imagenes con IA',
    renewal: 'Acceso a la app durante 1 ano adicional',
  };
  const amount = prices[type] || 1000;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: names[type] || type, description: descriptions[type] || '' },
          unit_amount: amount,
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

app.post("/webhook", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("WEBHOOK SIGNATURE ERROR:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
  console.log("WEBHOOK EVENT RECEIVED:", event.type);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, type } = session.metadata;
    console.log("PROCESSING PAYMENT:", { userId, type });
    const supabase = getSupabase();
    try {
      const { error: insertError } = await supabase.from('payments').insert({
        user_id: userId, type, amount: session.amount_total / 100,
        stripe_session_id: session.id, status: 'completed'
      });
      if (insertError) console.error("INSERT ERROR:", insertError);
      else console.log("PAYMENT INSERTED OK");

      if (type === 'initial') {
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        const { error: approveError } = await supabase.from('profiles')
          .update({ approved: true, analysis_credits: 100, expires_at: newExpiry.toISOString() })
          .eq('id', userId);
        if (approveError) console.error("APPROVE ERROR:", approveError);
        else console.log("USER APPROVED AND CREDITS SET OK");
      } else if (type === 'recharge') {
        const { error: rpcError } = await supabase.rpc('add_analysis_credits', { p_user_id: userId, p_credits: 100 });
        if (rpcError) console.error("RPC ERROR:", rpcError);
        else console.log("CREDITS ADDED OK");
      } else if (type === 'renewal') {
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        const { error: updateError } = await supabase.from('profiles')
          .update({ expires_at: newExpiry.toISOString() }).eq('id', userId);
        if (updateError) console.error("UPDATE ERROR:", updateError);
        else console.log("RENEWAL UPDATED OK");
      }
    } catch (dbError) {
      console.error("DB ERROR:", dbError);
    }
  }
  res.json({ received: true });
});

app.get("/", (req, res) => { res.send("Servidor funcionando"); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
