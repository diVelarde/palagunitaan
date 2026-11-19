# Data Privacy Review

Palagunitaan partly meets NFR-09: it stores little personal data and limits access by role, but it has no privacy notice, no account deletion, and its public API returns the raw (educational) text without a login. Checked against the code on main, commit 7307c56.

## What personal data the system holds

| Data | Where it is stored | Who can see it |
| --- | --- | --- |
| Name, email, Google account ID, profile photo link (from Google sign-in) | `users` table | Email: the person themselves and administrators. Name: shown on their blog posts. |
| Role (public, contributor, validator, admin) | `users` table | Administrators; the person themselves |
| Role request qualifications and message | `role_requests` table | Administrators |
| Submitted entries: title, raw account, source description, history claims, location | `heritage_entries`, `heritage_entry_history_claims`, `geographic_tags` | Public once published (see finding 1) |
| Photos, audio, video | Cloudinary (third party), linked from `multimedia_assets` | Public once the entry is published |
| Blog posts | `blog_posts` | Public once approved; author name shown |
| Reports, notifications, reviewer decisions and comments | `content_reports`, `notifications`, `editorial_actions` | Moderators and administrators; each person sees their own notifications |
| Entry text sent for categorising, rewriting and translating | Google Gemini API (third party) | Not stored by Palagunitaan beyond the generated result |

No passwords are stored: sign-in is Google OAuth only.

## Review against NFR-09

NFR-09: the system shall comply with basic data privacy principles in handling user account information and submitted content. Three gaps, three partial items, six met.

| Control | Status | What the code shows |
| --- | --- | --- |
| 1. Raw text on the public API | Gap | `GET /api/heritage-entries`, `/search` and `/:id` run `SELECT *` and return `raw_content`, `source_description` and `user_id` to anyone, without sign-in. The public and educational views are only a toggle on the page, so FR-03 and FR-04 are not enforced by the server. |
| 2. Privacy notice and consent at sign-in | Gap | No privacy notice, terms or data-use statement exists in the client or server. Users are not told that their name shows on blog posts or that entry text goes to Gemini. |
| 3. Account deletion, export and retention | Gap | No endpoint or screen to delete or export an account. Administrators can delete entries but not users. No retention rule is written down. |
| 4. Session and request hardening | Partly met | In production the cookie is secure with sameSite none, and CORS allows only the client URL. But `express-session` uses its default in-memory store, no cookie lifetime is set, and there is no rate limiting or security-header middleware. |
| 5. Consent for sensitive content and named people | Partly met | Met: a submission checkbox turns off the AI rewrite for sensitive or local-language content, and blog posts need a consent checkbox that moderators see. Missing: nothing asks contributors to confirm consent from informants named in the source description (the form's own example is "Interview with Lola Maria, 87, Naga City"). |
| 6. Third-party processing | Partly met | Google (sign-in), Gemini (entry text only, no account data), Cloudinary (media) and the database host process data. None is disclosed to users, and the manuscript still names OpenAI instead of Gemini. |
| 7. Sign-in and credentials | Met | Google OAuth only (`passport-google-oauth20`); no passwords stored. |
| 8. Role-based access | Met | `requireRole` guards the admin, review and moderation routes; `rbac.test.js` covers it. Role changes need an administrator, and administrators cannot decide their own request. |
| 9. Data minimisation | Met | Account data is name, email, Google ID, photo link and role. Email never appears in public responses; blog posts show the author's name only. |
| 10. Accountability | Met | `editorial_actions` logs entry and blog decisions, administrators have an audit log viewer, and reviewers cannot review their own submissions. |
| 11. Input handling and uploads | Met | Parameterised SQL, request validators on the main write routes, and an upload filter with file-type and size limits. |
| 12. Secrets and logs | Met | Keys live in environment variables and `.env` files are git-ignored. Server logs record entry and post IDs and error text, not emails. |

## Fixes before the defense

1. **Stop sending raw text to signed-out visitors.** In `heritageEntryController` (`getEntryById`, `searchEntries`, `listPublished`), return `raw_content` only when `req.user` exists, and drop `user_id` from public responses. Add a test. Small change, closes the gap that matters most.
2. **Add a short privacy notice.** One page linked from the footer and from the sign-in button: what is collected (name, email, Google ID, photo), why, who sees it, which services process it (Google, Gemini, Cloudinary), and who to contact. Reference the Data Privacy Act of 2012 (RA 10173) principles of transparency, legitimate purpose and proportionality.
3. **Ask for informant consent on submissions.** Add a checkbox next to the source description, like the blog one: "If this names an informant, they agreed to share it." Store it with the entry.
4. **Use a real session store and basic hardening.** Add `helmet` and a rate limit on the public search and report routes, and set a cookie lifetime. Render restarts currently end every session.
5. **Write the account rules down.** If building deletion is out of reach, state in the manuscript and the privacy notice how a user can ask an administrator to remove their account and what is kept (published entries and the audit trail). Treat self-service deletion as future work.
6. **Update the manuscript's third-party list** from OpenAI to Google Gemini wherever the AI step is described.

## Wording for the manuscript

Paste under NFR-09 or in the testing chapter, and edit it as the fixes above are finished.

> Palagunitaan limits the personal data it keeps to what the platform needs: the name, email address, Google account identifier, profile photo link and role of each signed-in user. Authentication is handled entirely by Google OAuth 2.0, so no passwords are stored. Access to review, moderation and administration functions is restricted by role, role upgrades are decided by an administrator other than the applicant, and every editorial decision on an entry or blog post is recorded in an audit trail. Contributors can mark an entry as containing sensitive or local-language content so that no AI rewrite is generated, and blog authors must confirm consent before naming real people or families. Submitted text is processed by the Google Gemini API for categorisation, rewriting and translation, and media files are hosted on Cloudinary. A privacy notice, informant-consent confirmation on entry submissions, and server-side restriction of the educational (raw) version to signed-in users are planned before public deployment, consistent with the transparency, legitimate purpose and proportionality principles of the Data Privacy Act of 2012 (RA 10173).
