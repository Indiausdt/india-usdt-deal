# Railway deployment

1. Extract this ZIP and upload the folder to a private GitHub repository.
2. In Railway, choose **New Project > Deploy from GitHub repo**.
3. Select the repository. Railway reads `railway.json` automatically.
4. After deployment succeeds, open **Settings > Networking > Generate Domain**.

Required runtime: Node.js 22 or newer. No environment variables are required
for the current UI prototype.

Hidden routes:

- Agent: `/agent-login`
- Admin: `/admin-control`

Important: the current prototype stores demo changes in the browser's local
storage. A database and secure authentication must be added before production
use so data can sync across devices and admin routes can be protected.
