export function stepFlight(state, dt, flap = false) {
  const velocity = flap ? -225 : Math.min(350, state.velocity + 520 * dt);
  return { ...state, velocity, y: state.y + velocity * dt };
}
export function portalHit(y, portals, radius = 10) {
  return (
    portals.find(
      (p) => y - radius > p.y - p.height / 2 && y + radius < p.y + p.height / 2,
    ) ?? null
  );
}
