-- Add proper foreign key constraints for offices table
ALTER TABLE public.offices 
ADD CONSTRAINT offices_branch_manager_id_fkey 
FOREIGN KEY (branch_manager_id) REFERENCES public.profiles(id);

ALTER TABLE public.offices 
ADD CONSTRAINT offices_parent_office_id_fkey 
FOREIGN KEY (parent_office_id) REFERENCES public.offices(id);

-- Add helpful comments
COMMENT ON CONSTRAINT offices_branch_manager_id_fkey ON public.offices IS 'Links office to branch manager profile';
COMMENT ON CONSTRAINT offices_parent_office_id_fkey ON public.offices IS 'Links office to parent office for hierarchy';