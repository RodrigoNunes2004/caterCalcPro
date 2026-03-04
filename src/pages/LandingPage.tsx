import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChefHat,
  Calculator,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star,
  Package,
  BarChart3,
  Calendar,
  ShoppingCart,
  Zap,
  Shield,
  Mail,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import PlanBadge from "@/components/PlanBadge";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
  availability: string;
  availabilityClassName: string;
}

const features: Feature[] = [
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Starter Plan - Core Tools",
    description:
      "Calculate recipe costs, scale ingredients for event size, and run day-to-day catering operations in one place.",
    benefit:
      "Includes recipe scaling, event costing, prep lists, shopping lists, and recipe/menu/event organization.",
    availability: "Available now",
    availabilityClassName: "bg-green-100 text-green-800",
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Pro Plan - Advanced Insights",
    description:
      "Designed for growing teams that want deeper visibility into costs, margins, and performance trends.",
    benefit:
      "Planned: real-time analytics dashboard, profit margin reports, GST breakdowns, and priority support.",
    availability: "Coming soon",
    availabilityClassName: "bg-amber-100 text-amber-800",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "AI Plan - Premium Automation",
    description:
      "AI-assisted recipe and menu creation to speed up planning while keeping costing workflows consistent.",
    benefit:
      "Planned: AI recipe generation, AI menu suggestions, auto-scaled ingredient quantities, and cost/margin estimates.",
    availability: "Future plan",
    availabilityClassName: "bg-purple-100 text-purple-800",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Executive Chef, Auckland Events",
    content:
      "Gastro Grid transformed our catering operations. We've reduced planning time by 70% and increased our profit margins significantly.",
    rating: 5,
  },
  {
    name: "Marcus Thompson",
    role: "Catering Manager, Wellington Weddings",
    content:
      "The recipe scaling feature is incredible. No more manual calculations or guesswork when catering for 200+ guests.",
    rating: 5,
  },
  {
    name: "Emma Chen",
    role: "Owner, Christchurch Catering Co.",
    content:
      "Finally, a tool that understands the catering business. The cost breakdowns and inventory tracking are game-changers.",
    rating: 5,
  },
];

const useCases = [
  {
    title: "Wedding Catering",
    description:
      "Scale recipes for 150 guests, calculate exact costs, and manage multi-course menus",
    example:
      "Transform a 10-person recipe into any number of guests feasts with accurate ingredient quantities and costs",
  },
  {
    title: "Corporate Events",
    description:
      "Plan buffet spreads, track dietary requirements, and optimise profit margins",
    example:
      "Cater a 300-person corporate lunch with precise cost control and inventory management",
  },
  {
    title: "Restaurant Catering",
    description:
      "Extend your restaurant's reach with efficient off-site catering management",
    example:
      "Manage multiple daily catering orders while maintaining restaurant quality and profitability",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planTier, isLoading: planLoading } = usePlanAccess();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  const handleGoToApp = () => {
    navigate(user ? "/" : "/login");
  };

  const handleStartStripeCheckout = async (selectedPlanTier: "starter" | "pro" | "ai") => {
    try {
      setStripeLoading(true);
      const baseUrl = window.location.origin;
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planTier: selectedPlanTier,
          successUrl: `${baseUrl}/${user ? "billing" : "register"}?billing=success`,
          cancelUrl: `${baseUrl}/?billing=cancelled`,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start Stripe checkout");
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Stripe checkout URL not returned");
    } catch (error) {
      console.error("Stripe checkout error:", error);
      alert("Stripe checkout is not configured yet. Please use Start Free Trial for now.");
    } finally {
      setStripeLoading(false);
      setShowPlanOptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white light-mode-only">
      <style>{`
        .light-mode-only,
        .light-mode-only * {
          color-scheme: light !important;
        }
        
        /* Force light theme on all elements */
        .light-mode-only * {
          --background: 0 0% 100% !important;
          --foreground: 222.2 84% 4.9% !important;
          --card: 0 0% 100% !important;
          --card-foreground: 222.2 84% 4.9% !important;
          --popover: 0 0% 100% !important;
          --popover-foreground: 222.2 84% 4.9% !important;
          --primary: 221.2 83.2% 53.3% !important;
          --primary-foreground: 210 40% 98% !important;
          --secondary: 210 40% 96% !important;
          --secondary-foreground: 222.2 84% 4.9% !important;
          --muted: 210 40% 96% !important;
          --muted-foreground: 215.4 16.3% 46.9% !important;
          --accent: 210 40% 96% !important;
          --accent-foreground: 222.2 84% 4.9% !important;
          --destructive: 0 84.2% 60.2% !important;
          --destructive-foreground: 210 40% 98% !important;
          --border: 214.3 31.8% 91.4% !important;
          --input: 214.3 31.8% 91.4% !important;
          --ring: 221.2 83.2% 53.3% !important;
          --radius: 0.5rem !important;
        }
        
        /* Override specific component styles */
        .light-mode-only .bg-background { background-color: white !important; }
        .light-mode-only .bg-card { background-color: white !important; }
        .light-mode-only .bg-popover { background-color: white !important; }
        .light-mode-only .bg-primary { background-color: #ea580c !important; }
        .light-mode-only .bg-secondary { background-color: #f1f5f9 !important; }
        .light-mode-only .bg-muted { background-color: #f1f5f9 !important; }
        .light-mode-only .bg-accent { background-color: #f1f5f9 !important; }
        .light-mode-only .bg-destructive { background-color: #ef4444 !important; }
        
        .light-mode-only .text-foreground { color: #0f172a !important; }
        .light-mode-only .text-card-foreground { color: #0f172a !important; }
        .light-mode-only .text-popover-foreground { color: #0f172a !important; }
        .light-mode-only .text-primary-foreground { color: white !important; }
        .light-mode-only .text-secondary-foreground { color: #0f172a !important; }
        .light-mode-only .text-muted-foreground { color: #64748b !important; }
        .light-mode-only .text-accent-foreground { color: #0f172a !important; }
        .light-mode-only .text-destructive-foreground { color: white !important; }
        
        .light-mode-only .border-border { border-color: #e2e8f0 !important; }
        .light-mode-only .border-input { border-color: #e2e8f0 !important; }
        .light-mode-only .border-ring { border-color: #3b82f6 !important; }
        
        /* Force button styles */
        .light-mode-only button {
          background-color: white !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }
        
        .light-mode-only button[data-variant="default"],
        .light-mode-only button:not([data-variant]) {
          background-color: #0f172a !important;
          color: white !important;
        }
        
        .light-mode-only button[data-variant="outline"] {
          background-color: transparent !important;
          color: #0f172a !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        .light-mode-only button[data-variant="outline"]:hover {
          background-color: #f1f5f9 !important;
        }
        
        /* Force card styles */
        .light-mode-only [data-ui="card"],
        .light-mode-only .bg-card {
          background-color: white !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        
        /* Override any dark mode classes */
        .light-mode-only .dark\\:bg-gray-800,
        .light-mode-only .dark\\:bg-gray-900,
        .light-mode-only .dark\\:bg-slate-800,
        .light-mode-only .dark\\:bg-slate-900 { 
          background-color: white !important; 
        }
        
        .light-mode-only .dark\\:text-white,
        .light-mode-only .dark\\:text-gray-100 { 
          color: #0f172a !important; 
        }
        
        .light-mode-only .dark\\:border-gray-700,
        .light-mode-only .dark\\:border-slate-700 { 
          border-color: #e2e8f0 !important; 
        }
        
        /* Additional overrides for common dark mode patterns */
        .light-mode-only [class*="dark:"] {
          background-color: white !important;
          color: #0f172a !important;
        }
      `}</style>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gastro Grid</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <PlanBadge planTier={planTier} loading={planLoading} />
                  <Button variant="outline" onClick={handleGoToApp}>
                    Go to App
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link to="/billing">Manage Plan</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link to="/register">Start Free Trial</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-100 text-orange-800 hover:bg-orange-100">
            Professional Catering Management
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Cater Smarter,
            <span className="text-orange-600"> Not Harder</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            All-in-one platform to manage recipes, menus, events, and costs for
            catering businesses. Built to help improve margins through accurate
            costing and better planning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4"
              asChild
            >
              <Link to="/register">
                <Zap className="h-5 w-5 mr-2" />
                Start Free 30-Day Trial
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4"
              onClick={handleGoToApp}
            >
              <Eye className="h-5 w-5 mr-2" />
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>30-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-lg text-gray-600">
              A clearer workflow for teams: plan, prep, and price with confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg">1. Build Menus & Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Attach recipes to events, scale for guest count, and set cost coverage targets.
                </p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg">2. Generate Prep & Purchase Lists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Auto-generate chef-ready tasks and buying lists with full status workflow.
                </p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg">3. Price Events Fairly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Use inventory-aware costs to calculate target sale price and margin in real time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Plans Built for Catering Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Clear feature tiers help you choose what fits today while showing
              what is coming next.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 border-gray-100 hover:border-orange-200 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{feature.description}</p>
                  <p className="text-gray-700 mb-4">{feature.benefit}</p>
                  <Badge
                    variant="secondary"
                    className={feature.availabilityClassName}
                  >
                    {feature.availability}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Catering Scenario
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're catering intimate gatherings or large events,
              Gastro Grid scales with your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-600">
                    {useCase.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 italic">
                      "{useCase.example}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professional Caterers
            </h2>
            <p className="text-xl text-gray-600">
              Join hundreds of catering professionals who've transformed their
              operations with Gastro Grid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 border-gray-100">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start with Starter now, then upgrade as advanced analytics and AI
              features roll out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-orange-200 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  $39<span className="text-lg font-normal">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Available now</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Core costing and scaling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Prep and shopping workflows</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Recipe, menu, and event management</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  $79<span className="text-lg font-normal">/month</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">Coming soon</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Real-time cost analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Margin reports and GST breakdowns</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Priority email support</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">AI Plan</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  $99<span className="text-lg font-normal">/month</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">Future plan</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">AI recipe generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">AI menu suggestions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Suggested cost and margin estimates</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-xl mx-auto mt-8 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">30-Day Free Trial on Starter</span>
            </div>
            <p className="text-sm text-green-700 mt-1 text-center">
              Upgrade anytime as Pro and AI features become available.
            </p>
          </div>

          <div className="max-w-md mx-auto mt-6">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3" asChild>
              <Link to="/register">
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full mt-3 text-lg py-3"
              onClick={() => {
                if (user) {
                  navigate("/billing");
                  return;
                }
                setShowPlanOptions(true);
              }}
              disabled={stripeLoading}
            >
              {stripeLoading ? "Redirecting..." : "See Subscription Options"}
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={showPlanOptions} onOpenChange={setShowPlanOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a subscription plan</DialogTitle>
            <DialogDescription>
              Select a plan to continue to Stripe checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={() => handleStartStripeCheckout("starter")}
              disabled={stripeLoading}
            >
              Starter - $39.00 NZD/month
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartStripeCheckout("pro")}
              disabled={stripeLoading}
            >
              Pro - $79.00 NZD/month
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartStripeCheckout("ai")}
              disabled={stripeLoading}
            >
              AI Plan - $99.00 NZD/month
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Catering Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of professional caterers who've streamlined their
            operations and increased profitability with Gastro Grid.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4"
              asChild
            >
              <Link to="/register">
                <Mail className="h-5 w-5 mr-2" />
                Start Free Trial Now
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={handleGoToApp}
            >
              <Eye className="h-5 w-5 mr-2" />
              Sign In
            </Button>
          </div>

          <p className="text-sm text-gray-400 mt-6">
            Questions? Email us at support@gastrogrid.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <ChefHat className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-semibold text-white">
                  Gastro Grid
                </span>
              </div>
              <p className="text-sm">
                Professional catering management software for efficient kitchen
                operations.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-400">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Gastro Grid. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
