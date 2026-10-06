export function spellingRound(pair, random = Math.random) {
  const correct = random() > 0.5;
  return {
    text: correct ? pair.correct : pair.wrong,
    correct,
    answer: pair.correct,
    explanation: pair.explanation,
  };
}
export const judge = (round, choice) => round.correct === choice;
