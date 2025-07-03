import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Multi-Tenant Architecture",
      description: "Manage multiple organizations with isolated data and customizable branding"
    },
    {
      title: "Comprehensive Loan Management",
      description: "Handle all aspects of loan lifecycle from application to repayment"
    },
    {
      title: "Savings Management",
      description: "Support various savings products with automated interest calculations"
    },
    {
      title: "Group Banking",
      description: "Manage community groups and their collective financial activities"
    },
    {
      title: "M-Pesa Integration",
      description: "Seamless mobile money integration for payments and disbursements"
    },
    {
      title: "Client Self-Service",
      description: "Empower clients with their own portal for account management"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/5 via-background to-banking-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-banking-primary">LoanSpur CBS</h1>
              <span className="text-sm text-muted-foreground">Core Banking System</span>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                Pricing
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Modern Core Banking System for 
            <span className="text-banking-primary"> Microfinance Institutions</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empower your financial institution with comprehensive loan management, 
            savings solutions, and seamless mobile money integration powered by Mifos X APIs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need to Run Your Institution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for microfinance institutions, SACCOs, and community banks
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-banking-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Institution?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of financial institutions already using LoanSpur CBS to serve their communities better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-lg font-bold text-banking-primary">LoanSpur CBS</span>
              <span className="text-sm text-muted-foreground">© 2024 All rights reserved</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Support</a>
              <a href="#" className="hover:text-primary">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
