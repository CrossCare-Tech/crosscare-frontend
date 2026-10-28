// Weekly baby content from the design prototype (Baby development v4). Sizes are rounded reference averages:
// length is crown to rump up to week 19 and head to heel from week 20. Text is English only for now.
export type BabyPartKey = "development" | "organs" | "brain" | "senses" | "movement";

export interface BabyWeek {
  object: string; // comparison object, drawn by constants/babyFruits.ts
  lengthIn: number;
  weightOz: number;
  big: { icon: string; head: string; text: string; why: string };
  highlights: string[];
  parts: { key: BabyPartKey; text: string; dyk?: string }[];
  notice: string[];
  tip: string;
}

export const BABY_WEEKS: Record<number, BabyWeek> = {
  4: {
    object: "Poppy seed",
    lengthIn: 0.04,
    weightOz: 0.04,
    big: {
      icon: "🏠",
      head: "Settling in",
      text: "The tiny embryo has nestled into your womb lining and is wrapped in a fluid-filled sac.",
      why: "A yolk sac feeds it for now while the placenta starts to form.",
    },
    highlights: ["The embryo settles into the womb lining", "A fluid-filled sac begins to form around it", "Your body starts making pregnancy hormones"],
    parts: [
      { key: "development", text: "A tiny ball of cells is settling into the lining of the womb.", dyk: "At this point the embryo is smaller than a grain of rice." },
      { key: "organs", text: "Early layers that become the brain, spine and heart start to form. The embryo is a tiny disc of cells. A sac and the early placenta are forming to support it." },
      { key: "brain", text: "The cells that will become the brain and spinal cord are starting to form." },
    ],
    notice: ["A missed period is often the first sign", "A metallic taste, tender breasts and needing to pee more", "Mild cramps like period pain can happen"],
    tip: "If you have not yet, take a pregnancy test and book a first visit with your care team.",
  },
  5: {
    object: "Sesame seed",
    lengthIn: 0.08,
    weightOz: 0.04,
    big: {
      icon: "🧠",
      head: "The brain and spine begin",
      text: "Your baby's brain and spinal cord are taking shape, and new blood vessels are growing that will become the umbilical cord.",
      why: "It is the foundation that every other body system builds on.",
    },
    highlights: ["The heart and brain begin to take shape", "A tiny tube forms, the start of the spinal cord", "The embryo is about the size of a seed"],
    parts: [
      { key: "development", text: "The heart and brain begin to take shape.", dyk: "Pregnancy tests are usually positive from around now." },
      { key: "organs", text: "A thin tube that will become the spinal cord is forming. The first layers of the heart, gut and lungs are starting to form from the embryo's three cell layers." },
      { key: "brain", text: "A groove folds into the neural tube, which will become the brain and spinal cord." },
    ],
    notice: ["Extreme tiredness, even this early", "Nausea that can strike at any time of day", "New food loves and hates"],
    tip: "Ask your care team about prenatal vitamins and what to avoid.",
  },
  6: {
    object: "Lentil",
    lengthIn: 0.24,
    weightOz: 0.04,
    big: {
      icon: "💓",
      head: "A heart starts to beat",
      text: "Your baby is about the size of a pea, with a heart that has begun to beat and little buds for arms and legs.",
      why: "Many people see this first flicker on an early scan.",
    },
    highlights: ["The heart begins to beat", "Buds appear that will become arms and legs", "The face begins to form: eyes, nostrils and mouth"],
    parts: [
      { key: "development", text: "The heart starts to beat. It may show as a flicker on an early scan.", dyk: "A heartbeat can sometimes be seen on an early ultrasound around this time." },
      { key: "organs", text: "Tiny buds appear that will grow into arms and legs. The heart is a small tube beating at a fast rhythm. The gut and early lungs are taking shape." },
      { key: "brain", text: "The neural tube closes and the brain begins to split into early regions." },
    ],
    notice: ["Queasiness that is often worst when you wake", "Mood swings and headaches", "A sharper sense of smell"],
    tip: "Keep plain snacks by the bed for queasy mornings.",
  },
  7: {
    object: "Blueberry",
    lengthIn: 0.39,
    weightOz: 0.04,
    big: {
      icon: "✨",
      head: "Brain cells at full speed",
      text: "New brain cells are forming at a remarkable rate, and small dimples mark where the nose and ears will be.",
      why: "Eyelids are starting to grow too, ready to cover the eyes.",
    },
    highlights: ["The brain grows fast and forms regions", "Arm and leg buds get longer", "The lungs and gut begin to form"],
    parts: [
      { key: "development", text: "The brain is growing quickly and the face is starting to form.", dyk: "The brain is already building its basic structure." },
      { key: "organs", text: "Arm and leg buds are getting longer. The gut, lungs and liver are forming. Hands and feet start to look like tiny paddles." },
      { key: "brain", text: "The brain is growing quickly and forming its main regions." },
    ],
    notice: ["Feeling thirstier as your blood volume rises", "Darker patches on the face (chloasma)", "Light spotting or cramps can happen; mention any worry to your care team"],
    tip: "Sip water little and often, since your blood volume is rising.",
  },
  8: {
    object: "Raspberry",
    lengthIn: 0.63,
    weightOz: 0.04,
    big: {
      icon: "👶",
      head: "From embryo to fetus",
      text: "This week your baby gets a new name, fetus, and the head begins to uncurl.",
      why: "The arms are growing faster than the legs while the upper body leads the way.",
    },
    highlights: ["Fingers and toes begin to separate", "Eyes, ears and upper lip take shape", "Tiny movements begin"],
    parts: [
      { key: "development", text: "Fingers and toes are starting to form, and the eyes and ears take shape.", dyk: "Despite its size, your baby already has the beginnings of most major organs." },
      { key: "organs", text: "Most major organs have started to form, and the tail-like end of the embryo is disappearing." },
      { key: "brain", text: "The brain and nerves are connecting to the muscles, which is why tiny movements begin." },
      { key: "movement", text: "Your baby is already making tiny movements, far too small to feel." },
    ],
    notice: ["Bloating and mild breast swelling", "Peeing more as the womb presses on your bladder", "Hair that starts to look thicker and shinier"],
    tip: "Wear something comfy; bloating is normal and often eases.",
  },
  9: {
    object: "Cherry",
    lengthIn: 0.91,
    weightOz: 0.07,
    big: {
      icon: "👀",
      head: "A face you could recognize",
      text: "Eyes, a small mouth and even a tongue with taste buds are taking shape.",
      why: "Tiny grooves on the hands and feet mark where fingers and toes will form.",
    },
    highlights: ["Vital organs keep developing", "The face looks more defined", "Muscles and nerves are connecting"],
    parts: [
      { key: "development", text: "The vital organs have begun to develop and the face is more defined.", dyk: "The tiny heart is nearly fully formed." },
      { key: "organs", text: "The heart is nearly fully formed. Tiny buds that will become teeth are beginning to appear." },
      { key: "brain", text: "The brain keeps forming and the nerves are linking up with the body." },
      { key: "movement", text: "Small twitches begin as muscles and nerves connect." },
    ],
    notice: ["An emotional rollercoaster as hormones peak", "Your waist may start to thicken", "Relief is on its way as the first trimester nears its end"],
    tip: "Rest when you can; this is often one of the most tiring weeks.",
  },
  10: {
    object: "Kumquat",
    lengthIn: 1.22,
    weightOz: 0.14,
    big: {
      icon: "💗",
      head: "A very fast little heart",
      text: "Your baby's heart is beating about three times faster than yours, and small jerky movements can show up on a scan.",
      why: "Milk-tooth buds are forming inside the jaw.",
    },
    highlights: ["Your baby is now called a fetus", "Fingernails start to appear", "Elbows and knees begin to bend"],
    parts: [
      { key: "development", text: "Your baby is now called a fetus. Tiny fingernails start to appear.", dyk: "Your baby's bones are still soft cartilage at this stage." },
      { key: "organs", text: "The vital organs are in place and growing. The intestines are moving into the belly." },
      { key: "brain", text: "The brain is growing fast, and new nerve cells form every day." },
      { key: "movement", text: "Arms and legs can bend, and joints like elbows and knees are forming." },
    ],
    notice: ["Burping and gassiness", "Trouble fastening your usual jeans", "Your booking appointment, usually between weeks 8 and 12"],
    tip: "Ask when your booking appointment will be.",
  },
  11: {
    object: "Fig",
    lengthIn: 1.61,
    weightOz: 0.25,
    big: {
      icon: "🖐",
      head: "Fingers and toes unfurl",
      text: "Fingers and toes are separating and tiny nails are starting to form.",
      why: "Your baby is already moving; you just cannot feel it yet.",
    },
    highlights: ["Growth speeds up", "The head is about half of your baby's length", "Bones begin to harden"],
    parts: [
      { key: "development", text: "The head is about half of your baby's length while the body catches up.", dyk: "Tooth buds for baby teeth are forming under the gums." },
      { key: "organs", text: "The liver and kidneys are starting to work. External features are becoming more defined." },
      { key: "brain", text: "Nerve cells are multiplying, and basic reflexes are getting ready to start." },
      { key: "movement", text: "Your baby moves and stretches often, though you cannot feel it yet." },
    ],
    notice: ["Feeling hot, sweaty or dizzy as your body pumps extra blood", "Mild belly aches as muscles and ligaments stretch", "Oilier skin or breakouts"],
    tip: "Stand up slowly; extra blood flow can make you dizzy.",
  },
  12: {
    object: "Lime",
    lengthIn: 2.13,
    weightOz: 0.49,
    big: {
      icon: "🌱",
      head: "Organs get to work",
      text: "The placenta takes over from the yolk sac, and your baby's heartbeat can be picked up on a scan.",
      why: "Many people find nausea starts to ease around now.",
    },
    highlights: ["Reflexes begin", "Fingers and toes are fully separate", "Organs are in place and starting to work"],
    parts: [
      { key: "development", text: "Fingers and toes are fully separate and the first reflexes appear.", dyk: "Your baby's intestines are settling inside the belly." },
      { key: "organs", text: "The kidneys begin to make urine and the intestines are settled inside the belly." },
      { key: "brain", text: "The brain and muscles are working together: reflexes such as curling the fingers begin." },
      { key: "movement", text: "Fingers can open and close, and the mouth can make small movements." },
    ],
    notice: ["Nausea starting to fade and your appetite coming back", "A thin, milky discharge", "Hair that feels thicker and shinier"],
    tip: "A scan may be offered soon; jot down any questions to ask.",
  },
  13: {
    object: "Peach",
    lengthIn: 2.91,
    weightOz: 0.81,
    big: {
      icon: "👍",
      head: "Thumb-sucking practice",
      text: "Some babies practice sucking a thumb, building the reflex they will need to feed.",
      why: "Your baby is also starting to make deliberate movements.",
    },
    highlights: ["Fingerprints are forming", "The vocal cords are developing", "The first trimester ends this week"],
    parts: [
      { key: "development", text: "Tiny fingerprints are forming on the fingertips.", dyk: "Tooth buds for all baby teeth are now in place." },
      { key: "organs", text: "The body is catching up with the head. The ovaries or testes are developed inside." },
      { key: "brain", text: "The brain is developing quickly and the nerve pathways keep forming." },
      { key: "senses", text: "The vocal cords are developing and the eyes sit closer together on the face." },
    ],
    notice: ["A small bump may appear", "Peeing less often as the womb rises away from the bladder", "A boost in sex drive for some people"],
    tip: "If energy has returned, a gentle walk is a lovely treat.",
  },
  14: {
    object: "Lemon",
    lengthIn: 3.43,
    weightOz: 1.52,
    big: {
      icon: "💧",
      head: "The kidneys start working",
      text: "Your baby's kidneys now make urine, which goes into the amniotic fluid, and the head looks rounder and better balanced.",
      why: "Your baby is very active, even if you cannot feel it yet.",
    },
    highlights: ["The neck lengthens and the head lifts", "Facial expressions begin", "The second trimester has begun"],
    parts: [
      { key: "development", text: "The neck is lengthening, so the head can lift more easily.", dyk: "Your baby may be able to suck a thumb." },
      { key: "organs", text: "The body is growing faster than the head now. The liver and spleen are getting to work." },
      { key: "brain", text: "The brain sends signals to the face, so squinting and frowning are possible." },
      { key: "movement", text: "Your baby can squint, frown and grimace." },
    ],
    notice: ["More energy and less nausea", "Early milk (colostrum) may show up in your bra", "Swollen gums and nosebleeds"],
    tip: "A little unperfumed moisturizer can help with skin changes.",
  },
  15: {
    object: "Apple",
    lengthIn: 3.98,
    weightOz: 2.47,
    big: {
      icon: "🌿",
      head: "Soft fuzz and light-sensitive eyes",
      text: "Fine, downy hair called lanugo is growing all over, and your baby's eyes have become sensitive to light.",
      why: "Eyebrows and eyelashes are starting to appear as well.",
    },
    highlights: ["Fine hair begins to grow", "The skeleton keeps hardening", "Your baby may sense bright light"],
    parts: [
      { key: "development", text: "Fine hair begins to grow, and the skeleton keeps hardening.", dyk: "Your baby's ears are moving toward their final position." },
      { key: "organs", text: "The skeleton is hardening and thin hair begins to grow on the body and head." },
      { key: "brain", text: "The brain is growing and the nerve connections to the eyes and ears are forming." },
      { key: "senses", text: "Eyes are closed, but your baby may sense bright light from outside." },
      { key: "movement", text: "Arms and legs move more smoothly now." },
    ],
    notice: ["Aches on the sides of your belly (round ligament pain)", "More discharge than usual", "Itchy skin and less steady balance"],
    tip: "Take your time getting up as your balance shifts.",
  },
  16: {
    object: "Avocado",
    lengthIn: 4.57,
    weightOz: 3.53,
    big: {
      icon: "🤛",
      head: "Tiny fists",
      text: "Hands can curl into fists and your baby may start to punch, while those facial expressions are still just reflexes.",
      why: "Kicks may become noticeable within the next week or so.",
    },
    highlights: ["Facial muscles are working", "The tiny ear bones are forming", "Arms and legs move more smoothly"],
    parts: [
      { key: "development", text: "The muscles of the face are working, so expressions are possible.", dyk: "Tiny fingers can curl into a fist." },
      { key: "organs", text: "The skeleton keeps hardening, and your baby's body is growing straighter." },
      { key: "brain", text: "The brain is developing its folds and nerves are getting a protective coating over time." },
      { key: "senses", text: "The tiny bones of the ear are forming." },
      { key: "movement", text: "Your baby is active, stretching and curling up." },
    ],
    notice: ["A check-up of your weight, blood pressure and urine", "Constipation, bloating or indigestion", "Results from routine blood screening tests"],
    tip: "Ask about your screening test results at your next visit.",
  },
  17: {
    object: "Pear",
    lengthIn: 5.12,
    weightOz: 4.94,
    big: {
      icon: "🫧",
      head: "Bubbles and flutters",
      text: "Your baby reacts to loud sounds and can open and close the mouth, while one-of-a-kind fingerprints are forming.",
      why: "Many people feel the first flutters around now, often described as bubbling.",
    },
    highlights: ["Cartilage is turning into bone", "Taste buds are forming", "The umbilical cord is getting stronger"],
    parts: [
      { key: "development", text: "Soft cartilage is slowly turning into bone.", dyk: "The umbilical cord carries oxygen and nutrients between you and your baby." },
      { key: "organs", text: "A layer of fat will soon begin to form. The cord, which carries blood to your baby, is thickening." },
      { key: "brain", text: "The brain is building new connections, and the senses keep developing." },
      { key: "senses", text: "Taste buds are forming on the tongue." },
      { key: "movement", text: "Your baby may start to hiccup. You will not feel it yet." },
    ],
    notice: ["Bubbling or fluttering as the first movements arrive", "Your waist starting to disappear", "Stretch marks on your belly, breasts or thighs"],
    tip: "Moisturizing your belly can help if it feels itchy; stretch marks are common and fade.",
  },
  18: {
    object: "Bell pepper",
    lengthIn: 5.59,
    weightOz: 6.7,
    big: {
      icon: "🎧",
      head: "The senses wake up",
      text: "Hearing, feeling, swallowing and sucking reflexes are all developing.",
      why: "This is a common week for the very first movement you can feel.",
    },
    highlights: ["Nerves are getting a protective coating", "Hearing may begin", "First flutters are possible"],
    parts: [
      { key: "development", text: "A protective layer is forming around the nerves, helping signals travel faster.", dyk: "Your baby's fingerprints and toeprints are already unique." },
      { key: "organs", text: "Bones and muscles are growing stronger. The womb's lining and the placenta keep supporting growth." },
      { key: "brain", text: "Nerves are wrapped in a protective coating, called myelin, which helps signals travel faster." },
      { key: "senses", text: "Ears are in position and your baby may start to hear sounds." },
      { key: "movement", text: "Many people feel the first flutters between weeks 18 and 22." },
    ],
    notice: ["A gentle fluttering in your belly, maybe for the first time", "Feeling clumsy as your belly grows", "A dark line down your belly (linea nigra)"],
    tip: "Mention any dizziness when you stand up to your care team.",
  },
  19: {
    object: "Heirloom tomato",
    lengthIn: 6.02,
    weightOz: 8.47,
    big: {
      icon: "🦷",
      head: "Teeth behind the teeth",
      text: "Adult teeth are beginning to form behind the baby teeth already in the gums.",
      why: "Your baby is steadily gaining weight for the months ahead.",
    },
    highlights: ["A protective coating covers the skin", "Hearing keeps improving", "Kicks and rolls get stronger"],
    parts: [
      { key: "development", text: "A creamy coating called vernix is forming to protect the skin.", dyk: "Your baby's senses of smell, taste, sight, hearing and touch are all developing." },
      { key: "organs", text: "The skin is covered with a waxy coating called vernix and fine hair called lanugo." },
      { key: "brain", text: "The brain areas for smell, taste, sight, hearing and touch are developing." },
      { key: "senses", text: "Hearing is improving, so your baby may react to loud noises." },
      { key: "movement", text: "Kicks and rolls are getting stronger." },
    ],
    notice: ["Movements that feel like bubbles", "Trouble sleeping even when you are tired", "Thicker, shinier hair"],
    tip: "Jot down the movements you notice; it helps you learn your baby's pattern.",
  },
  20: {
    object: "Banana",
    lengthIn: 10.08,
    weightOz: 10.58,
    big: {
      icon: "🍌",
      head: "Halfway, and wrapped in vernix",
      text: "A white, creamy coating called vernix now protects your baby's skin from drying out in the fluid.",
      why: "From now on length is measured head to heel, which is why the number jumps.",
    },
    highlights: ["You are about halfway there", "Length is now measured head to heel", "Your baby can hear your voice"],
    parts: [
      { key: "development", text: "You are about halfway there. Your baby's length is now measured head to heel.", dyk: "Fine hair called lanugo covers your baby's body." },
      { key: "organs", text: "Your baby's body is more in proportion. Fine hair covers the skin and the coating protects it." },
      { key: "brain", text: "The brain is growing quickly, and the areas for senses are developing." },
      { key: "senses", text: "Your baby can hear your voice and heartbeat." },
      { key: "movement", text: "Flutters and kicks may feel more noticeable now." },
    ],
    notice: ["An anomaly scan may be offered around now", "Leg cramps at night", "Aches on the sides of your belly"],
    tip: "For night-time leg cramps, gently stretching your toes upward or massaging the calf can help.",
  },
  21: {
    object: "Carrot",
    lengthIn: 10.51,
    weightOz: 12.7,
    big: {
      icon: "🌙",
      head: "Sleep and wake rhythms",
      text: "Your baby now has distinct awake and asleep spells, and may be busiest just when you want to rest.",
      why: "Your baby is also heavier than the placenta now.",
    },
    highlights: ["Your baby swallows amniotic fluid", "Taste buds are working", "Movements follow a pattern"],
    parts: [
      { key: "development", text: "Your baby is swallowing small amounts of amniotic fluid, which helps the gut develop.", dyk: "Your baby's bone marrow has started making blood cells." },
      { key: "organs", text: "The gut is working: your baby swallows fluid and the digestive system keeps developing." },
      { key: "brain", text: "The brain keeps building connections as the senses sharpen." },
      { key: "senses", text: "Taste buds are working, and flavors from your meals can reach the fluid." },
      { key: "movement", text: "Movements follow a pattern and you may notice busy and quiet times." },
    ],
    notice: ["Feeling unsteady as your center of gravity shifts", "A baby who is busiest when you want to rest", "Wanting a daytime nap"],
    tip: "Short daytime naps can help if nights are broken.",
  },
  22: {
    object: "Mango",
    lengthIn: 10.94,
    weightOz: 15.17,
    big: {
      icon: "🍽",
      head: "Practicing to breathe, tasting your meals",
      text: "The lungs are practicing breathing, and taste buds are developing and may notice flavors from what you eat.",
      why: "Swallowed fluid will later become your baby's first stool, called meconium.",
    },
    highlights: ["Eyelids and eyebrows are fully formed", "The sense of touch is developing", "Your baby may respond to a gentle belly rub"],
    parts: [
      { key: "development", text: "Eyelids and eyebrows are fully formed.", dyk: "Your baby may touch the face and the umbilical cord." },
      { key: "organs", text: "The pancreas is developing and the lungs are growing tiny air sacs." },
      { key: "brain", text: "The brain's sensory areas are developing, supporting touch and hearing." },
      { key: "senses", text: "The sense of touch is developing. Your baby may explore the face and hands." },
      { key: "movement", text: "Your baby may respond when you gently rub your belly." },
    ],
    notice: ["Stretch marks starting to show", "Backache and swollen feet", "Skin that is oilier or spotty"],
    tip: "Pelvic floor exercises are a good habit to start now.",
  },
  23: {
    object: "Grapefruit",
    lengthIn: 11.38,
    weightOz: 17.67,
    big: {
      icon: "🫶",
      head: "In proportion and on a rhythm",
      text: "Your baby's limbs are now in proportion, breathing practice continues and sleep and wake patterns are settling.",
      why: "Kicks get easier to notice.",
    },
    highlights: ["Fat starts to build up under the skin", "Your baby hears sounds from outside", "Sudden noises can make your baby jump"],
    parts: [
      { key: "development", text: "Fat is starting to build up under the skin.", dyk: "Your baby's lungs are practicing breathing movements." },
      { key: "organs", text: "Blood vessels in the lungs are developing, getting ready for breathing after birth." },
      { key: "brain", text: "The brain is developing quickly, and your baby reacts to sudden sounds." },
      { key: "senses", text: "Your baby can hear sounds from outside, like your voice and music." },
      { key: "movement", text: "Sudden noises can make your baby jump." },
    ],
    notice: ["Colostrum may leak from your breasts", "Breathlessness or rib pain as your ribs spread", "Skin that burns more easily in the sun"],
    tip: "Use sunscreen; your skin can be more sensitive to the sun.",
  },
  24: {
    object: "Ear of corn",
    lengthIn: 11.81,
    weightOz: 21.16,
    big: {
      icon: "🌟",
      head: "Everything in proportion",
      text: "All your baby's body parts are in proportion now, just smaller than they will be at full term.",
      why: "It is a good week to start thinking about your birth preferences.",
    },
    highlights: ["The lungs grow branches and start making surfactant", "Hearing sharpens further", "Kicks and stretches are easier to feel"],
    parts: [
      { key: "development", text: "The lungs are growing branches and starting to make surfactant, which helps them open after birth.", dyk: "Your baby may start to respond to familiar sounds, like your voice." },
      { key: "organs", text: "The lungs are growing branches, and the cells that make surfactant are starting to work." },
      { key: "brain", text: "The brain is building connections, supporting hearing and early learning of sounds." },
      { key: "senses", text: "Hearing keeps improving and your baby recognizes familiar sounds." },
      { key: "movement", text: "Kicks and stretches are easier to feel now." },
    ],
    notice: ["A bigger appetite", "Rib, back and breast aches", "Puffy hands, swollen gums or nosebleeds"],
    tip: "Start thinking about your birth preferences and talk them through with your care team.",
  },
  25: {
    object: "Cauliflower",
    lengthIn: 13.62,
    weightOz: 23.28,
    big: {
      icon: "🔊",
      head: "Jumpy at loud noises",
      text: "Your baby may jump or kick at a sudden loud sound, and occasional hiccups may be something you can feel.",
      why: "Much of the fluid around your baby is now their own urine.",
    },
    highlights: ["The skin looks smoother", "Your baby responds to your voice", "Small rhythmic hiccups are common"],
    parts: [
      { key: "development", text: "Your baby is filling out and the skin looks smoother.", dyk: "Your baby's nostrils are starting to open." },
      { key: "organs", text: "Your baby is filling out and the skin looks smoother as fat builds up." },
      { key: "brain", text: "The brain is growing and learning to respond to familiar sounds, like your voice." },
      { key: "senses", text: "Your baby responds to your voice and to music." },
      { key: "movement", text: "Steady, rhythmic movements are common, including hiccups." },
    ],
    notice: ["Puffiness in your face, hands and feet", "Burning in your chest and more burping", "Tiredness and trouble sleeping"],
    tip: "Tell your care team straight away about severe headaches or changes to your vision.",
  },
  26: {
    object: "Lettuce head",
    lengthIn: 14.02,
    weightOz: 26.81,
    big: {
      icon: "👁",
      head: "Eyes open for the first time",
      text: "Your baby's eyes open for the first time this week, and learning to blink is the next skill.",
      why: "Eye color is down to genes and can keep changing for a while.",
    },
    highlights: ["Eyes begin to open and blink", "The lungs keep maturing", "Your baby may react to light"],
    parts: [
      { key: "development", text: "The lungs continue to mature and the nervous system keeps developing.", dyk: "Eye color is still settling, and it can keep changing after birth." },
      { key: "organs", text: "The lungs keep developing and your baby practices breathing movements with amniotic fluid." },
      { key: "brain", text: "The brain is active and starting to coordinate eyes, ears and movement." },
      { key: "senses", text: "Eyes begin to open and blink." },
      { key: "movement", text: "Your baby moves a lot and may react to light shining on your belly." },
    ],
    notice: ["Clumsiness as your balance shifts", "More leg cramps at night", "Forgetfulness, often called baby brain"],
    tip: "Lists and phone reminders can help if forgetfulness is getting in the way.",
  },
  27: {
    object: "Cabbage",
    lengthIn: 14.41,
    weightOz: 30.86,
    big: {
      icon: "🫁",
      head: "Ready to breathe",
      text: "The lungs are now able to take breaths, and skin folds are filling out with fat for a rounder look.",
      why: "This is the last week of the second trimester.",
    },
    highlights: ["The brain builds new connections", "Sleep and wake cycles begin", "Your baby can tell light from dark"],
    parts: [
      { key: "development", text: "The brain is growing fast and building new connections.", dyk: "Small rhythmic jumps you feel may be your baby's hiccups." },
      { key: "organs", text: "The lungs and other organs keep maturing, and your baby is putting on weight." },
      { key: "brain", text: "The brain is developing quickly, with new connections and early sleep cycles." },
      { key: "senses", text: "Your baby tells light from dark and responds to sound." },
      { key: "movement", text: "Regular sleep and wake cycles begin, so movement comes in patterns." },
    ],
    notice: ["Constipation and bloating", "Snoring, as nasal passages swell", "Side aches as ligaments stretch"],
    tip: "Pillows to prop you up can ease snoring and a stuffy nose.",
  },
  28: {
    object: "Eggplant",
    lengthIn: 14.8,
    weightOz: 35.27,
    big: {
      icon: "🍆",
      head: "A slower heartbeat",
      text: "Your baby's heartbeat has slowed from the speedy early weeks, and a stethoscope can pick it up.",
      why: "The third trimester starts now.",
    },
    highlights: ["The third trimester begins", "Eyes can open and close", "Dream-like sleep may begin"],
    parts: [
      { key: "development", text: "The third trimester begins. The lungs are maturing and fat is building up.", dyk: "Your baby's eyelashes have grown in." },
      { key: "organs", text: "The lungs are maturing and fat is building up under the skin." },
      { key: "brain", text: "The brain is growing quickly and forming folds, which add surface area." },
      { key: "senses", text: "Eyes can open and close, and eyelashes have grown." },
      { key: "movement", text: "Your baby may begin to dream during sleep. Count movements as your care team advises." },
    ],
    notice: ["Heartburn and indigestion", "Back strain as your joints loosen", "Swollen ankles, feet or face"],
    tip: "Ask your care team when your next visits and tests are planned.",
  },
  29: {
    object: "Butternut squash",
    lengthIn: 15.2,
    weightOz: 40.57,
    big: {
      icon: "🧼",
      head: "The coating starts to fade",
      text: "The waxy vernix begins to thin this week, and your baby is fully formed and focused on gaining fat.",
      why: "Most of what happens from here is maturing and growing.",
    },
    highlights: ["Bones are hardening", "Hearing is well developed", "Kicks may be visible from outside"],
    parts: [
      { key: "development", text: "Bones are hardening, though the skull stays soft for birth.", dyk: "Your baby's head is growing to make room for the brain." },
      { key: "organs", text: "Bones are hardening, and your baby draws on your calcium for bone growth." },
      { key: "brain", text: "The brain is growing quickly and the head grows to make room for it." },
      { key: "senses", text: "Hearing is well developed and your baby may startle at loud sounds." },
      { key: "movement", text: "Kicks feel stronger and you may see them from the outside." },
    ],
    notice: ["Breathlessness as your baby presses on your lungs", "More bathroom trips at night", "Sleep broken by an active baby"],
    tip: "Lying on your side with a pillow between your knees can make sleep easier.",
  },
  30: {
    object: "Cucumber",
    lengthIn: 15.71,
    weightOz: 46.56,
    big: {
      icon: "🔍",
      head: "Eyes that can focus",
      text: "Your baby's eyes can focus now, and after birth they will see faces best from close up.",
      why: "Following moving objects comes a few months after birth.",
    },
    highlights: ["The brain develops folds", "Your baby can open the eyes", "Movement feels more like rolls and stretches"],
    parts: [
      { key: "development", text: "The brain keeps growing and developing folds.", dyk: "Your baby's bone marrow is now the main place blood cells are made." },
      { key: "organs", text: "Blood cells are mostly made in the bone marrow now, and body fat keeps building." },
      { key: "brain", text: "The brain's folds are deepening, and it is controlling breathing and body temperature more." },
      { key: "senses", text: "Your baby can open the eyes and look around in dim light." },
      { key: "movement", text: "Space is getting tighter, so movement feels more like rolls and stretches." },
    ],
    notice: ["Getting out of breath on the stairs", "Vivid dreams", "Aches on the sides of your bump"],
    tip: "Look at antenatal class dates and your hospital bag checklist.",
  },
  31: {
    object: "Pineapple",
    lengthIn: 16.18,
    weightOz: 52.91,
    big: {
      icon: "🤸",
      head: "Somersaults and sucking",
      text: "Your baby is practicing sucking, tumbling around and starting to recognize voices from outside.",
      why: "The skin is smoothing out as fat is added.",
    },
    highlights: ["Brain connections form quickly", "Your baby turns toward light and sound", "The head can turn from side to side"],
    parts: [
      { key: "development", text: "The brain is forming connections quickly.", dyk: "Your baby can now take in information from all five senses." },
      { key: "organs", text: "The body is catching up with the head and the skin looks smoother." },
      { key: "brain", text: "The brain is forming connections quickly and can now process input from the senses." },
      { key: "senses", text: "Your baby turns toward light and sound." },
      { key: "movement", text: "Your baby can turn the head from side to side." },
    ],
    notice: ["Braxton Hicks tightenings that last under a minute", "Your bump may start to sit lower", "Harder balance and getting around"],
    tip: "If tightenings become regular, painful or frequent, call your care team.",
  },
  32: {
    object: "Coconut",
    lengthIn: 16.69,
    weightOz: 59.97,
    big: {
      icon: "🧸",
      head: "A cozy layer of fat",
      text: "Fat is building up to help your baby stay warm after birth, and your baby is perfectly formed but still putting on weight.",
      why: "Most babies are heading into a head-down position now.",
    },
    highlights: ["Weight gain is steady", "Fingernails and toenails are fully formed", "Your baby practices breathing movements"],
    parts: [
      { key: "development", text: "Your baby is gaining weight steadily. The fingernails and toenails are fully formed.", dyk: "Your baby's toenails have reached the tips of the toes." },
      { key: "organs", text: "The body is gaining fat and the skin is turning from red toward pink." },
      { key: "brain", text: "The brain keeps growing, helping your baby respond to light and sound." },
      { key: "senses", text: "The pupils can react to light." },
      { key: "movement", text: "Your baby practices breathing movements." },
    ],
    notice: ["A waddling walk as your body adjusts", "More tiredness than usual", "Swollen hands and feet"],
    tip: "Rest as much as you need; carrying the extra weight is tiring.",
  },
  33: {
    object: "Large pineapple",
    lengthIn: 17.2,
    weightOz: 67.02,
    big: {
      icon: "🦴",
      head: "A skull built to bend",
      text: "Bones are hardening, but the skull bones stay soft so your baby can pass through the birth canal.",
      why: "The brain and nervous system are well developed.",
    },
    highlights: ["The immune system is developing", "Bones keep hardening", "Movements feel less sharp as room runs out"],
    parts: [
      { key: "development", text: "The immune system is developing and the bones are hardening.", dyk: "Your baby's skull bones stay soft and flexible for birth." },
      { key: "organs", text: "The immune system is developing and the bones are hardening, except the skull, which stays soft." },
      { key: "brain", text: "The brain keeps maturing, and your baby is better at controlling the body." },
      { key: "senses", text: "Your baby can tell day from night through the light that reaches the womb." },
      { key: "movement", text: "Movements may feel less sharp as room runs out." },
    ],
    notice: ["A heavy, full feeling in your pelvis", "Tightening over your bump that comes and goes", "Restless nights"],
    tip: "If you have not yet, look into childbirth classes.",
  },
  34: {
    object: "Cantaloupe",
    lengthIn: 17.72,
    weightOz: 75.84,
    big: {
      icon: "🌀",
      head: "Curled up and settling low",
      text: "Your baby is curled up with legs bent toward the chest and may start settling head-down into your pelvis.",
      why: "If that happens, breathing and heartburn can ease a little.",
    },
    highlights: ["The lungs and nervous system are nearly mature", "Sight and hearing are well developed", "Your baby may settle head down"],
    parts: [
      { key: "development", text: "The nervous system and lungs are nearly mature.", dyk: "The creamy coating on your baby's skin is getting thicker." },
      { key: "organs", text: "The lungs and the digestive system are nearly mature and the vernix coating is thicker." },
      { key: "brain", text: "The central nervous system is maturing, ready to take on more tasks after birth." },
      { key: "senses", text: "Sight and hearing are well developed." },
      { key: "movement", text: "Your baby may settle into a head-down position." },
    ],
    notice: ["Easier breathing if your baby has settled lower", "More trips to the bathroom", "Colostrum may leak"],
    tip: "Pack your hospital bag and keep important numbers handy.",
  },
  35: {
    object: "Honeydew melon",
    lengthIn: 18.19,
    weightOz: 83.95,
    big: {
      icon: "🧁",
      head: "Getting chubbier",
      text: "Your baby is filling out to stay warm after birth, still moving even though space is tight.",
      why: "Colostrum, your first milk, may start to leak.",
    },
    highlights: ["The kidneys are fully developed", "The liver is starting to work", "There is less room to move"],
    parts: [
      { key: "development", text: "The kidneys are fully developed and the liver is starting to work.", dyk: "Most of your baby's weight gain now is fat." },
      { key: "organs", text: "The kidneys are fully developed, and the liver can process some waste." },
      { key: "brain", text: "The brain keeps developing, and your baby's reflexes get stronger." },
      { key: "senses", text: "Your baby is more aware of voices and may calm to familiar ones." },
      { key: "movement", text: "There is less room, but you should still feel regular movement." },
    ],
    notice: ["Yellowish stains in your bra from colostrum", "Sore ribs from kicks and your baby's position", "Painless tightenings (Braxton Hicks)"],
    tip: "If your breasts leak, breast pads can keep you comfortable.",
  },
  36: {
    object: "Romaine heart",
    lengthIn: 18.66,
    weightOz: 91.71,
    big: {
      icon: "🫁",
      head: "Lungs nearly ready",
      text: "The lungs are likely mature enough to breathe outside the womb, and your baby can suck and digest milk.",
      why: "Many babies move head-down around now.",
    },
    highlights: ["Fat builds up to help keep your baby warm", "Eyes can focus a short distance", "Many babies settle head down"],
    parts: [
      { key: "development", text: "Your baby is building fat to stay warm after birth.", dyk: "Most of the fine body hair is gone by about now." },
      { key: "organs", text: "Most of the fine body hair is gone and fat keeps building up." },
      { key: "brain", text: "The brain keeps developing, and your baby's reflexes are ready for sucking and swallowing." },
      { key: "senses", text: "Eyes are open when awake and your baby can focus a short distance." },
      { key: "movement", text: "Many babies move head-down around now, ready for birth." },
    ],
    notice: ["Your bump may drop as the head moves into the pelvis", "A little leaking when you laugh or cough", "Painless practice contractions"],
    tip: "Pelvic floor exercises can help if you leak when you laugh or cough.",
  },
  37: {
    object: "Swiss chard",
    lengthIn: 19.13,
    weightOz: 100.88,
    big: {
      icon: "🙂",
      head: "Practicing expressions",
      text: "Your baby is practicing frowning and smiling, and most babies are now head-down facing your back.",
      why: "Your bump may drop as the head settles into the pelvis.",
    },
    highlights: ["Your baby is now early term", "Sucking and breathing are being practiced", "Your baby is getting ready to know your voice"],
    parts: [
      { key: "development", text: "Your baby is now considered early term.", dyk: "Your baby has a firm grasp." },
      { key: "organs", text: "The organs are close to ready. Your baby keeps gaining weight and the lungs keep maturing." },
      { key: "brain", text: "The brain keeps developing and will continue to for years after birth." },
      { key: "senses", text: "Your baby is getting ready to recognize your voice and touch after birth." },
      { key: "movement", text: "Your baby practices sucking and breathing movements." },
    ],
    notice: ["Your bump 'dropping'", "More discharge", "A rush to clean and organize"],
    tip: "Be gentle with nesting; save some energy for the days ahead.",
  },
  38: {
    object: "Leek",
    lengthIn: 19.61,
    weightOz: 108.64,
    big: {
      icon: "🌾",
      head: "Almost there",
      text: "Most of the fine lanugo hair has shed, and the first stool, meconium, is gathering in the bowel.",
      why: "Your baby could arrive any day now.",
    },
    highlights: ["The organs are ready for life outside the womb", "Your baby hears you clearly", "Movements feel more like rolls than kicks"],
    parts: [
      { key: "development", text: "The organs are ready for life outside the womb.", dyk: "Your baby's gut is building up the first stool, called meconium." },
      { key: "organs", text: "The organs are ready for life outside the womb, and the gut is building up its first stool." },
      { key: "brain", text: "The brain is ready for life outside, though it keeps developing for years." },
      { key: "senses", text: "Your baby can still hear you clearly, so talking and singing is welcome." },
      { key: "movement", text: "Movements may feel more like rolls than kicks. Contact your care team if they change." },
    ],
    notice: ["Frustration or boredom while you wait", "Stronger Braxton Hicks tightenings", "Indigestion and constipation"],
    tip: "Know the signs of labor and who to call.",
  },
  39: {
    object: "Mini watermelon",
    lengthIn: 19.96,
    weightOz: 116.05,
    big: {
      icon: "🛡",
      head: "A tougher skin",
      text: "Your baby's skin now has a tougher outer layer, coated in vernix that helps on the way out.",
      why: "Hands and feet can look a little bluish just after birth.",
    },
    highlights: ["Your baby is full term", "The brain and lungs keep maturing", "Your baby sits low in the pelvis"],
    parts: [
      { key: "development", text: "Your baby is considered full term. The brain and lungs keep maturing.", dyk: "Your baby's brain will keep developing through the first years of life." },
      { key: "organs", text: "The lungs are ready for breathing, and your baby keeps gaining a little weight." },
      { key: "brain", text: "The brain keeps growing, and your baby is practicing for birth." },
      { key: "senses", text: "Hearing, sight and touch are ready for birth." },
      { key: "movement", text: "Your baby is low in the pelvis and moves less, but should keep moving." },
    ],
    notice: ["A 'show' of slimy, pinkish mucus can be an early sign of labor", "Back pain and pressure low in your bump", "Bursts of energy and nesting"],
    tip: "Waters can break as a trickle or a gush; call your care team if you think they have.",
  },
  40: {
    object: "Small watermelon",
    lengthIn: 20.16,
    weightOz: 122.05,
    big: {
      icon: "🎉",
      head: "Ready to meet you",
      text: "Your baby is fully ready, the lungs are mature and movement should carry on in your baby's usual pattern.",
      why: "Tell your care team promptly if movement changes.",
    },
    highlights: ["Your baby is ready to meet you", "Your baby knows your voice", "Keep tracking movements until the birth"],
    parts: [
      { key: "development", text: "Your baby is ready to meet you, though the exact day varies.", dyk: "Many babies arrive a little before or after their due date." },
      { key: "organs", text: "Your baby is fully formed. The organs are ready and the body is ready for life outside." },
      { key: "brain", text: "The brain and nerves are ready for life outside. Learning continues after birth." },
      { key: "senses", text: "Your baby knows your voice and will soon see your face." },
      { key: "movement", text: "Keep tracking movements and call your care team with any concern." },
    ],
    notice: ["Lower backache or period-like feelings that can mean labor is starting", "Waters that may break as a trickle or a gush", "Nerves and excitement"],
    tip: "Keep noticing your baby's movements and call your care team if they change.",
  },
};

export const BABY_WEEK_NUMBERS = Object.keys(BABY_WEEKS)
  .map(Number)
  .sort((a, b) => a - b);

export const FIRST_BABY_WEEK = BABY_WEEK_NUMBERS[0];
export const LAST_BABY_WEEK = BABY_WEEK_NUMBERS[BABY_WEEK_NUMBERS.length - 1];

// A measurement as value/unit pairs, so the unit can be drawn smaller ("1 lb 5 oz" → [["1","lb"],["5","oz"]])
export type BabyMeasure = [string, string][];

const trim = (value: number, digits = 1) => value.toFixed(digits).replace(/\.0$/, "");

// US units (inches) for lbs users, centimeters otherwise
export const formatBabyLength = (inches: number, unit: "kg" | "lbs"): BabyMeasure => {
  if (unit === "lbs") return [[inches < 0.1 ? "<0.1" : trim(inches), "in"]];
  const cm = inches * 2.54;
  return [[cm < 0.1 ? "<0.1" : cm < 10 ? trim(cm) : String(Math.round(cm)), "cm"]];
};

// Ounces under a pound, then pounds and ounces; grams under a kilogram, then kilograms
export const formatBabyWeight = (ounces: number, unit: "kg" | "lbs"): BabyMeasure => {
  if (unit === "lbs") {
    if (ounces < 0.1) return [["<0.1", "oz"]];
    if (ounces < 10) return [[trim(ounces), "oz"]];
    const total = Math.round(ounces);
    if (total < 16) return [[String(total), "oz"]];
    const pounds = Math.floor(total / 16);
    const rest = total % 16;
    return rest ? [[String(pounds), "lb"], [String(rest), "oz"]] : [[String(pounds), "lb"]];
  }
  const grams = ounces * 28.35;
  if (grams < 1) return [["<1", "g"]];
  if (grams < 1000) return [[String(Math.round(grams)), "g"]];
  return [[trim(grams / 1000), "kg"]];
};
