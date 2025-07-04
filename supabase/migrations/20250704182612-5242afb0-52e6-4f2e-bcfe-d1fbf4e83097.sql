-- Create 5 dummy groups with realistic names and details
INSERT INTO public.groups (name, group_number, tenant_id, meeting_day, meeting_frequency, meeting_time, is_active) VALUES
  ('Umoja Savings Group', 'GRP001', (SELECT id FROM tenants LIMIT 1), 'Monday', 'Weekly', '14:00:00', true),
  ('Harambee Women Circle', 'GRP002', (SELECT id FROM tenants LIMIT 1), 'Wednesday', 'Weekly', '10:00:00', true),
  ('Kilimo Farmers Group', 'GRP003', (SELECT id FROM tenants LIMIT 1), 'Friday', 'Bi-weekly', '16:00:00', true),
  ('Mama Mboga Traders', 'GRP004', (SELECT id FROM tenants LIMIT 1), 'Tuesday', 'Weekly', '09:00:00', true),
  ('Vijana Investment Circle', 'GRP005', (SELECT id FROM tenants LIMIT 1), 'Thursday', 'Weekly', '18:00:00', true);

-- Create some dummy clients if none exist
INSERT INTO public.clients (first_name, last_name, client_number, tenant_id, email, phone, is_active) 
SELECT 
  first_names.name,
  last_names.name,
  'CL' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  (SELECT id FROM tenants LIMIT 1),
  LOWER(first_names.name || '.' || last_names.name || '@example.com'),
  '+25471' || (7000000 + (ROW_NUMBER() OVER()))::text,
  true
FROM 
  (VALUES ('Grace'), ('Peter'), ('Mary'), ('John'), ('Jane'), ('David'), ('Sarah'), ('Michael'), ('Ruth'), ('James'), ('Faith'), ('Daniel'), ('Joyce'), ('Samuel'), ('Alice'), ('Joseph'), ('Catherine'), ('Paul'), ('Margaret'), ('Stephen')) AS first_names(name),
  (VALUES ('Njeri'), ('Mwangi'), ('Achieng'), ('Kiprotich'), ('Wanjiku'), ('Ochieng'), ('Nyong'), ('Kimani'), ('Muthoni'), ('Otieno')) AS last_names(name)
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE tenant_id = (SELECT id FROM tenants LIMIT 1))
LIMIT 25;

-- Assign clients to groups (distribute them across the 5 groups)
WITH group_assignments AS (
  SELECT 
    c.id as client_id,
    g.id as group_id,
    ROW_NUMBER() OVER (ORDER BY c.created_at) as client_rank
  FROM clients c
  CROSS JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as group_rank
    FROM groups 
    WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
    LIMIT 5
  ) g
  WHERE c.tenant_id = (SELECT id FROM tenants LIMIT 1)
    AND c.is_active = true
)
INSERT INTO public.group_members (client_id, group_id, is_active, joined_at)
SELECT 
  client_id,
  group_id,
  true,
  NOW() - INTERVAL '30 days' * RANDOM()
FROM group_assignments
WHERE (client_rank - 1) % 5 = (
  SELECT group_rank - 1 
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as group_rank
    FROM groups 
    WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
    LIMIT 5
  ) ranked_groups 
  WHERE ranked_groups.id = group_assignments.group_id
);