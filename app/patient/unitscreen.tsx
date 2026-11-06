import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUnitStore, WaterUnit } from "@/zustandStore/unitStore";
import UnitPicker from "@/components/vitals/UnitPicker";

// Units & Measurements for water
const UnitScreen = () => {
  const { t } = useTranslation();
  const { waterUnit, setWaterUnit } = useUnitStore();
  const [selectedUnit, setSelectedUnit] = useState<WaterUnit>(waterUnit);

  useEffect(() => {
    setSelectedUnit(waterUnit);
  }, [waterUnit]);

  return (
    <UnitPicker
      section={t("sectionTitle2")}
      options={[
        { id: "ml", label: t("ml") },
        { id: "fl.oz", label: t("flOz") },
      ]}
      selected={selectedUnit}
      onSelect={setSelectedUnit}
      onSave={() => {
        setWaterUnit(selectedUnit);
        router.back();
      }}
    />
  );
};

export default UnitScreen;
