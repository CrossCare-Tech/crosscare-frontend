export interface ProcessUserQueryParams {
  query: string;
  userId: string;
  messages: any[];
  healthStats: any;
  currentLanguage: string;
  questionnaireManager: {
    isActive: boolean;
    handleUserResponse: (query: string) => Promise<boolean> | boolean;
    startQuestionnaire: () => void;
    resumeQuestionnaire: () => Promise<void> | void;
    isCompleted?: boolean;
  };
  callbacks: {
    setIsProcessing: (value: boolean) => void;
    setMessages: (updater: (prevMessages: any[]) => any[]) => void;
    handleLogRequest: (query: string, shouldSpeak:boolean) => Promise<boolean>;
    handleGoalRequest: (query: string, shouldSpeak:boolean) => Promise<boolean>;
    speakResponse: (text: string) => void;
    sendToAPI: (messageContent: string, messageType: 'text' | 'audio') => Promise<{ response: string }>;
    callRagService?: (query: string, conversationHistory: any[], currentLanguage: string) => Promise<any>;
  };
  shouldSpeak: boolean;
  t: (key: string) => string;
}

export const processUserQuery = async ({
query,
userId,
messages,
healthStats,
questionnaireManager,
callbacks,
shouldSpeak,
currentLanguage,
t,
}: ProcessUserQueryParams): Promise<void> => {

 try {
  console.log("processUserQuery started with:", query);

  if(shouldSpeak){
    callbacks.setIsProcessing(true);
  }

  console.log(shouldSpeak, t);

  // Check if this is a response to the "continue paused questionnaire" question
  if (messages.length > 0 && !messages[messages.length - 1].isUser) {
    // Look for specific continuation patterns
    const lastMessage = messages[messages.length - 1].content;

    // Check if the last message is asking about continuing
    const continuationPrompts = [
      /continue this conversation/i,
      /continue where you left off/i,
      /unfinished questionnaire/i,
      /we can continue/i,
      /ready. Just let me know/i,
      /would you like to continue/i,
    ];

    const isContinuationPrompt = continuationPrompts.some((pattern) =>
      pattern.test(lastMessage)
    );

    if (isContinuationPrompt) {
      console.log("Detected continuation prompt response");

      // Check for positive responses
      const positiveResponses = [
        /^yes$/i,
        /^yeah$/i,
        /^sure$/i,
        /^ok$/i,
        /^okay$/i,
        /^continue$/i,
        /^let's continue$/i,
        /^ready$/i,
        /^resume$/i,
        /^let's go$/i,
        /^go$/i,
      ];

      if (positiveResponses.some((pattern) => pattern.test(query.trim()))) {
        console.log("User wants to resume questionnaire");

        // Add user's message to the chat
        callbacks.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now().toString(),
            type: "text",
            content: query,
            isUser: true,
            timestamp: new Date(),
          },
        ]);

        // Add a single confirmation message
        callbacks.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: "Great! Let's pick up where we left off.",
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        // Use a slight delay before resuming
        setTimeout(() => {
          questionnaireManager.resumeQuestionnaire();
        }, 800);

        callbacks.setIsProcessing(false);
        return;
      }
    }
  }

  // First check if this is a questionnaire response
  if (questionnaireManager.isActive) {
      try {
        const wasHandledAsQuestionnaireResponse = await questionnaireManager.handleUserResponse(query);
        if (wasHandledAsQuestionnaireResponse) {
          callbacks.setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Error handling questionnaire response:", error);
      }
    }

  // Check if this is a request to start the questionnaire
  if (
    /start questionnaire|begin questionnaire|take questionnaire|health assessment|assessment/i.test(
      query
    )
  ) {
    questionnaireManager.startQuestionnaire();
    callbacks.setIsProcessing(false);
    return;
  }

  // IMPORTANT: These callback functions are likely calling React hooks!
  // First check if this is a log request
  try {
    const wasHandledAsLogRequest = await callbacks.handleLogRequest(query, shouldSpeak);
    if (wasHandledAsLogRequest) {
      callbacks.setIsProcessing(false);
      return;
    }
  } catch (error) {
    console.error("Error in handleLogRequest - likely contains React hooks:", error);
    // Continue processing instead of stopping
  }

  // Then check if this is a goal setting request
  try {
    const wasHandledAsGoalRequest = await callbacks.handleGoalRequest(query, shouldSpeak);
    if (wasHandledAsGoalRequest) {
      callbacks.setIsProcessing(false);
      return;
    }
  } catch (error) {
    console.error("Error in handleGoalRequest - likely contains React hooks:", error);
    // Continue processing instead of stopping
  }

  // Check for different types of health stat queries
  const isWaterQuery = /water|hydration/i.test(query);
  const isWeightQuery = /weight/i.test(query);
  const isStepsQuery = /steps|step count|walking/i.test(query);
  const isHeartQuery = /heart|pulse|bpm/i.test(query);
  const isSleepQuery = /sleep|slept/i.test(query);
  
  // Distinguish between asking ABOUT logged meals vs asking FOR meal advice
  const isAskingAboutLoggedMeal = /what (did I|have I) (eat|eaten|have|had)|show (my|me).*?(breakfast|lunch|dinner|snack|meal)|did I (eat|have|log)|list my (meals|food)|my (breakfast|lunch|dinner|snack)/i.test(query);
  
  const isAskingForMealAdvice = /what (is|are|should I|can I|would be).*?(good|healthy|best|bad).*?(breakfast|lunch|dinner|snack|food|meal)|recommend.*?(breakfast|lunch|dinner|food|meal)|suggest.*?(breakfast|lunch|dinner|food|meal)|good.*?to eat|healthy.*?to eat/i.test(query);
  
  const isCalorieQuery = /\bcalorie\b|\bcalories\b|\bkcal\b/i.test(query) && /how many|how much|total|consumed|logged/i.test(query);
  const isFoodQualityQuery = /good food|bad food|healthy|unhealthy|nutrition quality/i.test(query) && /did I|have I|my food/i.test(query);

  // Add specific meal type queries (only for logged meal queries)
  const isBreakfastQuery = /breakfast/i.test(query) && isAskingAboutLoggedMeal;
  const isLunchQuery = /lunch/i.test(query) && isAskingAboutLoggedMeal;
  const isDinnerQuery = /dinner/i.test(query) && isAskingAboutLoggedMeal;
  const isSnackQuery = /snack/i.test(query) && isAskingAboutLoggedMeal;
  const isSpecificMealQuery = isBreakfastQuery || isLunchQuery || isDinnerQuery || isSnackQuery;
  
  // Overall meal query detection (but only for logged data, not advice)
  const isMealQuery = isAskingAboutLoggedMeal || isCalorieQuery || isFoodQualityQuery;

  // Check for time period queries
  const isAverageQuery = /average|avg/i.test(query);
  const isTodayQuery = /today|current/i.test(query);
  const isWeeklyQuery = /week|weekly|7 days/i.test(query);
  const isMonthlyQuery = /month|monthly|30 days/i.test(query);

  // Check for comprehensive stats query
  const isComprehensiveQuery =
    /all stats|all metrics|health summary|overview/i.test(query) ||
    (/avg|average/i.test(query) &&
      /heart|water|steps|sleep|weight/i.test(query) &&
      /heart|water|steps|sleep|weight/i.test(query) &&
      /heart|water|steps|sleep|weight/i.test(query) &&
      !/^what('s| is) (my |the )?(avg|average) weight/i.test(query) &&
      !/^what('s| is) (my |the )?(avg|average) sleep/i.test(query) &&
      !/^what('s| is) (my |the )?(avg|average) heart/i.test(query) &&
      !/^what('s| is) (my |the )?(avg|average) water/i.test(query) &&
      !/^what('s| is) (my |the )?(avg|average) steps/i.test(query) &&
      !/sleep duration/i.test(query));

  console.log("Query analysis:", {
    isWaterQuery,
    isWeightQuery,
    isStepsQuery,
    isHeartQuery,
    isSleepQuery,
    isAskingAboutLoggedMeal,
    isAskingForMealAdvice,
    isMealQuery,
    isCalorieQuery,
    isFoodQualityQuery,
    isBreakfastQuery,
    isLunchQuery,
    isDinnerQuery,
    isSnackQuery,
    isSpecificMealQuery,
    isAverageQuery,
    isTodayQuery,
    isWeeklyQuery,
    isMonthlyQuery,
    isComprehensiveQuery,
  });

  // Handle comprehensive health stats query
  if (isComprehensiveQuery) {
    console.log("Detected comprehensive health stats query");

    // Format a comprehensive health stats response
    let statsMessage = `${t('healthData.statsMessage')}:\n\n`;

    // Determine time period to report
    let reportPeriod = "weekly"; // Default to weekly
    if (isTodayQuery) reportPeriod = "today";
    if (isMonthlyQuery) reportPeriod = "monthly";

    // Water stats
    if (reportPeriod === "today") {
      statsMessage += `${t('water')}: ${healthStats.water.today} ${t('healthData.glasses')} ${t('healthData.today')}\n`;
    } else if (reportPeriod === "weekly") {
      statsMessage += `${t('water')}: ${healthStats.water.avgWeekly.toFixed(
        1
      )} ${t('healthData.glasses_per_day_weekly_avg')}\n`;
    } else {
      statsMessage += `${t('water')}: ${healthStats.water.avgMonthly.toFixed(
        1
      )} ${t('healthData.glasses_per_day_monthly_avg')}\n`;
    }

    // Steps stats
    if (reportPeriod === "today") {
      statsMessage += `${t('steps')}: ${healthStats.steps.today} ${t('healthData.steps_today')}\n`;
    } else if (reportPeriod === "weekly") {
      statsMessage += `${t('steps')}: ${healthStats.steps.avgWeekly.toFixed(
        0
      )} ${t('healthData.steps_per_day_weekly_avg')}\n`;
    } else {
      statsMessage += `${t('steps')}: ${healthStats.steps.avgMonthly.toFixed(
        0
      )} ${t('healthData.steps_per_day_monthly_avg')}\n`;
    }

    // Weight stats
    if (healthStats.weight.avgWeekly > 0) {
      if (reportPeriod === "today") {
        statsMessage += `${t('weight')}: ${healthStats.weight.today} ${healthStats.weight.unit} ${t('healthData.steps_today')}\n\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('weight')}: ${healthStats.weight.avgWeekly.toFixed(
          1
        )} ${healthStats.weight.unit} ${t('healthData.weekly_average')}\n`;
      } else {
        statsMessage += `${t('weight')}: ${healthStats.weight.avgMonthly.toFixed(
          1
        )} ${healthStats.weight.unit} ${t('healthData.monthly_average')}\n`;
      }
    }

    // Heart rate stats
    if (healthStats.heart.avgWeekly > 0) {
      if (reportPeriod === "today") {
        statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.today} ${t('healthData.bpm_today')}\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgWeekly.toFixed(
          0
        )} ${t('healthData.bpm_weekly_avg')}\n`;
      } else {
        statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgMonthly.toFixed(
          0
        )} ${t('healthData.bpm_monthly_avg')}\n`;
      }
    }

    // Sleep stats
    if (healthStats.sleep.avgWeekly > 0) {
      if (reportPeriod === "today") {
        statsMessage += `${t('sleep')}: ${healthStats.sleep.today.toFixed(
          1
        )} ${t('healthData.hours_today')}\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('sleep')}: ${healthStats.sleep.avgWeekly.toFixed(
          1
        )} ${t('healthData.hours_per_night_weekly_avg')}\n`;
      } else {
        statsMessage += `${t('sleep')}: ${healthStats.sleep.avgMonthly.toFixed(
          1
        )} ${t('healthData.hours_per_night_monthly_avg')}\n`;
      }
    }

    // Add meal stats to comprehensive report
    if (healthStats.meals && healthStats.meals.today.caloriesConsumed > 0) {
      if (reportPeriod === "today") {
        statsMessage += `${t('healthData.calories')}: ${healthStats.meals.today.caloriesConsumed} ${t('healthData.consumed_today')}`;
        if (healthStats.meals.today.calorieGoal > 0) {
          statsMessage += ` (${t('healthData.goal')}: ${healthStats.meals.today.calorieGoal})`;
        }
        statsMessage += `\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('healthData.calories')}: ${healthStats.meals.weekly.avgCaloriesConsumed.toFixed(0)} ${t('healthData.avg_per_day_weekly')}\n`;
      }
    }

    // Add a note if some metrics are missing
    if (
      healthStats.heart.avgWeekly === 0 ||
      healthStats.sleep.avgWeekly === 0
    ) {
      statsMessage +=
         `\n${t('healthData.message')}`;
    }

    // Add the response to messages
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: statsMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    if (shouldSpeak) {
      callbacks.speakResponse(statsMessage);
    }

    callbacks.setIsProcessing(false);
    return; // Exit early since we've handled this specific query
  }

  // Handle specific metric queries
  if (isWaterQuery) {
    let waterMessage = "";

    if (isTodayQuery) {
      waterMessage = `${t('healthData.youve_consumed')} ${healthStats.water.today} ${t('healthData.glasses_of_water_today')}`;
    } else if (isWeeklyQuery || isAverageQuery) {
      waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
        1
      )} ${t('healthData.glasses_per_day_week')} ${
        healthStats.water.weekly
      } ${t('healthData.glasses')}.`;
    } else if (isMonthlyQuery) {
      waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgMonthly.toFixed(
        1
      )} ${t('healthData.glasses_per_day_month')} ${
        healthStats.water.monthly
      } ${t('healthData.glasses')}.`;
    } else {
      // Default to weekly if no time period specified
      waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
        1
      )} ${t('healthData.glasses_per_day_week_today')} ${
        healthStats.water.today
      } ${t('healthData.glasses')}.`;
    }

    waterMessage += `${t('healthData.hydration_reminder')}`;
    
    // Add the response to messages
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: waterMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    if (shouldSpeak) {
      callbacks.speakResponse(waterMessage);
    }

    callbacks.setIsProcessing(false);
    return;
  }

  if (
    isWeightQuery &&
    /^what('s| is) (my |the )?(avg|average) weight/i.test(query)
  ) {
    if (
      healthStats.weight.avgWeekly === 0 &&
      healthStats.weight.today === 0
    ) {
       const noDataMessage =
          `${t('healthData.no_weight_data')}`;
      
      if (shouldSpeak) {
        callbacks.speakResponse(noDataMessage);
      }

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: noDataMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return;
    }

    let weightMessage = "";

    if (isMonthlyQuery) {
      weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgMonthly.toFixed(
        1
      )} ${healthStats.weight.unit} ${t('healthData.over_past_month')}`;
    } else {
      // Default to weekly average for "what is avg weight" queries
      weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgWeekly.toFixed(
        1
      )} ${healthStats.weight.unit} ${t('healthData.over_past_week')}`;
    }

    if (shouldSpeak) {
      callbacks.speakResponse(weightMessage);
    }

    // Add the response to messages
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: weightMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    callbacks.setIsProcessing(false);
    return;
  }

  // Steps queries
  if (isStepsQuery) {
    let stepsMessage = "";

    if (isTodayQuery) {
      stepsMessage = `${t('healthData.youve_taken')} ${healthStats.steps.today} ${t('healthData.steps_today1')}`;
    } else if (isWeeklyQuery || isAverageQuery) {
      stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
        0
      )} ${t('healthData.steps_past_week')} ${
        healthStats.steps.weekly
      }.`;
    } else if (isMonthlyQuery) {
      stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgMonthly.toFixed(
        0
      )} ${t('healthData.steps_past_month')} ${
        healthStats.steps.monthly
      }.`;
    } else {
      // Default to weekly if no time period specified
      stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
        0
      )} ${t('healthData.steps_week_today')} ${
        healthStats.steps.today
      } ${t('steps')}`;
    }

    stepsMessage +=
        ` ${t('healthData.walking_encouragement')}`;

    // Add the response to messages
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: stepsMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    if (shouldSpeak) {
      callbacks.speakResponse(stepsMessage);
    }

    callbacks.setIsProcessing(false);
    return;
  }

  // Heart rate queries
  if (isHeartQuery) {
    if (
      healthStats.heart.avgWeekly === 0 &&
      healthStats.heart.today === 0
    ) {
       const noDataMessage =
          `${t('healthData.no_heart_data')}`;
      
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: noDataMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

        if (shouldSpeak) {
        callbacks.speakResponse(noDataMessage);
      }

      callbacks.setIsProcessing(false);
      return;
    }

    let heartMessage = "";

    if (isTodayQuery) {
      heartMessage = `${t('healthData.heart_rate_today')} ${healthStats.heart.today} bpm.`;
    } else if (isWeeklyQuery || isAverageQuery) {
      heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgWeekly.toFixed(
        0
      )} bpm ${t('healthData.over_past_week')}`;
    } else if (isMonthlyQuery) {
      heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgMonthly.toFixed(
        0
      )} bpm ${t('healthData.over_past_week')}`;
    } else {
      heartMessage = `${t('healthData.average_heart_rate')} ${
        healthStats.heart.today
      } bpm, ${t('healthData.over_past_week')} ${healthStats.heart.avgWeekly.toFixed(
        0
      )} bpm.`;
    }

    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: heartMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

     if (shouldSpeak) {
      callbacks.speakResponse(heartMessage);
    }

    callbacks.setIsProcessing(false);
    return;
  }

  // Handle meal/food queries
  if (isMealQuery || isCalorieQuery) {
    // Check if we have meal data
    if (!healthStats.meals || (healthStats.meals.today.caloriesConsumed === 0 && healthStats.meals.today.calorieGoal === 0)) {
      const noMealDataMessage = `${t('healthData.no_meal_data')}`;
      
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: noMealDataMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      if (shouldSpeak) {
        callbacks.speakResponse(noMealDataMessage);
      }

      callbacks.setIsProcessing(false);
      return;
    }

    let mealMessage = "";

    // Handle specific meal type queries (NEW ENHANCED SECTION)
    if (isSpecificMealQuery) {
      let mealType = "";
      let mealData = null;
      
      if (isBreakfastQuery) {
        mealType = "breakfast";
        mealData = healthStats.meals.today.meals.BREAKFAST;
      } else if (isLunchQuery) {
        mealType = "lunch";
        mealData = healthStats.meals.today.meals.LUNCH;
      } else if (isDinnerQuery) {
        mealType = "dinner";
        mealData = healthStats.meals.today.meals.DINNER;
      } else if (isSnackQuery) {
        mealType = "snack";
        mealData = healthStats.meals.today.meals.SNACK;
      }

      if (!mealData || mealData.length === 0) {
        mealMessage = `You haven't logged any ${mealType} today.`;
      } else {
        mealMessage = `For ${mealType} today, you had:\n\n`;
        
        let totalCalories = 0;
        mealData.forEach((meal: any, index: number) => {
          if (meal.foodItems && meal.foodItems.length > 0) {
            meal.foodItems.forEach((item: any) => {
              mealMessage += `• ${item.name}`;
              if (item.portion) {
                mealMessage += ` (${item.portion})`;
              }
              if (item.quantity && item.quantity > 1) {
                mealMessage += ` x${item.quantity}`;
              }
              mealMessage += ` - ${item.calories} calories\n`;
              totalCalories += item.calories;
            });
          }
        });
        
        if (totalCalories > 0) {
          mealMessage += `\nTotal ${mealType} calories: ${totalCalories}`;
        }
      }
    }
    // Handle specific calorie queries
    else if (isCalorieQuery) {
      if (isTodayQuery) {
        const caloriesConsumed = healthStats.meals.today.caloriesConsumed;
        const calorieGoal = healthStats.meals.today.calorieGoal;
        const remaining = Math.max(0, calorieGoal - caloriesConsumed);
        
        mealMessage = `${t('healthData.calories_consumed_today')} ${caloriesConsumed} ${t('healthData.calories')}`;
        
        if (calorieGoal > 0) {
          mealMessage += ` ${t('healthData.out_of')} ${calorieGoal} ${t('healthData.calorie_goal')}`;
          if (remaining > 0) {
            mealMessage += ` ${t('healthData.you_have')} ${remaining} ${t('healthData.calories_remaining')}`;
          } else {
            mealMessage += ` ${t('healthData.goal_reached')}`;
          }
        }
      } else if (isWeeklyQuery || isAverageQuery) {
        mealMessage = `${t('healthData.average_daily_calories')} ${healthStats.meals.weekly.avgCaloriesConsumed.toFixed(0)} ${t('healthData.calories_past_week')}`;
      } else {
        // Default response
        const caloriesConsumed = healthStats.meals.today.caloriesConsumed;
        const calorieGoal = healthStats.meals.today.calorieGoal;
        mealMessage = `${t('healthData.calories_today')} ${caloriesConsumed} ${t('healthData.calories')}`;
        if (calorieGoal > 0) {
          mealMessage += ` ${t('healthData.goal_is')} ${calorieGoal} ${t('healthData.calories')}`;
        }
      }
    }
    // Handle food quality queries
    else if (isFoodQualityQuery) {
      const goodFoods = healthStats.meals.today.goodFoodCount;
      const badFoods = healthStats.meals.today.badFoodCount;
      const totalFoods = goodFoods + badFoods;
      
      if (totalFoods === 0) {
        mealMessage = `${t('healthData.no_food_logged_today')}`;
      } else {
        const goodPercentage = Math.round((goodFoods / totalFoods) * 100);
        mealMessage = `${t('healthData.food_quality_today')} ${goodFoods} ${t('healthData.healthy_foods')} ${badFoods} ${t('healthData.less_healthy_foods')} ${t('healthData.thats')} ${goodPercentage}% ${t('healthData.healthy_choices')}`;
      }
    }
    // Handle general meal queries
    else {
      const meals = healthStats.meals.today.meals;
      const mealTypes = Object.keys(meals).filter(type => meals[type as keyof typeof meals].length > 0);
      
      if (mealTypes.length === 0) {
        mealMessage = `${t('healthData.no_meals_logged_today')}`;
      } else {
        mealMessage = `${t('healthData.meals_logged_today')} ${mealTypes.join(', ').toLowerCase()}. `;
        mealMessage += `${t('healthData.total_calories')} ${healthStats.meals.today.caloriesConsumed} ${t('healthData.calories')}`;
        
        if (healthStats.meals.today.calorieGoal > 0) {
          mealMessage += ` ${t('healthData.out_of')} ${healthStats.meals.today.calorieGoal} ${t('healthData.calorie_goal')}`;
        }
      }
    }

    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: mealMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    if (shouldSpeak) {
      callbacks.speakResponse(mealMessage);
    }

    callbacks.setIsProcessing(false);
    return;
  }

  // Format conversation history for RAG
  const recentMessages = messages
    .slice(-6) // Last 6 messages for context
    .filter(msg => msg.type === "text") // Only text messages
    .map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content
    }));

  // Try to use RAG service if available
  if (callbacks.callRagService) {
    try {
      const ragResponse = await callbacks.callRagService(query, recentMessages, currentLanguage);
      
      if (ragResponse && ragResponse.success) {
        // Use the response from RAG service
        const assistantMessage = ragResponse.response;
        
        // Add the response to messages
        callbacks.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: assistantMessage,
            media: Array.isArray(ragResponse.media) ? ragResponse.media : undefined,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        if (shouldSpeak) {
          callbacks.speakResponse(assistantMessage);
        }
        
        callbacks.setIsProcessing(false);
        return;
      }
    } catch (error) {
      console.error("Error with RAG service, falling back to API:", error);
    }
  }

  // Fall back to Gemini API
  const apiResponse = await callbacks.sendToAPI(query, "text");
  
  if (apiResponse) {
    const assistantMessage = apiResponse.response;

    // Add the response to messages
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: assistantMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    if (shouldSpeak) {
      callbacks.speakResponse(assistantMessage);
    }
  }

  callbacks.setIsProcessing(false);
} catch (error: any) {
  console.error("Error in processUserQuery:", error.message);
  console.error("Error stack:", error.stack);
  callbacks.setIsProcessing(false);
  
  // Add error message to chat
  callbacks.setMessages((prevMessages) => [
    ...prevMessages,
    {
      id: (Date.now() + 1).toString(),
      type: "text",
      content: "I'm sorry, I couldn't process your request. Please try again.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
}
};