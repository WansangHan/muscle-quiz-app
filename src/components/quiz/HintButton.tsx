import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  hintLevel: number;
  hintTexts: { charCount: string; choseong: string };
  latinMode?: boolean;
  onPress: () => void;
}

export function HintButton({ hintLevel, hintTexts, latinMode, onPress }: Props) {
  const getHintDisplay = () => {
    if (hintLevel === 0) return null;
    if (hintLevel === 1) return `글자 수: ${hintTexts.charCount}`;
    return `${latinMode ? '첫 글자' : '초성'}: ${hintTexts.choseong}`;
  };

  const hintDisplay = getHintDisplay();

  return (
    <>
      {hintLevel < 2 && (
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <View style={styles.buttonInner}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={Colors.text} />
            <Text style={styles.buttonText}>
              {hintLevel === 0 ? '힌트 보기' : (latinMode ? '첫 글자 힌트' : '초성 힌트')}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      {hintDisplay && <Text style={styles.hintText}>{hintDisplay}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  hintText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
