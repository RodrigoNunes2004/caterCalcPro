import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  DollarSign,
  ChefHat,
  Menu,
  Search,
  Filter,
  Eye,
  Copy,
} from "lucide-react";

interface Menu {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  recipeIds?: string[];
  recipes?: Recipe[];
  totalCost: number;
  totalRecipes: number;
  avgPrepTime: number;
  createdAt: string;
  updatedAt: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  category: string;
  prepTime: number;
  cookTime: number;
  totalCost: number;
  costPerServing: number;
}

interface MenuFormData {
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  recipeIds: string[];
}

interface MenuManagerProps {
  searchTerm: string;
  viewMode: "grid" | "list";
}

const MENU_CATEGORIES = [
  { value: "buffet", label: "Buffet Events" },
  { value: "morning-tea", label: "Morning Tea" },
  { value: "canapes", label: "Canapés & Cocktails" },
  { value: "corporate", label: "Corporate Lunches" },
  { value: "wedding", label: "Wedding Receptions" },
  { value: "afternoon-tea", label: "Afternoon Tea" },
  { value: "custom", label: "Custom Menu" },
];

export default function MenuManager({
  searchTerm,
  viewMode,
}: MenuManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [viewingMenu, setViewingMenu] = useState<Menu | null>(null);
  const [viewingMenuRecipes, setViewingMenuRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [formData, setFormData] = useState<MenuFormData>({
    name: "",
    description: "",
    category: "buffet",
    isActive: true,
    recipeIds: [],
  });

  const queryClient = useQueryClient();

  // Fetch menus
  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ["menus", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/menus?${params}`);
      if (!response.ok) throw new Error("Failed to fetch menus");
      return response.json();
    },
  });

  // Fetch available recipes for menu creation
  const { data: availableRecipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["recipes", "available"],
    queryFn: async () => {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
    enabled: isCreateDialogOpen || isEditDialogOpen,
  });

  // Create menu mutation
  const createMenuMutation = useMutation({
    mutationFn: async (data: MenuFormData) => {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Menu Created",
        description: "Your menu has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create menu. Please try again.",
      });
    },
  });

  // Update menu mutation
  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuFormData }) => {
      const response = await fetch(`/api/menus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setIsEditDialogOpen(false);
      setSelectedMenu(null);
      resetForm();
      toast({
        title: "Menu Updated",
        description: "Menu has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update menu. Please try again.",
      });
    },
  });

  // Delete menu mutation
  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menus/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast({
        title: "Menu Deleted",
        description: "Menu has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete menu. Please try again.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "buffet",
      isActive: true,
      recipeIds: [],
    });
    setSelectedRecipes([]);
    setRecipeSearchTerm("");
    setViewingMenuRecipes([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMenuMutation.mutate({ ...formData, recipeIds: selectedRecipes });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMenu) {
      updateMenuMutation.mutate({
        id: selectedMenu.id,
        data: { ...formData, recipeIds: selectedRecipes },
      });
    }
  };

  const handleEdit = async (menu: Menu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description,
      category: menu.category,
      isActive: menu.isActive,
      recipeIds: [],
    });

    // Load existing recipes for this menu
    try {
      const response = await fetch(`/api/menus/${menu.id}`);
      if (response.ok) {
        const menuWithRecipes = await response.json();
        setSelectedRecipes(menuWithRecipes.recipeIds || []);
      }
    } catch (error) {
      console.error("Error loading menu recipes:", error);
    }

    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (menu: Menu) => {
    setFormData({
      name: `${menu.name} (Copy)`,
      description: menu.description,
      category: menu.category,
      isActive: true,
      recipeIds: [],
    });
    setIsCreateDialogOpen(true);
  };

  const handleView = async (menu: Menu) => {
    setViewingMenu(menu);
    setViewingMenuRecipes([]);

    // Load recipes for this menu
    try {
      const response = await fetch(`/api/menus/${menu.id}`);
      if (response.ok) {
        const menuWithRecipes = await response.json();
        setViewingMenuRecipes(menuWithRecipes.recipes || []);
      }
    } catch (error) {
      console.error("Error loading menu recipes:", error);
    }

    setIsViewDialogOpen(true);
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      buffet: "bg-orange-100 text-orange-800",
      "morning-tea": "bg-blue-100 text-blue-800",
      canapes: "bg-purple-100 text-purple-800",
      corporate: "bg-green-100 text-green-800",
      wedding: "bg-pink-100 text-pink-800",
      "afternoon-tea": "bg-indigo-100 text-indigo-800",
      custom: "bg-gray-100 text-gray-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const filteredRecipes = Array.isArray(availableRecipes?.recipes)
    ? availableRecipes.recipes.filter(
        (recipe: Recipe) =>
          recipe.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
          recipe.category.toLowerCase().includes(recipeSearchTerm.toLowerCase())
      )
    : [];

  if (menusLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-600">Create and manage your catering menus</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              New Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Menu</DialogTitle>
              <DialogDescription>
                Build a new catering menu by selecting recipes and setting
                details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Menu Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter menu name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MENU_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this menu"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: !!checked })
                  }
                />
                <Label htmlFor="isActive">
                  Make this menu active and available for events
                </Label>
              </div>

              <Separator />

              {/* Recipe Selection */}
              <div>
                <Label className="text-lg font-semibold">Select Recipes</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose recipes to include in this menu. Selected:{" "}
                  {selectedRecipes.length}
                </p>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search recipes..."
                      value={recipeSearchTerm}
                      onChange={(e) => setRecipeSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {recipesLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading recipes...
                    </div>
                  ) : filteredRecipes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No recipes found
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {filteredRecipes.map((recipe: Recipe) => (
                        <div
                          key={recipe.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            selectedRecipes.includes(recipe.id)
                              ? "bg-orange-50 border-orange-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedRecipes.includes(recipe.id)}
                            onCheckedChange={() =>
                              toggleRecipeSelection(recipe.id)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{recipe.name}</h4>
                              <Badge
                                className={getCategoryColor(recipe.category)}
                              >
                                {recipe.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{recipe.servings}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {recipe.prepTime + recipe.cookTime}m
                                </span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  $
                                  {typeof recipe.costPerServing === "number"
                                    ? recipe.costPerServing.toFixed(2)
                                    : typeof recipe.costPerServing === "string"
                                    ? parseFloat(recipe.costPerServing).toFixed(
                                        2
                                      )
                                    : "0.00"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMenuMutation.isPending ||
                    !formData.name ||
                    selectedRecipes.length === 0
                  }
                >
                  {createMenuMutation.isPending ? "Creating..." : "Create Menu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menusData?.menus?.map((menu: Menu) => (
            <Card key={menu.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{menu.name}</span>
                      {!menu.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {menu.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Badge className={getCategoryColor(menu.category)}>
                    {MENU_CATEGORIES.find((c) => c.value === menu.category)
                      ?.label || menu.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <ChefHat className="h-4 w-4" />
                      <span>{menu.totalRecipes} recipes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{menu.avgPrepTime} min avg</span>
                    </div>
                    <div className="flex items-center space-x-1 col-span-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Total cost: $
                        {typeof menu.totalCost === "number"
                          ? menu.totalCost.toFixed(2)
                          : typeof menu.totalCost === "string"
                          ? parseFloat(menu.totalCost).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(menu)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(menu)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(menu)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMenuMutation.mutate(menu.id)}
                      disabled={deleteMenuMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {menusData?.menus?.map((menu: Menu) => (
            <Card key={menu.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{menu.name}</span>
                        {!menu.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge className={getCategoryColor(menu.category)}>
                        {MENU_CATEGORIES.find((c) => c.value === menu.category)
                          ?.label || menu.category}
                      </Badge>
                    </div>
                    <CardDescription className="mb-3">
                      {menu.description || "No description provided"}
                    </CardDescription>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <ChefHat className="h-4 w-4" />
                        <span>{menu.totalRecipes} recipes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{menu.avgPrepTime} min avg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          Total cost: $
                          {typeof menu.totalCost === "number"
                            ? menu.totalCost.toFixed(2)
                            : typeof menu.totalCost === "string"
                            ? parseFloat(menu.totalCost).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(menu)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(menu)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(menu)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMenuMutation.mutate(menu.id)}
                      disabled={deleteMenuMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {menusData?.menus?.length === 0 && (
        <div className="text-center py-12">
          <Menu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No menus found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by creating your first menu"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Menu
          </Button>
        </div>
      )}

      {/* Edit Menu Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>
              Update menu details and recipe selection
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Same form content as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Menu Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter menu name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this menu"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: !!checked })
                }
              />
              <Label htmlFor="edit-isActive">
                Make this menu active and available for events
              </Label>
            </div>

            <Separator />

            {/* Recipe Selection for Edit */}
            <div>
              <Label className="text-lg font-semibold">Select Recipes</Label>
              <p className="text-sm text-gray-600 mb-4">
                Choose recipes to include in this menu. Selected:{" "}
                {selectedRecipes.length}
              </p>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search recipes..."
                    value={recipeSearchTerm}
                    onChange={(e) => setRecipeSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {recipesLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading recipes...
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No recipes found
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {filteredRecipes.map((recipe: Recipe) => (
                      <div
                        key={recipe.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          selectedRecipes.includes(recipe.id)
                            ? "bg-orange-50 border-orange-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedRecipes.includes(recipe.id)}
                          onCheckedChange={() =>
                            toggleRecipeSelection(recipe.id)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{recipe.name}</h4>
                            <Badge
                              className={getCategoryColor(recipe.category)}
                            >
                              {recipe.category}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{recipe.servings}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{recipe.prepTime + recipe.cookTime}m</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                $
                                {typeof recipe.costPerServing === "number"
                                  ? recipe.costPerServing.toFixed(2)
                                  : typeof recipe.costPerServing === "string"
                                  ? parseFloat(recipe.costPerServing).toFixed(2)
                                  : "0.00"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMenuMutation.isPending || !formData.name}
              >
                {updateMenuMutation.isPending ? "Updating..." : "Update Menu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Menu Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{viewingMenu?.name}</span>
              {viewingMenu && !viewingMenu.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {viewingMenu && (
                <Badge className={getCategoryColor(viewingMenu.category)}>
                  {MENU_CATEGORIES.find((c) => c.value === viewingMenu.category)
                    ?.label || viewingMenu.category}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewingMenu?.description || "No description provided"}
            </DialogDescription>
          </DialogHeader>

          {viewingMenu && (
            <div className="space-y-6">
              {/* Menu Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <ChefHat className="h-4 w-4 mr-2" />
                      Recipes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingMenu.totalRecipes}
                    </div>
                    <p className="text-xs text-muted-foreground">Total items</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Prep Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingMenu.avgPrepTime}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minutes average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Total Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      $
                      {typeof viewingMenu.totalCost === "number"
                        ? viewingMenu.totalCost.toFixed(2)
                        : typeof viewingMenu.totalCost === "string"
                        ? parseFloat(viewingMenu.totalCost).toFixed(2)
                        : "0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">Base cost</p>
                  </CardContent>
                </Card>
              </div>

              {/* Menu Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Menu Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge
                        variant={viewingMenu.isActive ? "default" : "secondary"}
                      >
                        {viewingMenu.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Category:</span>
                      <span className="text-sm">
                        {MENU_CATEGORIES.find(
                          (c) => c.value === viewingMenu.category
                        )?.label || viewingMenu.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">
                        {new Date(viewingMenu.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm">
                        {new Date(viewingMenu.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEdit(viewingMenu);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Menu
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleDuplicate(viewingMenu);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Menu
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Recipes (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Menu Recipes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Menu Recipes</CardTitle>
                  <CardDescription>
                    {viewingMenuRecipes.length > 0
                      ? `${viewingMenuRecipes.length} recipes in this menu`
                      : "No recipes found in this menu"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewingMenuRecipes.length > 0 ? (
                    <div className="space-y-4">
                      {viewingMenuRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{recipe.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {recipe.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{recipe.servings} servings</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {recipe.prepTime + recipe.cookTime}m
                                </span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  $
                                  {typeof recipe.costPerServing === "number"
                                    ? recipe.costPerServing.toFixed(2)
                                    : typeof recipe.costPerServing === "string"
                                    ? parseFloat(recipe.costPerServing).toFixed(
                                        2
                                      )
                                    : "0.00"}
                                  /serving
                                </span>
                              </span>
                            </div>
                          </div>
                          <Badge className={getCategoryColor(recipe.category)}>
                            {recipe.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recipes in this menu</p>
                      <p className="text-sm">
                        Add recipes by editing this menu
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
