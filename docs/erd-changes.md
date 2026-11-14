# ERD change notes

## Reading this description

This is a text description of the current entities used by `server/models` and the additive migrations in `server/db/migrations`. The repository does not include the baseline schema or migration `001`. Relationships called “application-level” are implied by joins, inserts, or model behavior; except where noted, their original FK constraints cannot be verified from checked-in migrations.

## Entities and keys

- **users** — primary key `id`. OAuth lookup fields include `google_id` and `email`; account display fields include `name`, `avatar_url`, and `role`.
- **heritage_entries** — primary key `id`; submitter `user_id`, optional region `region_id`. Migration 008 adds nullable `alternate_names TEXT`, stored as a JSON-encoded array.
- **heritage_entry_history_claims** — primary key `id`; parent key `heritage_entry_id`.
- **claim_assessments** — primary key `id`; required `history_claim_id`, `heritage_entry_id`, and `validator_id`; optional `editorial_action_id`. This is the actual table name; there is no `source_assessments` table in the migrations or models.
- **blog_posts** — primary key `id`; author `user_id`; optional reviewer `reviewed_by`. Migration 004 adds `status`, `reviewed_by`, `reviewed_at`, and `rejection_reason`; migration 007 adds `mentions_people` and `consent_confirmed`.
- **editorial_actions** — primary key `id`; optional `heritage_entry_id` and `blog_post_id`, plus `validator_id`. Migration 005 makes `heritage_entry_id` nullable and adds nullable `blog_post_id` with an FK to `blog_posts.id`. The model requires exactly one target in application logic.
- **role_requests** — primary key `id`; applicant `user_id`, reviewer `reviewed_by`. Migration 003 adds nullable `decision_reason`.
- **content_reports** — primary key `id`; required `reporter_id`; polymorphic target pair `(target_type, target_id)`. Migration 006 intentionally declares no FK for the polymorphic target.
- **notifications** — primary key `id`; recipient `user_id`; optional entry reference `heritage_entry_id`. The model creates blog and role-request notifications with a null entry reference; no direct blog-post reference is used.
- **regions** — primary key `id`.
- **geographic_tags** — primary key `id`; entry reference `heritage_entry_id`.
- **heritage_sites** — primary key `id`; creator `created_by`.
- **highlights** — primary key `id`; optional target keys `heritage_entry_id` and `heritage_site_id`; creator `created_by`.
- **multimedia_assets** — primary key `id`; parent `heritage_entry_id`.
- **categories** — primary key `id`.
- **metadata_fields** — primary key `id`; parent `category_id`.
- **metadata_values** — primary key `id`; `heritage_entry_id` and `metadata_field_id`.

## Relationships and cardinality

Cardinality notation is `one parent : zero-or-many children`, unless otherwise noted. “Inferred” means supported by model SQL/behavior but not fully confirmed as a database constraint in the checked-in migrations.

1. **users to heritage_entries** — one user : zero-or-many entries; each entry has one submitter (`heritage_entries.user_id`). Inferred from model fields and queries.
2. **regions to heritage_entries** — one region : zero-or-many entries; an entry may have zero or one region (`heritage_entries.region_id`). Inferred from the optional region form and model joins.
3. **heritage_entries to heritage_entry_history_claims** — one entry : zero-or-many claims. The claim model inserts and selects by `heritage_entry_id`; assessment migration declares `ON DELETE CASCADE` from claims to assessments, not the original entry-to-claim FK.
4. **heritage_entry_history_claims to claim_assessments** — one claim : zero-or-many assessments. Migration 002 declares the required FK with `ON DELETE CASCADE`.
5. **heritage_entries to claim_assessments** — one entry : zero-or-many assessments. Migration 002 declares the required FK with `ON DELETE CASCADE`. The migration does not enforce that the assessment's `heritage_entry_id` is the same entry as its `history_claim_id`; application validation must maintain that consistency.
6. **users to claim_assessments** — one validator : zero-or-many assessments. Migration 002 declares `validator_id` as an FK with `ON DELETE CASCADE`.
7. **editorial_actions to claim_assessments** — one action : zero-or-many assessments; each assessment may refer to zero or one action. Migration 002 makes `editorial_action_id` nullable and sets it to null when the action is deleted.
8. **users to blog_posts** — one author : zero-or-many posts (`blog_posts.user_id`); inferred from model create and viewer queries.
9. **users to reviewed blog_posts** — one reviewer : zero-or-many posts; each post may have zero or one reviewer (`blog_posts.reviewed_by`). Migration 004 declares the FK to `users.id`.
10. **blog_posts to editorial_actions** — one post : zero-or-many actions. Each action can target zero or one blog post; migration 005 adds nullable `blog_post_id` with `ON DELETE CASCADE`.
11. **heritage_entries to editorial_actions** — one entry : zero-or-many actions. Each action can target zero or one entry; migration 005 makes `heritage_entry_id` nullable. The model enforces exactly one of `heritage_entry_id` or `blog_post_id` per action. The existing entry FK is not recreated or otherwise shown in the checked-in migrations.
12. **users to editorial_actions** — one validator : zero-or-many actions (`editorial_actions.validator_id`); inferred from model joins.
13. **users to role_requests as applicant** — one user : zero-or-many requests (`role_requests.user_id`); inferred from model joins and request creation.
14. **users to role_requests as reviewer** — one reviewer : zero-or-many reviewed requests (`role_requests.reviewed_by`); inferred from review updates. A request may be unreviewed.
15. **users to notifications** — one recipient : zero-or-many notifications (`notifications.user_id`); inferred from model queries.
16. **heritage_entries to notifications** — one entry : zero-or-many notifications; a notification may have no entry reference. The model uses `NULL` for role-request and blog decisions. No checked-in migration establishes the column's nullable constraint.
17. **users to content_reports** — one reporter : zero-or-many reports. Migration 006 declares `reporter_id` as an FK with `ON DELETE CASCADE`.
18. **content_reports to heritage_entries/blog_posts** — one entry or post : zero-or-many reports; each report has one intended target selected by `target_type` and `target_id`. This relationship is polymorphic and has no FK, as specified by migration 006.
19. **heritage_entries to geographic_tags** — model behavior intends one entry : zero-or-one tag (lookup by entry, then update-or-insert). No uniqueness constraint is present in the checked-in migrations, so the database cardinality is not verifiable and duplicates may be possible.
20. **regions to geographic_tags** — no direct relationship is stored; map queries obtain region/province through `heritage_entries.region_id`.
21. **users to heritage_sites** — one creator : zero-or-many sites (`heritage_sites.created_by`); inferred from create fields.
22. **heritage_entries/heritage_sites to highlights** — each target may have zero-or-many highlights. A highlight has nullable entry/site target fields in the model's target-selection logic; no checked-in migration confirms an XOR constraint or the underlying FKs.
23. **users to highlights** — one creator : zero-or-many highlights (`highlights.created_by`); inferred from create fields.
24. **heritage_entries to multimedia_assets** — one entry : zero-or-many assets (`multimedia_assets.heritage_entry_id`); inferred from insert and lookup queries.
25. **categories to metadata_fields** — one category : zero-or-many fields. The model documents that deleting a category cascades to its metadata fields; no migration in this repository defines the FK.
26. **metadata_fields to metadata_values** — one field : zero-or-many values (`metadata_values.metadata_field_id`); inferred from joins and inserts.
27. **heritage_entries to metadata_values** — one entry : zero-or-many values (`metadata_values.heritage_entry_id`); inferred from joins and inserts.

## Migration and query mismatches to resolve when redrawing

- The requested assessment entity name `source_assessments` differs from the implemented `claim_assessments`.
- The migrations start at 002 and omit the baseline schema; legacy primary keys, most foreign keys, and nullability need confirmation against the deployed database.
- `blog_posts.published_at` is used by model queries but is not defined in migrations 002–008; it belongs to the external baseline schema.
- `notifications.heritage_entry_id` is written as `NULL` for blog and role-request notifications. The checked-in migrations do not document whether the existing column permits nulls.
- `editorial_actions.action_type` includes the string value `approved_unverified`. The owner confirmed this column is a string; there is no enum migration to apply.
- `content_reports.target_id` has no FK by design. ERD tooling should show its polymorphic relationship as a logical association, not a foreign-key edge.
