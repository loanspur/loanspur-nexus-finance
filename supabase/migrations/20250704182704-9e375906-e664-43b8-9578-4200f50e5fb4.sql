-- Create 5 dummy groups only if they don't exist
INSERT INTO public.groups (name, group_number, tenant_id, meeting_day, meeting_frequency, meeting_time, is_active) 
SELECT name, group_number, tenant_id, meeting_day, meeting_frequency, meeting_time, is_active
FROM (VALUES 
  ('Umoja Savings Group', 'GRP001', 'Monday', 'Weekly', '14:00:00'),
  ('Harambee Women Circle', 'GRP002', 'Wednesday', 'Weekly', '10:00:00'),
  ('Kilimo Farmers Group', 'GRP003', 'Friday', 'Bi-weekly', '16:00:00'),
  ('Mama Mboga Traders', 'GRP004', 'Tuesday', 'Weekly', '09:00:00'),
  ('Vijana Investment Circle', 'GRP005', 'Thursday', 'Weekly', '18:00:00')
) AS new_groups(name, group_number, meeting_day, meeting_frequency, meeting_time)
CROSS JOIN (SELECT id as tenant_id FROM tenants LIMIT 1) t
WHERE NOT EXISTS (
  SELECT 1 FROM groups g 
  WHERE g.group_number = new_groups.group_number 
  AND g.tenant_id = t.tenant_id
);

-- Create some dummy clients only if very few exist
INSERT INTO public.clients (first_name, last_name, client_number, tenant_id, email, phone, is_active) 
SELECT 
  first_names.name,
  last_names.name,
  'CL' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM clients WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 3, '0'),
  (SELECT id FROM tenants LIMIT 1),
  LOWER(first_names.name || '.' || last_names.name || '@example.com'),
  '+25471' || (7000000 + (ROW_NUMBER() OVER()))::text,
  true
FROM 
  (VALUES ('Grace'), ('Peter'), ('Mary'), ('John'), ('Jane'), ('David'), ('Sarah'), ('Michael'), ('Ruth'), ('James'), ('Faith'), ('Daniel'), ('Joyce'), ('Samuel'), ('Alice')) AS first_names(name),
  (VALUES ('Njeri'), ('Mwangi'), ('Achieng'), ('Kiprotich'), ('Wanjiku')) AS last_names(name)
WHERE (SELECT COUNT(*) FROM clients WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)) < 10
LIMIT 15;