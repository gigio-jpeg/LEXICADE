// The home is the 3D room. Load the 3D engine only on this route.
export async function home(main) {
  return (await import("../arcade/room.js")).arcadeRoom(main);
}
