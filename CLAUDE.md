# CrossCare front end: UI rules

Everything in this repo (code, comments, docs, commit messages) is written in English.

## Theme (client decision: Lilac Mist canvas + Meadow surface)

- Every new or restyled screen is wrapped in `<ScreenBackground>` from `components/ui/ScreenBackground.tsx`.
  It draws the Lilac Mist gradient and the Meadow glows and makes the status bar translucent.
  The screen's own container must have **no** `backgroundColor` (transparent), or the gradient is hidden.
- Use the SafeAreaView inside `ScreenBackground`, not the other way around, so the gradient reaches the screen edges:

  ```tsx
  <ScreenBackground>
    <SafeAreaView style={styles.safeArea}>...</SafeAreaView>
  </ScreenBackground>
  ```

- Cards, inputs and buttons that hold data stay **white** (`Theme.colors.surface`) so text stays legible on the tinted canvas.
- All colors, spacing, radii and shadows come from `constants/theme.ts` (`Theme`). Do not write hex values in screens.
  If a color is missing, add a token to `Theme` first, then use it.
- Fonts: `Theme.typography` (Fraunces for display titles, Manrope for everything else).
- Secondary text uses `Theme.colors.inkFaint` (`#6A565D`, AA contrast). Do not use lighter greys.
- Do not edit `ScreenBackground` or the palette tokens to tweak one screen. The palette is a client decision;
  change it only when asked, in `Theme` and `ScreenBackground` only.

## Exceptions (ask before using)

Screens that are dark on purpose (`bedtime`, `sleep`) and the Ask Doula chat keep their own backgrounds until redesigned.

## Reference

- Reference screens: `app/login.tsx`, `app/signup.tsx`. Copy their structure for new screens.
- The design prototype (palette `Lilac Mist`, surface `Meadow`) lives in `Prototipo/lp_cross` at the project root;
  `/backgrounds/` shows the pickers. When the app and the prototype disagree, the prototype is the source of truth.
- Reusable pieces already in `components/ui`: `AuthTopBar`, `CustomTextInput`, `InlineNotice`, `AuthDialog`, `OtpInput`, `AuthSuccess`.
  Reuse them before creating new ones.
