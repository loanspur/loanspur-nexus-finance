-- Create function to get user roles from enum
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT array_agg(unnest) FROM unnest(enum_range(NULL::user_role));
$function$;