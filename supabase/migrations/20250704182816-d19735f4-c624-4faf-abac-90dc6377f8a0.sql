-- Create 5 dummy groups only if they don't exist
INSERT INTO public.groups (name, group_number, tenant_id, meeting_day, meeting_frequency, meeting_time, is_active) 
SELECT 
  new_groups.name,
  new_groups.group_number,
  t.tenant_id,
  new_groups.meeting_day,
  new_groups.meeting_frequency,
  new_groups.meeting_time::time,
  true
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
INSERT INTO public.clients (first_name, last_name, client_number, tenant_id, email, phone, is_active, approval_status, kyc_status) 
SELECT 
  first_names.name,
  last_names.name,
  'CL' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM clients WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 3, '0'),
  (SELECT id FROM tenants LIMIT 1),
  LOWER(first_names.name || '.' || last_names.name || '@example.com'),
  '+25471' || (7000000 + (ROW_NUMBER() OVER()))::text,
  true,
  'approved',
  'completed'
FROM 
  (VALUES ('Grace'), ('Peter'), ('Mary'), ('John'), ('Jane'), ('David'), ('Sarah'), ('Michael'), ('Ruth'), ('James'), ('Faith'), ('Daniel'), ('Joyce'), ('Samuel'), ('Alice')) AS first_names(name),
  (VALUES ('Njeri'), ('Mwangi'), ('Achieng'), ('Kiprotich'), ('Wanjiku')) AS last_names(name)
WHERE (SELECT COUNT(*) FROM clients WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)) < 10
LIMIT 15;

-- Now assign clients to groups evenly, but only if they're not already assigned
INSERT INTO public.group_members (client_id, group_id, is_active, joined_at)
SELECT 
  c.id,
  g.id,
  true,
  NOW() - INTERVAL '1 day' * (RANDOM() * 60)
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as client_row
  FROM clients 
  WHERE tenant_id = (SELECT id FROM tenants LIMIT 1) 
  AND is_active = true
) c
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as group_row
  FROM groups 
  WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
  AND is_active = true
) g ON ((c.client_row - 1) % 5) + 1 = g.group_row
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.client_id = c.id AND gm.group_id = g.id
);