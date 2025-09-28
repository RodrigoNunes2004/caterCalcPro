import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Calculator, ChefHat, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PrepListGenerator from "@/components/PrepListGenerator";
import Navigation from "@/components/Navigator";

export default function PrepListPage() {
  const navigate = useNavigate();

  const handleSavePrepList = (prepList: any[], purchaseList: any[]) => {
    // Handle saving the prep list - could integrate with backend here
    console.log("Saving prep list:", { prepList, purchaseList });
    // Show success message or navigate to saved lists
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border"></div>
              <FileText className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                Prep List Generator
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Professional Prep List Generator
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Generate comprehensive, chef-friendly preparation lists for your
            catering events. Automatically scale recipes, consolidate
            ingredients, and check inventory to create detailed prep tasks and
            shopping lists.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Smart Scaling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automatically scale recipe quantities based on guest count with
                precision unit conversion and support for custom overrides.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Chef-Friendly Format</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate clear, organized prep lists with task priorities, time
                estimates, and detailed preparation instructions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Inventory Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Cross-check with current inventory levels to automatically
                generate purchase lists with estimated costs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Prep List Generator */}
        <PrepListGenerator onSave={handleSavePrepList} />

        {/* How It Works Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-xl">How It Works</CardTitle>
            <CardDescription>
              Follow these simple steps to generate your prep list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-orange-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Select Menus</h3>
                <p className="text-sm text-gray-600">
                  Choose one or more menus for your catering event from your
                  available options.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Set Guest Count</h3>
                <p className="text-sm text-gray-600">
                  Enter the number of guests to automatically scale all recipe
                  quantities.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Add Overrides</h3>
                <p className="text-sm text-gray-600">
                  Optionally customize specific ingredient quantities for
                  proteins, vegetables, and carbs.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-purple-600">4</span>
                </div>
                <h3 className="font-semibold mb-2">Generate & Export</h3>
                <p className="text-sm text-gray-600">
                  Generate your prep list and shopping list, then export for
                  your kitchen team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Benefits for Your Kitchen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded">
                    <Calculator className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      Eliminate Manual Calculations
                    </h4>
                    <p className="text-sm text-gray-600">
                      No more time-consuming manual scaling or unit conversions.
                      Get accurate quantities instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-1 rounded">
                    <ChefHat className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Organized Prep Workflow</h4>
                    <p className="text-sm text-gray-600">
                      Tasks organized by category and priority with time
                      estimates for better kitchen management.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-1 rounded">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Reduce Food Waste</h4>
                    <p className="text-sm text-gray-600">
                      Precise quantities and inventory checking help minimize
                      over-ordering and waste.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-1 rounded">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      Professional Documentation
                    </h4>
                    <p className="text-sm text-gray-600">
                      Generate clear, printable prep lists that your entire
                      kitchen team can follow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 p-1 rounded">
                    <Calculator className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Cost Control</h4>
                    <p className="text-sm text-gray-600">
                      Automatic cost estimation helps you stay within budget and
                      improve profitability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-pink-100 p-1 rounded">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Scale Any Event Size</h4>
                    <p className="text-sm text-gray-600">
                      From intimate gatherings to large corporate events, scale
                      with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
