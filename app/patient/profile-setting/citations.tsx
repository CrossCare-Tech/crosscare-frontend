import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";

// Medical sources shown to satisfy App Store guideline 1.4.1 (also linked from the
// Ask Doula banner). Source copy stays in English, as it did before the redesign.
const INTRO =
  "The information in this app, as well as the medical guidance provided by the AI CrossCare Concierge, is based on trusted medical and health sources to ensure accuracy and reliability for expectant mothers. This content is intended for informational and educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. For any medical concerns or final decisions related to your health, please consult your qualified healthcare provider.";

const SOURCES: { title: string; topic: string; url: string }[] = [
  {
    title: "American College of Obstetricians and Gynecologists (ACOG)",
    topic: "Pregnancy health, fetal development and common questions during pregnancy",
    url: "https://www.acog.org",
  },
  {
    title: "Centers for Disease Control and Prevention (CDC)",
    topic: "Maternal lead exposure, diabetes in pregnancy, breastfeeding and maternal health",
    url: "https://www.cdc.gov",
  },
  {
    title: "MedlinePlus (U.S. National Library of Medicine)",
    topic: "Medical definitions, symptoms and treatment guidance",
    url: "https://medlineplus.gov",
  },
  {
    title: "PubMed Central (PMC)",
    topic: "Studies on air pollution, thyroid disruption, stress and other prenatal risk factors",
    url: "https://www.ncbi.nlm.nih.gov/pmc",
  },
  {
    title: "National Center for Biotechnology Information (NCBI)",
    topic: "Clinical overviews, environmental exposures and fetal development",
    url: "https://www.ncbi.nlm.nih.gov",
  },
  {
    title: "Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)",
    topic: "Effects of stress during pregnancy and child development",
    url: "https://www.nichd.nih.gov",
  },
  {
    title: "Stanford Medicine Children's Health",
    topic: "Lead exposure during pregnancy",
    url: "https://www.stanfordchildrens.org",
  },
  {
    title: "UMMS Health",
    topic: "Environmental risks such as lead and litter exposure in pregnancy",
    url: "https://www.umms.org",
  },
  {
    title: "Harvard T.H. Chan School of Public Health",
    topic: "Air pollution and pregnancy outcomes",
    url: "https://www.hsph.harvard.edu",
  },
  {
    title: "Johns Hopkins Bloomberg School of Public Health",
    topic: "Long-term effects of low-level air pollution on fetal development",
    url: "https://publichealth.jhu.edu",
  },
  {
    title: "Nature Scientific Reports",
    topic: "Air pollution's effect on pregnancy and adverse birth outcomes",
    url: "https://www.nature.com",
  },
  {
    title: "PubMed (NIH)",
    topic: "Endocrine disruption, nutritional deficiency, environmental risks and health disparities",
    url: "https://pubmed.ncbi.nlm.nih.gov",
  },
  {
    title: "U.S. Congress – Congressional Research Service (CRS)",
    topic: "Policy overviews on maternal and child health",
    url: "https://sgp.fas.org/crs",
  },
  {
    title: "National Academy of Medicine / Bookshelf (NIH)",
    topic: "Medical research methods and care models",
    url: "https://www.ncbi.nlm.nih.gov/books",
  },
  {
    title: "National Academy for State Health Policy (NASHP)",
    topic: "Social determinants of health and Medicaid maternal care policy",
    url: "https://www.nashp.org",
  },
  {
    title: "WebMD",
    topic: "General wellness tips and hydration advice during pregnancy",
    url: "https://www.webmd.com",
  },
];

const openSource = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error("Error opening link:", error);
  }
};

const Citations = () => {
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AuthTopBar title={t("profile.sourcesCitations")} />
          <View style={styles.content}>
            <Text style={styles.intro}>{INTRO}</Text>

            {SOURCES.map((source) => (
              <TouchableOpacity
                key={source.url}
                style={styles.row}
                onPress={() => openSource(source.url)}
                activeOpacity={0.6}
                accessibilityRole="link"
              >
                <View style={styles.iconChip}>
                  <LineIcon size={17} color={Theme.colors.purple}>
                    <Path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
                    <Path d="M14 3.5V8h4" />
                  </LineIcon>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.title}>{source.title}</Text>
                  <Text style={styles.topic}>{source.topic}</Text>
                </View>
                <LineIcon size={15} color={Theme.colors.inkSoft}>
                  <Path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
                  <Path d="M14 4h6v6M20 4 11 13" />
                </LineIcon>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default Citations;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 12,
  },
  intro: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  title: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.ink,
  },
  topic: {
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkFaint,
    marginTop: 1,
  },
});
