const fs = require("fs");
const path = require("path");
const { withAndroidStyles, withDangerousMod } = require("@expo/config-plugins");

// Android draws Alert.alert and the date/time pickers with the system theme: grey in dark mode, teal accents.
// This gives all of them the app look. Same values as Theme.colors (constants/theme.ts): magenta, ink, inkSoft, surface.
const MAGENTA = "#B3006B";
const INK = "#191C1D";
const INK_SOFT = "#594049";
const SURFACE = "#FFFFFF";

// Alerts are AppCompat dialogs; the pickers are platform dialogs, and the Alert variant is wider than its content, which leaves a white strip beside the date header
const makeTheme = (name, parent) => ({
  $: { name, parent },
  item: [
    ["colorAccent", MAGENTA],
    ["android:colorAccent", MAGENTA],
    ["android:colorControlActivated", MAGENTA],
    ["android:textColorPrimary", INK],
    ["android:textColorSecondary", INK_SOFT],
    ["android:windowBackground", "@drawable/crosscare_dialog_bg"],
  ].map(([name, value]) => ({ $: { name }, _: value })),
});
const dialog = makeTheme("CrossCareDialog", "Theme.AppCompat.Light.Dialog.Alert");
const picker = makeTheme("CrossCarePicker", "android:Theme.Material.Light.Dialog");

module.exports = (config) => {
  config = withAndroidStyles(config, (c) => {
    const styles = c.modResults.resources;
    styles.style = styles.style.filter((s) => !["CrossCareDialog", "CrossCarePicker"].includes(s.$.name));
    styles.style.push(dialog, picker);
    const theme = styles.style.find((s) => s.$.name === "AppTheme");
    const wanted = { alertDialogTheme: "@style/CrossCareDialog", "android:datePickerDialogTheme": "@style/CrossCarePicker", "android:timePickerDialogTheme": "@style/CrossCarePicker" };
    theme.item = (theme.item || []).filter((i) => !(i.$.name in wanted));
    Object.entries(wanted).forEach(([name, value]) => theme.item.push({ $: { name }, _: value }));
    return c;
  });
  return withDangerousMod(config, [
    "android",
    (c) => {
      const dir = path.join(c.modRequest.platformProjectRoot, "app/src/main/res/drawable");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "crosscare_dialog_bg.xml"),
        `<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android">\n  <solid android:color="${SURFACE}"/>\n  <corners android:radius="20dp"/>\n</shape>\n`
      );
      return c;
    },
  ]);
};
