import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

const Citations = () => {
  const { t } = useTranslation();

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening link:", error);
    }
  };

  const LinkText = ({ children, url }: { children: string; url: string }) => (
    <Text 
      style={styles.linkText}
      onPress={() => handleLinkPress(url)}
    >
      {children}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#373737" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sources and Medical Citations</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Citations Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.introText}>
          The information in this app, as well as the medical guidance provided by the AI CrossCare Concierge, is based on trusted medical and health sources to ensure accuracy and reliability for expectant mothers. This content is intended for informational and educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. For any medical concerns or final decisions related to your health, please consult your qualified healthcare provider.
        </Text>

        <Text style={styles.subheading}>
          Below are the primary sources used to develop content related to pregnancy health, risks, prevention, and wellness:
        </Text>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>American College of Obstetricians and Gynecologists (ACOG)</Text>
          <Text style={styles.citationDescription}>
            General guidelines on pregnancy health, fetal development, and common questions during pregnancy are based on publications from <LinkText url="https://www.acog.org">https://www.acog.org</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Centers for Disease Control and Prevention (CDC)</Text>
          <Text style={styles.citationDescription}>
            Information about maternal lead exposure, diabetes during pregnancy, breastfeeding in special circumstances, and general maternal health guidance is based on resources from <LinkText url="https://www.cdc.gov">https://www.cdc.gov</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>MedlinePlus (U.S. National Library of Medicine)</Text>
          <Text style={styles.citationDescription}>
            Medical definitions, symptoms, and treatment guidance referenced from <LinkText url="https://medlineplus.gov">https://medlineplus.gov</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>PubMed Central (PMC)</Text>
          <Text style={styles.citationDescription}>
            Scientific studies and medical journal content used to support findings related to air pollution, thyroid disruption, stress in pregnancy, and other prenatal risk factors were sourced from <LinkText url="https://www.ncbi.nlm.nih.gov/pmc">https://www.ncbi.nlm.nih.gov/pmc</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>National Center for Biotechnology Information (NCBI)</Text>
          <Text style={styles.citationDescription}>
            Clinical overviews, effects of environmental exposures, and fetal development factors were referenced from <LinkText url="https://www.ncbi.nlm.nih.gov">https://www.ncbi.nlm.nih.gov</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)</Text>
          <Text style={styles.citationDescription}>
            Insights into the effects of stress during pregnancy and child development sourced from <LinkText url="https://www.nichd.nih.gov">https://www.nichd.nih.gov</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Stanford Medicine Children's Health</Text>
          <Text style={styles.citationDescription}>
            Information about lead exposure during pregnancy is based on educational material published by <LinkText url="https://www.stanfordchildrens.org">https://www.stanfordchildrens.org</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>UMMS Health</Text>
          <Text style={styles.citationDescription}>
            Guidance on environmental risks such as lead and litter exposure in pregnancy from <LinkText url="https://www.umms.org">https://www.umms.org</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Harvard T.H. Chan School of Public Health</Text>
          <Text style={styles.citationDescription}>
            Research findings on air pollution and pregnancy outcomes were sourced from <LinkText url="https://www.hsph.harvard.edu">https://www.hsph.harvard.edu</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Johns Hopkins Bloomberg School of Public Health</Text>
          <Text style={styles.citationDescription}>
            Studies on the long-term effects of low-level air pollution on fetal development are referenced from <LinkText url="https://publichealth.jhu.edu">https://publichealth.jhu.edu</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>Nature Scientific Reports</Text>
          <Text style={styles.citationDescription}>
            Peer-reviewed data on air pollution's effect on pregnancy and adverse birth outcomes from <LinkText url="https://www.nature.com">https://www.nature.com</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>PubMed (NIH)</Text>
          <Text style={styles.citationDescription}>
            Research on endocrine disruption, nutritional deficiency, environmental risks, and health disparities during pregnancy sourced from <LinkText url="https://pubmed.ncbi.nlm.nih.gov">https://pubmed.ncbi.nlm.nih.gov</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>U.S. Congress – Congressional Research Service (CRS)</Text>
          <Text style={styles.citationDescription}>
            Policy overviews related to maternal and child health referenced from <LinkText url="https://sgp.fas.org/crs">https://sgp.fas.org/crs</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>National Academy of Medicine / Bookshelf (NIH)</Text>
          <Text style={styles.citationDescription}>
            Used for reference on medical research methods and care models: <LinkText url="https://www.ncbi.nlm.nih.gov/books">https://www.ncbi.nlm.nih.gov/books</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>National Academy for State Health Policy (NASHP)</Text>
          <Text style={styles.citationDescription}>
            Referenced for social determinants of health and policy strategies regarding Medicaid and maternal care from <LinkText url="https://www.nashp.org">https://www.nashp.org</LinkText>.
          </Text>
        </View>

        <View style={styles.citationItem}>
          <Text style={styles.citationTitle}>WebMD</Text>
          <Text style={styles.citationDescription}>
            General wellness tips and hydration advice during pregnancy referenced from <LinkText url="https://www.webmd.com">https://www.webmd.com</LinkText>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Citations;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#373737",
    textAlign: "center",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#373737",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "justify",
  },
  subheading: {
    fontSize: 15,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 20,
    lineHeight: 22,
  },
  citationItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  citationTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#F66DCE",
    marginBottom: 8,
    lineHeight: 22,
  },
  citationDescription: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#373737",
    lineHeight: 20,
    textAlign: "justify",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "DMSans500",
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});
