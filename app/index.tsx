import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Provider, useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken, setToken } from "../store/userSlice";
import { jwtDecode } from "jwt-decode";
import '../translation/i18next';
import { store } from "../store/store";
import { View, Text } from "react-native";

// Separate component that uses Redux hooks
const IndexContent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("userToken");
      if (storedToken) {
        try {
          const decoded: any = jwtDecode(storedToken);

          // Check if the token is expired
          console.log(decoded.exp);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem("userToken");
            dispatch(removeToken());
          } else {
            dispatch(setToken(storedToken));
          }
        } catch (error) {
          console.log("Invalid token");
          await AsyncStorage.removeItem("userToken");
          dispatch(removeToken());
        }
      }
      setIsLoading(false);
    };

    loadToken();
  }, [dispatch]);

  if (isLoading) return <View><Text>Loading...</Text></View>; // Show loading indicator

  return (
    <Redirect href={user?.token ? "/patient/(tabs)/home" : "/login"} />
  );
};

// Main component that wraps Redux Provider
const Index = () => {
  // This ensures Redux is available in this component tree
  return (
    <Provider store={store}>
      <IndexContent />
    </Provider>
  );
};

export default Index;