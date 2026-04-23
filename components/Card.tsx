import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CardProps {
  title: string;
  bg1: string;
  bg2: string;
  description: string;
  image1: any;
  id:string;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  bg1,
  bg2,
  image1,
  id,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardPressable}>
      <LinearGradient colors={[bg1, bg2]} style={styles.card}>
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          <Image
            source={image1}
            style={{ width: 84, height: 84, borderRadius: 100, borderWidth:0, }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardPressable: {
    height: 110,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
  },
  card: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1, // Ensure card content is above the gradient
  },
  cardTitle: {
    fontSize: 18,
    color: "white",
    fontFamily: "DMSans700",
  },
  cardDescription: {
    fontSize: 12,
    color: "white",
    fontFamily: "DMSans400",
  },
});

export default Card;
