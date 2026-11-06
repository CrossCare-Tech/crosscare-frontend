import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useEffect, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { Path } from "react-native-svg"
import { changeLanguage } from "@/translation/i18next"
import { Theme } from "@/constants/theme"
import ScreenBackground from "@/components/ui/ScreenBackground"
import AuthTopBar from "@/components/ui/AuthTopBar"
import LineIcon from "@/components/profile/LineIcon"

const languages = [
  { id: "en", name: "English", nativeName: "English (US)" },
  { id: "es", name: "Spanish", nativeName: "Español" },
  { id: "pt", name: "Portuguese", nativeName: "Português" },
  { id: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen" },
]

const Language = () => {
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en")

  useEffect(() => {
    // Load saved language on component mount
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage")
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("Error loading language:", error)
      }
    }

    loadLanguage()
  }, [])

  const handleLanguageSelect = async (langId: string) => {
    try {
      await changeLanguage(langId)
      setSelectedLanguage(langId)

      // Let the check mark show before going back
      setTimeout(() => {
        router.back()
      }, 500)
    } catch (error) {
      console.error("Error saving language:", error)
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AuthTopBar title={t("profile.language")} />
          <View style={styles.content}>
            {/* Prototype `.card-soft` with one `.rowline` per language */}
            <View style={styles.card}>
              {languages.map((item, index) => {
                const isSelected = selectedLanguage === item.id
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.row,
                      index === languages.length - 1 && styles.rowLast,
                    ]}
                    onPress={() => handleLanguageSelect(item.id)}
                    activeOpacity={0.6}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View>
                      <Text style={styles.name}>{item.nativeName}</Text>
                      <Text style={styles.sub}>{item.name}</Text>
                    </View>
                    {isSelected && (
                      <LineIcon size={17} color={Theme.colors.magenta}>
                        <Path d="M5 12.5l4.5 4.5L19 7" />
                      </LineIcon>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  )
}

export default Language

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // 44px minimum touch target
    minHeight: 56,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  name: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  sub: {
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
})
