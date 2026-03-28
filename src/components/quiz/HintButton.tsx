import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  hintLevel: number;
  hintTexts: { charCount: string; choseong: string };
  onPress: () => void;
}

export function HintButton({ hintLevel, hintTexts, onPress }: Props) {
  const getHintDisplay = () => {
    if (hintLevel === 0) return null;
    if (hintLevel === 1) return `글자 수: ${hintTexts.charCount}`;
    return `초성: ${hintTexts.choseong}`;
  };

  const hintDisplay = getHintDisplay();

  return (
    <>
      {hintLevel < 2 && (
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>
            {hintLevel === 0 ? '힌트 보기' : '초성 힌트'}
          </Text>
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
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#333',
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
