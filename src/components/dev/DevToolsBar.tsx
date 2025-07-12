import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDevelopment, seedDatabase } from '@/lib/dev-utils';
import { 
  Code2, 
  Database, 
  Users, 
  CreditCard, 
  Building2, 
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DevToolsBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  if (!isDevelopment()) {
    return null;
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedStatus('idle');
    
    try {
      await seedDatabase();
      setSeedStatus('success');
      toast({
        title: "Database Seeded",
        description: "Sample data has been added to your database",
      });
    } catch (error) {
      setSeedStatus('error');
      toast({
        title: "Seeding Failed",
        description: "Failed to seed database with sample data",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200 shadow-lg"
          >
            <Code2 className="w-4 h-4 mr-2" />
            Dev Tools
            {isOpen ? (
              <ChevronDown className="w-4 h-4 ml-2" />
            ) : (
              <ChevronUp className="w-4 h-4 ml-2" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card className="w-80 shadow-xl border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Development Tools
              </CardTitle>
              <CardDescription className="text-xs">
                Tools for testing and development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environment</span>
                <Badge variant="secondary" className="text-xs">
                  {import.meta.env.MODE}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="w-full text-xs h-8"
                  variant="outline"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 mr-2" />
                      Seed Database
                    </>
                  )}
                </Button>
                
                {seedStatus === 'success' && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Successfully seeded
                  </div>
                )}
                
                {seedStatus === 'error' && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    Seeding failed
                  </div>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full text-xs h-8">
                    <Users className="w-3 h-3 mr-2" />
                    Sample Data Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base">Sample Data Information</DialogTitle>
                    <DialogDescription className="text-sm">
                      Available sample data generators for development
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Clients
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Random client profiles with names, contact info, and occupations
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Loan Products
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Various loan products with different terms and interest rates
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Organizations
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Sample tenant organizations with addresses and contact details
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};