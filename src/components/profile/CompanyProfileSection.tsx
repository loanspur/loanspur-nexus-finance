import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building, Globe, Clock, Upload, DollarSign, Calendar, Users } from "lucide-react";
import { getBaseDomain } from '@/utils/tenant';

const companyProfileSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  contact_person_name: z.string().optional(),
  contact_person_email: z.string().email().optional().or(z.literal("")),
  contact_person_phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  currency_code: z.string().min(1, "Currency is required"),
  currency_decimal_places: z.coerce.number().int().min(0).max(6).default(2),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
});

type CompanyProfileForm = z.infer<typeof companyProfileSchema>;

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
];

export const CompanyProfileSection = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Fetch tenant data
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

const form = useForm<CompanyProfileForm>({
  resolver: zodResolver(companyProfileSchema),
  defaultValues: {
    name: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
    country: "",
    timezone: "UTC",
    currency_code: "USD",
    currency_decimal_places: 2,
    city: "",
    state_province: "",
    postal_code: "",
  },
});

// Update form when tenant data loads
useEffect(() => {
  if (tenant) {
    form.reset({
      name: tenant.name || "",
      contact_person_name: tenant.contact_person_name || "",
      contact_person_email: tenant.contact_person_email || "",
      contact_person_phone: tenant.contact_person_phone || "",
      country: tenant.country || "",
      timezone: tenant.timezone || "UTC",
      currency_code: tenant.currency_code || "USD",
      currency_decimal_places: tenant.currency_decimal_places ?? 2,
      city: tenant.city || "",
      state_province: tenant.state_province || "",
      postal_code: tenant.postal_code || "",
    });
  }
}, [tenant, form]);

  const onSubmit = async (data: CompanyProfileForm) => {
    if (!profile?.tenant_id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: data.name,
          contact_person_name: data.contact_person_name || null,
          contact_person_email: data.contact_person_email || null,
          contact_person_phone: data.contact_person_phone || null,
          country: data.country || null,
          timezone: data.timezone,
          currency_code: data.currency_code,
          currency_decimal_places: Number(data.currency_decimal_places),
          city: data.city || null,
          state_province: data.state_province || null,
          postal_code: data.postal_code || null,
        })
        .eq('id', profile.tenant_id);

      if (error) throw error;

      // Invalidate and refetch tenant data and currency context
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tenant', profile.tenant_id] }),
        queryClient.invalidateQueries({ queryKey: ['tenant-currency', profile.tenant_id] }),
      ]);

      toast({
        title: "Company Profile Updated",
        description: "Your company information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.tenant_id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo file must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.tenant_id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(fileName);

      // Update tenant record with logo URL
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', profile.tenant_id);

      if (updateError) throw updateError;

      // Invalidate and refetch tenant data
      await queryClient.invalidateQueries({ queryKey: ['tenant', profile.tenant_id] });

      toast({
        title: "Logo Updated",
        description: "Your company logo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const getPricingTierColor = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'bg-green-100 text-green-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'scale':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPricingTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No company information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Overview
          </CardTitle>
          <CardDescription>
            Your organization's current information and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={tenant.logo_url || undefined} />
                <AvatarFallback className="text-lg bg-gradient-primary text-white">
                  {tenant.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-3 w-3" />
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
              </label>
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-xl font-semibold">{tenant.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tenant.subdomain}.{getBaseDomain()}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{tenant.currency_code}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.timezone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getPricingTierColor(tenant.pricing_tier)}>
                    {formatPricingTier(tenant.pricing_tier)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">
                    Since {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {tenant.contact_person_name && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{tenant.contact_person_name}</p>
                  {tenant.contact_person_email && (
                    <p className="text-sm text-muted-foreground">{tenant.contact_person_email}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Company Information</CardTitle>
          <CardDescription>
            Update your organization details and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_person_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
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
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@organization.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_person_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Location & Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
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
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timezone
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="currency_code"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Default Currency
        </FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="currency_decimal_places"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Decimal Places
        </FormLabel>
        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value ?? 2)}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select decimal places" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {[0,1,2,3,4,5,6].map((d) => (
              <SelectItem key={d} value={String(d)}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
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
                          <Input placeholder="State or Province" {...field} />
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
                          <Input placeholder="Postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full md:w-auto">
                {isUpdating ? "Updating..." : "Update Company Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};