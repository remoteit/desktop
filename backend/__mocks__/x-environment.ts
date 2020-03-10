// @ts-ignore
export const isWindows = jest.fn(() => false)

export default {
  userPath: '../jest/user',
  adminPath: '../jest/admin',
  binPath: '../jest/bin',
  isWindows,
}
