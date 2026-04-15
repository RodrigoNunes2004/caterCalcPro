import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChefHat, Eye, EyeOff, Loader2, Sparkles, BarChart3 } from "lucide-react";
import type { PlanTier } from "@/lib/planTier";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("starter");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    const result = await register(companyName, email, password);
    setIsLoading(false);
    if (result.ok) {
      if (selectedPlan === "starter") {
        navigate("/");
        return;
      }
      navigate(`/billing?highlight=${selectedPlan}`);
      return;
    }
    setError(result.error || "Registration failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <ChefHat className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Choose a plan, then start your trial or subscribe. You can change plans anytime in Billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base font-medium">Choose a plan</Label>
              <RadioGroup
                value={selectedPlan}
                onValueChange={(v) => setSelectedPlan(v as PlanTier)}
                className="grid gap-3"
              >
                <label
                  htmlFor="plan-starter"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    selectedPlan === "starter" ? "border-orange-500 bg-orange-50/50" : ""
                  }`}
                >
                  <RadioGroupItem value="starter" id="plan-starter" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      Starter
                      <span className="text-xs font-normal text-muted-foreground">
                        (30-day trial, no card)
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Core costing, prep & shopping workflows, recipes, menus, and events.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="plan-pro"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    selectedPlan === "pro" ? "border-orange-500 bg-orange-50/50" : ""
                  }`}
                >
                  <RadioGroupItem value="pro" id="plan-pro" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      Pro
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Analytics dashboard, margin insights, and advanced reporting (subscribe after signup).
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="plan-ai"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    selectedPlan === "ai" ? "border-orange-500 bg-orange-50/50" : ""
                  }`}
                >
                  <RadioGroupItem value="ai" id="plan-ai" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      AI
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI recipe drafts and menu assistance (subscribe after signup).
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your catering business name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@example.com"
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : selectedPlan === "starter" ? (
                "Start free trial"
              ) : (
                "Create account & continue to billing"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
