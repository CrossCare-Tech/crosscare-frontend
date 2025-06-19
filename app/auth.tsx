import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have an authorization code from Fitbit
        const code = params.code as string;
        const error = params.error as string;

        console.log('Auth callback params:', params);

        if (error) {
          console.error('Fitbit OAuth error:', error);
          // Redirect back to steps screen with error
          router.replace('/patient/(tabs)/home');
          return;
        }

        if (code) {
          console.log('Received Fitbit auth code:', code);
          // The code will be handled by the existing OAuth flow in useFitbitStore
          // Just redirect back to the steps screen - the auth flow will continue automatically
          router.replace('/patient/(tabs)/home');
        } else {
          console.log('No auth code received, redirecting back');
          router.replace('/patient/(tabs)/home');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        router.replace('/patient/(tabs)/home');
      }
    };

    // Small delay to ensure params are loaded
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5E4FA2" />
      <Text style={styles.text}>Connecting to Fitbit...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Inter400',
  },
});