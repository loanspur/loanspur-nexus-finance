import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTenant } from "@/hooks/useSupabase";

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens"),
  domain: z.string().optional(),
  pricing_tier: z.enum(["starter", "professional", "enterprise", "scale"]),
  status: z.enum(["active", "suspended", "cancelled"]),
  contact_person_name: z.string().optional(),
  contact_person_email: z.string().email().optional().or(z.literal("")),
  contact_person_phone: z.string().optional(),
  billing_cycle: z.enum(["monthly", "quarterly", "annually"]).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency_code: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant?: any | null;
}

export const TenantForm = ({ open, onOpenChange, editingTenant }: TenantFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTenantMutation = useCreateTenant();

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: editingTenant ? {
      name: editingTenant.name,
      slug: editingTenant.slug,
      subdomain: editingTenant.subdomain || editingTenant.slug,
      domain: editingTenant.domain || "",
      pricing_tier: editingTenant.pricing_tier,
      status: editingTenant.status,
      contact_person_name: editingTenant.contact_person_name || "",
      contact_person_email: editingTenant.contact_person_email || "",
      contact_person_phone: editingTenant.contact_person_phone || "",
      billing_cycle: editingTenant.billing_cycle || "monthly",
      country: editingTenant.country || "",
      timezone: editingTenant.timezone || "UTC",
      currency_code: editingTenant.currency_code || "USD",
      city: editingTenant.city || "",
      state_province: editingTenant.state_province || "",
      postal_code: editingTenant.postal_code || "",
    } : {
      name: "",
      slug: "",
      subdomain: "",
      domain: "",
      pricing_tier: "starter",
      status: "active",
      contact_person_name: "",
      contact_person_email: "",
      contact_person_phone: "",
      billing_cycle: "monthly",
      country: "",
      timezone: "UTC",
      currency_code: "USD",
      city: "",
      state_province: "",
      postal_code: "",
    },
  });

  // Reset form when editingTenant changes
  useEffect(() => {
    if (editingTenant) {
      form.reset({
        name: editingTenant.name,
        slug: editingTenant.slug,
        subdomain: editingTenant.subdomain || editingTenant.slug,
        domain: editingTenant.domain || "",
        pricing_tier: editingTenant.pricing_tier,
        status: editingTenant.status,
        contact_person_name: editingTenant.contact_person_name || "",
        contact_person_email: editingTenant.contact_person_email || "",
        contact_person_phone: editingTenant.contact_person_phone || "",
        billing_cycle: editingTenant.billing_cycle || "monthly",
        country: editingTenant.country || "",
        timezone: editingTenant.timezone || "UTC",
        currency_code: editingTenant.currency_code || "USD",
        city: editingTenant.city || "",
        state_province: editingTenant.state_province || "",
        postal_code: editingTenant.postal_code || "",
      });
    }
  }, [editingTenant, form]);

  const onSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    try {
      await createTenantMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        subdomain: data.subdomain,
        domain: data.domain || null,
        logo_url: null,
        theme_colors: { primary: "#1e40af", secondary: "#64748b" },
        pricing_tier: data.pricing_tier,
        status: data.status,
        trial_ends_at: null,
        subscription_ends_at: null,
        mifos_base_url: null,
        mifos_tenant_identifier: null,
        mifos_username: null,
        mifos_password: null,
        contact_person_name: data.contact_person_name || null,
        contact_person_email: data.contact_person_email || null,
        contact_person_phone: data.contact_person_phone || null,
        billing_cycle: data.billing_cycle || 'monthly',
        auto_billing: true,
        payment_terms: 30,
        billing_address: {},
        dns_settings: {},
        mpesa_settings: {},
        addons: [],
        country: data.country || null,
        timezone: data.timezone || 'UTC',
        currency_code: data.currency_code || 'USD',
        city: data.city || null,
        state_province: data.state_province || null,
        postal_code: data.postal_code || null,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating tenant:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tenant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="enter-slug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input placeholder="company" {...field} />
                      <span className="ml-2 text-sm text-muted-foreground">.loanspurcbs.com</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="scale">Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_person_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_person_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter contact email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_person_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="KE">Kenya</SelectItem>
                          <SelectItem value="UG">Uganda</SelectItem>
                          <SelectItem value="TZ">Tanzania</SelectItem>
                          <SelectItem value="NG">Nigeria</SelectItem>
                          <SelectItem value="GH">Ghana</SelectItem>
                          <SelectItem value="ZA">South Africa</SelectItem>
                          <SelectItem value="IN">India</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                          <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                          <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                          <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                          <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state/province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editingTenant ? "Updating..." : "Creating...") : (editingTenant ? "Update Tenant" : "Create Tenant")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};