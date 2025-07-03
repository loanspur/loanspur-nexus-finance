import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PricingPage = () => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "14-day trial",
      description: "Perfect for small microfinance institutions getting started",
      features: [
        "Up to 100 clients",
        "Basic loan management",
        "Simple reporting",
        "Email support",
        "Basic client portal"
      ],
      limitations: [
        "Limited to 1 branch",
        "Basic integrations only"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "per month",
      description: "For growing institutions with advanced needs",
      features: [
        "Up to 1,000 clients",
        "Advanced loan products",
        "Group management",
        "M-Pesa integration",
        "SMS notifications",
        "Advanced reporting",
        "Multi-branch support",
        "Priority email support"
      ],
      limitations: [],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$299",
      period: "per month",
      description: "For large institutions requiring full features",
      features: [
        "Up to 10,000 clients",
        "All loan products",
        "Advanced accounting",
        "Full API access",
        "WhatsApp integration",
        "Custom reporting",
        "Multi-currency support",
        "Dedicated support",
        "Training included"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    },
    {
      name: "Scale",
      price: "Custom",
      period: "per month",
      description: "For banks and large financial institutions",
      features: [
        "Unlimited clients",
        "White-label solution",
        "Custom integrations",
        "Dedicated infrastructure",
        "24/7 phone support",
        "Custom training",
        "SLA guarantee",
        "Regulatory compliance"
      ],
      limitations: [],
      cta: "Contact Us",
      popular: false
    }
  ];

  const addons = [
    {
      name: "M-Pesa C2B Integration",
      price: "$29/month",
      description: "Enable clients to make payments directly via M-Pesa"
    },
    {
      name: "M-Pesa B2C Integration", 
      price: "$49/month",
      description: "Automate loan disbursements via M-Pesa"
    },
    {
      name: "Bulk SMS Service",
      price: "$0.05/SMS",
      description: "Send notifications and reminders to clients"
    },
    {
      name: "WhatsApp Integration",
      price: "$39/month",
      description: "Send notifications via WhatsApp Business API"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/5 via-background to-banking-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flexible pricing for institutions of all sizes. Start with our free trial and scale as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-elevated' : 'shadow-card'}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Add-on Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {addons.map((addon, index) => (
              <Card key={index} className="shadow-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <CardDescription className="mt-2">{addon.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary">
                      {addon.price}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Need a custom solution?</h3>
          <p className="text-muted-foreground mb-6">
            Contact our sales team for enterprise pricing and custom integrations.
          </p>
          <Button size="lg">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;