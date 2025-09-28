import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChefHat,
  Menu as MenuIcon,
  Calendar,
  Package,
  Calculator,
  Plus,
  Menu as HamburgerIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import ThemeToggle from "@/components/ThemeToggle";

interface NavigationProps {
  showCreateButton?: boolean;
  createButtonText?: string;
  createButtonAction?: () => void;
}

export default function Navigation({
  showCreateButton = false,
  createButtonText = "Create",
  createButtonAction,
}: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const getButtonVariant = (path: string) => {
    return isActive(path) ? "default" : "outline";
  };

  const navigationItems = [
    { path: "/", label: "Home", icon: ChefHat },
    { path: "/landing", label: "Landing", icon: ChefHat },
    { path: "/recipes", label: "Recipes", icon: ChefHat },
    { path: "/menus", label: "Menus", icon: MenuIcon },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/prep-list", label: "Prep Lists", icon: Calculator },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleCreateAction = () => {
    if (createButtonAction) {
      createButtonAction();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-3">
        {navigationItems.map(({ path, label, icon: Icon }) => (
          <Button
            key={path}
            variant={getButtonVariant(path)}
            size="sm"
            onClick={() => navigate(path)}
            className={
              isActive(path)
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : ""
            }
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}

        {showCreateButton && (
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={createButtonAction}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createButtonText}
          </Button>
        )}

        <ThemeToggle />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center space-x-2">
        <ThemeToggle />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <HamburgerIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <VisuallyHidden.Root>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden.Root>
            <div className="flex flex-col space-y-4 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Navigation
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {navigationItems.map(({ path, label, icon: Icon }) => (
                <Button
                  key={path}
                  variant={isActive(path) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNavigation(path)}
                  className={`w-full justify-start ${
                    isActive(path)
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : ""
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {label}
                </Button>
              ))}

              {showCreateButton && (
                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleCreateAction}
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    {createButtonText}
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
