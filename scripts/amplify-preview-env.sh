# Sourced by amplify.yml for PR previews. Amplify gives a preview the app-level environment, not its
# base branch's, and the app level is the legacy production config, so a preview would otherwise sign
# in as remoteit_desktop on login.remote.it. Previews run on dev, matching the main branch's env.
export VITE_OAUTH_ISSUER=https://login.dev.remote.it
export VITE_OAUTH_CLIENT_ID=remoteit_portal
export VITE_OAUTH_GRAPHQL_RESOURCE=https://cloud.dev.remote.it/api
export VITE_OAUTH_AGENT_RESOURCE=https://agent.dev.remote.it
export VITE_OAUTH_MCP_RESOURCE=https://cloud.dev.remote.it/mcp
export VITE_OAUTH_MCP_DETAIL=remoteit_mcp
export VITE_GRAPHQL_API=https://cloud.dev.remote.it/api/graphql
export VITE_WEBSOCKET_URL=wss://cloud.dev.remote.it/api/ws
export VITE_AGENT_URL=https://agent.dev.remote.it
