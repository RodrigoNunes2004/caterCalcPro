import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import Navigation from "@/components/Navigator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GeneratedResult = {
  recipe?: { id: string; name: string };
  costing?: { totalCost?: number; costPerServing?: number };
  note?: string;
};

export default function AIStudioPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [eventType, setEventType] = useState("buffet");
  const [cuisineType, setCuisineType] = useState("Modern");
  const [ingredients, setIngredients] = useState("chicken, garlic, onion");
  const [dietary, setDietary] = useState("");
  const [guestCount, setGuestCount] = useState(30);

  const generateRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          cuisineType,
          ingredientsOnHand: ingredients
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          dietaryRequirements: dietary
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          guestCount: Number(guestCount) || 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate recipe");
      const data = await response.json();
      setResult(data);
    } catch {
      setResult(null);
      alert("Unable to generate recipe right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-foreground">AI Studio</h1>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate AI Recipe Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Event Type</Label>
              <Input value={eventType} onChange={(e) => setEventType(e.target.value)} />
            </div>
            <div>
              <Label>Cuisine Type</Label>
              <Input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} />
            </div>
            <div>
              <Label>Ingredients (comma-separated)</Label>
              <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
            </div>
            <div>
              <Label>Dietary requirements (comma-separated)</Label>
              <Input value={dietary} onChange={(e) => setDietary(e.target.value)} />
            </div>
            <div>
              <Label>Guest count</Label>
              <Input
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
              />
            </div>
            <Button onClick={generateRecipe} disabled={loading}>
              {loading ? "Generating..." : "Generate Recipe"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generated Recipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Name:</strong> {result.recipe?.name || "Draft"}</p>
              <p>
                <strong>Total Cost:</strong> $
                {Number(result.costing?.totalCost || 0).toFixed(2)}
              </p>
              <p>
                <strong>Cost Per Serving:</strong> $
                {Number(result.costing?.costPerServing || 0).toFixed(2)}
              </p>
              {result.note && <p className="text-sm text-muted-foreground">{result.note}</p>}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

