/* What is shown does not move from under a press. While a pointer or an activating key is down, what would change it is
   held, and done once the press is over and its click has been taken — so a press acts on what was shown when it began. A
   release that never comes (the pointer let go outside the window, a key lost with the focus) holds nothing for long. */

const HELD_MS = 5_000

let down = false
let safety: ReturnType<typeof setTimeout> | undefined
let held: (() => void)[] = []

const release = () => {
  clearTimeout(safety)
  if (!down) return
  down = false
  const due = held
  held = []
  due.forEach(change => change())
}
// The click comes after the release, in the same task or the next.
const over = () => void setTimeout(release)
const press = () => {
  down = true
  clearTimeout(safety)
  safety = setTimeout(release, HELD_MS)
}
const activates = (event: KeyboardEvent) => event.key === 'Enter' || event.key === ' '

window.addEventListener('pointerdown', press, true)
window.addEventListener('pointerup', over, true)
window.addEventListener('pointercancel', over, true)
window.addEventListener('keydown', event => activates(event) && press(), true)
window.addEventListener('keyup', event => activates(event) && over(), true)
window.addEventListener('blur', over)

/** Makes a change to what is shown: now, or once the press under way is over. */
export function whenReleased(change: () => void) {
  if (down) held.push(change)
  else change()
}
