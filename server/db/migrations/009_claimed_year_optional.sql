-- Some sources do not state a year, so the claimed year is now optional.
ALTER TABLE heritage_entry_history_claims
  MODIFY claimed_year INT NULL;
