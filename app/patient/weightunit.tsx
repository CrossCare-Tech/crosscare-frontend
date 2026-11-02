import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useUnitStore, WeightUnit } from "@/zustandStore/unitStore";

const weightunit = () => {
  const {t} = useTranslation();
  const { weightUnit, setWeightUnit } = useUnitStore();
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(weightUnit);

  useEffect(() => {
    setSelectedUnit(weightUnit);
  }, [weightUnit]);

  const handleSave = () => {
    // Save the selected unit to the store
    setWeightUnit(selectedUnit);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('title')}</Text>
        <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('sectionTitle')}</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setSelectedUnit('kg')}
          >
            <Text style={styles.optionText}>{t('kg')}</Text>
            {selectedUnit === 'kg' && (
              <Ionicons name="checkmark" size={16} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setSelectedUnit('lbs')}
          >
            <Text style={styles.optionText}>{t('lbs')}</Text>
            {selectedUnit === 'lbs' && (
              <Ionicons name="checkmark" size={16} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default weightunit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#007AFF",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily:'DMSans600',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal:10,
    borderColor: '#C8C7CC',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
    fontFamily:'Inter500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C8C7CC',
    marginLeft: 16,
  },
});
