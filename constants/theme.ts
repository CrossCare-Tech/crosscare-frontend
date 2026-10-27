export const Theme = {
  colors: {
    // Palette: Lilac Mist (client choice). `canvasTop` is the tint at the top of every screen, fading into `bg`.
    bg: '#F8F4FD',
    canvasTop: '#E9DEFA',
    surface: '#FFFFFF',
    surfaceSunken: '#EFE8F8',
    surfaceSubtle: '#FAF7F8',

    // Tipografia / Textos
    ink: '#191C1D',
    inkSoft: '#594049',
    inkFaint: '#6A565D',
    hairline: '#E2D8F0',
    hairlineLight: '#F0ECEE',

    // Cores Principais do CrossCare Concierge
    magenta: '#B3006B',
    magentaVivid: '#E61B8D',
    magentaTint: '#FDEAF3',
    magentaHover: '#98005A',

    purple: '#5028A7',
    purpleTint: '#F1ECFB',
    purpleSoft: '#C9B8F0', // earlier days on vitals bar charts
    plum: '#2B1B45',

    teal: '#00838F',
    tealTint: '#E3F3F4',

    // Profile
    sosTint: '#FDE7F0', // emergency (911) icon chip
    photoFrom: '#F6D3E4', // profile photo placeholder gradient
    photoTo: '#D9CCF3',

    // Overlays
    scrim: 'rgba(25,28,29,0.4)', // backdrop behind modals
    onInkSoft: 'rgba(255,255,255,0.82)', // body text on the plum alert card
    onInkLine: 'rgba(255,255,255,0.4)', // outline button on the plum alert card

    // Feedback
    danger: '#B3261E',
    dangerTint: '#FBE9E7',
    caution: '#FFC400', // fill for warning icons; pair with ink, never as text on white
    warning: '#8A5A00',
    warningTint: '#FFF2D9',
    success: '#1E6E42',
    successTint: '#E4F5E9',

    // Inputs e bordas
    inputBorder: '#E2D8F0',
    inputBorderFocus: '#B3006B',
    inputBg: '#FFFFFF',
    placeholder: '#9C8890',

    // Social buttons
    socialBorder: '#E2D8F0',
    socialBg: '#FFFFFF',
  },
  // Home (prototype version B): tile gradients, progress bars and accents
  home: {
    tiles: {
      water: ['#EAF3FF', '#F7FAFF'] as [string, string],
      food: ['#FFEAF2', '#FFF6F9'] as [string, string],
      steps: ['#E6F8F1', '#F5FCF9'] as [string, string],
      due: ['#EFE9FF', '#F8F5FF'] as [string, string],
      pressure: ['#FFECEA', '#FFF7F6'] as [string, string],
      glucose: ['#FFF3DE', '#FFFAF0'] as [string, string],
    },
    bars: {
      water: ['#4DA3FF', '#3B6FE8'] as [string, string],
      steps: ['#34D3A0', '#12A47A'] as [string, string],
      default: ['#E61B8D', '#5028A7'] as [string, string],
    },
    tileBorder: 'rgba(255,255,255,0.8)',
    tileChip: 'rgba(255,255,255,0.75)', // chevron chip on tiles
    waterButton: '#4F86F0',
    waterButtonDisabled: '#B8C6E6',
    hero: ['#F4ECFF', '#FBE8F4', '#F1E8FF'] as [string, string, string],
    heroTagBg: 'rgba(255,255,255,0.7)',
    heroTagBorder: 'rgba(80,40,167,0.14)',
    heroButtonEnd: '#6A46C2',
    ringTrack: 'rgba(255,255,255,0.8)',
    babyBg: '#F7F1E8',
    sosBorder: '#F2C6DA',
    dayInfoText: '#0A4A52',
  },
  // Health Reminders: accent of each reminder type (icons only; text stays ink)
  reminderTypes: {
    water: '#4F86F0',
    steps: '#12A47A',
    sleep: '#7B4FC9',
    heart: '#D64545',
    weight: '#00838F',
    medication: '#C77A12',
  } as Record<string, string>,
  // Health Reminders empty state illustration
  reminderEmpty: {
    halo: '#FCE9EE',
    calendarTop: '#DCD0F2',
    calendarDot: '#EADFF7',
    check: '#E07A93',
    heart: '#E8A3B4',
    leaf: '#A9D3CB',
  },
  typography: {
    display: 'Fraunces600',
    heading: 'Manrope700',
    subheading: 'Manrope600',
    body: 'Manrope400',
    caption: 'Manrope500',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    xs: 6,
    sm: 8, // buttons and inputs, as in the prototype
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#5028A7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    card: {
      shadowColor: '#191C1D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
    },
  },
};

export default Theme;
