// Text the demo backend hands out: badge names and canned Doula replies standing in for the RAG service.

export const BADGE_TEXT: Record<string, { title: string; description: string }> = {
  HYDRATED_QUEEN: { title: "Hydrated Queen", description: "Logged water for the first time" },
  SNAPSHOT: { title: "Snapshot Queen", description: "Added the first photo to the journal" },
  HEART_SCRIBE: { title: "Heart Scribe", description: "Wrote the first journal note" },
  RESTED_DIVA: { title: "Rested Diva", description: "Logged sleep for the first time" },
  EXPLORER: { title: "Explorer", description: "Visited every part of the app" },
  GETTING_TO_KNOW_YOU: { title: "Getting to Know You", description: "Finished the first questionnaire domain" },
  WATER_WIZARD_I: { title: "Water Wizard I", description: "Met the water goal 7 days in a row" },
  SLEEP_WIZARD_I: { title: "Sleep Wizard I", description: "Logged sleep 7 days in a row" },
  HEALTH_QUEEN_I: { title: "Health Queen I", description: "Logged every vital for a week" },
};

type Lang = "en" | "pt" | "es";

const TOPICS: { match: RegExp; reply: Record<Lang, string> }[] = [
  {
    match: /\b(bleed|bleeding|sangr|severe pain|dor forte|dolor fuerte|can't breathe|vision|vis[aã]o)\b/i,
    reply: {
      en: "This could need attention right away. **Call your provider or 911 now** if you have heavy bleeding, severe pain, trouble breathing or changes in your vision. I'm here with you, but please don't wait on this one.",
      pt: "Isso pode precisar de atenção imediata. **Ligue para o seu médico ou para a emergência agora** se tiver sangramento forte, dor intensa, falta de ar ou alteração na visão. Estou aqui com você, mas não espere para buscar ajuda.",
      es: "Esto podría necesitar atención inmediata. **Llama a tu proveedor o al 911 ahora** si tienes sangrado abundante, dolor intenso, dificultad para respirar o cambios en la visión.",
    },
  },
  {
    match: /(nause|enjo|v[oô]mit|sick)/i,
    reply: {
      en: "Nausea is really common, even in the second trimester. A few things that help many moms:\n\n- **Small, frequent snacks** (crackers before getting up)\n- **Ginger** tea or candies\n- Sipping water between meals, not with them\n\nIf you can't keep fluids down for a day, let your provider know.",
      pt: "Enjoo é muito comum, mesmo no segundo trimestre. Algumas coisas que ajudam muitas mães:\n\n- **Lanches pequenos e frequentes** (biscoito antes de levantar)\n- Chá ou bala de **gengibre**\n- Beber água entre as refeições, e não junto\n\nSe não conseguir manter líquidos por um dia, avise o seu médico.",
      es: "Las náuseas son muy comunes. Prueba **comidas pequeñas y frecuentes**, **jengibre** y beber agua entre comidas. Si no retienes líquidos por un día, avisa a tu proveedor.",
    },
  },
  {
    match: /(sleep|sono|dormir|insomn|tired|cansad)/i,
    reply: {
      en: "Your sleep has averaged about **7 h 50 min** this week, nice work. At 24 weeks, sleeping on your **left side** with a pillow between your knees can ease back pressure. Try to keep screens away for 30 minutes before bed.",
      pt: "Seu sono teve média de **7 h 50 min** nesta semana, muito bem. Com 24 semanas, dormir de **lado esquerdo** com um travesseiro entre os joelhos alivia as costas. Tente deixar as telas de lado 30 minutos antes de dormir.",
      es: "Dormiste un promedio de **7 h 50 min** esta semana. A las 24 semanas, dormir del **lado izquierdo** con una almohada entre las rodillas alivia la espalda.",
    },
  },
  {
    match: /(kick|chut|patad|mov)/i,
    reply: {
      en: "Feeling those kicks is such a special moment! Around **24 weeks** movements get stronger and more regular. From week 28 you can start counting kicks: about **10 movements in 2 hours** is a good sign.",
      pt: "Sentir os chutes é um momento muito especial! Por volta de **24 semanas** os movimentos ficam mais fortes e regulares. A partir da semana 28 você pode contar: cerca de **10 movimentos em 2 horas** é um bom sinal.",
      es: "¡Sentir las patadas es muy especial! Alrededor de las **24 semanas** los movimientos son más fuertes. Desde la semana 28 puedes contarlas: unas **10 en 2 horas** es buena señal.",
    },
  },
  {
    match: /(eat|food|comer|comida|aliment|diet|calor)/i,
    reply: {
      en: "Today you've logged **920 kcal** so far, mostly good choices. Aim for protein at every meal, leafy greens for iron, and about **10 glasses of water**. Avoid raw fish, deli meats and unpasteurized cheese.",
      pt: "Hoje você registrou **920 kcal** até agora, a maioria boas escolhas. Tente incluir proteína em todas as refeições, folhas verdes para o ferro e cerca de **10 copos de água**. Evite peixe cru, frios e queijos não pasteurizados.",
      es: "Hoy registraste **920 kcal**, en su mayoría buenas opciones. Incluye proteína en cada comida, verduras de hoja para el hierro y unos **10 vasos de agua**.",
    },
  },
  {
    match: /(back|costas|espalda|dor|pain|dolor)/i,
    reply: {
      en: "Back pain is common as your belly grows. Gentle **cat-cow stretches**, a warm (not hot) shower and supportive shoes can help. You can find guided stretches in **Self-care**. If the pain is sharp or comes in waves, call your provider.",
      pt: "Dor nas costas é comum com o crescimento da barriga. Alongamentos suaves como **gato-vaca**, banho morno (não quente) e sapatos confortáveis ajudam. Há alongamentos guiados em **Autocuidado**. Se a dor for aguda ou vier em ondas, ligue para o seu médico.",
      es: "El dolor de espalda es común. Estiramientos suaves, una ducha tibia y zapatos cómodos ayudan. Si el dolor es agudo o viene en oleadas, llama a tu proveedor.",
    },
  },
  {
    match: /(exerc|walk|caminh|yoga|activ|ativ)/i,
    reply: {
      en: "Moving is great for you and baby. About **30 minutes of walking** most days, prenatal yoga or swimming are safe for most pregnancies. You walked about **6,500 steps** a day this week. Stop if you feel dizzy or short of breath.",
      pt: "Movimentar-se faz bem para você e para o bebê. Cerca de **30 minutos de caminhada** na maioria dos dias, yoga pré-natal ou natação são seguros na maioria das gestações. Você caminhou cerca de **6.500 passos** por dia nesta semana. Pare se sentir tontura ou falta de ar.",
      es: "Moverte es bueno para ti y tu bebé. Unos **30 minutos de caminata** al día, yoga prenatal o natación son seguros para la mayoría.",
    },
  },
];

const FALLBACK: Record<Lang, string> = {
  en: "That's a great question. At **24 weeks**, your baby is about the size of an ear of corn and is starting to hear your voice. Tell me a bit more and I'll help you think it through. For anything urgent, please contact your provider.",
  pt: "Ótima pergunta. Com **24 semanas**, o bebê tem mais ou menos o tamanho de uma espiga de milho e já começa a ouvir a sua voz. Me conte um pouco mais e eu te ajudo a pensar nisso. Para algo urgente, procure o seu médico.",
  es: "Muy buena pregunta. A las **24 semanas**, tu bebé tiene el tamaño de una mazorca de maíz y empieza a oír tu voz. Cuéntame un poco más y te ayudo.",
};

// What the real AI does with the questionnaire: the saved answers are part of every prompt (see
// CrossCare-rag, `getUserProfile`). The demo shows that by quoting them back when asked about them.
const ABOUT_ME = /(my answers|about me|what do you know|home|house|housing|casa|moradia|minhas respostas|sobre mim)/i;
const ABOUT_ME_INTRO: Record<Lang, string> = {
  en: "From your questionnaire, here is what I know and keep in mind when I answer you:",
  pt: "Pelo seu questionário, isto é o que eu sei e levo em conta nas minhas respostas:",
  es: "Por tu cuestionario, esto es lo que sé y tengo en cuenta al responderte:",
};

export type SavedAnswer = { questionId?: string; response?: string };

export const ragReply = (query: string, language?: string, answers: SavedAnswer[] = []) => {
  const lang: Lang = language === "pt" || language === "es" ? language : "en";
  const known = answers.filter((a) => a.response);
  if (known.length && ABOUT_ME.test(query)) {
    return `${ABOUT_ME_INTRO[lang]}\n\n${known.slice(0, 6).map((a) => `- ${a.response}`).join("\n")}`;
  }
  const topic = TOPICS.find((t) => t.match.test(query));
  return (topic ? topic.reply : FALLBACK)[lang];
};
