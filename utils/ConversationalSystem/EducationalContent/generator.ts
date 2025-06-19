// crosscare-frontend/utils/ConversationalSystem/EducationalContent/generator.ts
interface EducationalContentRequest {
    topic: string;
    questionId: string;
    userResponse?: string;
  }
  
  interface EducationalContent {
    content: string;
    tips: string[];
    resources?: string[];
    nextSteps?: string;
  }
  
  export const generateEducationalContent = async (
    request: EducationalContentRequest,
    openAIApiKey: string  // Renamed from openAIApiKey to be more generic
  ): Promise<EducationalContent> => {
    const educationalPrompts = {
      'q1-smoke-info': `Generate comprehensive but concise information about second-hand smoke effects during pregnancy. Include:
      - Health risks to mother and baby
      - 3-4 practical tips to minimize exposure
      - Supportive, non-judgmental tone
      Keep response under 200 words.`,
      
      'q1-chemicals-info': `Generate safety information about chemical exposure during pregnancy. Include:
      - Why chemical exposure is concerning during pregnancy
      - 3-4 practical safety measures
      - How to talk to family members about safety
      Keep response under 200 words.`,
      
      'q1-exhaust-info': `Generate information about air quality and vehicle exhaust during pregnancy. Include:
      - Health effects of air pollution on pregnancy
      - 2-3 practical tips to reduce exposure
      - Alternative ventilation suggestions
      Keep response under 200 words.`,
      
      'q1-lead-info': `Generate information about lead exposure prevention during pregnancy. Include:
      - Risks of lead exposure during pregnancy
      - 2-3 practical prevention tips
      - When to seek professional help
      Keep response under 200 words.`,
      
      'q1-filter-info': `Generate air filter maintenance tips for pregnant women. Include:
      - Benefits of clean air during pregnancy
      - 2-3 practical maintenance tips
      - Cost-effective alternatives if needed
      Keep response under 200 words.`,
      
      'q1-no-filter-info': `Generate air quality improvement tips for pregnant women without air filters. Include:
      - Importance of clean air during pregnancy
      - 2-3 practical tips to improve indoor air quality
      - Low-cost solutions
      Keep response under 200 words.`,
      
      'q4-14': `Generate birthing plan information and tips. Include:
      - Key components of a birth plan
      - 2-3 questions to consider
      - Encouragement about flexibility
      Keep response under 200 words.`
    };
  
    const prompt = educationalPrompts[request.questionId as keyof typeof educationalPrompts];
  
  if (!prompt) {
    throw new Error(`No educational content defined for question: ${request.questionId}`);
  }

  try {
    console.log('Making OpenAI API call for educational content');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a caring doula providing educational information to pregnant women. Be warm, supportive, and practical.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nContext: User is pregnant.\n${request.userResponse ? `User's response: "${request.userResponse}"` : ''}\n\nFormat your response as educational content that feels like it's coming from a caring doula. Be warm, supportive, and practical.`
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 
                   "I'd be happy to provide information about this topic. Please consult with your healthcare provider for personalized advice.";

    console.log('Successfully generated educational content via OpenAI');
    
    return {
      content: content.replace(/\*/g, ""),
      tips: [],
      resources: [],
      nextSteps: "Let's continue with the next question."
    };

  } catch (error) {
    console.error('Error generating educational content with OpenAI:', error);
    
      
      // Fallback content
      const fallbackContent = {
        'q1-smoke-info': "Second-hand smoke can affect both you and your baby's health. During pregnancy, exposure to second-hand smoke increases the risk of complications like low birth weight, preterm birth, and developmental issues. It can also increase the risk of sudden infant death syndrome (SIDS) after birth.\n\nTo minimize exposure:\n• Ask family members and visitors to smoke outside, away from doors and windows\n• Avoid places where people smoke, like certain restaurants or gatherings\n• If your partner smokes, encourage them to quit or at least change clothes after smoking\n• Improve ventilation in your home with air purifiers or open windows when air quality is good\n\nRemember, it's perfectly okay to prioritize your health and your baby's health during this time.",
        'q1-chemicals-info': "Chemical exposure during pregnancy is concerning because many chemicals can cross the placenta and affect your baby's development. Developing organs and systems are especially vulnerable to disruption from certain chemicals.\n\nHere are some practical safety measures:\n• Ask family members who work with chemicals to change clothes, remove shoes, and shower before interacting with you\n• Keep their work clothes separate from regular laundry\n• Ensure good ventilation in areas where cleaning products are used\n• Consider switching to natural cleaning products during pregnancy\n\nWhen talking to family members about safety, focus on how these precautions protect both you and the baby. Be specific about what you need and explain that these measures are temporary but important for your baby's health.",
        'q1-exhaust-info': "Vehicle exhaust contains harmful chemicals like carbon monoxide, nitrogen dioxide, and particulate matter that can affect your pregnancy. Research has linked air pollution exposure during pregnancy to increased risks of preterm birth, lower birth weight, and potential developmental issues.\n\nTo reduce your exposure:\n• Keep windows closed when in high-traffic areas or during rush hour\n• Use the recirculate air setting in your car when driving in heavy traffic\n• Consider using air purifiers with HEPA filters in your home\n\nFor better ventilation without opening windows near busy roads, try opening windows on the side of your home away from traffic, using exhaust fans, or ventilating your home during times when traffic is lighter.",
        'q1-lead-info': "Lead exposure during pregnancy is particularly concerning because it can cross the placenta and affect your baby's developing brain and nervous system. Even low levels of lead exposure have been linked to lower IQ, learning difficulties, and behavioral problems in children.\n\nTo protect yourself and your baby:\n• Keep windows closed during nearby construction, especially of older buildings\n• Wash your hands frequently, particularly before eating\n• If you live in an older home (pre-1978), be cautious about peeling paint and renovation dust\n\nSeek professional help if you suspect lead exposure in your home, especially if you live in an older building or if renovation work is being done. Your healthcare provider can order a blood lead level test if you're concerned about exposure.",
        'q1-filter-info': "Clean air is especially important during pregnancy as your breathing rate increases and your baby's developing lungs and organs are sensitive to pollutants. A well-maintained air filter helps remove harmful particles, allergens, and some chemicals from your indoor air.\n\nFor effective air filter maintenance:\n• Check filters monthly and replace or clean them according to manufacturer instructions\n• Vacuum the area around air intakes to reduce dust buildup\n• Keep windows closed during high pollution days or when pollen counts are high\n\nIf cost is a concern, consider these alternatives: placing HEPA filters in just your bedroom where you spend the most time, using box fan filters (attaching a furnace filter to a box fan), or increasing natural ventilation when outdoor air quality is good.",
        'q1-no-filter-info': "Clean air is particularly important during pregnancy as your breathing increases and your baby is developing vital organs. Without an air filter, you can still improve your indoor air quality with these practical tips:\n\n• Keep windows closed during high pollution times (rush hour) or when air quality is poor\n• Open windows on the side of your home away from traffic when ventilation is needed\n• Use exhaust fans in kitchens and bathrooms to remove indoor pollutants\n\nLow-cost solutions include placing houseplants that naturally filter air (like spider plants or peace lilies), using baking soda and vinegar for cleaning instead of harsh chemicals, and keeping your home dust-free with regular damp dusting and vacuuming with a HEPA filter vacuum if possible.",
        'q4-14': "A birth plan helps communicate your preferences to your healthcare team, though flexibility is important as birth can be unpredictable.\n\nKey components to consider include:\n• Your preferred pain management approach (natural techniques, medication options, or epidural)\n• Who you want present during labor and delivery (partner, family member, doula)\n• Preferences for mobility during labor (walking, birthing ball, different positions)\n• Immediate postpartum wishes (delayed cord clamping, skin-to-skin contact)\n\nImportant questions to consider:\n• What comfort measures would you like to try before pain medication?\n• How do you feel about medical interventions if they become necessary?\n• What are your feeding plans for baby after birth?\n\nRemember, birth rarely goes exactly according to plan. The most important outcome is a healthy mom and baby, so be open to adjustments if medical needs arise. Your healthcare team wants to honor your preferences while ensuring safety."
      };
  
      return {
        content: fallbackContent[request.questionId as keyof typeof fallbackContent] || 
                 "I'd be happy to provide information about this topic. Please consult with your healthcare provider for personalized advice.",
        tips: [],
        resources: [],
        nextSteps: "Let's continue with the next question."
      };
    }
  };