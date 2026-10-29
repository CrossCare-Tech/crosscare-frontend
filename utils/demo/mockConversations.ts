import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReplyMedia } from "@/constants/replyMedia";

// Scripted conversations for demo mode: extra topics for the simulated Concierge, answers that
// follow up on the previous reply, and a sample chat history that can be loaded from Developer.
// Everything is local, so the chat can be shown with no backend, RAG service or AI keys.

export type Lang = "en" | "pt" | "es";
export type Localized = Record<Lang, string>;

export type Topic = {
  id: string;
  match: RegExp;
  reply: Localized;
  // Answer to "yes" / "sim" / "sí" right after this reply
  more?: Localized;
  // Image, video, link or buttons that come with the reply (screen 6d). In the real app they come
  // from the reviewed content library (Contentful); here they are sample content.
  media?: (lang: Lang) => ReplyMedia[];
};

const L = (en: string, pt: string, es: string): Localized => ({ en, pt, es });
const text = (l: Localized, lang: Lang) => l[lang];

export const YES = /^\s*(yes|yeah|yep|sure|ok|okay|please|go ahead|sim|claro|pode|quero|s[ií]|dale|por favor)\b/i;

// Checked before the older topics in mockContent, so short words like "hi" or "thanks" do not
// fall into a broader topic (for example "great" contains "eat").
export const EXTRA_TOPICS: Topic[] = [
  {
    id: "greeting",
    match: /^\s*(hi|hello|hey|good (morning|afternoon|evening)|ol[aá]|oi|bom dia|boa tarde|boa noite|hola|buen[oa]s)\b/i,
    reply: {
      en: "Hi Maya! You're **24 weeks and 3 days** today. How are you feeling? I can help with symptoms, food, sleep, your appointments or anything on your mind.",
      pt: "Oi, Maya! Hoje você está com **24 semanas e 3 dias**. Como você está se sentindo? Posso ajudar com sintomas, alimentação, sono, consultas ou o que estiver na sua cabeça.",
      es: "¡Hola, Maya! Hoy estás en la semana **24 y 3 días**. ¿Cómo te sientes? Puedo ayudarte con síntomas, comida, sueño, citas o lo que tengas en mente.",
    },
  },
  {
    id: "thanks",
    match: /^\s*(thanks|thank you|thx|obrigad[oa]|valeu|gracias)\b/i,
    reply: {
      en: "Anytime, Maya. I'm here whenever you need me.",
      pt: "Sempre que precisar, Maya. Estou por aqui.",
      es: "Cuando quieras, Maya. Aquí estoy.",
    },
  },
  {
    id: "appointment",
    match: /(appointment|check-?up|next visit|consulta|pr[oó]xima|cita|doctor visit|dr\.? lee)/i,
    reply: {
      en: "Your next visit is the **prenatal check-up with Dr. Lee**, in the next few days (it's on your Calendar). Want a short list of questions to bring?",
      pt: "Sua próxima consulta é o **pré-natal com a Dra. Lee**, nos próximos dias (está no seu Calendário). Quer uma lista curta de perguntas para levar?",
      es: "Tu próxima visita es el **control prenatal con la Dra. Lee**, en los próximos días (está en tu Calendario). ¿Quieres una lista corta de preguntas para llevar?",
    },
    more: {
      en: "Good questions to ask at this visit:\n\n- Is my **weight gain** on track?\n- When should I do the **glucose screening**?\n- Which **vaccines** do I need (Tdap around week 27)?\n- What should I do if I notice **less movement**?\n- Can we talk about my **birth plan**?",
      pt: "Boas perguntas para essa consulta:\n\n- Meu **ganho de peso** está dentro do esperado?\n- Quando devo fazer o **teste de glicose**?\n- Quais **vacinas** preciso tomar (dTpa por volta da semana 27)?\n- O que fazer se eu notar **menos movimentos**?\n- Podemos falar do meu **plano de parto**?",
      es: "Buenas preguntas para esta visita:\n\n- ¿Mi **aumento de peso** va bien?\n- ¿Cuándo hago la **prueba de glucosa**?\n- ¿Qué **vacunas** necesito (Tdap cerca de la semana 27)?\n- ¿Qué hago si noto **menos movimiento**?\n- ¿Hablamos de mi **plan de parto**?",
    },
  },
  {
    id: "glucose",
    match: /(glucose test|glucose screening|gestational diabetes|teste de glicose|diabetes gestacional|prueba de glucosa)/i,
    reply: {
      en: "The **glucose screening** is usually done between **weeks 24 and 28**, and yours is already booked on your Calendar. You drink a sweet solution and have blood drawn an hour later. You don't need to fast unless your provider says so.",
      pt: "O **teste de glicose** costuma ser feito entre as **semanas 24 e 28**, e o seu já está agendado no Calendário. Você bebe uma solução doce e coleta sangue uma hora depois. Não precisa de jejum, a menos que o seu médico peça.",
      es: "La **prueba de glucosa** se hace entre las **semanas 24 y 28**, y la tuya ya está en tu Calendario. Tomas una solución dulce y te sacan sangre una hora después. No necesitas ayuno salvo que tu proveedor lo pida.",
    },
  },
  {
    id: "hospital-bag",
    match: /(hospital bag|pack|mala (da )?maternidade|maleta|bolso del hospital)/i,
    reply: {
      en: "It's a bit early, but a good plan is to pack by **week 35**. The essentials:\n\n- **ID, insurance card** and birth plan\n- Comfortable clothes and a going-home outfit for you and baby\n- **Phone charger**, toiletries, nursing bra\n- A car seat installed before you leave",
      pt: "Ainda é cedo, mas o ideal é deixar pronta até a **semana 35**. O essencial:\n\n- **Documentos, carteirinha do convênio** e plano de parto\n- Roupas confortáveis e a roupa de saída para você e o bebê\n- **Carregador**, itens de higiene, sutiã de amamentação\n- Cadeirinha instalada no carro antes de sair",
      es: "Aún es temprano, pero lo ideal es tenerla lista en la **semana 35**. Lo esencial:\n\n- **Identificación, seguro** y plan de parto\n- Ropa cómoda y ropa de salida para ti y el bebé\n- **Cargador**, aseo, sostén de lactancia\n- Silla de auto instalada antes de salir",
    },
  },
  {
    id: "contractions",
    match: /(contraction|braxton|contra[cç][oõ]es|contracciones)/i,
    reply: {
      en: "Irregular, painless tightening of the belly is often **Braxton Hicks**, and it's common from the second trimester. Drink water, rest on your left side and change position. **Call your provider** if they become regular, painful, or come with fluid or bleeding before week 37.",
      pt: "Endurecimento da barriga irregular e sem dor costuma ser **Braxton Hicks**, comum a partir do segundo trimestre. Beba água, descanse do lado esquerdo e mude de posição. **Ligue para o seu médico** se ficarem regulares, doloridas, ou vierem com perda de líquido ou sangue antes da semana 37.",
      es: "El endurecimiento irregular y sin dolor suele ser **Braxton Hicks**, común desde el segundo trimestre. Bebe agua, descansa del lado izquierdo y cambia de posición. **Llama a tu proveedor** si se vuelven regulares, dolorosas o con líquido o sangrado antes de la semana 37.",
    },
  },
  {
    id: "caffeine",
    match: /(coffee|caffeine|caf[eé]|cafe[ií]na)/i,
    reply: {
      en: "Up to **200 mg of caffeine a day** is considered safe in pregnancy, about one 12 oz cup of coffee. Tea, chocolate and soda count too.",
      pt: "Até **200 mg de cafeína por dia** é considerado seguro na gravidez, cerca de uma xícara grande de café. Chá, chocolate e refrigerante também contam.",
      es: "Hasta **200 mg de cafeína al día** se considera seguro en el embarazo, más o menos una taza grande de café. El té, el chocolate y los refrescos también cuentan.",
    },
  },
  {
    id: "swelling",
    match: /(swell|swollen|inchad|inchaço|hinchaz|hinchad)/i,
    reply: {
      en: "Mild swelling in feet and ankles is common at this stage. Elevate your legs, drink water and avoid standing for long. **Sudden swelling in your face or hands, or a bad headache**, needs a call to your provider the same day, since it can signal high blood pressure.",
      pt: "Um leve inchaço nos pés e tornozelos é comum nessa fase. Eleve as pernas, beba água e evite ficar muito tempo em pé. **Inchaço repentino no rosto ou nas mãos, ou dor de cabeça forte**, pede contato com o seu médico no mesmo dia, pois pode indicar pressão alta.",
      es: "Una hinchazón leve en pies y tobillos es común en esta etapa. Eleva las piernas, bebe agua y evita estar mucho tiempo de pie. **Hinchazón repentina en la cara o las manos, o un dolor de cabeza fuerte**, requiere llamar a tu proveedor el mismo día.",
    },
  },
  {
    id: "heartburn",
    match: /(heartburn|reflux|acid|azia|refluxo|acidez)/i,
    reply: {
      en: "Heartburn gets more common as the baby grows. Try **smaller meals**, avoid lying down for 2 hours after eating, and sleep with your head raised. Spicy and fried foods are common triggers.",
      pt: "A azia fica mais comum conforme o bebê cresce. Experimente **refeições menores**, não se deitar por 2 horas depois de comer e dormir com a cabeça elevada. Comidas apimentadas e fritas costumam piorar.",
      es: "La acidez es más común a medida que crece el bebé. Prueba **comidas más pequeñas**, no acostarte 2 horas después de comer y dormir con la cabeza elevada.",
    },
  },
  {
    id: "anxiety",
    match: /(anxious|anxiety|worried|scared|stress|sad|depress|ansios|preocupad|medo|triste|estress|ansied|miedo)/i,
    reply: {
      en: "Thank you for telling me, Maya. Feeling worried or low sometimes is very common in pregnancy, and you don't have to carry it alone. A few things that help: a **5-minute breathing break**, a walk outside, and talking with someone you trust. If these feelings last more than two weeks, or you ever think about hurting yourself, please **tell your provider or call or text 988** right away. Want a short breathing exercise now?",
      pt: "Obrigada por me contar, Maya. Sentir preocupação ou desânimo às vezes é muito comum na gravidez, e você não precisa carregar isso sozinha. O que costuma ajudar: uma **pausa de 5 minutos para respirar**, uma caminhada ao ar livre e conversar com alguém de confiança. Se esses sentimentos durarem mais de duas semanas, ou se pensar em se machucar, **fale com o seu médico ou ligue para o serviço de emergência** agora. Quer um exercício curto de respiração?",
      es: "Gracias por contármelo, Maya. Sentir preocupación o tristeza a veces es muy común en el embarazo, y no tienes que cargarlo sola. Ayuda hacer una **pausa de 5 minutos para respirar**, caminar al aire libre y hablar con alguien de confianza. Si estos sentimientos duran más de dos semanas, o piensas en hacerte daño, **avisa a tu proveedor o llama al 988** ahora. ¿Quieres un ejercicio corto de respiración?",
    },
    more: {
      en: "Let's try it together:\n\n1. Sit comfortably and relax your shoulders\n2. **Breathe in** through your nose for 4 counts\n3. **Hold** for 4 counts\n4. **Breathe out** slowly for 6 counts\n5. Repeat 5 times\n\nHow do you feel now?",
      pt: "Vamos fazer juntas:\n\n1. Sente-se confortavelmente e relaxe os ombros\n2. **Inspire** pelo nariz contando até 4\n3. **Segure** contando até 4\n4. **Solte o ar** devagar contando até 6\n5. Repita 5 vezes\n\nComo você se sente agora?",
      es: "Hagámoslo juntas:\n\n1. Siéntate cómoda y relaja los hombros\n2. **Inhala** por la nariz contando hasta 4\n3. **Sostén** contando hasta 4\n4. **Exhala** despacio contando hasta 6\n5. Repite 5 veces\n\n¿Cómo te sientes ahora?",
    },
  },
  {
    id: "baby-size",
    match: /(how.?s my baby|como est[aá] (o )?meu beb[eê]|c[oó]mo est[aá] mi beb[eé]|baby size|how big|size of (my )?baby|tamanho do beb[eê]|tamano del beb[eé]|tama[nñ]o del beb[eé])/i,
    reply: {
      en: "At **24 weeks** your baby is about the size of an **ear of corn**: roughly 12 inches long and about 1.3 pounds. Their lungs are developing and they can hear your voice.",
      pt: "Com **24 semanas** o bebê tem o tamanho de uma **espiga de milho**: cerca de 30 cm e uns 600 g. Os pulmões estão se desenvolvendo e ele já ouve a sua voz.",
      es: "A las **24 semanas** tu bebé tiene el tamaño de una **mazorca de maíz**: unos 30 cm y 600 g. Sus pulmones se están desarrollando y ya oye tu voz.",
    },
    media: (lang) => [
      {
        type: "image",
        asset: "baby-w24",
        alt: text(L("Illustration of a baby at week 24 of pregnancy", "Ilustração de um bebê na semana 24 da gravidez", "Ilustración de un bebé en la semana 24 del embarazo"), lang),
        title: text(L("Your baby at week 24", "Seu bebê na semana 24", "Tu bebé en la semana 24"), lang),
        note: text(L("Illustration · sizes are approximate", "Ilustração · tamanhos aproximados", "Ilustración · tamaños aproximados"), lang),
      },
      {
        type: "link",
        url: "https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy",
        title: text(L("Fetal development, week by week", "Desenvolvimento do bebê, semana a semana", "Desarrollo del bebé, semana a semana"), lang),
        domain: "acog.org",
        label: text(L("Medical source", "Fonte médica", "Fuente médica"), lang),
      },
    ],
  },
  {
    id: "stretch",
    match: /(stretch|alongament|estiramient|prenatal yoga|back (pain|ache|stretch))/i,
    reply: L(
      "Of course. This short routine is safe for most pregnancies. Go slowly and stop if anything hurts.",
      "Claro. Esta rotina curta é segura para a maioria das gestações. Vá devagar e pare se algo doer.",
      "Claro. Esta rutina corta es segura para la mayoría de los embarazos. Ve despacio y para si algo duele."
    ),
    media: (lang) => {
      const title = text(L("10-minute prenatal stretch", "Alongamento pré-natal de 10 minutos", "Estiramiento prenatal de 10 minutos"), lang);
      return [
        // Sample clip: the real one comes from Contentful
        { type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", title, durationSec: 582 },
        { type: "actions", title, actions: ["save", "remind"] },
      ];
    },
  },
  {
    id: "walking",
    match: /(walk|walking|caminh|camin[ae])/i,
    reply: L(
      "For most healthy pregnancies, walking is a good and gentle way to stay active. Go at your own pace, and ask your care team if you have any concerns.",
      "Na maioria das gestações saudáveis, caminhar é uma forma boa e suave de se manter ativa. Vá no seu ritmo e fale com a sua equipe se tiver dúvidas.",
      "En la mayoría de los embarazos saludables, caminar es una forma buena y suave de mantenerte activa. Ve a tu ritmo y consulta a tu equipo si tienes dudas."
    ),
    media: (lang) => [
      {
        type: "link",
        url: "https://www.acog.org/womens-health/faqs/exercise-during-pregnancy",
        title: text(L("Exercise during pregnancy", "Exercício durante a gravidez", "Ejercicio durante el embarazo"), lang),
        domain: "acog.org",
        label: text(L("Medical source", "Fonte médica", "Fuente médica"), lang),
      },
    ],
  },
  {
    id: "vaccines",
    match: /(vaccin|tdap|flu shot|vacina|vacuna)/i,
    reply: {
      en: "Two vaccines are usually recommended: the **flu shot** (any trimester) and **Tdap** between **weeks 27 and 36** to protect the baby from whooping cough. Check with Dr. Lee at your next visit.",
      pt: "Costumam ser indicadas duas vacinas: a da **gripe** (em qualquer trimestre) e a **dTpa** entre as **semanas 27 e 36**, para proteger o bebê da coqueluche. Confirme com a Dra. Lee na próxima consulta.",
      es: "Normalmente se recomiendan dos vacunas: la de la **gripe** (cualquier trimestre) y la **Tdap** entre las **semanas 27 y 36**, para proteger al bebé de la tos ferina. Confírmalo con la Dra. Lee.",
    },
  },
  {
    id: "travel",
    match: /(travel|trip|flight|fly|viaj|voo|vuelo)/i,
    reply: {
      en: "The second trimester is usually the most comfortable time to travel. Walk and stretch every 1 to 2 hours, drink water, wear the seat belt below your belly and carry your prenatal records. Most airlines allow flying until around week 36, but check yours.",
      pt: "O segundo trimestre costuma ser a fase mais confortável para viajar. Caminhe e alongue a cada 1 ou 2 horas, beba água, use o cinto abaixo da barriga e leve seus exames do pré-natal. A maioria das companhias aéreas permite voar até cerca da semana 36, mas confirme a sua.",
      es: "El segundo trimestre suele ser el más cómodo para viajar. Camina y estira cada 1 o 2 horas, bebe agua, usa el cinturón debajo del vientre y lleva tus registros prenatales. La mayoría de aerolíneas permite volar hasta la semana 36.",
    },
  },
];

// ---------- sample chat history, loaded from Settings > Developer ----------

type SeedMessage = { isUser: boolean; content: Localized; minutesAgo: number };

const SEED: SeedMessage[] = [
  { isUser: false, minutesAgo: 1500, content: {
    en: "Hi Maya! I'm your CrossCare Concierge. Ask me anything about your pregnancy, or tell me what you'd like to track today.",
    pt: "Oi, Maya! Eu sou a sua CrossCare Concierge. Pergunte o que quiser sobre a gravidez ou diga o que quer registrar hoje.",
    es: "¡Hola, Maya! Soy tu CrossCare Concierge. Pregúntame lo que quieras sobre tu embarazo o dime qué quieres registrar hoy." } },
  { isUser: true, minutesAgo: 1498, content: {
    en: "I think I felt the baby kick for the first time today!",
    pt: "Acho que senti o bebê chutar pela primeira vez hoje!",
    es: "¡Creo que hoy sentí al bebé patear por primera vez!" } },
  { isUser: false, minutesAgo: 1497, content: {
    en: "Feeling those kicks is such a special moment! Around **24 weeks** movements get stronger and more regular. From week 28 you can start counting kicks: about **10 movements in 2 hours** is a good sign.",
    pt: "Sentir os chutes é um momento muito especial! Por volta de **24 semanas** os movimentos ficam mais fortes e regulares. A partir da semana 28 você pode contar: cerca de **10 movimentos em 2 horas** é um bom sinal.",
    es: "¡Sentir las patadas es muy especial! Alrededor de las **24 semanas** los movimientos son más fuertes. Desde la semana 28 puedes contarlas: unas **10 en 2 horas** es buena señal." } },
  { isUser: true, minutesAgo: 1490, content: {
    en: "How has my sleep been lately?",
    pt: "Como tem sido o meu sono ultimamente?",
    es: "¿Cómo ha estado mi sueño últimamente?" } },
  { isUser: false, minutesAgo: 1489, content: {
    en: "Your sleep has averaged about **7 h 50 min** this week, nice work. At 24 weeks, sleeping on your **left side** with a pillow between your knees can ease back pressure. Try to keep screens away for 30 minutes before bed.",
    pt: "Seu sono teve média de **7 h 50 min** nesta semana, muito bem. Com 24 semanas, dormir de **lado esquerdo** com um travesseiro entre os joelhos alivia as costas. Tente deixar as telas de lado 30 minutos antes de dormir.",
    es: "Dormiste un promedio de **7 h 50 min** esta semana. A las 24 semanas, dormir del **lado izquierdo** con una almohada entre las rodillas alivia la espalda." } },
  { isUser: true, minutesAgo: 1485, content: {
    en: "When is my next appointment?",
    pt: "Quando é a minha próxima consulta?",
    es: "¿Cuándo es mi próxima cita?" } },
  { isUser: false, minutesAgo: 1484, content: EXTRA_TOPICS.find((t) => t.id === "appointment")!.reply },
];

const pick = (lang: string | undefined): Lang => (lang === "pt" || lang === "es" ? lang : "en");

// Writes the sample chat where the Concierge reads its history ("chatHistory", same shape as a message).
export const loadSampleConversation = async (language?: string) => {
  const lang = pick(language);
  const now = Date.now();
  const messages = SEED.map((m, index) => ({
    id: `sample-${index}`,
    isUser: m.isUser,
    type: "text",
    content: m.content[lang],
    timestamp: new Date(now - m.minutesAgo * 60_000).toISOString(),
  }));
  await AsyncStorage.setItem("chatHistory", JSON.stringify(messages));
};
