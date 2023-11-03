export const env = import.meta.env

if (typeof global === 'undefined') {
  window.global = window
}
