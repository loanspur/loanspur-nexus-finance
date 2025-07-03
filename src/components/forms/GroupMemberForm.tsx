import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";

const groupMemberSchema = z.object({
  group_id: z.string().min(1, "Group is required"),
  member_ids: z.array(z.string()).min(1, "At least one member is required"),
});

type GroupMemberFormValues = z.infer<typeof groupMemberSchema>;

interface GroupMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const GroupMemberForm = ({ open, onOpenChange, onSuccess }: GroupMemberFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch available groups
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, group_number')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch available clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, client_number, email')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const form = useForm<GroupMemberFormValues>({
    resolver: zodResolver(groupMemberSchema),
    defaultValues: {
      group_id: "",
      member_ids: [],
    },
  });

  const onSubmit = async (values: GroupMemberFormValues) => {
    setIsSubmitting(true);
    try {
      // Check for existing memberships
      const { data: existing } = await supabase
        .from('group_members')
        .select('client_id')
        .eq('group_id', values.group_id)
        .in('client_id', values.member_ids);

      const existingMemberIds = existing?.map(m => m.client_id) || [];
      const newMemberIds = values.member_ids.filter(id => !existingMemberIds.includes(id));

      if (newMemberIds.length === 0) {
        toast({
          title: "Warning",
          description: "All selected clients are already members of this group",
          variant: "destructive",
        });
        return;
      }

      // Insert new group members
      const { error } = await supabase
        .from('group_members')
        .insert(
          newMemberIds.map(clientId => ({
            group_id: values.group_id,
            client_id: clientId,
            is_active: true,
          }))
        );

      if (error) throw error;

      const existingCount = existingMemberIds.length;
      const newCount = newMemberIds.length;

      toast({
        title: "Success",
        description: `Added ${newCount} new member(s) to the group${existingCount > 0 ? `. ${existingCount} member(s) were already in the group.` : ''}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error adding group members:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add group members",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Group Members
        </CardTitle>
        <CardDescription>
          Add existing clients to a group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.group_number})
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
              name="member_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Members</FormLabel>
                  <FormDescription>
                    Choose clients to add to the group
                  </FormDescription>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={client.id}
                          checked={field.value.includes(client.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, client.id]);
                            } else {
                              field.onChange(field.value.filter(id => id !== client.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={client.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {client.first_name} {client.last_name} ({client.client_number})
                          {client.email && (
                            <span className="text-muted-foreground ml-2">- {client.email}</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Members
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};