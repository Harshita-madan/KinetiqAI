import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { Avatar } from '../components';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => (
  <View
    style={[
      styles.messageBubble,
      message.isUser ? styles.userBubble : styles.aiBubble,
    ]}
  >
    {!message.isUser && (
      <View style={styles.aiAvatarContainer}>
        <View style={styles.aiAvatar}>
          <Ionicons name="hardware-chip" size={16} color={colors.white} />
        </View>
      </View>
    )}
    <View
      style={[
        styles.bubbleContent,
        message.isUser ? styles.userBubbleContent : styles.aiBubbleContent,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText,
        ]}
      >
        {message.text}
      </Text>
      <Text
        style={[
          styles.timestamp,
          message.isUser ? styles.userTimestamp : styles.aiTimestamp,
        ]}
      >
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  </View>
);

const SuggestedPrompt: React.FC<{ text: string; onPress: () => void }> = ({ text, onPress }) => (
  <TouchableOpacity style={styles.suggestedPrompt} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.suggestedPromptText}>{text}</Text>
    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
  </TouchableOpacity>
);

export const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm KinetiqAI, your intelligent assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const suggestedPrompts = [
    "What can you help me with?",
    "Explain accessibility features",
    "How does AI vision work?",
    "Tell me about offline mode",
  ];

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'm a demo AI assistant. In the full version, I would provide helpful responses based on your questions. Feel free to explore the app's features!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleSuggestedPrompt = (text: string) => {
    setInputText(text);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {/* Suggested Prompts - show only when few messages */}
          {messages.length <= 2 && (
            <View style={styles.suggestedContainer}>
              <Text style={styles.suggestedTitle}>Try asking:</Text>
              {suggestedPrompts.map((prompt, index) => (
                <SuggestedPrompt
                  key={index}
                  text={prompt}
                  onPress={() => handleSuggestedPrompt(prompt)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={24} color={colors.gray400} />
            </TouchableOpacity>
            <TextInput
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              style={styles.textInput}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic-outline" size={24} color={colors.gray400} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.white : colors.gray400}
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
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  aiAvatarContainer: {
    marginRight: spacing.sm,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContent: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  userBubbleContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  aiBubbleContent: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  userMessageText: {
    color: colors.white,
  },
  aiMessageText: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: colors.textMuted,
  },
  suggestedContainer: {
    marginTop: spacing.lg,
    paddingLeft: 40, // Align with AI messages
  },
  suggestedTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  suggestedPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestedPromptText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
  },
  attachButton: {
    padding: spacing.sm,
  },
  micButton: {
    padding: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: colors.gray200,
  },
});
