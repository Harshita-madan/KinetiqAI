import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const COACHING_PROMPTS = [
  "How can I improve my plank form?",
  "What exercises are good for beginners?",
  "How often should I train?",
  "Tips for better posture?",
];

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
      {!message.isUser && (
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[styles.bubbleContent, message.isUser && styles.userBubbleContent]}>
        <Text style={[styles.messageText, message.isUser && styles.userMessageText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, message.isUser && styles.userTimestamp]}>
          {message.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );
};

export const ChatbotCoachScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial greeting
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "Hi! I'm your AI fitness coach. I can help you improve your form, suggest exercises, and answer any fitness questions you have. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);

    // If coming from a session, offer contextual help
    if (route?.params?.session) {
      setTimeout(() => {
        const contextMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I see you just completed a ${route.params.session.exerciseName} session with a score of ${route.params.session.averageScore}. Would you like some tips on how to improve?`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, contextMessage]);
      }, 1000);
    }
  }, []);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Plank-related
    if (lowerMessage.includes('plank')) {
      return "For a perfect plank:\n\n1. Keep your body in a straight line from head to heels\n2. Engage your core muscles - imagine pulling your belly button to your spine\n3. Don't let your hips sag or pike up\n4. Keep your neck neutral - look at the floor about a foot in front of you\n5. Squeeze your glutes for stability\n\nStart with 20-30 seconds and gradually increase. Quality over quantity!";
    }

    // Squat-related
    if (lowerMessage.includes('squat')) {
      return "Perfect squat form tips:\n\n1. Feet shoulder-width apart, toes slightly out\n2. Keep your chest up and core engaged\n3. Push your hips back like sitting in a chair\n4. Knees should track over your toes, not past them\n5. Go as low as you can while maintaining form\n6. Drive through your heels to stand up\n\nPractice bodyweight squats first before adding weight!";
    }

    // Beginner advice
    if (lowerMessage.includes('beginner') || lowerMessage.includes('start')) {
      return "Welcome to your fitness journey! Here's my advice for beginners:\n\n1. Start with bodyweight exercises (planks, squats, push-ups)\n2. Focus on proper form over speed or reps\n3. Train 3-4 times per week with rest days\n4. Gradually increase difficulty - don't rush\n5. Stay consistent - that's the key to progress\n6. Listen to your body and avoid pain\n\nYou've got this! 💪";
    }

    // Frequency/training schedule
    if (lowerMessage.includes('often') || lowerMessage.includes('frequency') || lowerMessage.includes('schedule')) {
      return "For optimal results:\n\n• Beginners: 3-4 days/week\n• Intermediate: 4-5 days/week\n• Advanced: 5-6 days/week\n\nAlways include:\n- At least 1-2 rest days\n- 48 hours between working the same muscle groups\n- Quality sleep (7-9 hours)\n- Proper nutrition and hydration\n\nConsistency beats intensity. Build a sustainable routine!";
    }

    // Posture
    if (lowerMessage.includes('posture')) {
      return "Improving posture throughout the day:\n\n1. Sit with your back straight, shoulders back\n2. Keep screens at eye level\n3. Take breaks every 30 minutes to stretch\n4. Strengthen your core and back muscles\n5. Be mindful of your alignment\n\nExercises that help:\n- Planks\n- Rows\n- Shoulder blade squeezes\n- Wall angels\n\nGood posture reduces pain and boosts confidence!";
    }

    // Push-up
    if (lowerMessage.includes('push') || lowerMessage.includes('pushup')) {
      return "Push-up form guide:\n\n1. Hands shoulder-width apart, slightly wider is okay\n2. Body in a straight line (like a plank)\n3. Lower until chest nearly touches the ground\n4. Elbows at 45-degree angle to body\n5. Push through your palms to return\n\nToo hard? Try:\n- Wall push-ups\n- Incline push-ups\n- Knee push-ups\n\nBuild up gradually!";
    }

    // Improvement/progress
    if (lowerMessage.includes('improve') || lowerMessage.includes('better') || lowerMessage.includes('progress')) {
      return "To see continuous improvement:\n\n1. Track your sessions (you're already doing this!)\n2. Focus on one correction at a time\n3. Use mirrors or record yourself\n4. Progressively increase difficulty\n5. Stay patient - results take time\n6. Celebrate small wins\n\nEvery session makes you stronger. Keep going!";
    }

    // Motivation
    if (lowerMessage.includes('motivat') || lowerMessage.includes('tired') || lowerMessage.includes('give up')) {
      return "I believe in you! Remember:\n\n- Progress isn't always linear\n- Every workout counts, even short ones\n- You're stronger than you think\n- Consistency > Perfection\n- Rest is part of training\n\nYou showed up today - that's what matters. One rep at a time, one day at a time. You've got this! 💪✨";
    }

    // Default response
    return "That's a great question! Here are some general tips:\n\n1. Always warm up before exercising\n2. Focus on controlled movements\n3. Breathe properly - don't hold your breath\n4. Stay hydrated\n5. Listen to your body\n\nCould you be more specific? I can help with exercise form, training schedules, or technique tips. What would you like to know?";
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay 1-2s
  };

  const handlePromptPress = (prompt: string) => {
    setInputText(prompt);
  };

  // Safe navigation back handler
  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleSafeGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <View style={styles.bubbleContent}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              </View>
            </View>
          )}

          {/* Quick prompts - shown when no messages yet or conversation is short */}
          {messages.length <= 2 && (
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsTitle}>Quick questions:</Text>
              {COACHING_PROMPTS.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.promptChip}
                  onPress={() => handlePromptPress(prompt)}
                >
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.gray400}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={inputText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() === '' ? colors.gray400 : colors.white} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
  },
  messageBubble: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  userBubble: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubbleContent: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBg,
  },
  userBubbleContent: {
    backgroundColor: colors.primary,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  userTimestamp: {
    color: colors.white,
    opacity: 0.7,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray400,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.3,
  },
  promptsContainer: {
    marginTop: spacing.lg,
  },
  promptsTitle: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    marginBottom: spacing.sm,
  },
  promptChip: {
    backgroundColor: colors.cardBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  promptText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.cardBg,
  },
});
