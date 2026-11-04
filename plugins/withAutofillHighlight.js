const { withAndroidStyles } = require("@expo/config-plugins");

// Android paints a field yellow when the password manager fills it. Keep the autofill, drop the tint.
module.exports = (config) =>
  withAndroidStyles(config, (c) => {
    const theme = c.modResults.resources.style.find((s) => s.$.name === "AppTheme");
    theme.item = (theme.item || []).filter((i) => i.$.name !== "android:autofilledHighlight");
    theme.item.push({ $: { name: "android:autofilledHighlight", "tools:targetApi": "26" }, _: "@android:color/transparent" });
    return c;
  });
