import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Smartphone, Building, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentChannel {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile' | 'card';
  accountId?: string;
  icon: React.ReactNode;
}

interface FundSourcesConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productType: 'loan' | 'savings';
}

const DEFAULT_PAYMENT_CHANNELS: PaymentChannel[] = [
  { id: 'cash', name: 'Cash Payments', type: 'cash', icon: <Banknote className="w-4 h-4" /> },
  { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', icon: <Building className="w-4 h-4" /> },
  { id: 'mobile_money', name: 'Mobile Money', type: 'mobile', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'card_payment', name: 'Card Payment', type: 'card', icon: <CreditCard className="w-4 h-4" /> },
];

export const FundSourcesConfigDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  productName, 
  productType 
}: FundSourcesConfigDialogProps) => {
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannel[]>(DEFAULT_PAYMENT_CHANNELS);
  const [customChannels, setCustomChannels] = useState<PaymentChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState("");
  const { data: accounts = [] } = useChartOfAccounts();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [existingMappings, setExistingMappings] = useState<Array<{ channel_id: string; channel_name: string; account_id: string }>>([]);
  const assetAccounts = accounts.filter(acc => acc.account_type === 'asset' && acc.is_active);
  const liabilityAccounts = accounts.filter(acc => acc.account_type === 'liability' && acc.is_active);

  useEffect(() => {
    const loadMappings = async () => {
      if (!open || !profile?.tenant_id || !productId) return;
      const { data, error } = await supabase
        .from('product_fund_source_mappings')
        .select('channel_id, channel_name, account_id')
        .eq('tenant_id', profile.tenant_id)
        .eq('product_id', productId)
        .eq('product_type', productType);
      if (error) {
        console.error('Failed to load fund source mappings', error);
        return;
      }
      const mappings = (data || []) as Array<{ channel_id: string; channel_name: string; account_id: string }>;
      setExistingMappings(mappings);

      const defaultIds = new Set(DEFAULT_PAYMENT_CHANNELS.map(c => c.id));
      // update defaults
      setPaymentChannels(prev => prev.map(ch => {
        const m = mappings.find(mm => mm.channel_id === ch.id);
        return m ? { ...ch, accountId: m.account_id } : { ...ch, accountId: ch.accountId };
      }));
      // build customs from mappings not in defaults
      const customs = mappings
        .filter(m => !defaultIds.has(m.channel_id))
        .map(m => ({
          id: m.channel_id,
          name: m.channel_name,
          type: 'bank' as const,
          accountId: m.account_id,
          icon: <Plus className="w-4 h-4" />,
        }));
      setCustomChannels(customs);
    };
    loadMappings();
  }, [open, profile?.tenant_id, productId, productType]);

  const handleChannelAccountChange = (channelId: string, accountId: string) => {
    setPaymentChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, accountId } 
          : channel
      )
    );
    
    setCustomChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, accountId } 
          : channel
      )
    );
  };

  const addCustomChannel = () => {
    if (!newChannelName.trim()) return;
    
    const newChannel: PaymentChannel = {
      id: `custom_${Date.now()}`,
      name: newChannelName,
      type: 'bank',
      icon: <Plus className="w-4 h-4" />
    };
    
    setCustomChannels(prev => [...prev, newChannel]);
    setNewChannelName("");
  };

  const removeCustomChannel = (channelId: string) => {
    setCustomChannels(prev => prev.filter(channel => channel.id !== channelId));
  };

  const handleSave = async () => {
    const configuredChannels = [...paymentChannels, ...customChannels]
      .filter(channel => channel.accountId);
    
    if (configuredChannels.length === 0) {
      toast({
        title: "Warning",
        description: "No payment channels have been configured with fund sources.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!profile?.tenant_id) throw new Error('Missing tenant context');

      const upsertPayload = configuredChannels.map((channel) => ({
        tenant_id: profile.tenant_id!,
        product_id: productId,
        product_type: productType,
        channel_id: channel.id,
        channel_name: channel.name,
        account_id: channel.accountId!,
      }));

      const { error: upsertError } = await supabase
        .from('product_fund_source_mappings')
        .upsert(upsertPayload, { onConflict: 'tenant_id,product_id,product_type,channel_id' });
      if (upsertError) throw upsertError;

      const selectedIds = new Set(configuredChannels.map(c => c.id));
      const toDelete = (existingMappings || [])
        .filter(m => !selectedIds.has(m.channel_id))
        .map(m => m.channel_id);
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from('product_fund_source_mappings')
          .delete()
          .eq('tenant_id', profile.tenant_id!)
          .eq('product_id', productId)
          .eq('product_type', productType)
          .in('channel_id', toDelete);
        if (delError) throw delError;
      }

      toast({
        title: "Fund Sources Configured",
        description: `Successfully configured ${configuredChannels.length} payment channels for ${productName}.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Saving fund sources failed', err);
      toast({ title: 'Error', description: err.message || 'Failed to save fund sources', variant: 'destructive' });
    }
  };

  const allChannels = [...paymentChannels, ...customChannels];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configure Fund Sources for Payment Channels
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Map payment channels to specific chart of accounts for {productType} product: <strong>{productName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Channels Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Channels</CardTitle>
              <CardDescription>
                Configure which accounts to use for different payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {channel.icon}
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        <Badge variant="outline" className="text-xs">
                          {channel.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={channel.accountId || ""}
                      onValueChange={(value) => handleChannelAccountChange(channel.id, value)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select fund source account" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 font-medium text-sm text-muted-foreground">Asset Accounts</div>
                        {assetAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                        <div className="p-2 font-medium text-sm text-muted-foreground">Liability Accounts</div>
                        {liabilityAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {customChannels.some(c => c.id === channel.id) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeCustomChannel(channel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add Custom Channel */}
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Payment Channel</CardTitle>
              <CardDescription>
                Create additional payment channels specific to your institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="newChannel">Channel Name</Label>
                  <input
                    id="newChannel"
                    type="text"
                    placeholder="e.g., PayPal, Cryptocurrency, etc."
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addCustomChannel} disabled={!newChannelName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Channel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {allChannels.filter(c => c.accountId).length} of {allChannels.length} payment channels configured
              </div>
              <div className="mt-2 space-y-1">
                {allChannels
                  .filter(channel => channel.accountId)
                  .map(channel => {
                    const account = accounts.find(acc => acc.id === channel.accountId);
                    return (
                      <div key={channel.id} className="flex justify-between text-sm">
                        <span>{channel.name}</span>
                        <span className="text-muted-foreground">
                          {account ? `${account.account_code} - ${account.account_name}` : 'Unknown Account'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};