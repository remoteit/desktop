export const isLoopback = (address?: string) =>
  !!address && /^(::1|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.test(address)
