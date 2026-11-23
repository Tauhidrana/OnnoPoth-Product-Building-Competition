-- Registration features become a list (one item per input on the form).
-- Existing text is split on line breaks.
--
-- The form and API require 3–5 features for every new registration. The
-- database allows 1–5 so registrations made before this change (which may
-- hold a single line) can still be approved, declined or edited: Postgres
-- re-checks constraints on every UPDATE.

alter table registrations drop constraint registrations_features_check;

alter table registrations
  alter column features type text[]
  using array_remove(regexp_split_to_array(btrim(features), '\s*\n\s*'), '');

alter table registrations
  add constraint registrations_features_check
  check (cardinality(features) between 1 and 5 and length(array_to_string(features, '')) <= 1000);
