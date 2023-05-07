export function usePlayer() {
  const player = add([
    sprite("mario", { anim: "idle" }),
    pos(center()),
    area(),
    body(),
    anchor("center"),
  ]);
  return {
    player,
  }
}