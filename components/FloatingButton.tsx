import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSearchParams } from "expo-router/build/hooks"
import type React from "react"
import { useRef, useEffect, useState } from "react"
import {
  View,
  Animated,
  PanResponder,
  Text,
  Dimensions,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Easing,
} from "react-native"
import { useSelector } from "react-redux"

// Define the AvatarData interface
interface AvatarData {
  imageUri: string;
}

interface FloatingButtonProps {
  onPress?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  showMessage?: boolean
  message?: string
  onMessageDismiss?: () => void
  autoShowInterval?: number
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  onPositionChange,
  showMessage = false,
  message = "Hey, do you have a minute?",
  onMessageDismiss,
  autoShowInterval = 30000, // Default to 30 seconds
}) => {
  // Get screen dimensions
  const { width, height } = Dimensions.get("window")

  // Initialize position (bottom right corner)
  const pan = useRef(new Animated.ValueXY({ x: width - 70, y: height / 1.2 })).current

  // Track if we're currently dragging to differentiate between drag and tap
  const isDragging = useRef(false)
  // Track the start time of touch to differentiate between tap and drag
  const touchStartTime = useRef(0)

  // Enhanced animations for message bubble
  const messageOpacity = useRef(new Animated.Value(0)).current
  const messageScale = useRef(new Animated.Value(0.8)).current
  const messageTranslateY = useRef(new Animated.Value(-20)).current
  const messageBounce = useRef(new Animated.Value(0)).current
  const buttonPulse = useRef(new Animated.Value(1)).current

  // Track if message is visible
  const [isMessageVisible, setIsMessageVisible] = useState(false)
  // Track bubble layout to force proper sizing
  const [bubbleLayout, setBubbleLayout] = useState({ width: 0, height: 0 })

  const [imageLoaded, setImageLoaded] = useState(true)
  // State for avatar image from AsyncStorage
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  // Loading state for avatar image
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true)

  useEffect(() => {
    const fetchAvatarImage = async () => {
      try {
        setIsLoadingAvatar(true)
        const avatarDataString = await AsyncStorage.getItem('userAvatar')
        
        if (avatarDataString) {
          const avatarData: AvatarData = JSON.parse(avatarDataString)
          console.log("Retrieved avatar data:", avatarData)
          
          if (avatarData.imageUri) {
            setAvatarImage(avatarData.imageUri)
            setImageLoaded(true)
          }
        }
      } catch (error) {
        console.error("Error retrieving avatar image:", error)
        setImageLoaded(false)
      } finally {
        setIsLoadingAvatar(false)
      }
    }

    fetchAvatarImage()
  }, [])

  const user = useSelector((state:any)=>state.user);
  console.log("USER", user);

  // Auto-show message every interval
  useEffect(() => {
    const showMessageWithAnimation = () => {
      if (onMessageDismiss) {
        onMessageDismiss() // This will trigger the show animation through the showMessage prop
      }
    }

    // Set up interval to show message
    const intervalId = setInterval(showMessageWithAnimation, autoShowInterval)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [autoShowInterval, onMessageDismiss])

  // Show/hide message based on prop with enhanced animations
  useEffect(() => {
    if (showMessage && !isMessageVisible) {
      setIsMessageVisible(true)

      // Pulse animation for the button to draw attention
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start()

      // Start with invisible message, let layout calculate first
      messageOpacity.setValue(0)
      messageScale.setValue(0.8)
      messageTranslateY.setValue(-20)
    } else if (!showMessage && isMessageVisible) {
      // Hide animation
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(messageScale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(messageTranslateY, {
          toValue: -20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMessageVisible(false)
        messageBounce.setValue(0) // Reset bounce for next time
        setBubbleLayout({ width: 0, height: 0 }) // Reset layout
      })
    }
  }, [showMessage])

  // Separate effect to handle the show animation after layout is ready
  useEffect(() => {
    if (isMessageVisible) {
      // If layout is already calculated, animate immediately
      if (bubbleLayout.width > 0) {
        console.log("Layout ready, starting animation")
        startShowAnimation()
      } else {
        // Fallback: start animation after a delay even if layout isn't calculated
        console.log("Layout not ready, using fallback timer")
        const fallbackTimer = setTimeout(() => {
          console.log("Fallback timer triggered, starting animation")
          startShowAnimation()
        }, 200)
        
        return () => clearTimeout(fallbackTimer)
      }
    }
  }, [isMessageVisible, bubbleLayout.width])

  const startShowAnimation = () => {
    Animated.sequence([
      // First appear with scale and fade
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(messageScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(messageTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      // Then add a subtle bounce effect
      Animated.timing(messageBounce, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start()
  }

  // Update position when screen dimensions change
  useEffect(() => {
    const updatePosition = () => {
      const { width, height } = Dimensions.get("window")

      // Keep button within screen bounds after rotation
      const currentX = pan.x as any;
      const currentY = pan.y as any;
      if (currentX._value > width - 60) {
        pan.x.setValue(width - 60)
      }
      if (currentY._value > height - 60) {
        pan.y.setValue(height - 60)
      }

      // Report position change
      if (onPositionChange) {
        onPositionChange({ x: currentX._value, y: currentY._value })
      }
    }

    const subscription = Dimensions.addEventListener("change", updatePosition)

    // Initial position report
    if (onPositionChange) {
      const currentX = pan.x as any;
      const currentY = pan.y as any;
      onPositionChange({ x: currentX._value, y: currentY._value })
    }

    return () => subscription.remove()
  }, [])

  // Update position whenever it changes - with debounce to prevent too many updates
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout

    const xListener = pan.x.addListener(({ value }) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (onPositionChange) {
          const currentY = pan.y as any;
          onPositionChange({ x: value, y: currentY._value })
        }
      }, 100) // Debounce position updates
    })

    const yListener = pan.y.addListener(({ value }) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (onPositionChange) {
          const currentX = pan.x as any;
          onPositionChange({ x: currentX._value, y: value })
        }
      }, 100) // Debounce position updates
    })

    return () => {
      clearTimeout(debounceTimer)
      pan.x.removeListener(xListener)
      pan.y.removeListener(yListener)
    }
  }, [onPositionChange])

  const handlePress = () => {
    console.log("FloatingButton pressed")
    if (onPress) {
      onPress()
    }
  }

  const handleMessageDismiss = () => {
    if (onMessageDismiss) {
      onMessageDismiss()
    }
  }

  const handleMessagePress = () => {
    handleMessageDismiss()
    handlePress()
  }

  // Handle layout change to force proper sizing
  const handleBubbleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    
    setBubbleLayout({ width, height })
  }

  const panResponder = useRef(
    PanResponder.create({
      // We want to activate the gesture handler on touch
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      // When the gesture starts, record the time and set dragging flag to false initially
      onPanResponderGrant: () => {
        touchStartTime.current = Date.now()
        isDragging.current = false

        // Store the initial position
        const currentX = pan.x as any;
        const currentY = pan.y as any;
        pan.setOffset({
          x: currentX._value,
          y: currentY._value,
        })
        // Reset the gesture value
        pan.setValue({ x: 0, y: 0 })
      },

      // When moving, update the dragging flag if moved more than a threshold
      onPanResponderMove: (evt, gestureState) => {
        // If moved more than 5px in any direction, consider it a drag
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true
        }

        // Update position
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState)
      },

      // When released, handle the end of gesture
      onPanResponderRelease: (_, gestureState) => {
        // Flatten offset to avoid jumps in next drag
        pan.flattenOffset()

        // If it was a short tap without much movement, trigger the onPress
        const isQuickTap = Date.now() - touchStartTime.current < 200
        if (!isDragging.current && isQuickTap) {
          console.log("Quick tap detected")
          handlePress()
          return
        }

        // If it was a drag, snap to the nearest edge
        const { moveX } = gestureState
        const screenWidth = Dimensions.get("window").width
        const screenHeight = Dimensions.get("window").height

        // Determine which edge to snap to (left or right)
        const finalX = moveX > screenWidth / 2 ? screenWidth - 60 : 10

        // Animate to the edge with a nice spring effect
        const currentY = pan.y as any;
        Animated.spring(pan, {
          toValue: { x: finalX, y: currentY._value },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start()

        // Ensure button stays within vertical bounds
        if (currentY._value < 50) {
          Animated.spring(pan.y, {
            toValue: 50,
            useNativeDriver: false,
          }).start()
        } else if (currentY._value > screenHeight - 100) {
          Animated.spring(pan.y, {
            toValue: screenHeight - 100,
            useNativeDriver: false,
          }).start()
        }
      },
    }),
  ).current

  // Determine if button is on the right side of the screen
  const currentX = pan.x as any;
  const isOnRightSide = currentX._value > width / 2

  // Calculate bounce effect for message
  const bounceInterpolation = messageBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 5, 0],
  })

  const renderButtonContent = () => {
    // Show loading state
    if (isLoadingAvatar) {
      return (
        <Image
          source={require("../assets/images/doulaImg.png")}
          style={styles.image}
          resizeMode="contain"
        />
      );
    }
    
    // Check if user has a valid avatar URL
    if (user?.avatar_url && user.avatar_url.trim() !== '') {
      return (
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            console.log("Failed to load user avatar, falling back to default");
            setImageLoaded(false);
          }}
        />
      );
    }
    
    // Check if we have a local avatar image from AsyncStorage
    if (avatarImage && avatarImage.trim() !== '') {
      return (
        <Image
          source={{ uri: avatarImage }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            console.log("Failed to load local avatar, falling back to default");
            setImageLoaded(false);
          }}
        />
      );
    }
    
    // Fallback to default doulaImg.png
    return (
      <Image
        source={require("../assets/images/doulaImg.png")}
        style={styles.image}
        resizeMode="contain"
      />
    );
  };

  return (
    <Animated.View style={[styles.container, pan.getLayout()]} {...panResponder.panHandlers}>
      {/* Message bubble - always rendered but with opacity control */}
      <Animated.View
        style={[
          styles.messageBubbleContainer,
          isOnRightSide ? styles.messageBubbleLeft : styles.messageBubbleRight,
          {
            opacity: isMessageVisible ? messageOpacity : 0,
            transform: [
              { translateY: messageTranslateY },
              { scale: messageScale },
              { translateY: bounceInterpolation }, // Add bounce effect
            ],
          },
        ]}
        onLayout={handleBubbleLayout}
        pointerEvents={isMessageVisible ? "auto" : "none"}
      >
        <TouchableOpacity onPress={handleMessagePress} activeOpacity={0.8}>
          <Text style={styles.messageText}>{message}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Floating button with pulse animation */}
      <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
        <TouchableWithoutFeedback onPress={handlePress}>
          <View style={styles.button}>
            {renderButtonContent()}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FA9DDF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    borderWidth: 2,
    borderColor: "#FDD1F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: "hidden", // Ensure image stays within the circular button
  },
  image: {
    width: "100%",    
    height: "100%",
  },
  fallbackText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  messageBubbleContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderColor: "#F76CCF4D",
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    // Force layout calculation and prevent overflow
    alignSelf: 'flex-start',
    flexShrink: 1,
    // Ensure proper text wrapping
    flexWrap: 'wrap',
    // Force layout recalculation
    minHeight: 40,
  },
  messageBubbleLeft: {
    right: 65,
    top: -10,
    maxWidth: Dimensions.get("window").width * 0.7, // Responsive max width
  },  
  messageBubbleRight: {
    left: 65,
    top: -10,
    maxWidth: Dimensions.get("window").width * 0.7, // Responsive max width
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#3F3F3F",
    textAlign: "left",
    lineHeight: 20,
    // Force text to wrap and calculate proper width
    flexWrap: 'wrap',
    includeFontPadding: false,
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
    padding: 4,
  },
})

export default FloatingButton
