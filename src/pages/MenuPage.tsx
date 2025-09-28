import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Menu, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MenuManager from "@/components/MenuManager";
import Navigation from "@/components/Navigator";

const MENU_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "buffet", label: "Buffet Events" },
  { value: "morning-tea", label: "Morning Tea" },
  { value: "canapes", label: "Canapés & Cocktails" },
  { value: "corporate", label: "Corporate Lunches" },
  { value: "wedding", label: "Wedding Receptions" },
  { value: "afternoon-tea", label: "Afternoon Tea" },
  { value: "custom", label: "Custom Menu" },
];

export default function MenusPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Menu className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                Menu Management
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Catering Menu Management
          </h2>
          <p className="text-muted-foreground text-lg">
            Create, organize, and manage your catering menus. Build collections
            of recipes for different event types and occasions.
          </p>
        </div>

        <Tabs defaultValue="menus" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menus">Menu Collection</TabsTrigger>
            <TabsTrigger value="builder">Menu Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="menus" className="space-y-6">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Find Menus</CardTitle>
                <CardDescription>
                  Search and filter your menu collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search menus by name, category, or description..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={selectedCategory}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MENU_CATEGORIES.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Manager Component */}
            <MenuManager searchTerm={searchTerm} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            {/* Menu Builder Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Menu Builder Guide</CardTitle>
                <CardDescription>
                  Follow these steps to create effective catering menus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-orange-600">
                          1
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          Choose Event Type
                        </h3>
                        <p className="text-sm text-gray-600">
                          Select the category that best matches your event
                          (buffet, corporate lunch, wedding, etc.)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          2
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Select Recipes</h3>
                        <p className="text-sm text-gray-600">
                          Browse your recipe collection and add items that work
                          well together for your chosen event type
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-green-600">
                          3
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          Balance Your Menu
                        </h3>
                        <p className="text-sm text-gray-600">
                          Ensure you have a good mix of appetizers, mains,
                          sides, and desserts with varying prep times
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-purple-600">
                          4
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Test & Refine</h3>
                        <p className="text-sm text-gray-600">
                          Use the prep list generator to test your menu and make
                          adjustments based on timing and costs
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-orange-900">
                        Menu Planning Tips
                      </h3>
                      <ul className="text-sm text-orange-800 space-y-1">
                        <li>• Include 1-2 items that can be prepared ahead</li>
                        <li>• Balance hot and cold dishes</li>
                        <li>
                          • Consider dietary restrictions and alternatives
                        </li>
                        <li>• Plan for 10-15% extra portions</li>
                        <li>• Group items by cooking method and timing</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-blue-900">
                        Cost Optimization
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use seasonal ingredients when possible</li>
                        <li>
                          • Balance expensive proteins with affordable sides
                        </li>
                        <li>• Consider ingredient overlap between recipes</li>
                        <li>
                          • Factor in labor costs for complex preparations
                        </li>
                        <li>• Build in 20-30% markup for profitability</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-green-900">
                        Scaling Considerations
                      </h3>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Test recipes at larger scales before events</li>
                        <li>• Consider equipment limitations</li>
                        <li>• Plan serving logistics and equipment needs</li>
                        <li>
                          • Account for holding and transport requirements
                        </li>
                        <li>• Build buffer time into prep schedules</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        const element = document.querySelector(
                          '[data-value="menus"]'
                        ) as HTMLElement;
                        element?.click();
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Building Your Menu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Menu Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Menu Templates</CardTitle>
                <CardDescription>
                  Start with these proven menu combinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-semibold mb-2">Corporate Buffet</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Perfect for business meetings and conferences
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>• Mixed green salad</div>
                      <div>• Herb-crusted chicken</div>
                      <div>• Roasted vegetables</div>
                      <div>• Dinner rolls</div>
                      <div>• Seasonal fruit</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-semibold mb-2">Elegant Canapés</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Sophisticated finger foods for cocktail events
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>• Smoked salmon blinis</div>
                      <div>• Beef tenderloin crostini</div>
                      <div>• Goat cheese tartlets</div>
                      <div>• Prawn skewers</div>
                      <div>• Mini dessert bites</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-semibold mb-2">Morning Tea</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Light refreshments for morning events
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>• Assorted pastries</div>
                      <div>• Fresh fruit platter</div>
                      <div>• Coffee and tea service</div>
                      <div>• Mini muffins</div>
                      <div>• Yogurt parfaits</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
