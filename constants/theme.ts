export const Theme = {
  colors: {
    bg: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSunken: '#F1EFF1',
    surfaceSubtle: '#FAF7F8',

    // Tipografia / Textos
    ink: '#191C1D',
    inkSoft: '#594049',
    inkFaint: '#9C8890',
    hairline: '#E7E1E3',
    hairlineLight: '#F0ECEE',

    // Cores Principais do CrossCare Concierge
    magenta: '#B3006B',
    magentaVivid: '#E61B8D',
    magentaTint: '#FDEAF3',
    magentaHover: '#98005A',

    purple: '#5028A7',
    purpleTint: '#F1ECFB',
    plum: '#2B1B45',

    teal: '#00838F',
    tealTint: '#E3F3F4',

    // Feedback
    danger: '#B3261E',
    dangerTint: '#FBE9E7',
    caution: '#FFC400', // fill for warning icons; pair with ink, never as text on white
    warning: '#8A5A00',
    warningTint: '#FFF2D9',
    success: '#1E6E42',
    successTint: '#E4F5E9',

    // Inputs e bordas
    inputBorder: '#E7E1E3',
    inputBorderFocus: '#B3006B',
    inputBg: '#FFFFFF',
    placeholder: '#9C8890',

    // Social buttons
    socialBorder: '#E7E1E3',
    socialBg: '#FFFFFF',
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
