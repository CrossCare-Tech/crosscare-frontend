# Prompt: build or restyle a screen with the CrossCare theme

Copy everything inside the block below into Claude (or your AI assistant) at the start of a screen task,
then add the name of the screen and a short description at the end.

````markdown
You are working in the CrossCare React Native (Expo) front end. Follow these rules exactly.
Read `CLAUDE.md` and `constants/theme.ts` first, and use `app/login.tsx` as the structural reference.

## Theme (client decision)
- Canvas: **Lilac Mist**. Surface: **Meadow**. Both are already implemented in
  `components/ui/ScreenBackground.tsx`. Do not recreate or change them.
- Wrap the whole screen in `<ScreenBackground>` and put the `SafeAreaView` inside it.
  The container styles must NOT set `backgroundColor`, otherwise the gradient disappears.
- Cards, inputs and data blocks stay white (`Theme.colors.surface`). Borders use `Theme.colors.hairline`.
- No hex colors in the screen. Use `Theme.colors.*`, `Theme.spacing.*`, `Theme.borderRadius.*`, `Theme.shadows.*`.
  If a token is missing, add it to `constants/theme.ts` and tell me.
- Fonts from `Theme.typography` only (Fraunces for display titles, Manrope for body and UI).
- Secondary text: `Theme.colors.inkFaint`. Primary actions: magenta (`Theme.colors.magenta`). Touch targets at least 44 px.
- Reuse components from `components/ui` (`AuthTopBar`, `CustomTextInput`, `InlineNotice`, `AuthDialog`, ...) before creating new ones.
- Do not touch `ScreenBackground`, the palette tokens, navigation or business logic unless I ask.
- Everything in English: code, comments, UI copy keys, commit messages.

## Workflow
1. Work on your own branch named `ui/phase3/<area>/<screen>` created from the latest theme branch or `main` once the theme is merged.
2. Keep behavior unchanged: this task is visual only (layout, colors, typography, spacing).
3. Run `npx tsc --noEmit` and check that you added no new errors in the files you touched.
4. Run the app on the phone and compare with the prototype (`Prototipo/lp_cross`). Report differences instead of silently inventing new styles.
5. Small commits, one concern each, in the form `feat(<area>): <what changed>`.

## Done when
- The screen shows the Lilac Mist gradient and Meadow glows, with the phone status bar blending in.
- No hex values or `backgroundColor` on the root container.
- Cards and inputs are white and readable.
- Nothing else in the app changed.

## Screen to build
<screen name, route, and what it shows>
````
