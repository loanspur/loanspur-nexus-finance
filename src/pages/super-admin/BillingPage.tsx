import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DollarSign, TrendingUp, AlertCircle, Users } from "lucide-react";

const BillingPage = () => {
  // Fetch billing invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select(`
          *,
          tenants (
            name,
            pricing_tier
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Fetch payment history for revenue calculation
  const { data: payments } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_payment_history')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Calculate revenue statistics
  const calculateRevenueStats = () => {
    if (!payments) return { monthlyRevenue: 0, annualRevenue: 0, outstandingInvoices: 0 };
    
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    
    const monthlyRevenue = payments
      .filter(p => new Date(p.created_at) >= currentMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const annualRevenue = payments
      .filter(p => new Date(p.created_at) >= currentYear)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const outstandingInvoices = invoices
      ?.filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
    
    return { monthlyRevenue, annualRevenue, outstandingInvoices };
  };

  const { monthlyRevenue, annualRevenue, outstandingInvoices } = calculateRevenueStats();

  const billingData = [
    {
      tenant: "ABC Microfinance",
      plan: "Professional",
      amount: "$99",
      status: "Paid",
      dueDate: "2024-03-15",
      invoiceId: "INV-001"
    },
    {
      tenant: "XYZ SACCO",
      plan: "Enterprise",
      amount: "$299",
      status: "Pending",
      dueDate: "2024-03-20",
      invoiceId: "INV-002"
    },
    {
      tenant: "Community Bank",
      plan: "Professional",
      amount: "$99",
      status: "Paid",
      dueDate: "2024-03-10",
      invoiceId: "INV-003"
    }
  ];

  const revenueStats = [
    { 
      title: "Monthly Revenue", 
      value: `$${monthlyRevenue.toLocaleString()}`, 
      change: "+12%",
      icon: DollarSign,
      color: "text-success"
    },
    { 
      title: "Annual Recurring Revenue", 
      value: `$${annualRevenue.toLocaleString()}`, 
      change: "+18%",
      icon: TrendingUp,
      color: "text-primary"
    },
    { 
      title: "Outstanding Invoices", 
      value: `$${outstandingInvoices.toLocaleString()}`, 
      change: "-5%",
      icon: AlertCircle,
      color: "text-warning"
    },
    { 
      title: "Total Tenants", 
      value: invoices?.length.toString() || "0", 
      change: "+3%",
      icon: Users,
      color: "text-info"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Revenue</h1>
        <p className="text-muted-foreground">Monitor payments and revenue metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-success">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading invoices...</div>
            </div>
          ) : invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.tenants?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {invoice.tenants?.pricing_tier || 'N/A'} plan
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{invoice.invoice_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${invoice.total_amount}</span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 
                                invoice.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
              <p className="text-muted-foreground">Invoices will appear here as tenants are billed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;