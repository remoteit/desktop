# Sourced by amplify.yml for branch previews: the branches Amplify autodetects, whose auto-created
# branch config sets AMPLIFY_PREVIEW=true. A preview also gets the app-level environment, and the app
# level pins the legacy production API, so a preview would otherwise sign in as remoteit_desktop on
# login.remote.it. Pinning the dev issuer selects STAGES.dev for the rest.
unset VITE_GRAPHQL_API VITE_WEBSOCKET_URL VITE_OAUTH_GRAPHQL_RESOURCE VITE_OAUTH_AGENT_RESOURCE VITE_OAUTH_MCP_RESOURCE VITE_OAUTH_MCP_DETAIL
export VITE_OAUTH_ISSUER=https://login.dev.remote.it
export VITE_OAUTH_CLIENT_ID=remoteit_portal
# A pinned build otherwise calls the agent at /agent, which only the vite dev server proxies.
export VITE_AGENT_URL=https://agent.dev.remote.it
