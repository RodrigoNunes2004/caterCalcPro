import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calculator,
  ShoppingCart,
  Users,
  ChefHat,
  Package,
  Menu as MenuIcon,
  Calendar,
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
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigator";

export default function HomePage() {
  const navigate = useNavigate();
  const [guestCount, setGuestCount] = useState<number>(50);

  // Mock data for demonstration
  const recentRecipes = [
    {
      id: 1,
      name: "Herb-Crusted Salmon",
      servings: 10,
      category: "main",
      cost: 45.5,
    },
    {
      id: 2,
      name: "Roasted Vegetable Medley",
      servings: 12,
      category: "side",
      cost: 18.75,
    },
    {
      id: 3,
      name: "Chocolate Mousse",
      servings: 8,
      category: "dessert",
      cost: 22.3,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      name: "Corporate Lunch",
      date: "2024-01-15",
      guests: 75,
      status: "confirmed",
    },
    {
      id: 2,
      name: "Wedding Reception",
      date: "2024-01-20",
      guests: 150,
      status: "planning",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-foreground">
                Gastro Grid
              </h1>
            </div>

            <Navigation
              showCreateButton={true}
              createButtonText="New Recipe"
              createButtonAction={() => navigate("/recipes")}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Scale Your Catering Operations
          </h2>
          <p className="text-muted-foreground text-lg">
            Intelligent recipe scaling, cost breakdown, and ingredient
            management for professional caterers.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Smart Recipe Scaling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Automatically scale your recipes based on guest count with
                intelligent unit conversion.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-20"
                  min="1"
                />
                <span className="text-sm text-muted-foreground">guests</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">
                  Real-Time Cost Breakdown
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant cost calculations per recipe with live ingredient
                price tracking.
              </p>
              <div className="text-2xl font-bold text-blue-600 mt-3">$247</div>
              <div className="text-xs text-muted-foreground">
                for {guestCount} guests
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/prep-list")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Smart Prep Lists</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Generate comprehensive prep lists and shopping lists with
                automatic ingredient aggregation.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 mt-3">
                Generate List
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-purple-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/events")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Event Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Plan buffets, morning tea, canapés, and more. Track
                profitability across all your events.
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="secondary">Buffets</Badge>
                <Badge variant="secondary">Canapés</Badge>
                <Badge variant="secondary">Morning Tea</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-indigo-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/inventory")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Inventory Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Track stock levels, manage storage locations, and monitor
                ingredient costs in real-time.
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="secondary">Stock Take</Badge>
                <Badge variant="secondary">Low Stock</Badge>
                <Badge variant="secondary">Pricing</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Recent Recipes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Recipes</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/recipes")}
                  >
                    View All
                  </Button>
                </div>
                <CardDescription>
                  Your most recently created and modified recipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {recipe.name}
                        </h4>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {recipe.servings} servings
                          </span>
                          <Badge variant="secondary">{recipe.category}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ${recipe.cost}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          base cost
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Your scheduled catering events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border rounded-lg bg-card"
                    >
                      <h4 className="font-medium text-foreground mb-2">
                        {event.name}
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground mb-2">
                        <div>Date: {event.date}</div>
                        <div>Guests: {event.guests}</div>
                      </div>
                      <Badge
                        variant={
                          event.status === "confirmed" ? "default" : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Everything You Need to Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Intelligent Recipe Scaling
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatically scale recipes for any guest count with smart
                  unit conversion from cups to grams and vice versa.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Sub-Recipe Support
                </h4>
                <p className="text-sm text-muted-foreground">
                  Build complex recipes using other recipes as ingredients with
                  automatic cost and scaling calculations.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Smart Shopping Lists
                </h4>
                <p className="text-sm text-muted-foreground">
                  Generate consolidated shopping lists that automatically
                  combine similar ingredients across multiple recipes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
