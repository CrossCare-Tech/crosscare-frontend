import BrokenHealthKit, { HealthKitPermissions } from "react-native-health";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "@/constants/config";
import { Platform } from "react-native";

// Only initialize AppleHealthKit on iOS
let AppleHealthKit: typeof BrokenHealthKit | null = null;

if (Platform.OS === 'ios') {
  const NativeModules = require("react-native").NativeModules;
  AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
  
  // Only set Constants if AppleHealthKit exists
  if (AppleHealthKit) {
    AppleHealthKit.Constants = BrokenHealthKit.Constants;
  }
}

// Define permissions only for iOS
const permissions: HealthKitPermissions | null = Platform.OS === 'ios' && AppleHealthKit?.Constants ? {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.RestingHeartRate,
      ],
      write: [],
    },
  } : null;

interface AppleHealthState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastConnectionCheck: number | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  getStepsData: () => Promise<any>;
  getDataForRange: (dataType: string, startDate: string, endDate: string) => Promise<any>;
  syncStepsGoalWithBackend: (userId: string, defaultGoal?: number) => Promise<number | null>;
  syncStepsWithBackend: (userId: string) => Promise<any>;
  getSleepData: () => Promise<any>;
  getSleepDataForRange: (timeRange: string) => Promise<any>;
  syncSleepWithBackend: (userId: string) => Promise<any>;
  // HEART RATE FUNCTIONALITY
  getHeartRateData: (date: string, period: string) => Promise<any>;
  getHeartRateDataForRange: (timeRange: string) => Promise<any>;
  getCurrentHeartRate: () => Promise<number>;
  syncHeartRateWithBackend: (userId: string) => Promise<any>;
}

export const useAppleHealth = create<AppleHealthState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isLoading: false,
      error: null,
      lastConnectionCheck: null,

      checkConnection: async () => {
        // Return false immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return false;
        }
        
        const { isConnected, lastConnectionCheck } = get();
        const now = Date.now();
        
        // If we think we're connected and checked recently (within 5 minutes), assume still connected
        if (isConnected && lastConnectionCheck && (now - lastConnectionCheck) < 5 * 60 * 1000) {
          return true;
        }

        // Otherwise, verify the connection
        set({ isLoading: true });
        
        try {
          return new Promise<boolean>((resolve) => {
            console.log('🍎 Checking Apple Health connection...');
            
            AppleHealthKit!.initHealthKit(permissions!, (initError) => {
              if (initError) {
                console.log('❌ Apple Health connection check failed:', initError);
                set({ 
                  isConnected: false, 
                  isLoading: false, 
                  error: `Connection check failed: ${initError}`,
                  lastConnectionCheck: now
                });
                resolve(false);
                return;
              }

              // Test data access to confirm connection
              const today = new Date();
              const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
              
              const options = {
                startDate: yesterday.toISOString(),
                endDate: today.toISOString(),
              };

              AppleHealthKit!.getStepCount(options, (error, results) => {
                if (error) {
                  console.log('❌ Error accessing Apple Health data:', error);
                  set({ 
                    isConnected: false, 
                    isLoading: false, 
                    error: `Failed to access data: ${error}`,
                    lastConnectionCheck: now
                  });
                  resolve(false);
                  return;
                }

                console.log('✅ Apple Health connection verified!');
                set({ 
                  isConnected: true, 
                  isLoading: false, 
                  error: null,
                  lastConnectionCheck: now
                });
                resolve(true);
              });
            });
          });
        } catch (error) {
          console.error('Error checking Apple Health connection:', error);
          set({ 
            isConnected: false, 
            isLoading: false, 
            error: `Unexpected error: ${error}`,
            lastConnectionCheck: now
          });
          return false;
        }
      },

      connect: async () => {
        // Return false immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return false;
        }
        
        set({ isLoading: true, error: null });
        try {
          return new Promise<boolean>((resolve) => {
            console.log('🍎 Attempting to initialize Apple Health...');
            
            AppleHealthKit!.initHealthKit(permissions!, async (initError) => {
              if (initError) {
                console.log('❌ Apple Health initialization failed:', initError);
                set({ 
                  isConnected: false, 
                  isLoading: false, 
                  error: `Failed to connect: ${initError}`,
                  lastConnectionCheck: Date.now()
                });
                resolve(false);
                return;
              }

              // Successfully initialized, now check if we can access data
              const today = new Date();
              const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
              
              const options = {
                startDate: yesterday.toISOString(),
                endDate: today.toISOString(),
              };

              AppleHealthKit!.getStepCount(options, (error, results) => {
                if (error) {
                  console.log('❌ Error getting step data:', error);
                  set({ 
                    isConnected: false, 
                    isLoading: false, 
                    error: `Failed to access step data: ${error}`,
                    lastConnectionCheck: Date.now()
                  });
                  resolve(false);
                  return;
                }

                console.log('✅ Successfully connected to Apple Health!');
                set({ 
                  isConnected: true, 
                  isLoading: false, 
                  error: null,
                  lastConnectionCheck: Date.now()
                });
                
                // Store connection status in AsyncStorage as backup
                AsyncStorage.setItem('appleHealthConnected', 'true');
                resolve(true);
              });
            });
          });
        } catch (error) {
          console.error('Error connecting to Apple Health:', error);
          set({ 
            isConnected: false, 
            isLoading: false, 
            error: `Unexpected error: ${error}`,
            lastConnectionCheck: Date.now()
          });
          return false;
        }
      },

      disconnect: async () => {
        // No-op on Android
        if (Platform.OS !== 'ios') {
          return;
        }
        
        set({ isLoading: true });
        try {
          // Apple Health doesn't have a proper disconnect method,
          // so we just update our state to reflect disconnection
          set({ 
            isConnected: false, 
            isLoading: false, 
            error: null,
            lastConnectionCheck: Date.now()
          });
          
          // Remove connection status from AsyncStorage
          await AsyncStorage.removeItem('appleHealthConnected');
        } catch (error) {
          console.error('Error disconnecting from Apple Health:', error);
          set({ isLoading: false, error: `Failed to disconnect: ${error}` });
        }
      },

      // STEPS FUNCTIONALITY
      getStepsData: async () => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          const today = new Date();
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
          };

          return new Promise((resolve, reject) => {
            AppleHealthKit!.getStepCount(options, (error, results) => {
              if (error) {
                console.error('Error getting step data:', error);
                // If we get an error, the connection might be lost
                set({ isConnected: false, lastConnectionCheck: Date.now() });
                reject(error);
                return;
              }

              // Format in a way compatible with the app
              const formattedData = {
                "activities-steps": [{
                  dateTime: today.toISOString().split('T')[0],
                  value: String(results.value)
                }]
              };

              resolve(formattedData);
            });
          });
        } catch (error) {
          console.error('Error in getStepsData:', error);
          return null;
        }
      },

      getDataForRange: async (dataType, startDate, endDate) => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          if (dataType === "activities/steps") {
            const options = {
              startDate,
              endDate,
            };

            return new Promise((resolve, reject) => {
              // Get daily step counts
              AppleHealthKit!.getStepCount(options, (error, results) => {
                if (error) {
                  console.error('Error getting step data for range:', error);
                  // If we get an error, the connection might be lost
                  set({ isConnected: false, lastConnectionCheck: Date.now() });
                  reject(error);
                  return;
                }

                // Format in a way compatible with the app
                const formattedData = {
                  "activities-steps": [{
                    dateTime: new Date().toISOString().split('T')[0],
                    value: String(results.value)
                  }]
                };

                resolve(formattedData);
              });
            });
          }
          return null;
        } catch (error) {
          console.error(`Error in getDataForRange for ${dataType}:`, error);
          return null;
        }
      },

      syncStepsGoalWithBackend: async (userId, defaultGoal) => {
        // On Android, just handle the backend part without Apple Health
        if (Platform.OS !== 'ios') {
          try {
            // If a specific goal was passed in, use it
            if (defaultGoal && defaultGoal > 0) {
              console.log(`Using provided goal: ${defaultGoal}`);
              
              // Save the provided goal to backend
              const setResponse = await fetch(
                `${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ stepsGoal: defaultGoal }),
                }
              );
              
              if (setResponse.ok) {
                return defaultGoal;
              } else {
                console.error('Failed to save goal to backend, but still using provided goal');
                return defaultGoal;
              }
            }
            
            // If no specific goal was provided, check backend
            const response = await fetch(
              `${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.stepsGoal && data.stepsGoal > 0) {
                console.log(`Using backend goal: ${data.stepsGoal}`);
                return data.stepsGoal;
              }
            }

            // Default goal if nothing else is available
            return 10000;
          } catch (error) {
            console.error('Error syncing steps goal with backend:', error);
            return defaultGoal && defaultGoal > 0 ? defaultGoal : 10000;
          }
        }
        
        // iOS implementation
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          // If a specific goal was passed in, prioritize it over everything else
          // This ensures user-set goals are respected
          if (defaultGoal && defaultGoal > 0) {
            console.log(`Using provided goal: ${defaultGoal}`);
            
            // Save the provided goal to backend
            const setResponse = await fetch(
              `${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ stepsGoal: defaultGoal }),
              }
            );
            
            if (setResponse.ok) {
              return defaultGoal;
            } else {
              console.error('Failed to save goal to backend, but still using provided goal');
              return defaultGoal;
            }
          }
          
          // If no specific goal was provided, check backend
          const response = await fetch(
            `${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data && data.stepsGoal && data.stepsGoal > 0) {
              console.log(`Using backend goal: ${data.stepsGoal}`);
              return data.stepsGoal;
            }
          }

          // If no goal provided and no valid backend goal, use default of 10000
          console.log('No valid goal found, using default of 10000');
          const finalDefaultGoal = 10000;
          
          // Save default goal to backend
          const setResponse = await fetch(
            `${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ stepsGoal: finalDefaultGoal }),
            }
          );

          if (setResponse.ok) {
            return finalDefaultGoal;
          }

          return finalDefaultGoal;
        } catch (error) {
          console.error('Error syncing steps goal with backend:', error);
          // If a goal was provided, still use it even if backend sync failed
          if (defaultGoal && defaultGoal > 0) {
            return defaultGoal;
          }
          return 10000; // Last resort default
        }
      },

      syncStepsWithBackend: async (userId) => {
        // On Android, just return null as we can't get steps from Apple Health
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, getStepsData, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          // Get today's steps
          const stepsData = await getStepsData();
          
          if (!stepsData || !stepsData["activities-steps"] || stepsData["activities-steps"].length === 0) {
            console.log('No steps data to sync');
            return null;
          }

          const todaySteps = parseInt(stepsData["activities-steps"][0].value);
          
          // Send steps to backend
          const response = await fetch(
            `${CONFIG.API_BASE_URL}/user/activity/${userId}/steps`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ steps: todaySteps }),
            }
          );

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          const responseData = await response.json();
          console.log("Backend API response:", responseData);

          return responseData;
        } catch (error) {
          console.error('Error syncing steps with backend:', error);
          return null;
        }
      },

      // SLEEP FUNCTIONALITY
      getSleepData: async () => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          const today = new Date();
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          
          const options = {
            startDate: yesterday.toISOString(),
            endDate: today.toISOString(),
          };

          return new Promise((resolve, reject) => {
            AppleHealthKit!.getSleepSamples(options, (error, results) => {
              if (error) {
                console.error('Error getting sleep data:', error);
                // If we get an error, the connection might be lost
                set({ isConnected: false, lastConnectionCheck: Date.now() });
                reject(error);
                return;
              }

              // Filter only for ASLEEP samples
              const sleepSamples = results.filter((sample: any) => 
                sample.value === 'ASLEEP' || sample.value === 'CORE' || 
                sample.value === 'DEEP' || sample.value === 'REM'
              );

              if (sleepSamples.length === 0) {
                resolve({ sleep: [] });
                return;
              }

              // Find earliest sleep start and latest sleep end
              let earliestStart = new Date(sleepSamples[0].startDate);
              let latestEnd = new Date(sleepSamples[0].endDate);

              sleepSamples.forEach((sample: any) => {
                const startDate = new Date(sample.startDate);
                const endDate = new Date(sample.endDate);
                
                if (startDate < earliestStart) {
                  earliestStart = startDate;
                }
                
                if (endDate > latestEnd) {
                  latestEnd = endDate;
                }
              });

              // Calculate total sleep duration in milliseconds
              const totalDuration = latestEnd.getTime() - earliestStart.getTime();
              
              // Format in Fitbit-compatible format
              const formattedData = {
                sleep: [{
                  dateOfSleep: today.toISOString().split('T')[0],
                  duration: totalDuration,
                  efficiency: 90, // Apple Health doesn't provide this, use a reasonable default
                  logId: `apple-${Date.now()}`,
                  startTime: earliestStart.toISOString(),
                  endTime: latestEnd.toISOString(),
                }]
              };

              resolve(formattedData);
            });
          });
        } catch (error) {
          console.error('Error in getSleepData:', error);
          return null;
        }
      },

      getSleepDataForRange: async (timeRange) => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          const today = new Date();
          let startDate = new Date();

          // Determine date range based on timeRange
          if (timeRange === "today") {
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
          } else if (timeRange === "week") {
            startDate.setDate(today.getDate() - 7);
          } else if (timeRange === "month") {
            startDate.setMonth(today.getMonth() - 1);
          } else if (timeRange === "lastMonth") {
            startDate.setMonth(today.getMonth() - 2);
            const endDate = new Date();
            endDate.setMonth(today.getMonth() - 1);
            today.setTime(endDate.getTime());
          }

          const options = {
            startDate: startDate.toISOString(),
            endDate: today.toISOString(),
          };

          return new Promise((resolve, reject) => {
            AppleHealthKit!.getSleepSamples(options, (error, results) => {
              if (error) {
                console.error('Error getting sleep data for range:', error);
                // If we get an error, the connection might be lost
                set({ isConnected: false, lastConnectionCheck: Date.now() });
                reject(error);
                return;
              }

              // Filter only for ASLEEP samples
              const sleepSamples = results.filter((sample: any) => 
                sample.value === 'ASLEEP' || sample.value === 'CORE' || 
                sample.value === 'DEEP' || sample.value === 'REM'
              );

              if (sleepSamples.length === 0) {
                resolve({ sleep: [] });
                return;
              }

              // Group sleep samples by date
              const sleepByDate = sleepSamples.reduce((acc: any, sample: any) => {
                const dateStr = new Date(sample.startDate).toISOString().split('T')[0];
                
                if (!acc[dateStr]) {
                  acc[dateStr] = {
                    samples: [],
                    dateOfSleep: dateStr,
                  };
                }
                
                acc[dateStr].samples.push(sample);
                return acc;
              }, {});

              // Process each date's samples to find sleep duration
              const processedSleep = Object.values(sleepByDate).map((dayData: any) => {
                // Find earliest sleep start and latest sleep end for this day
                let earliestStart = new Date(dayData.samples[0].startDate);
                let latestEnd = new Date(dayData.samples[0].endDate);

                dayData.samples.forEach((sample: any) => {
                  const startDate = new Date(sample.startDate);
                  const endDate = new Date(sample.endDate);
                  
                  if (startDate < earliestStart) {
                    earliestStart = startDate;
                  }
                  
                  if (endDate > latestEnd) {
                    latestEnd = endDate;
                  }
                });

                // Calculate total sleep duration in milliseconds
                const totalDuration = latestEnd.getTime() - earliestStart.getTime();
                
                return {
                  dateOfSleep: dayData.dateOfSleep,
                  duration: totalDuration,
                  efficiency: 90, // Apple Health doesn't provide this, use a reasonable default
                  logId: `apple-${dayData.dateOfSleep}-${Date.now()}`,
                  startTime: earliestStart.toISOString(),
                  endTime: latestEnd.toISOString(),
                };
              });

              // Format in Fitbit-compatible format
              const formattedData = {
                sleep: processedSleep
              };

              resolve(formattedData);
            });
          });
        } catch (error) {
          console.error('Error in getSleepDataForRange:', error);
          return null;
        }
      },

      syncSleepWithBackend: async (userId) => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, getSleepDataForRange, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          // Get sleep data for the last month
          const sleepData = await getSleepDataForRange("month");
          
          if (!sleepData || !sleepData.sleep || sleepData.sleep.length === 0) {
            console.log('No sleep data to sync');
            return null;
          }

          // Helper function to format time in the exact format the backend expects
          const formatTimeForBackend = (dateStr: string) => {
            const date = new Date(dateStr);
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";

            // Convert to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12

            // Format minutes with leading zero if needed
            const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

            return `${hours}:${minutesStr} ${ampm}`;
          };

          // Send each sleep record to backend
          for (const sleepRecord of sleepData.sleep) {
            const sleepDataForAPI = {
              date: sleepRecord.dateOfSleep,
              sleepStart: formatTimeForBackend(sleepRecord.startTime),
              sleepEnd: formatTimeForBackend(sleepRecord.endTime),
            };

            try {
              const response = await fetch(
                `${CONFIG.API_BASE_URL}/user/activity/${userId}/sleep`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(sleepDataForAPI),
                }
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error Response: ${errorText}`);
                continue; // Continue with next record
              }

              const responseData = await response.json();
              console.log(`Successfully saved sleep data for ${sleepRecord.dateOfSleep}:`, responseData);
            } catch (error) {
              console.error("Error saving sleep data to database:", error);
              // Continue with next record
            }
          }

          return sleepData;
        } catch (error) {
          console.error('Error syncing sleep data with backend:', error);
          return null;
        }
      },

      // HEART RATE FUNCTIONALITY
      getHeartRateData: async (date, period) => {
        // Return null immediately on Android
        if (Platform.OS !== 'ios' || !AppleHealthKit) {
          return null;
        }
        
        const { isConnected, checkConnection } = get();
        
        // Verify connection before proceeding
        if (!isConnected) {
          const connectionValid = await checkConnection();
          if (!connectionValid) {
            console.log('Not connected to Apple Health');
            return null;
          }
        }

        try {
          const targetDate = new Date(date);
          const startOfDay = new Date(targetDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const options = {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
          };

          return new Promise((resolve, reject) => {
            // Try to get resting heart rate first
            AppleHealthKit!.getRestingHeartRate(options, (restingError, restingResults) => {
              if (!restingError && restingResults && (restingResults as any).length > 0) {
                // Found resting heart rate data
                const formattedData = {
                  "activities-heart": [{
                    dateTime: date,
                    value: {
                      restingHeartRate: Math.round((restingResults as any)[0].value)
                    }
                  }]
                };
                resolve(formattedData);
                return;
              }

              // If no resting heart rate, get regular heart rate samples
              AppleHealthKit!.getHeartRateSamples(options, (error, results) => {
                if (error) {
                  console.error('Error getting heart rate data:', error);
                  set({ isConnected: false, lastConnectionCheck: Date.now() });
                  reject(error);
                  return;
                }

                if (!results || results.length === 0) {
                  // No heart rate data for this day
                  resolve({
                    "activities-heart": [{
                      dateTime: date,
                      value: {
                        restingHeartRate: null
                      }
                    }]
                  });
                  return;
                }

                                // Calculate average heart rate from samples
                                const heartRateSum = results.reduce((sum: number, sample: any) => sum + sample.value, 0);
                                const averageHeartRate = Math.round(heartRateSum / results.length);
                
                                const formattedData = {
                                  "activities-heart": [{
                                    dateTime: date,
                                    value: {
                                      restingHeartRate: averageHeartRate
                                    }
                                  }]
                                };
                
                                resolve(formattedData);
                              });
                            });
                          });
                        } catch (error) {
                          console.error('Error in getHeartRateData:', error);
                          return null;
                        }
                      },
                
                      getHeartRateDataForRange: async (timeRange) => {
                        // Return null immediately on Android
                        if (Platform.OS !== 'ios' || !AppleHealthKit) {
                          return null;
                        }
                        
                        const { isConnected, checkConnection } = get();
                        
                        // Verify connection before proceeding
                        if (!isConnected) {
                          const connectionValid = await checkConnection();
                          if (!connectionValid) {
                            console.log('Not connected to Apple Health');
                            return null;
                          }
                        }
                
                        try {
                          const today = new Date();
                          let startDate = new Date();
                          let endDate = new Date(today);
                
                          // Determine date range based on timeRange
                          if (timeRange === "today") {
                            startDate = new Date(today);
                            startDate.setHours(0, 0, 0, 0);
                            endDate.setHours(23, 59, 59, 999);
                          } else if (timeRange === "week") {
                            startDate.setDate(today.getDate() - 7);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (timeRange === "month") {
                            startDate.setMonth(today.getMonth() - 1);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (timeRange === "lastMonth") {
                            startDate.setMonth(today.getMonth() - 2);
                            endDate.setMonth(today.getMonth() - 1);
                            endDate.setDate(0); // Last day of previous month
                            startDate.setHours(0, 0, 0, 0);
                            endDate.setHours(23, 59, 59, 999);
                          }
                
                          const options = {
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                          };
                
                          return new Promise((resolve, reject) => {
                            // Try to get resting heart rate first
                            AppleHealthKit!.getRestingHeartRate(options, (restingError, restingResults) => {
                              if (!restingError && restingResults && (restingResults as any).length > 0) {
                                console.log('🍎 Found resting heart rate data:', (restingResults as any).length, 'samples');
                                
                                // Group resting heart rate by date
                                const heartRateByDate = (restingResults as any).reduce((acc: any, sample: any) => {
                                  const dateStr = new Date(sample.startDate).toISOString().split('T')[0];
                                  
                                  if (!acc[dateStr]) {
                                    acc[dateStr] = [];
                                  }
                                  
                                  acc[dateStr].push(sample);
                                  return acc;
                                }, {});
                
                                // Process each date's samples
                                const processedHeartRate = Object.keys(heartRateByDate).map((dateStr) => {
                                  const samples = heartRateByDate[dateStr];
                                  
                                  // Use the latest resting heart rate for the day
                                  const latestSample = samples.reduce((latest: any, current: any) => {
                                    return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
                                  });
                
                                  return {
                                    dateTime: dateStr,
                                    value: {
                                      restingHeartRate: Math.round(latestSample.value)
                                    }
                                  };
                                });
                
                                const formattedData = {
                                  "activities-heart": processedHeartRate
                                };
                
                                resolve(formattedData);
                                return;
                              }
                
                              // If no resting heart rate, get regular heart rate samples
                              AppleHealthKit!.getHeartRateSamples(options, (error, results) => {
                                if (error) {
                                  console.error('Error getting heart rate data for range:', error);
                                  set({ isConnected: false, lastConnectionCheck: Date.now() });
                                  reject(error);
                                  return;
                                }
                
                                if (!results || results.length === 0) {
                                  resolve({ "activities-heart": [] });
                                  return;
                                }
                
                                console.log('🍎 Found heart rate samples:', results.length, 'samples');
                
                                // Group heart rate samples by date
                                const heartRateByDate = results.reduce((acc: any, sample: any) => {
                                  const dateStr = new Date(sample.startDate).toISOString().split('T')[0];
                                  
                                  if (!acc[dateStr]) {
                                    acc[dateStr] = [];
                                  }
                                  
                                  acc[dateStr].push(sample);
                                  return acc;
                                }, {});
                
                                // Process each date's samples to get daily average
                                const processedHeartRate = Object.keys(heartRateByDate).map((dateStr) => {
                                  const samples = heartRateByDate[dateStr];
                                  
                                  // Calculate average heart rate for the day
                                  const heartRateSum = samples.reduce((sum: number, sample: any) => sum + sample.value, 0);
                                  const averageHeartRate = Math.round(heartRateSum / samples.length);
                
                                  return {
                                    dateTime: dateStr,
                                    value: {
                                      restingHeartRate: averageHeartRate
                                    }
                                  };
                                });
                
                                const formattedData = {
                                  "activities-heart": processedHeartRate
                                };
                
                                resolve(formattedData);
                              });
                            });
                          });
                        } catch (error) {
                          console.error('Error in getHeartRateDataForRange:', error);
                          return null;
                        }
                      },
                
                      getCurrentHeartRate: async () => {
                        // Return 0 immediately on Android
                        if (Platform.OS !== 'ios' || !AppleHealthKit) {
                          return 0;
                        }
                        
                        const { isConnected, checkConnection } = get();
                        
                        // Verify connection before proceeding
                        if (!isConnected) {
                          const connectionValid = await checkConnection();
                          if (!connectionValid) {
                            console.log('Not connected to Apple Health');
                            return 0;
                          }
                        }
                
                        try {
                          const today = new Date();
                          const startOfDay = new Date(today);
                          startOfDay.setHours(0, 0, 0, 0);
                
                          const options = {
                            startDate: startOfDay.toISOString(),
                            endDate: today.toISOString(),
                          };
                
                          return new Promise<number>((resolve, reject) => {
                            // Try to get today's resting heart rate first
                            AppleHealthKit!.getRestingHeartRate(options, (restingError, restingResults) => {
                              if (!restingError && restingResults && (restingResults as any).length > 0) {
                                // Use the latest resting heart rate
                                const latestResting = (restingResults as any).reduce((latest: any, current: any) => {
                                  return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
                                });
                                
                                console.log('🍎 Using resting heart rate for current:', Math.round(latestResting.value));
                                resolve(Math.round(latestResting.value));
                                return;
                              }
                
                              // If no resting heart rate, get recent heart rate samples
                              const recentOptions = {
                                startDate: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Last 2 hours
                                endDate: today.toISOString(),
                              };
                
                              AppleHealthKit!.getHeartRateSamples(recentOptions, (error, results) => {
                                if (error) {
                                  console.error('Error getting current heart rate:', error);
                                  set({ isConnected: false, lastConnectionCheck: Date.now() });
                                  resolve(0);
                                  return;
                                }
                
                                if (!results || results.length === 0) {
                                  console.log('🍎 No recent heart rate data found');
                                  resolve(0);
                                  return;
                                }
                
                                // Use the most recent heart rate sample
                                const latestSample = results.reduce((latest: any, current: any) => {
                                  return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
                                });
                
                                console.log('🍎 Using latest heart rate sample for current:', Math.round(latestSample.value));
                                resolve(Math.round(latestSample.value));
                              });
                            });
                          });
                        } catch (error) {
                          console.error('Error in getCurrentHeartRate:', error);
                          return 0;
                        }
                      },
                
                      syncHeartRateWithBackend: async (userId) => {
                        // Return null immediately on Android
                        if (Platform.OS !== 'ios' || !AppleHealthKit) {
                          return null;
                        }
                        
                        const { isConnected, getHeartRateDataForRange, checkConnection } = get();
                        
                        // Verify connection before proceeding
                        if (!isConnected) {
                          const connectionValid = await checkConnection();
                          if (!connectionValid) {
                            console.log('Not connected to Apple Health');
                            return null;
                          }
                        }
                
                        try {
                          // Get heart rate data for the last month
                          const heartRateData = await getHeartRateDataForRange("month");
                          
                          if (!heartRateData || !heartRateData["activities-heart"] || heartRateData["activities-heart"].length === 0) {
                            console.log('No heart rate data to sync');
                            return null;
                          }
                
                          // Send each heart rate record to backend
                          for (const heartRateRecord of heartRateData["activities-heart"]) {
                            if (!heartRateRecord.value?.restingHeartRate) {
                              continue; // Skip records without heart rate data
                            }
                
                            const heartRateDataForAPI = {
                              date: heartRateRecord.dateTime,
                              heartRate: heartRateRecord.value.restingHeartRate,
                            };
                
                            try {
                              const response = await fetch(
                                `${CONFIG.API_BASE_URL}/user/activity/${userId}/heartrate`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify(heartRateDataForAPI),
                                }
                              );
                
                              if (!response.ok) {
                                const errorText = await response.text();
                                console.error(`API Error Response: ${errorText}`);
                                continue; // Continue with next record
                              }
                
                              const responseData = await response.json();
                              console.log(`Successfully saved heart rate data for ${heartRateRecord.dateTime}:`, responseData);
                            } catch (error) {
                              console.error("Error saving heart rate data to database:", error);
                              // Continue with next record
                            }
                          }
                
                          return heartRateData;
                        } catch (error) {
                          console.error('Error syncing heart rate data with backend:', error);
                          return null;
                        }
                      }
                    }),
                    {
                      name: 'apple-health-storage', // unique name for the storage
                      storage: createJSONStorage(() => AsyncStorage),
                      // Only persist certain fields
                      partialize: (state) => ({
                        isConnected: state.isConnected,
                        lastConnectionCheck: state.lastConnectionCheck,
                      }),
                    }
                  )
                );
                
                // Initialize connection check on app start
                export const initializeAppleHealth = async () => {
                  // Skip on Android
                  if (Platform.OS !== 'ios') {
                    console.log('Skipping Apple Health initialization on Android');
                    return;
                  }
                  
                  const store = useAppleHealth.getState();
                  
                  // Check if we have a stored connection status
                  try {
                    const storedConnection = await AsyncStorage.getItem('appleHealthConnected');
                    if (storedConnection === 'true' || store.isConnected) {
                      console.log('🍎 Found stored Apple Health connection, verifying...');
                      await store.checkConnection();
                    }
                  } catch (error) {
                    console.error('Error initializing Apple Health:', error);
                  }
                };
                
                // Simple function to check Apple Health availability and permissions
                export const checkAppleHealthConnection = (): Promise<{
                  isAvailable: boolean;
                  hasPermissions: boolean;
                  error?: string;
                }> => {
                  // Return not available on Android
                  if (Platform.OS !== 'ios' || !AppleHealthKit) {
                    return Promise.resolve({
                      isAvailable: false,
                      hasPermissions: false,
                      error: 'Apple Health is only available on iOS'
                    });
                  }
                  
                  return new Promise((resolve) => {
                    // Skip the isAvailable check for now and go directly to initHealthKit
                    // The initHealthKit method will handle availability internally
                    console.log('🍎 Attempting to initialize Apple Health...');
                
                    AppleHealthKit!.initHealthKit(permissions!, (initError) => {
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
                  // Return failure on Android
                  if (Platform.OS !== 'ios' || !AppleHealthKit) {
                    return Promise.resolve({
                      success: false,
                      error: 'Apple Health is only available on iOS'
                    });
                  }
                  
                  return new Promise((resolve) => {
                    const today = new Date();
                    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                    
                    const options = {
                      startDate: yesterday.toISOString(),
                      endDate: today.toISOString(),
                    };
                
                    AppleHealthKit!.getStepCount(options, (error, results) => {
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
                  // Return not authorized on Android
                  if (Platform.OS !== 'ios' || !AppleHealthKit) {
                    return Promise.resolve({
                      isAuthorized: false,
                      error: 'Apple Health is only available on iOS'
                    });
                  }
                  
                  return new Promise((resolve) => {
                    AppleHealthKit!.getAuthStatus(permissions!, (error, results) => {
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