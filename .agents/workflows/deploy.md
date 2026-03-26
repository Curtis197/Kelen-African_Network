---
description: Combined GitHub push and Vercel deployment after code modifications.
---

1. Commit and push the current changes to GitHub.
// turbo
2. Run `git add .`
// turbo
3. Run `git commit -m "[Brief description of changes]"`
// turbo
4. Run `git push origin [current-branch]`
5. Deploy to Vercel using the Vercel CLI.
// turbo
6. Run `vercel deploy --prod` (or `vercel` for preview if needed)
7. Monitor the deployment build status.
8. If the deployment fails, use `vercel logs [deployment-url]` to debug and fix the errors.
9. Verify the live environment for any runtime issues.
