import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MasteryBadge } from '../common/MasteryBadge';
import { QuizCardMeta as QuizCardMetaType } from '../../types/quiz';
import { formatReviewInterval, formatAccuracy, formatDifficultyStars } from '../../lib/quizMetaUtils';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/spacing';

interface Props {
  difficulty: 1 | 2 | 3;
  meta: QuizCardMetaType;
}

function DifficultyStars({ level }: { level: number }) {
  return <Text style={styles.stars}>{formatDifficultyStars(level)}</Text>;
}

export function QuizCardMetaBar({ difficulty, meta }: Props) {
  const accuracy = formatAccuracy(meta.totalCorrect, meta.totalReviews);

  return (
    <View style={styles.container}>
      <DifficultyStars level={difficulty} />
      <Text style={styles.separator}>·</Text>
      <MasteryBadge level={meta.masteryLevel} />
      <Text style={styles.separator}>·</Text>
      <Text style={styles.text}>{formatReviewInterval(meta.lastReviewedAt)}</Text>
      <Text style={styles.separator}>·</Text>
      <Text style={styles.text}>정답률 {accuracy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  stars: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    letterSpacing: 1,
  },
  separator: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginHorizontal: Spacing.xs,
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
