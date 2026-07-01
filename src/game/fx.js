// Шина событий для частиц: сцены и UI кидают всплески, FxCanvas рисует.
const subs = new Set()

export const fx = {
  fire(type, x, y, opts = {}) {
    subs.forEach((f) => f(type, x, y, opts))
  },
  on(f) {
    subs.add(f)
    return () => subs.delete(f)
  },
}
