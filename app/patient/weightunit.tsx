import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUnitStore, WeightUnit } from "@/zustandStore/unitStore";
import UnitPicker from "@/components/vitals/UnitPicker";

// Units & Measurements for weight
const WeightUnitScreen = () => {
  const { t } = useTranslation();
  const { weightUnit, setWeightUnit } = useUnitStore();
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(weightUnit);

  useEffect(() => {
    setSelectedUnit(weightUnit);
  }, [weightUnit]);

  return (
    <UnitPicker
      section={t("sectionTitle")}
      options={[
        { id: "kg", label: t("kg") },
        { id: "lbs", label: t("lbs") },
      ]}
      selected={selectedUnit}
      onSelect={setSelectedUnit}
      onSave={() => {
        setWeightUnit(selectedUnit);
        router.back();
      }}
    />
  );
};

export default WeightUnitScreen;
