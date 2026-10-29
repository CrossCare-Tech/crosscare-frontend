// What the guide and the patient say in the full-screen call preview. There is no microphone and no
// live voice yet (D-066), so the patient taps a suggestion and it is "spoken" as if transcribed; the
// guide's lines are read aloud by the reply player. Replies are short because they are spoken.

export type CallLang = "en" | "pt" | "es";
type Line = Record<CallLang, string>;

export type CallTopic = { id: string; chip: Line; said: Line; reply: Line; summary: Line };

const L = (en: string, pt: string, es: string): Line => ({ en, pt, es });

export const CALL_GREETING = (name: string): Line =>
  L(
    `Hi ${name}! I'm so glad you called. You're twenty-four weeks along. How are you feeling today?`,
    `Oi, ${name}! Que bom que você ligou. Você está com vinte e quatro semanas. Como você está se sentindo hoje?`,
    `¡Hola, ${name}! Qué bueno que llamaste. Estás en la semana veinticuatro. ¿Cómo te sientes hoy?`
  );

export const CALL_TOPICS: CallTopic[] = [
  {
    id: "tired",
    chip: L("I feel tired", "Estou cansada", "Me siento cansada"),
    said: L("I have been feeling really tired lately.", "Tenho me sentido muito cansada ultimamente.", "Me he sentido muy cansada últimamente."),
    reply: L(
      "That's very common in the second trimester. Try a short rest in the afternoon, drink water, and eat small snacks with protein. If the tiredness gets much worse, mention it to your provider.",
      "Isso é muito comum no segundo trimestre. Tente um descanso curto à tarde, beba água e faça lanches pequenos com proteína. Se o cansaço piorar muito, fale com o seu médico.",
      "Es muy común en el segundo trimestre. Prueba un descanso corto por la tarde, bebe agua y come meriendas pequeñas con proteína. Si el cansancio empeora mucho, díselo a tu proveedor."
    ),
    summary: L("feeling tired", "cansaço", "cansancio"),
  },
  {
    id: "back",
    chip: L("My back hurts", "Dor nas costas", "Me duele la espalda"),
    said: L("My lower back has been hurting a bit.", "Minhas costas têm doído um pouco.", "Me ha dolido un poco la espalda baja."),
    reply: L(
      "Back pain is common as your belly grows. A warm shower, gentle stretches and a pillow between your knees at night can help. I can show you a short stretch in the chat afterwards.",
      "Dor nas costas é comum conforme a barriga cresce. Um banho morno, alongamentos suaves e um travesseiro entre os joelhos à noite ajudam. Depois posso mostrar um alongamento curto no chat.",
      "El dolor de espalda es común a medida que crece el vientre. Una ducha tibia, estiramientos suaves y una almohada entre las rodillas por la noche ayudan. Después puedo mostrarte un estiramiento en el chat."
    ),
    summary: L("back pain", "dor nas costas", "dolor de espalda"),
  },
  {
    id: "kicks",
    chip: L("I felt a kick", "Senti um chute", "Sentí una patada"),
    said: L("I think I felt the baby kick today!", "Acho que senti o bebê chutar hoje!", "¡Creo que hoy sentí al bebé patear!"),
    reply: L(
      "What a special moment! Around twenty-four weeks the movements get stronger and more regular. From week twenty-eight you can start counting kicks. Ten movements in two hours is a good sign.",
      "Que momento especial! Por volta de vinte e quatro semanas os movimentos ficam mais fortes e regulares. A partir da semana vinte e oito você pode contar os chutes. Dez movimentos em duas horas é um bom sinal.",
      "¡Qué momento tan especial! Alrededor de las veinticuatro semanas los movimientos son más fuertes y regulares. Desde la semana veintiocho puedes contar las patadas. Diez movimientos en dos horas es buena señal."
    ),
    summary: L("the baby's kicks", "os chutes do bebê", "las patadas del bebé"),
  },
  {
    id: "worried",
    chip: L("I'm a bit worried", "Estou preocupada", "Estoy preocupada"),
    said: L("I'm feeling a bit worried about everything.", "Estou me sentindo um pouco preocupada com tudo.", "Me siento un poco preocupada por todo."),
    reply: L(
      "Thank you for telling me. Feeling worried sometimes is normal, and you don't have to carry it alone. Let's take one slow breath together. In for four, hold for four, and out for six. How does that feel?",
      "Obrigada por me contar. Sentir preocupação às vezes é normal, e você não precisa carregar isso sozinha. Vamos respirar devagar juntas. Inspire contando até quatro, segure quatro e solte em seis. Como foi?",
      "Gracias por contármelo. Sentir preocupación a veces es normal y no tienes que cargarla sola. Respiremos despacio juntas. Inhala contando cuatro, sostén cuatro y exhala en seis. ¿Cómo se siente?"
    ),
    summary: L("how you were feeling", "como você estava se sentindo", "cómo te sentías"),
  },
];

export const CALL_FALLBACK: Line = L(
  "Thank you for sharing that. I'm here with you. For anything urgent, please contact your provider.",
  "Obrigada por compartilhar. Estou aqui com você. Para algo urgente, procure o seu médico.",
  "Gracias por compartirlo. Estoy aquí contigo. Para algo urgente, contacta a tu proveedor."
);

export const CALL_FOLLOW_UP: Line = L(
  "Anything else on your mind?",
  "Mais alguma coisa em mente?",
  "¿Algo más en tu mente?"
);

export const callLang = (language?: string): CallLang => (language === "pt" || language === "es" ? language : "en");
