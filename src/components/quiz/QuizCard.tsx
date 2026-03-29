import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TextInput, Animated, StyleSheet } from 'react-native';
import { QuizCard as QuizCardType } from '../../types/quiz';
import { PressableScale } from '../common/PressableScale';
import { HintButton } from './HintButton';
import { QuizCardMetaBar } from './QuizCardMeta';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';
import { BODY_REGION_LABELS } from '../../data/muscles';

interface Props {
  card: QuizCardType;
  hintLevel: number;
  isClose: boolean;
  answerIndex: number;
  totalAnswers: number;
  latinMode?: boolean;
  onSubmit: (answer: string) => void;
  onHint: () => void;
}

export function QuizCardComponent({ card, hintLevel, isClose, answerIndex, totalAnswers, latinMode, onSubmit, onHint }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Clear input and auto-focus when card or answer index changes
  useEffect(() => {
    setInput('');
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [card.muscle.id, answerIndex]);

  // Shake animation when close match
  useEffect(() => {
    if (isClose) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [isClose, shakeAnim]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input.trim());
    setInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={card.muscle.imageAsset} style={styles.image} resizeMode="contain" />
        <Text style={styles.regionBadge}>
          {BODY_REGION_LABELS[card.muscle.bodyRegion] ?? card.muscle.bodyRegion}
        </Text>
      </View>

      {card.meta && (
        <QuizCardMetaBar difficulty={card.muscle.difficulty} meta={card.meta} />
      )}

      <Text style={styles.prompt}>
        {latinMode ? 'What is the name of this muscle?' : '이 근육의 이름은?'}
      </Text>

      {card.choices && card.choices.length > 0 ? (
        <View style={styles.choicesContainer}>
          {card.choices.map((choice, idx) => (
            <PressableScale
              key={idx}
              style={styles.choiceButton}
              onPress={() => onSubmit(choice)}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </PressableScale>
          ))}
        </View>
      ) : (
        <>
          {isClose && (
            <Text style={styles.closeText}>거의 맞았어요! 다시 시도해보세요.</Text>
          )}

          <Animated.View style={{ width: '100%', transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              ref={inputRef}
              style={[styles.input, isClose && styles.inputClose]}
              value={input}
              onChangeText={setInput}
              placeholder={latinMode ? 'Enter muscle name' : '근육 이름을 입력하세요'}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
          </Animated.View>

          <PressableScale style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>확인</Text>
          </PressableScale>

          <HintButton
            hintLevel={hintLevel}
            hintTexts={card.hintTexts[answerIndex] ?? card.hintTexts[0]}
            latinMode={latinMode}
            onPress={onHint}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  regionBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    color: '#fff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    fontSize: FontSize.xs,
    fontWeight: '600',
    overflow: 'hidden',
  },
  prompt: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  closeText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    textAlign: 'center',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  inputClose: {
    borderColor: Colors.warning,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: 'center' as const,
  },
  submitText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  choicesContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  choiceButton: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
  },
  choiceText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
