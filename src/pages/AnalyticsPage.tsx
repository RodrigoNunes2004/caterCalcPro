import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import Navigation from "@/components/Navigator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/overview");
      if (!response.ok) throw new Error("Failed to load analytics overview");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && <p className="text-muted-foreground">Loading analytics...</p>}
        {isError && (
          <p className="text-destructive">
            Unable to load analytics right now.
          </p>
        )}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monthly Profit</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                ${Number(data?.monthlyProfit || 0).toFixed(2)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Margin</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {Number(data?.averageMarginPercent || 0).toFixed(2)}%
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inventory Spend</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                ${Number(data?.inventorySpend || 0).toFixed(2)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Snapshots</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {Number(data?.snapshotCount || 0)}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

