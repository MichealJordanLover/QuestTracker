# QuestTracker

QuestTracker is a Next.js, React and TypeScript companion for discovering Discord quests. Quest and region data comes from the third-party [Discord Quest community API](https://discordquest.com/document/), not directly from Discord. Eligibility, progress and rewards are controlled by Discord. Completion marks are personal notes and do not complete or claim quests in Discord.

## Run locally

Requires Node.js 20.9 or newer. From the project folder:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run typecheck` to check TypeScript and `npm run build` to create a production build. `npm start` runs that build locally.

## Deploy to Vercel

1. Upload this project folder to a GitHub, GitLab, or Bitbucket repository. Commit `package.json`, `package-lock.json`, `src`, `tsconfig.json`, and the other project files. Do not commit `node_modules` or `.next`; `.gitignore` already excludes them.
2. In the [Vercel dashboard](https://vercel.com/new), choose **Add New → Project** and import the repository. Select the folder containing `package.json` as the Root Directory if your repository contains other folders.
3. Vercel should detect **Next.js** automatically. Leave the default build command (`npm run build`) and output settings in place. Choose Node.js 20 or newer under Project Settings if needed.
4. Click **Deploy**. No environment variables, database, or Discord credentials are needed. Future pushes to your production branch trigger new deployments automatically.
5. Open the Vercel domain and check the quest library and the `/api/quests` endpoint. If quest data fails to load, check Vercel function logs and whether the community provider is reachable; it is a third-party dependency.

Alternatively, install the [Vercel CLI](https://vercel.com/docs/cli), run `vercel` from this folder to create a preview deployment, then run `vercel --prod` to deploy to production. Follow the CLI prompts to link your Vercel account and project.

## Data and limitations

No login, database or credentials are required. Bookmarks, completion marks, theme and reminder read status are stored in the browser on the current device, not synced across devices. Use Settings to export or clear your tracking data. Server-side quest data is cached per running server instance for five minutes; serverless cold starts may require a fresh request to the community provider. Refresh forces a fresh fetch. Regional availability may differ by account and location.

QuestTracker is not affiliated with Discord. It does not automate quests or verify Discord progress.
