import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Building, IdCard, CreditCard, PiggyBank } from "lucide-react";

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
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
      <div className="flex items-center justify-between">
        {/* Left: Client Info and Status */}
        <div className="flex-1">
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
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>{activeLoansCount} Active Loans</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <PiggyBank className="h-4 w-4" />
                <span>{formatCurrency(savingsBalance)} Savings</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Building className="h-4 w-4" />
                <span>{activeSavingsCount} Savings Accounts</span>
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

        {/* Right: Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24 border-4 border-white/20">
            <AvatarImage src={client.profile_picture_url || ""} />
            <AvatarFallback className="text-2xl bg-white/10 text-white border-2 border-white/20">
              {client.first_name.charAt(0)}{client.last_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};