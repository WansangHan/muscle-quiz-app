export function formatReviewInterval(lastReviewedAt: string | null): string {
  if (!lastReviewedAt) return '첫 학습';
  const diffMs = Date.now() - new Date(lastReviewedAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return '오늘 복습';
  return `${days}일 만의 복습`;
}

export function formatAccuracy(totalCorrect: number, totalReviews: number): string {
  if (totalReviews <= 0) return '-';
  return Math.round((totalCorrect / totalReviews) * 100) + '%';
}

export function formatDifficultyStars(level: number): string {
  return '★'.repeat(level) + '☆'.repeat(3 - level);
}
