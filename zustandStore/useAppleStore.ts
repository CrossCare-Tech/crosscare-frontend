import BrokenHealthKit, { HealthKitPermissions } from "react-native-health";

const NativeModules = require("react-native").NativeModules;
const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
AppleHealthKit.Constants = BrokenHealthKit.Constants;
  

  const permissions: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
      ],
      write: [],
    },
  };
  
  // Simple function to check Apple Health availability and permissions
  export const checkAppleHealthConnection = (): Promise<{
    isAvailable: boolean;
    hasPermissions: boolean;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      // Skip the isAvailable check for now and go directly to initHealthKit
      // The initHealthKit method will handle availability internally
      console.log('🍎 Attempting to initialize Apple Health...');
  
      AppleHealthKit.initHealthKit(permissions, (initError) => {
        if (initError) {
          console.log('❌ Apple Health initialization failed:', initError);
          
          // Check if it's an availability issue or permission issue
          if (initError.includes('not available') || initError.includes('HealthKit')) {
            resolve({
              isAvailable: false,
              hasPermissions: false,
              error: initError,
            });
          } else {
            resolve({
              isAvailable: true,
              hasPermissions: false,
              error: initError,
            });
          }
          return;
        }
  
        console.log('✅ Apple Health initialized successfully!');
        resolve({
          isAvailable: true,
          hasPermissions: true,
        });
      });
    });
  };
  
  // Simple function to test basic data access
  export const testAppleHealthData = (): Promise<{
    success: boolean;
    stepCount?: number;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const options = {
        startDate: yesterday.toISOString(),
        endDate: today.toISOString(),
      };
  
      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          console.log('❌ Error getting step count:', error);
          resolve({
            success: false,
            error: error,
          });
          return;
        }
  
        console.log('✅ Successfully retrieved step data:', results.value);
        resolve({
          success: true,
          stepCount: results.value,
        });
      });
    });
  };
  
  // Alternative method using getAuthStatus to check permissions
  export const checkAppleHealthPermissions = (): Promise<{
    isAuthorized: boolean;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(permissions, (error, results) => {
        if (error) {
          console.log('❌ Error checking auth status:', error);
          resolve({
            isAuthorized: false,
            error: error,
          });
          return;
        }
  
        console.log('✅ Auth status results:', results);
        resolve({
          isAuthorized: true,
        });
      });
    });
  };