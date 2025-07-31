import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  PiggyBank, 
  Users2, 
  Smartphone, 
  UserCheck,
  TrendingUp,
  Shield,
  Zap,
  Star,
  CheckCircle
} from "lucide-react";
import heroBankingImage from "@/assets/hero-banking.jpg";

const Index = () => {
  const navigate = useNavigate();

  const handleSmoothScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      title: "Multi-Tenant Architecture",
      description: "Manage multiple organizations with isolated data and customizable branding",
      icon: Building2,
      gradient: "from-banking-primary to-banking-secondary"
    },
    {
      title: "Comprehensive Loan Management",
      description: "Handle all aspects of loan lifecycle from application to repayment",
      icon: TrendingUp,
      gradient: "from-banking-accent to-banking-emerald"
    },
    {
      title: "Savings Management",
      description: "Support various savings products with automated interest calculations",
      icon: PiggyBank,
      gradient: "from-banking-gold to-warning"
    },
    {
      title: "Group Banking",
      description: "Manage community groups and their collective financial activities",
      icon: Users2,
      gradient: "from-info to-banking-secondary"
    },
    {
      title: "M-Pesa Integration",
      description: "Seamless mobile money integration for payments and disbursements",
      icon: Smartphone,
      gradient: "from-success to-banking-emerald"
    },
    {
      title: "Client Self-Service",
      description: "Empower clients with their own portal for account management",
      icon: UserCheck,
      gradient: "from-banking-primary to-accent"
    }
  ];

  const stats = [
    { label: "Active Institutions", value: "500+", icon: Building2 },
    { label: "Loans Processed", value: "$2.5M", icon: TrendingUp },
    { label: "Happy Clients", value: "10K+", icon: Users },
    { label: "Success Rate", value: "99.9%", icon: Star }
  ];

  const benefits = [
    "Enterprise-grade security",
    "24/7 customer support",
    "99.9% uptime guarantee",
    "Free onboarding & training",
    "Regular feature updates",
    "Compliance ready"
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Static Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-banking-primary">LoanSpur CBS</h1>
                <span className="text-xs text-muted-foreground">Core Banking System</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handleSmoothScroll('features')} 
                className="text-muted-foreground hover:text-banking-primary transition-colors text-sm font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => handleSmoothScroll('benefits')} 
                className="text-muted-foreground hover:text-banking-primary transition-colors text-sm font-medium"
              >
                Benefits
              </button>
              <button 
                onClick={() => navigate("/pricing")} 
                className="text-muted-foreground hover:text-banking-primary transition-colors text-sm font-medium"
              >
                Pricing
              </button>
              <button 
                onClick={() => handleSmoothScroll('contact')} 
                className="text-muted-foreground hover:text-banking-primary transition-colors text-sm font-medium"
              >
                Contact
              </button>
            </nav>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                Pricing
              </Button>
              <Button variant="banking" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-24 mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* Left Content */}
            <div className="text-left">
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                Trusted by 500+ Financial Institutions
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-8 leading-tight">
                Modern Core Banking for{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Microfinance
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Transform your financial institution with comprehensive loan management, 
                savings solutions, and seamless mobile money integration. Built for the future of banking.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Button size="xl" variant="banking" onClick={() => navigate("/auth")}>
                  <Star className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate("/pricing")}>
                  View Pricing
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-left animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-heading font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-20 blur-3xl transform rotate-6"></div>
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-floating">
                <img 
                  src={heroBankingImage} 
                  alt="Modern Core Banking System Dashboard" 
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center animate-fade-in shadow-floating">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-banking-emerald to-success rounded-xl flex items-center justify-center animate-fade-in shadow-floating" style={{ animationDelay: '0.2s' }}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Features
          </Badge>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
            Everything You Need to Run Your Institution
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Built specifically for microfinance institutions, SACCOs, and community banks with enterprise-grade security and scalability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:scale-105 transition-all duration-300 interactive border-0 shadow-elevated"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-banking-primary transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Why Choose LoanSpur
              </Badge>
              <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
                Built for Modern Financial Institutions
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform combines cutting-edge technology with deep understanding of microfinance operations to deliver exceptional results.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-20 blur-3xl"></div>
              <Card className="relative z-10 p-8 bg-gradient-card border-0 shadow-floating">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-4">Ready to Get Started?</h3>
                  <p className="text-muted-foreground mb-6">Join hundreds of institutions already transforming their operations.</p>
                  <Button size="lg" variant="banking" onClick={() => navigate("/auth")} className="w-full">
                    Start Free Trial
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-banking-primary/5 to-banking-secondary/5"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="outline" className="mb-6">
            <Star className="w-4 h-4 mr-2" />
            Join 500+ Institutions
          </Badge>
          <h2 className="text-5xl font-heading font-bold text-foreground mb-6">
            Ready to Transform Your Institution?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Join hundreds of financial institutions already using LoanSpur CBS to serve their communities better. Start your digital transformation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="xl" variant="banking" onClick={() => navigate("/auth")}>
              <Star className="w-5 h-5 mr-2" />
              Start Your Free Trial
            </Button>
            <Button size="xl" variant="outline">
              <Users className="w-5 h-5 mr-2" />
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-card/50 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-heading font-bold text-banking-primary">LoanSpur CBS</span>
                <div className="text-sm text-muted-foreground">© 2024 All rights reserved</div>
              </div>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-muted-foreground hover:text-banking-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-banking-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-banking-primary transition-colors">Support</a>
              <a href="#" className="text-muted-foreground hover:text-banking-primary transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
