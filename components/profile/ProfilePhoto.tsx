import React from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/userSlice";
import { CONFIG } from "@/constants/config";
import LineIcon from "./LineIcon";
import { Theme } from "@/constants/theme";

// Picks a square photo from the library, uploads it and stores it in Redux.
// Returns the local uri of the picked image, or null when nothing was picked.
export const usePickProfileImage = () => {
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();

  return async (): Promise<string | null> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile picture."
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return null;

      const uri = result.assets[0].uri;

      const formData = new FormData();
      formData.append("imageUrl", {
        uri,
        type: "image/jpeg",
        name: "profile-image.jpg",
      } as any);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile/image`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      dispatch(setUser({ ...user, user_photo: uri }));
      return uri;
    } catch (error) {
      console.error("Error updating profile image:", error);
      return null;
    }
  };
};

// Prototype `.photo.photo-lg` with its `.edit-badge`
const ProfilePhoto = ({
  uri,
  onPress,
}: {
  uri?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityLabel="Edit photo"
  >
    <LinearGradient
      colors={[Theme.colors.photoFrom, Theme.colors.photoTo]}
      start={{ x: 0.25, y: 0.07 }}
      end={{ x: 0.75, y: 0.93 }}
      style={styles.photo}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.photoImage} />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 56 56">
          <Circle cx="28" cy="22" r="9.5" fill={Theme.colors.surface} opacity={0.88} />
          <Path
            d="M8 56c0-13 8-19 20-19s20 6 20 19z"
            fill={Theme.colors.surface}
            opacity={0.88}
          />
        </Svg>
      )}
    </LinearGradient>
    <View style={styles.editBadge}>
      <LineIcon size={14} color={Theme.colors.surface} strokeWidth={2.4}>
        <Path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
      </LineIcon>
    </View>
  </TouchableOpacity>
);

export default ProfilePhoto;

const styles = StyleSheet.create({
  photo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.magenta,
    borderWidth: 2,
    borderColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
