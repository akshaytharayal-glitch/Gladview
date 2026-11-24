# Accounts, Google login and custom lists

Accounts live in PocketBase (`NEXT_PUBLIC_POCKETBASE_URL`, set at build time).

## One-time PocketBase setup
1. **Import the schema:** Admin UI -> Settings -> Import collections -> paste
   `docs/pb.json`. This adds `anime_lists` and `list_items` (custom lists)
   next to the existing `users`, `bookmarks` and `watched` collections.
2. **Email + password:** works out of the box (`users` collection ->
   Options -> "Identity/Password" enabled).
3. **Google login:**
   - Google Cloud Console -> APIs & Services -> Credentials -> Create
     "OAuth client ID" (Web application).
   - Authorized redirect URI: `https://<your-pocketbase-host>/api/oauth2-redirect`
   - PocketBase Admin -> `users` collection -> Options -> OAuth2 -> enable
     **Google** and paste the Client ID and Client Secret.

## What users get
- Sign up / log in with email + password, or "Continue with Google".
- "Lists" button on every anime page: save to **Watch Later** (created
  automatically) or to their own titled lists.
- Profile -> **My Lists**: create, rename and delete lists; each anime shows
  how much has been watched and links to the next episode to continue.
