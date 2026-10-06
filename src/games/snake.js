export function createSnake() {
  return {
    body: [
      [4, 8],
      [3, 8],
      [2, 8],
    ],
    direction: [1, 0],
    alive: true,
  };
}
export function turnSnake(state, direction) {
  if (
    direction[0] === -state.direction[0] &&
    direction[1] === -state.direction[1]
  )
    return state;
  return { ...state, direction };
}
export function stepSnake(state, size = 18, grow = false, obstacles = []) {
  const head = [
    state.body[0][0] + state.direction[0],
    state.body[0][1] + state.direction[1],
  ];
  const body = grow ? state.body : state.body.slice(0, -1);
  const blocked = [...body, ...obstacles].some(
    (p) => p[0] === head[0] && p[1] === head[1],
  );
  if (head.some((c) => c < 0 || c >= size) || blocked)
    return { ...state, alive: false };
  return { ...state, body: [head, ...body] };
}
