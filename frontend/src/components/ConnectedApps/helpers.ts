// The AS's revokeReach tells the truth per API: which surfaces stop honouring tokens
// immediately, and which let an already-minted access token live out its TTL.
export function revokeWindow(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

// Enabled actions across every permission group — the chips the pages render.
export function enabledActions(agent: IAuthorizedAgent): IGrantAction[] {
  return (agent.groups ?? []).flatMap(g => g.actions).filter(a => a.enabled)
}
