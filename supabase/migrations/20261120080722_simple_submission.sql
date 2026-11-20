-- Final submission is now just the live project URL plus an optional short
-- description. Name and product come from the approved registration.
-- Older columns stay (nullable) so any earlier submissions keep their data.

alter table submissions add column description text check (length(description) <= 500);

alter table submissions alter column platform drop not null;
alter table submissions alter column ai_tools drop not null;
