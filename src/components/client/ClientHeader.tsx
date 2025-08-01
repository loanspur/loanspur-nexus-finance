import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Building, IdCard, CreditCard, PiggyBank, Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientHeaderProps {
  client: {
    id: string;
    client_number: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    national_id?: string | null;
    occupation?: string | null;
    profile_picture_url?: string | null;
    created_at: string;
    mifos_client_id?: number | null;
    gender?: string | null;
  };
  activeLoansCount: number;
  savingsBalance: number;
  activeSavingsCount: number;
  formatCurrency: (amount: number) => string;
}

export const ClientHeader = ({ 
  client, 
  activeLoansCount, 
  savingsBalance, 
  activeSavingsCount,
  formatCurrency 
}: ClientHeaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${client.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(`profile-pictures/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(`profile-pictures/${fileName}`);

      // Update client profile picture URL
      const { error: updateError } = await supabase
        .from('clients')
        .update({ profile_picture_url: publicUrl })
        .eq('id', client.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      // Refresh the page to show new image
      window.location.reload();

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
      <div className="flex items-start justify-between gap-8">
        {/* Left: Client Info and Status */}
        <div className="flex-1 max-w-4xl">
          <h1 className="text-2xl font-semibold mb-2">
            {client.first_name} {client.last_name}
          </h1>
          <div className="flex items-center gap-4 text-white/90 text-sm mb-3">
            <span>Client #{client.client_number}</span>
            <span>•</span>
            <span>ID: {client.mifos_client_id || 'N/A'}</span>
            <span>•</span>
            <span>Staff: ADMIN</span>
          </div>
          
          {/* Client Details Grid */}
          <div className="grid grid-cols-3 gap-6 mb-3">
            <div className="space-y-1">
              {client.phone && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <span>📧</span>
                  <span>{client.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <span>📅</span>
                <span>Joined {format(new Date(client.created_at), 'dd MMM yyyy')}</span>
              </div>
            </div>
            <div className="space-y-1">
              {client.occupation && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Building className="h-4 w-4" />
                  <span>{client.occupation}</span>
                </div>
              )}
              {client.national_id && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <IdCard className="h-4 w-4" />
                  <span>{client.national_id}</span>
                </div>
              )}
              {client.gender && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <span>👤</span>
                  <span className="capitalize">{client.gender}</span>
                </div>
              )}
            </div>
            {/* Financial Summary - Horizontal Cards */}
            <div className="flex flex-wrap gap-4 max-w-3xl">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="bg-white/10 p-2 rounded-full">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-white/70 text-xs uppercase tracking-wide">Active Loans</div>
                  <div className="text-white font-semibold text-lg">{activeLoansCount}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="bg-white/10 p-2 rounded-full">
                  <PiggyBank className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-white/70 text-xs uppercase tracking-wide">Total Savings</div>
                  <div className="text-white font-semibold text-lg">{formatCurrency(savingsBalance)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="bg-white/10 p-2 rounded-full">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-white/70 text-xs uppercase tracking-wide">Savings Accounts</div>
                  <div className="text-white font-semibold text-lg">{activeSavingsCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Active Client
            </Badge>
            <Badge className="bg-green-500/20 text-white border-green-300/30">
              Verified KYC
            </Badge>
          </div>
        </div>

        {/* Right: Avatar with Upload */}
        <div className="flex-shrink-0 relative group">
          <Avatar className="h-32 w-32 border-4 border-white/20">
            <AvatarImage src={client.profile_picture_url || ""} />
            <AvatarFallback className="text-3xl bg-white/10 text-white border-2 border-white/20">
              {client.first_name.charAt(0)}{client.last_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Photo Upload Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};