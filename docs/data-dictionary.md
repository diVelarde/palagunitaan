# Server data dictionary

## Scope and evidence

This inventory is based on SQL in `server/models/*.js` and the checked-in migrations `002` through `008`. There is no baseline schema or migration `001` in `server/db/migrations`; consequently, types and nullability for legacy columns are marked unknown unless an additive migration defines them. A `* (wildcard)` row means the model selects every column from that table, including columns not individually enumerated here.

The application refers to 17 tables: `blog_posts`, `categories`, `claim_assessments`, `content_reports`, `editorial_actions`, `geographic_tags`, `heritage_entries`, `heritage_entry_history_claims`, `heritage_sites`, `highlights`, `metadata_fields`, `metadata_values`, `multimedia_assets`, `notifications`, `regions`, `role_requests`, and `users`.

## Comparison with requested additions

| Requested item | Checked-in state | Comparison |
|---|---|---|
| `heritage_entries.alternate_names` | Migration 008 adds nullable `TEXT`; the model stores JSON-encoded string arrays, reads them as arrays, updates them, and searches them. | Present and aligned. |
| `source_assessments` | No table by this name exists. Migration 002 and `claimAssessmentModel` use `claim_assessments`. | Naming mismatch: the implemented table is `claim_assessments`, not `source_assessments`. |
| `blog_posts.status`, `reviewed_by`, `reviewed_at`, `rejection_reason` | Migration 004 defines these; the model reads and writes them. | Present and aligned. |
| `blog_posts.mentions_people`, `consent_confirmed` | Migration 007 defines both as `TINYINT(1) NOT NULL DEFAULT 0`; the model writes them. | Present and aligned. |
| `role_requests.decision_reason` | Migration 003 adds nullable `TEXT`; the model writes it when reviewing. | Present and aligned. |
| `content_reports` | Migration 006 creates the table and `contentReportModel` uses it. Its target is intentionally polymorphic and has no target FK. | Present and aligned. |
| `editorial_actions.action_type = 'approved_unverified'` | The model persists `action_type` as a value; the code uses `approved_unverified`. The project owner confirmed the column is a string. No enum migration exists. | No migration needed for this value under the confirmed string schema. The checked-in migration history does not define the base column type. |

## Entity tables

### `blog_posts`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | `SELECT *` / `bp.*` is used for feed, detail, author, pending, and review reads. Base schema is absent. |
| `id` | Not inferable | Not inferable | Used as primary lookup key. |
| `user_id` | Not inferable | Not inferable | Author; joined to `users.id`. |
| `title` | Not inferable | Not inferable | Keyword search and audit title. |
| `content` | Not inferable | Not inferable | Keyword search. |
| `cover_image_url` | Not inferable | Not inferable | Stored by create. |
| `published_at` | Timestamp (owner-confirmed) | Not inferable | Sort/date filtering and author ordering use this column. |
| `view_count` | Not inferable | Not inferable | Incremented only for published posts. |
| `status` | `ENUM('pending','published','rejected')` | No | Migration 004; default `pending`; existing rows are set to `published`. |
| `reviewed_by` | `INT` | Yes | Migration 004; FK to `users.id`. |
| `reviewed_at` | `DATETIME` | Yes | Migration 004. |
| `rejection_reason` | `TEXT` | Yes | Migration 004. |
| `mentions_people` | `TINYINT(1)` | No | Migration 007; default `0`. |
| `consent_confirmed` | `TINYINT(1)` | No | Migration 007; default `0`. |

### `categories`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Category list and detail queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup and insert key. |
| `name` | Not inferable | Not inferable | Lookup, ordering, create, and update. |
| `description` | Not inferable | Not inferable | Create/update; code supplies `NULL` when omitted. |

### `claim_assessments`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | No | Primary key, migration 002. |
| `history_claim_id` | `INT` | No | FK to `heritage_entry_history_claims.id`, `ON DELETE CASCADE`. |
| `heritage_entry_id` | `INT` | No | FK to `heritage_entries.id`, `ON DELETE CASCADE`. |
| `validator_id` | `INT` | No | FK to `users.id`, `ON DELETE CASCADE`. |
| `editorial_action_id` | `INT` | Yes | FK to `editorial_actions.id`, `ON DELETE SET NULL`. |
| `source_type_fit` | `ENUM('met','partly','not_met')` | No | Migration 002. |
| `source_credibility` | `ENUM('met','partly','not_met')` | No | Migration 002. |
| `corroboration` | `ENUM('met','partly','not_met')` | No | Migration 002. |
| `claimed_year_supported` | `ENUM('met','partly','not_met')` | No | Migration 002. |
| `notes` | `TEXT` | Yes | Migration 002. |
| `created_at` | `TIMESTAMP` | Not stated | Default `CURRENT_TIMESTAMP`, migration 002; used for result ordering. |

### `content_reports`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | No | Primary key, migration 006. |
| `target_type` | `ENUM('entry','blog_post')` | No | Migration 006. |
| `target_id` | `INT` | No | Polymorphic target key; intentionally has no FK. |
| `reporter_id` | `INT` | No | FK to `users.id`, `ON DELETE CASCADE`. |
| `reason` | `VARCHAR(100)` | No | Migration 006. |
| `message` | `TEXT` | Yes | Migration 006. |
| `status` | `ENUM('open','closed')` | No | Default `open`, migration 006. |
| `created_at` | `TIMESTAMP` | Not stated | Default `CURRENT_TIMESTAMP`; migration 006 and list ordering. |
| `reporter_name` | Query alias | — | Selected from `users.name`; not a column on this table. |
| `target_title` | Query alias | — | `COALESCE(heritage_entries.title, blog_posts.title)`. |

### `editorial_actions`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Returned by create, entry history, and audit-log queries. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `heritage_entry_id` | `INT` | Yes | Migration 005 makes it nullable; used for entry-targeted actions. Its original FK is not defined in the checked-in migrations. |
| `blog_post_id` | `INT` | Yes | Added by migration 005; FK to `blog_posts.id`, `ON DELETE CASCADE`. |
| `validator_id` | Not inferable | Not inferable | Joined to `users.id` for the validator name. |
| `action_type` | String (owner-confirmed) | Not inferable | Values include review decisions such as `approved_unverified`; no enum definition or migration is present. |
| `comment` | Not inferable | Not inferable | Nullable value is passed as `NULL` when omitted; dispute lookup reads it. |
| `action_date` | Not inferable | Not inferable | Used for ordering history and audit results. |
| `validator_name` | Query alias | — | Selected from `users.name`. |
| `entry_title` | Query alias | — | Selected from `heritage_entries.title`. |
| `blog_post_title` | Query alias | — | Selected from `blog_posts.title`. |

### `geographic_tags`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Tag lookup selects all columns. |
| `id` | Not inferable | Not inferable | Returned by tag queries. |
| `heritage_entry_id` | Not inferable | Not inferable | Parent entry; used for lookup/update/insert and joined to `heritage_entries.id`. |
| `latitude` | Not inferable | Not inferable | Tag coordinates. |
| `longitude` | Not inferable | Not inferable | Tag coordinates. |
| `location_name` | Not inferable | Not inferable | Optional location label; code passes `NULL` when omitted. |
| `entry_id` | Query alias | — | Alias for `heritage_entries.id`. |
| `title`, `category_auto`, `verification_status` | Query aliases/source columns | — | Selected from `heritage_entries`. |
| `region_name`, `region_province` | Query aliases | — | Selected from `regions`. |

### `heritage_entries`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Detail, search, pending, and enrichment queries select all columns. |
| `id` | Not inferable | Not inferable | Primary lookup key. |
| `user_id` | Not inferable | Not inferable | Submitter; related to `users.id` in application queries. |
| `title` | Not inferable | Not inferable | Search, detail, timeline, and audit display. |
| `raw_content` | Not inferable | Not inferable | Search and entry content. |
| `source_type` | Not inferable | Not inferable | Submission source label. |
| `source_description` | Not inferable | Not inferable | Submission source notes. |
| `historical_period` | Not inferable | Not inferable | Search and timeline filter/display. |
| `category_auto` | Not inferable | Not inferable | Category and enrichment field. |
| `region_id` | Not inferable | Not inferable | Related to `regions.id` in queries. |
| `alternate_names` | `TEXT` | Yes | Migration 008; JSON-encoded array of strings, used by create/update and keyword search. |
| `ai_educational_excluded` | Not inferable | Not inferable | Read/written by enrichment and admin queries. |
| `status` | Not inferable | Not inferable | Pending/published filtering and status updates. |
| `verification_status` | Not inferable | Not inferable | Review/search/display field. |
| `submitted_at` | Not inferable | Not inferable | Pending and user-submission ordering. |
| `published_at` | Not inferable | Not inferable | Publication ordering and timeline output. |
| `euphemistic_content` | Not inferable | Not inferable | Search, display, and AI enrichment. |
| `translated_content` | Not inferable | Not inferable | Translation update. |
| `translated_language` | Not inferable | Not inferable | Translation update. |
| `cover_image_url` | Not inferable | Not inferable | Admin, map, and detail output. |
| `location_latitude`, `location_longitude`, `location_name` | Query aliases/source columns | — | Coordinates/name are selected from `geographic_tags`. |
| `region_name`, `region_province` | Query aliases | — | Selected from `regions`. |
| `dispute_comment` | Query alias | — | Latest non-null disputed `editorial_actions.comment`. |

### `heritage_entry_history_claims`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `id` | Not inferable | Not inferable | Claim key. |
| `heritage_entry_id` | Not inferable | Not inferable | Parent entry; queried and inserted with the claim. |
| `claimed_year` | Not inferable | Not inferable | Claim's reported origin year. |
| `source_type` | Not inferable | Not inferable | Source category recorded for the claim. |
| `source_description` | Not inferable | Not inferable | Claim source details. |
| `source_year` | Not inferable | Not inferable | Source publication/recording year. |
| `source_url` | Not inferable | Not inferable | Optional source link; code passes `NULL` when omitted. |

### `heritage_sites`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | List/detail queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `created_by` | Not inferable | Not inferable | Related to `users.id` by application data. |
| `name` | Not inferable | Not inferable | Create/update and highlight output. |
| `description` | Not inferable | Not inferable | Optional; code passes `NULL` when omitted. |
| `latitude` | Not inferable | Not inferable | Site coordinate. |
| `longitude` | Not inferable | Not inferable | Site coordinate. |
| `is_highlighted` | Not inferable | Not inferable | Boolean-like create/update value. |
| `highlight_period` | Not inferable | Not inferable | Optional; code passes `NULL` when omitted. |
| `image_url` | Not inferable | Not inferable | Optional; code passes `NULL` when omitted. |
| `created_at` | Not inferable | Not inferable | List ordering. |

### `highlights`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Active/history queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup/order key. |
| `heritage_entry_id` | Not inferable | Not inferable | Optional entry target in query logic. |
| `heritage_site_id` | Not inferable | Not inferable | Optional site target; checked to derive `target_type`. |
| `period_type` | Not inferable | Not inferable | Active-highlight filter. |
| `starts_on` | Not inferable | Not inferable | Active date-window filter and history ordering. |
| `ends_on` | Not inferable | Not inferable | Active date-window filter. |
| `created_by` | Not inferable | Not inferable | Creator identifier. |
| `created_at` | Not inferable | Not inferable | Active-highlight ordering. |
| `target_type` | Query alias | — | Computed as `site` when `heritage_site_id` is non-null, otherwise `entry`. |
| `title`, `raw_content`, `euphemistic_content`, `category_auto`, `cover_image_url`, `status` | Query aliases/source columns | — | Selected from `heritage_entries`. |
| `site_name`, `site_description`, `site_image_url`, `site_latitude`, `site_longitude` | Query aliases | — | Selected from `heritage_sites`. |

### `metadata_fields`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Category field listing selects all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `category_id` | Not inferable | Not inferable | Parent category; category delete is documented in model code as cascading to these rows. |
| `field_name` | Not inferable | Not inferable | Create/update and metadata value display. |
| `field_type` | Not inferable | Not inferable | Defaults to `text` on create. |

### `metadata_values`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `id` | Not inferable | Not inferable | Selected in model join. |
| `heritage_entry_id` | Not inferable | Not inferable | Entry relation. |
| `metadata_field_id` | Not inferable | Not inferable | Field relation. |
| `field_value` | Not inferable | Not inferable | Stored metadata value. |
| `field_name`, `field_type` | Query aliases/source columns | — | Selected from `metadata_fields`. |

### `multimedia_assets`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Insert result lookup selects all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `heritage_entry_id` | Not inferable | Not inferable | Parent entry. |
| `file_url` | Not inferable | Not inferable | Stored asset URL. |
| `file_type` | Not inferable | Not inferable | Stored asset type. |
| `created_at` | Not inferable | Not inferable | Asset ordering. |

### `notifications`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Insert result, list, and detail queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `user_id` | Not inferable | Not inferable | Recipient. |
| `heritage_entry_id` | Not inferable | Not inferable | Entry notification target; model passes `NULL` for role-request and blog notifications. No checked-in migration declares its nullability. |
| `type` | Not inferable | Not inferable | Notification type. |
| `message` | Not inferable | Not inferable | Notification content. |
| `created_at` | Not inferable | Not inferable | List ordering. |
| `is_read` | Not inferable | Not inferable | Unread count and read update. |

### `regions`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Region list/detail queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `name` | Not inferable | Not inferable | List, lookup, and create/update. |
| `province` | Not inferable | Not inferable | Region lookup/display and create/update. |
| `coordinates` | Not inferable | Not inferable | Optional; code passes `NULL` when omitted. |

### `role_requests`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | Detail and pending queries select all columns. |
| `id` | Not inferable | Not inferable | Lookup key. |
| `user_id` | Not inferable | Not inferable | Applicant; joined to `users.id`. |
| `requested_role` | Not inferable | Not inferable | Requested role. |
| `qualifications` | Not inferable | Not inferable | Applicant qualifications. |
| `message` | Not inferable | Not inferable | Optional; code passes `NULL` when omitted. |
| `status` | Not inferable | Not inferable | Pending filter and decision update. |
| `reviewed_by` | Not inferable | Not inferable | Reviewer identifier. |
| `reviewed_at` | Not inferable | Not inferable | Set with `NOW()` on review. |
| `created_at` | Not inferable | Not inferable | Pending request ordering. |
| `decision_reason` | `TEXT` | Yes | Added by migration 003; saved on review. |
| `user_name`, `user_email`, `applicant_role` | Query aliases | — | Selected from `users`. |

### `users`

| Column | Type if inferable | Nullable | Notes |
|---|---|---|---|
| `*` (wildcard) | Not inferable | Not inferable | User lookup/list queries select all columns. |
| `id` | Not inferable | Not inferable | User key and referenced identifier. |
| `google_id` | Not inferable | Not inferable | OAuth lookup/create. |
| `name` | Not inferable | Not inferable | User and moderator display name. |
| `email` | Not inferable | Not inferable | Lookup and role-request display. |
| `avatar_url` | Not inferable | Not inferable | User create/read. |
| `role` | Not inferable | Not inferable | User create/update and authorization. |
| `created_at` | Not inferable | Not inferable | User ordering and response serialization. |

## Query/migration mismatches and caveats

- The migrations directory begins at `002_claim_assessments.sql`; no base schema or migration `001` is checked in. Most legacy column types, nullability, primary keys, and foreign keys therefore cannot be confirmed here.
- The requested name `source_assessments` does not match the implemented/migrated `claim_assessments` table.
- `blog_posts.published_at` is used by SQL for sorting and date filters and was confirmed as the timestamp column, but no checked-in migration defines the base blog table or this column.
- `notificationModel` writes `heritage_entry_id = NULL` for role-request and blog notifications. No checked-in migration documents that column or changes its nullability, so compatibility depends on the external base schema.
- `editorial_actions.action_type` is used as a string and includes `approved_unverified`; no enum constraint appears in the migrations. The owner confirmed the column is a string.
- `view_count` is not referenced by `heritageEntryModel` SQL; the blog model does use `blog_posts.view_count`. It should not be inferred as a heritage-entry column from these queries.
