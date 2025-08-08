-- Make superadmin isolation: ensure the specified user is only super_admin and not associated with any tenant

-- 1) Promote/ensure role is super_admin and clear tenant association
update public.profiles
set role = 'super_admin',
    tenant_id = null,
    is_active = true
where email = 'justmurenga@gmail.com';

-- 2) Deactivate any other active profiles for this user that are not super_admin (if duplicates exist)
update public.profiles
set is_active = false
where email = 'justmurenga@gmail.com'
  and (role is distinct from 'super_admin');
