-- Store alternate names as JSON-encoded arrays of strings, for example ["Aswang","Aswong"].
ALTER TABLE heritage_entries
  ADD COLUMN alternate_names TEXT NULL;
