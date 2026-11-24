---
name: jira-tasks
description: >-
  Use this skill to manage GameLibrary project issues, tasks, and sprints in Jira via the Atlassian MCP server.
---

# Jira Tasks Management Skill

Instructions for querying, creating, updating, and transitioning **GameLibrary** tasks in Jira using the configured `atlassian` MCP server (`.agents/plugins/gamelibrary-atlassian/mcp_config.json` / `.mcp.json`).

## MCP Server Configuration

The workspace connects to the official Atlassian Remote MCP Server via OAuth 2.1 (`mcp-remote`):

- **Config files**: `.agents/plugins/gamelibrary-atlassian/mcp_config.json` (workspace plugin, toggleable in Antigravity Plugins UI) and `.mcp.json` (`https://mcp.atlassian.com/v2/mcp`)
- **Jira Site**: `https://roman999qaz.atlassian.net`
- **Cloud ID**: `2ee4e562-0f76-4c72-8802-2847cf703cb7`
- **Project Key**: `KAN` (*My Team*)

## Standard Procedure

### Step 1: Discover Resources & Projects
If `cloudId` or `projectKey` is not yet known in the session:
1. Call `getAccessibleAtlassianResources` to obtain the `cloudId`.
2. Call `getVisibleJiraProjects` with `cloudId` and `expandIssueTypes: true`.

### Step 2: Search Existing Issues (JQL)
Use `searchJiraIssuesUsingJql` to inspect the board before creating duplicates:
- `cloudId`: `"2ee4e562-0f76-4c72-8802-2847cf703cb7"`
- `jql`: `"project = KAN ORDER BY key DESC"`

### Step 3: Create or Transition Issues
- Use `createJiraIssue` with `projectKey: "KAN"`, `issueTypeName: "Task"` (or `"Epic"`, `"Subtask"`), `contentFormat: "markdown"`, `summary`, and structured `description` (with Acceptance Criteria).
- Use `getTransitionsForJiraIssue` followed by `transitionJiraIssue` when moving a task across board columns (*To Do* -> *In Progress* -> *Done*).

## Current Project Issues (`KAN`)

| Issue Key | Type | Summary | Status |
| :--- | :--- | :--- | :--- |
| **KAN-14** | Task | `[GameLibrary] Експорт та імпорт особистої бібліотеки ігор (JSON / CSV)` | Done |
| **KAN-13** | Task | `[GameLibrary] Додати персональні нотатки та відгуки до ігор у бібліотеці користувача` | Done |
| **KAN-12** | Task | `[GameLibrary] Реалізувати серверну пагінацію та сортування каталогу ігор` | Done |
| **KAN-3** | Subtask | `Subtask 2.1` | Done |
