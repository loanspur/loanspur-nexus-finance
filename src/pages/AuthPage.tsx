import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/10 via-background to-banking-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-banking-primary mb-2">LoanSpur CBS</h1>
          <p className="text-muted-foreground">Core Banking System</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Choose your login method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tenant" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="super-admin">Super Admin</TabsTrigger>
                <TabsTrigger value="tenant">Tenant Admin</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
              </TabsList>
              
              <TabsContent value="super-admin" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="super-email">Email</Label>
                    <Input id="super-email" type="email" placeholder="admin@loanspur.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="super-password">Password</Label>
                    <Input id="super-password" type="password" required />
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in as Super Admin"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="tenant" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-id">Tenant ID</Label>
                    <Input id="tenant-id" placeholder="your-company" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-email">Email</Label>
                    <Input id="tenant-email" type="email" placeholder="admin@yourcompany.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-password">Password</Label>
                    <Input id="tenant-password" type="password" required />
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in to Tenant"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="client" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-id">Client ID</Label>
                    <Input id="client-id" placeholder="your-client-id" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-pin">PIN</Label>
                    <Input id="client-pin" type="password" maxLength={6} required />
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Access My Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button variant="link" className="text-sm">
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            New to LoanSpur? 
            <Button variant="link" className="pl-1 h-auto">
              Request a demo
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;