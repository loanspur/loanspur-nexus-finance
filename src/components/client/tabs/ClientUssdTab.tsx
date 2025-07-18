import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings, Smartphone } from "lucide-react";

interface UssdInfo {
  id: string;
  phone_number: string;
  is_enabled: boolean;
  last_used?: string;
  transaction_limit?: number;
  daily_limit?: number;
}

interface ClientUssdTabProps {
  clientId: string;
}

export const ClientUssdTab = ({ clientId }: ClientUssdTabProps) => {
  const [ussdInfo, setUssdInfo] = useState<UssdInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for USSD information
    setUssdInfo([
      {
        id: '1',
        phone_number: '+254700000000',
        is_enabled: true,
        last_used: '2024-01-15T10:30:00Z',
        transaction_limit: 50000,
        daily_limit: 100000
      }
    ]);
    setLoading(false);
  }, [clientId]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'KES 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getStatusBadge = (isEnabled: boolean) => {
    return isEnabled ? (
      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Disabled</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Client USSD Information
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure USSD
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add USSD Number
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading USSD information...</div>
          ) : ussdInfo.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No USSD information configured</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Configure USSD Access
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Limit</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ussdInfo.map((info) => (
                    <TableRow key={info.id}>
                      <TableCell className="font-medium">{info.phone_number}</TableCell>
                      <TableCell>{getStatusBadge(info.is_enabled)}</TableCell>
                      <TableCell>{formatCurrency(info.transaction_limit)}</TableCell>
                      <TableCell>{formatCurrency(info.daily_limit)}</TableCell>
                      <TableCell>
                        {info.last_used ? new Date(info.last_used).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">USSD Service Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Service Code:</strong> *384*00#
                    </div>
                    <div>
                      <strong>Service Provider:</strong> Safaricom
                    </div>
                    <div>
                      <strong>Available Services:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Check Account Balance</li>
                        <li>Mini Statement</li>
                        <li>Loan Application</li>
                        <li>Loan Repayment</li>
                        <li>Change PIN</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Operating Hours:</strong> 24/7
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};