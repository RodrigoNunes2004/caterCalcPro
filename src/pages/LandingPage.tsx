import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Calculator,
  Users,
  DollarSign,
  Clock,
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
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
}

const features: Feature[] = [
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Smart Recipe Scaling",
    description:
      "Automatically scale recipes for any guest count with precision unit conversion",
    benefit: "Save 3+ hours per event on calculations",
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Real-time Cost Analysis",
    description:
      "Track ingredient costs, profit margins, and GST calculations instantly",
    benefit: "Increase profit margins by 15-25%",
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: "Inventory Management",
    description:
      "Monitor stock levels, track expiry dates, and get low-stock alerts",
    benefit: "Reduce food waste by 30%",
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: "Shopping List Generator",
    description: "Auto-generate consolidated shopping lists with total costs",
    benefit: "Cut shopping time in half",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Event Planning",
    description:
      "Plan multiple events, compare costs, and track preparation timelines",
    benefit: "Manage 5x more events efficiently",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Profit Analytics",
    description: "Detailed reports on costs, margins, and business performance",
    benefit: "Make data-driven pricing decisions",
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
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate sign up process
    setTimeout(() => {
      setIsLoading(false);
      setShowSignUp(false);
      // Navigate to home page after successful signup
      navigate("/");
    }, 2000);
  };

  const handleDemoAccess = () => {
    navigate("/");
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
              <Button variant="outline" onClick={handleDemoAccess}>
                View Demo
              </Button>
              <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Start Free Trial
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start Your Free 14-Day Trial</DialogTitle>
                    <DialogDescription>
                      No credit card required. Full access to all features.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="chef@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a secure password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        "Start Free Trial"
                      )}
                    </Button>
                    <p className="text-xs text-gray-600 text-center">
                      By signing up, you agree to our Terms of Service and
                      Privacy Policy
                    </p>
                  </form>
                </DialogContent>
              </Dialog>
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
            Scale Your Catering
            <span className="text-orange-600"> Business</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The only system you need for efficient kitchen catering operations.
            Calculate costs, scale recipes, and manage inventory for large
            buffet events with precision and confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Free 14-Day Trial
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4"
              onClick={handleDemoAccess}
            >
              <Eye className="h-5 w-5 mr-2" />
              View Live Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>14-day free trial</span>
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Catering
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From recipe scaling to cost analysis, Gastro Grid handles the
              complex calculations so you can focus on creating amazing culinary
              experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {feature.benefit}
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
              Start with a free trial, then continue with our affordable monthly
              plan.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-orange-200 shadow-xl">
              <CardHeader className="text-center bg-orange-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Professional Plan</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  $60<span className="text-lg font-normal">/month</span>
                </div>
                <p className="text-orange-100 mt-2">
                  Billed monthly, cancel anytime
                </p>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Unlimited recipes and events</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Advanced cost calculations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Inventory management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Profit analytics & reports</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Priority email support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Mobile & desktop access</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">14-Day Free Trial</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Full access to all features. No credit card required.
                  </p>
                </div>

                <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-lg py-3">
                      Start Your Free Trial
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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
            <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Start Free Trial Now
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={handleDemoAccess}
            >
              <Eye className="h-5 w-5 mr-2" />
              Explore Demo
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
