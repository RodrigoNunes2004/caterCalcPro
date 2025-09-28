import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navigation from "@/components/Navigator";
import RecipeManager from "@/components/RecipeManager";

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-foreground">
                Recipe Management
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Find Recipes</CardTitle>
            <CardDescription>Search your recipe collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recipes by name, ingredient, or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recipe Manager Component */}
        <RecipeManager searchTerm={searchTerm} />
      </div>
    </div>
  );
}
