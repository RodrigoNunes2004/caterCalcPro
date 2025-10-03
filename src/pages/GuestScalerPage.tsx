import React from "react";
import Navigation from "@/components/Navigator";
import GuestScaler from "@/components/GuestScaler";

export default function GuestScalerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">
                Recipe Scaling
              </h1>
            </div>

            <Navigation />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <GuestScaler />
      </div>
    </div>
  );
}
