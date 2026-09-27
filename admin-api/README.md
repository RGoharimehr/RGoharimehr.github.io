# Personal Website Admin API

Secure backend for the GitHub Pages admin panel.

## Render setup

Create a Web Service from this repository.

Build command:
```
npm install
```

Start command:
```
npm start
```

Environment variables:
- `GITHUB_TOKEN`: GitHub fine-grained token with Contents Read and write for `RGoharimehr.github.io`.
- `ADMIN_PASSWORD`: the password you want to use for the admin panel.
- `SESSION_SECRET`: a long random secret (different from the password).
- `ADMIN_ORIGIN`: `https://rgoharimehr.github.io`

After deployment, put the Render service URL into `admin.html` as `API_BASE`.

The GitHub token is stored only as a server environment variable and is never sent to the browser.
