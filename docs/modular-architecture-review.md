# Modular Architecture Review

Palagunitaan meets NFR-08 in how the code is organised, but is only partly ready for a second region: an admin can add regions, categories and heritage sites without code changes, while the Bicol and Camarines Sur wording, map centre, languages and category defaults are still written into the code. Checked against the code on main, commit 7307c56.

## Structure of the system

The three-tier design in the manuscript matches the code: a React client, an Express API with separate route, controller, service and model layers, and a relational database plus Cloudinary for media.

| Layer | What it contains | Evidence |
| --- | --- | --- |
| Presentation | React app with pages, components, layouts, API service files and an auth context; Tailwind and CSS theme | `client/src`; deployed on Vercel with a single-page-app rewrite |
| API | Express 5 with 16 route files mounted under `/api/...`; auth, role and upload middleware | `server/index.js`, `server/routes`, `server/middleware` |
| Business logic | 10 services: entry review, blog review, verification status, duplicate detection, timeline, notifications, auth, Gemini, Cloudinary, entry processing | `server/services` |
| Data access | 13 models using parameterised SQL through `mysql2`, and 10 request validators | `server/models`, `server/validators` |
| Database | 17 tables, including `regions`, `categories`, `metadata_fields` and `metadata_values`; changes since the first version are numbered migration scripts (002 to 008) | `server/db/migrations` |
| External services | Google OAuth, Gemini and Cloudinary, each reached through one config or service file | `config/passport.js`, `geminiService.js`, `cloudinaryService.js` |
| Configuration | 17 environment variables for the database, Google, Cloudinary, Gemini, session and URLs; no secrets in the repository | `.gitignore`, `process.env` uses |
| Tests | 33 server test files (models, services, routes, validators, role access) and 4 client tests | `server/tests` |

## Readiness for a second region (NFR-08)

The data model and admin tools are ready for more regions. The wording, map and language settings in the client are still written for Camarines Sur and Bicol.

| Area | Status | What the site does now |
| --- | --- | --- |
| Regions as data | Ready | Admins add, edit and delete regions (name and province) from the admin content routes, with no code change |
| Categories and heritage sites | Ready | Managed by admins through the same routes; entries link to a region and category |
| Media storage | Ready | Cloudinary is separate from the database and the API, so more regions do not change the storage design |
| Dynamic metadata | Partly ready | `metadata_fields` and `metadata_values` exist in the database and the category model, but the submission form and client do not use them |
| Region wording | Not ready | Camarines Sur and Bicol are written directly into the landing page, About page, footer, browse page, blog feed and map page |
| Map | Not ready | The map centre is fixed at 13.6218, 123.1948; there is no per-region centre or zoom |
| Languages | Not ready | The translation panel lists English, Filipino, Bikol Naga and Rinconada Bikol in the code |
| Gemini fallback | Partly ready | The category list used when Gemini cannot answer is a constant in `geminiService`, not read from the categories table |
| Timeline periods | Partly ready | Historical periods are defined in `timelineService` and apply to all regions |
| Reviewers | Not ready | Validators and admins are global; a region cannot have its own reviewers |
| Database setup | Partly ready | Migrations 002 to 008 describe changes only; there is no base schema script to build a new database from scratch |
| Tests | Partly ready | 33 server test files cover the logic; the client has 4 tests |

## Work needed before adding a region

1. Move the Camarines Sur and Bicol wording out of the pages into one config file or a region settings record that the pages read.
2. Store the map centre and zoom for each region, and have the map page read them in place of the fixed centre.
3. Make the translation languages a setting for each region.
4. Either use the dynamic metadata tables in the submission form and entry page, or remove that claim from the manuscript (FR-08).
5. Read the Gemini fallback categories from the categories table.
6. Add a base schema script and a migration that brings a new database to the current state.
7. Later: allow reviewers to be assigned to a region, so validators for one region do not review another.

## Wording for the manuscript

> Palagunitaan follows a three-tier architecture. A React client handles presentation, an Express API separates routes, controllers, services and models, and a relational database stores records while Cloudinary stores media. Google OAuth handles sign-in, and the Gemini API supports translation and categorization. Regions and categories are records that administrators manage without changing code, which supports the expansion goal in NFR-08. The pilot region, Camarines Sur, is currently written into some pages, the map centre and the language list. Moving these settings into configuration, and adding a base database schema, is listed as future work before a second region is added.