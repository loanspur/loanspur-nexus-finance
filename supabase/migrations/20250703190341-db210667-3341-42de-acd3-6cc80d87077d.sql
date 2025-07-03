-- Create RLS policies for tenant isolation
CREATE POLICY "Users can access their tenant's clients" ON public.clients FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's groups" ON public.groups FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's group members" ON public.group_members FOR ALL TO authenticated USING (
    group_id IN (SELECT id FROM public.groups WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can access their tenant's loan products" ON public.loan_products FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's loans" ON public.loans FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's loan guarantors" ON public.loan_guarantors FOR ALL TO authenticated USING (
    loan_id IN (SELECT id FROM public.loans WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can access their tenant's savings products" ON public.savings_products FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's savings accounts" ON public.savings_accounts FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's transactions" ON public.transactions FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's unallocated payments" ON public.unallocated_payments FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's client documents" ON public.client_documents FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their tenant's reconciliation reports" ON public.reconciliation_reports FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);