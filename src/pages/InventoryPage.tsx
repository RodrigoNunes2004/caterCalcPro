import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Download,
  Upload,
  Filter,
  Edit,
  Trash2,
  Refrigerator,
  Archive,
  Snowflake,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  ChefHat,
  Calculator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateTotalWithGST,
  formatNZCurrency,
  addGST,
  removeGST,
  getGSTFromInclusive,
} from "@/lib/gstCalculation";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigator";

interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  type?: string; // Type of product (e.g., "Fresh Produce", "Dairy", "Frozen Goods")
  location: string; // Now flexible - can be custom location like "chest freezer", "downstairs", etc.
  currentStock: number;
  unit: string;
  pricePerUnit: number;
  gstInclusive?: boolean; // Whether the price includes GST (default: false = GST exclusive)
  minimumStock: number;
  supplier: string;
  expiryDate?: string;
  lastUpdated: string;
  notes?: string;
}

function mapApiToItem(row: Record<string, unknown>): InventoryItem {
  const r = row as any;
  const stock = Number(r?.currentStock ?? r?.current_stock ?? 0) || 0;
  const minStock = Number(r?.minimumStock ?? r?.minimum_stock ?? 0) || 0;
  return {
    id: String(r?.id ?? ""),
    productName: String(r?.name ?? ""),
    category: "General",
    type: "",
    location: "Storage",
    currentStock: stock,
    unit: String(r?.unit ?? "kg"),
    pricePerUnit: 0,
    minimumStock: minStock,
    supplier: "",
    lastUpdated: r?.updatedAt || r?.updated_at ? new Date(r.updatedAt || r.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showGSTInclusive, setShowGSTInclusive] = useState(false); // Toggle for GST display

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    productName: "",
    category: "General",
    type: "",
    location: "Storage",
    currentStock: 0,
    unit: "kg",
    pricePerUnit: 0,
    gstInclusive: false,
    minimumStock: 0,
    supplier: "",
    expiryDate: "",
    notes: "",
  });

  const fetchInventory = useCallback(async () => {
    try {
      const res = await apiFetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventory(Array.isArray(data) ? data.map(mapApiToItem) : []);
      }
    } catch (e) {
      console.error("Failed to fetch inventory:", e);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      filterLocation === "all" || item.location === filterLocation;
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesLocation && matchesCategory;
  });

  const categories = Array.from(
    new Set(inventory.map((item) => item.category))
  );
  const lowStockItems = inventory.filter(
    (item) => item.currentStock <= item.minimumStock
  );

  // Calculate totals with GST breakdown
  const gstTotals = calculateTotalWithGST(inventory);
  const displayTotal = showGSTInclusive
    ? gstTotals.totalInclusive
    : gstTotals.totalExclusive;

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minimumStock) {
      return {
        status: "low",
        color: "text-red-600",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
    return {
      status: "good",
      color: "text-green-600",
      icon: <CheckCircle className="h-4 w-4" />,
    };
  };

  const handleAddItem = async () => {
    if (!newItem.productName?.trim()) {
      toast({ title: "Missing name", description: "Product name is required.", variant: "destructive" });
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await apiFetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItem.productName.trim(),
          currentStock: Number(newItem.currentStock) || 0,
          unit: newItem.unit || "kg",
          minimumStock: Number(newItem.minimumStock) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInventory([...inventory, mapApiToItem(data)]);
        setNewItem({ productName: "", category: "General", type: "", location: "Storage", currentStock: 0, unit: "kg", pricePerUnit: 0, gstInclusive: false, minimumStock: 0, supplier: "", expiryDate: "", notes: "" });
        setShowAddDialog(false);
        toast({ title: "Item added", description: `${newItem.productName} added to inventory.` });
      } else {
        const errMsg = res.status === 401
          ? "Session expired. Please log in again."
          : data?.error || "Could not add item. Please try again.";
        toast({ title: "Failed to add", description: errMsg, variant: "destructive" });
      }
    } catch (e) {
      console.error("Failed to add inventory:", e);
      toast({ title: "Error", description: "Could not add item. Check your connection.", variant: "destructive" });
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({
      productName: item.productName,
      category: item.category,
      type: item.type || "",
      location: item.location,
      currentStock: item.currentStock,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      gstInclusive: item.gstInclusive || false,
      minimumStock: item.minimumStock,
      supplier: item.supplier,
      expiryDate: item.expiryDate || "",
      notes: item.notes || "",
    });
    setShowAddDialog(true);
  };

  const handleSaveItem = async () => {
    if (editingItem) {
      if (!newItem.productName?.trim()) {
        toast({ title: "Missing name", description: "Product name is required.", variant: "destructive" });
        return;
      }
      setAddSubmitting(true);
      try {
        const res = await apiFetch(`/api/inventory/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newItem.productName.trim(),
            currentStock: Number(newItem.currentStock) || 0,
            unit: newItem.unit || "kg",
            minimumStock: Number(newItem.minimumStock) || 0,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          await fetchInventory();
          setShowAddDialog(false);
          setEditingItem(null);
          setNewItem({ productName: "", category: "General", type: "", location: "Storage", currentStock: 0, unit: "kg", pricePerUnit: 0, gstInclusive: false, minimumStock: 0, supplier: "", expiryDate: "", notes: "" });
          toast({ title: "Item updated", description: `${newItem.productName} updated.` });
        } else {
          const errMsg = res.status === 401
            ? "Session expired. Please log in again."
            : data?.error || "Could not update item. Please try again.";
          toast({ title: "Failed to update", description: errMsg, variant: "destructive" });
        }
      } catch (e) {
        console.error("Failed to update inventory:", e);
        toast({ title: "Error", description: "Could not update item. Check your connection.", variant: "destructive" });
      } finally {
        setAddSubmitting(false);
      }
      return;
    }
    await handleAddItem();
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const res = await apiFetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStock: newStock }),
      });
      if (res.ok) {
        setInventory(
          inventory.map((item) =>
            item.id === id ? { ...item, currentStock: newStock, lastUpdated: new Date().toISOString().split("T")[0] } : item
          )
        );
      }
    } catch (e) {
      console.error("Failed to update stock:", e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await apiFetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setInventory(inventory.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = [
      "Product Name",
      "Category",
      "Type",
      "Location",
      "Current Stock",
      "Unit",
      "Price Per Unit",
      "GST Inclusive",
      "Minimum Stock",
      "Supplier",
      "Expiry Date",
      "Last Updated",
      "Notes",
    ];

    const csvContent = [
      headers.join(","),
      ...inventory.map((item) =>
        [
          `"${item.productName}"`,
          `"${item.category}"`,
          `"${item.type || ""}"`,
          `"${item.location}"`,
          item.currentStock,
          `"${item.unit}"`,
          item.pricePerUnit,
          item.gstInclusive || false,
          item.minimumStock,
          `"${item.supplier}"`,
          `"${item.expiryDate || ""}"`,
          `"${item.lastUpdated}"`,
          `"${item.notes || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          try {
            const csvText = e.target?.result as string;
            const lines = csvText.split("\n");
            const headers = lines[0]
              .split(",")
              .map((h) => h.replace(/"/g, "").trim());

            const newItems: InventoryItem[] = [];

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                const values = line
                  .split(",")
                  .map((v) => v.replace(/"/g, "").trim());

                if (values.length >= 6) {
                  // Minimum required fields
                  const newItem: InventoryItem = {
                    id:
                      Date.now().toString() +
                      Math.random().toString(36).substr(2, 9),
                    productName: values[0] || "",
                    category: values[1] || "",
                    type: values[2] || "",
                    location: values[3] || "",
                    currentStock: parseFloat(values[4]) || 0,
                    unit: values[5] || "kg",
                    pricePerUnit: parseFloat(values[6]) || 0,
                    gstInclusive: values[7]?.toLowerCase() === "true" || false,
                    minimumStock: parseFloat(values[8]) || 0,
                    supplier: values[9] || "",
                    expiryDate: values[10] || "",
                    lastUpdated: new Date().toISOString().split("T")[0],
                    notes: values[12] || "",
                  };

                  if (
                    newItem.productName &&
                    newItem.category &&
                    newItem.location
                  ) {
                    newItems.push(newItem);
                  }
                }
              }
            }

            if (newItems.length > 0) {
              setInventory((prev) => [...prev, ...newItems]);
              alert(`Successfully imported ${newItems.length} items!`);
            } else {
              alert(
                "No valid items found in the CSV file. Please check the format."
              );
            }
          } catch (error) {
            console.error("Error parsing CSV:", error);
            alert("Error reading CSV file. Please check the file format.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                Inventory Management
              </h1>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleImportCSV}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate("/")}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Mobile + Desktop Navigation */}
            <Navigation showCreateButton={false} />
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="md:hidden bg-card border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportCSV}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700 w-full"
            onClick={() => navigate("/")}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">Loading inventory...</div>
        ) : (
        <>
        {/* GST Display Toggle */}
        <div className="mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-foreground">
                    GST Calculation
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          New Zealand GST is 15%. Toggle to show prices
                          including or excluding GST.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm ${
                      !showGSTInclusive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    GST Exclusive
                  </span>
                  <Switch
                    checked={showGSTInclusive}
                    onCheckedChange={setShowGSTInclusive}
                  />
                  <span
                    className={`text-sm ${
                      showGSTInclusive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    GST Inclusive
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value {showGSTInclusive ? "(incl. GST)" : "(excl. GST)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNZCurrency(displayTotal)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {showGSTInclusive
                  ? `Excl: ${formatNZCurrency(gstTotals.totalExclusive)}`
                  : `Incl: ${formatNZCurrency(gstTotals.totalInclusive)}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                GST Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNZCurrency(gstTotals.totalGST)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">15% GST</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {lowStockItems.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock Alerts</TabsTrigger>
            <TabsTrigger value="locations">Storage Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Stock Take</CardTitle>
                <CardDescription>
                  Manage your kitchen inventory with real-time stock levels and
                  pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products, categories, or suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select
                    value={filterLocation}
                    onValueChange={setFilterLocation}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {Array.from(
                        new Set(inventory.map((item) => item.location))
                      ).map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog
                    open={showAddDialog}
                    onOpenChange={(open) => {
                      setShowAddDialog(open);
                      if (!open) {
                        setEditingItem(null);
                        setNewItem({ productName: "", category: "General", type: "", location: "Storage", currentStock: 0, unit: "kg", pricePerUnit: 0, gstInclusive: false, minimumStock: 0, supplier: "", expiryDate: "", notes: "" });
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
                        <DialogDescription>
                          {editingItem ? "Update details for this inventory item" : "Enter the details for the new inventory item"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="productName">Product Name</Label>
                          <Input
                            id="productName"
                            value={newItem.productName || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                productName: e.target.value,
                              })
                            }
                            placeholder="e.g., Organic Salmon Fillets"
                          />
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={newItem.category || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                category: e.target.value,
                              })
                            }
                            placeholder="e.g., Fish & Seafood"
                          />
                        </div>

                        <div>
                          <Label htmlFor="type">Product Type</Label>
                          <Input
                            id="type"
                            value={newItem.type || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, type: e.target.value })
                            }
                            placeholder="e.g., Fresh Seafood, Baking Ingredients, Frozen Produce"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Storage Location</Label>
                            <Input
                              id="location"
                              value={newItem.location || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  location: e.target.value,
                                })
                              }
                              placeholder="e.g., Main Fridge, Chest Freezer, Downstairs"
                            />
                          </div>

                          <div>
                            <Label htmlFor="unit">Unit</Label>
                            <Select
                              value={newItem.unit}
                              onValueChange={(value) =>
                                setNewItem({ ...newItem, unit: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">
                                  Kilograms (kg)
                                </SelectItem>
                                <SelectItem value="g">Grams (g)</SelectItem>
                                <SelectItem value="l">Liters (l)</SelectItem>
                                <SelectItem value="ml">
                                  Milliliters (ml)
                                </SelectItem>
                                <SelectItem value="oz">Ounces (oz)</SelectItem>
                                <SelectItem value="lb">Pounds (lb)</SelectItem>
                                <SelectItem value="pieces">Pieces</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currentStock">Current Stock</Label>
                            <Input
                              id="currentStock"
                              type="number"
                              step="0.1"
                              value={newItem.currentStock || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  currentStock: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="minimumStock">Minimum Stock</Label>
                            <Input
                              id="minimumStock"
                              type="number"
                              step="0.1"
                              value={newItem.minimumStock || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  minimumStock: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="pricePerUnit">
                            Price per Unit (NZD)
                          </Label>
                          <Input
                            id="pricePerUnit"
                            type="number"
                            step="0.01"
                            value={newItem.pricePerUnit || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                pricePerUnit: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                          <div className="flex items-center space-x-2 mt-2">
                            <Switch
                              checked={newItem.gstInclusive || false}
                              onCheckedChange={(checked) =>
                                setNewItem({
                                  ...newItem,
                                  gstInclusive: checked,
                                })
                              }
                            />
                            <Label className="text-sm text-muted-foreground">
                              Price includes GST (15%)
                            </Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="supplier">Supplier</Label>
                          <Input
                            id="supplier"
                            value={newItem.supplier || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                supplier: e.target.value,
                              })
                            }
                            placeholder="e.g., Ocean Fresh Seafood"
                          />
                        </div>

                        <div>
                          <Label htmlFor="expiryDate">
                            Expiry Date (Optional)
                          </Label>
                          <Input
                            id="expiryDate"
                            type="date"
                            value={newItem.expiryDate || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                expiryDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={newItem.notes || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, notes: e.target.value })
                            }
                            placeholder="Additional notes about this item..."
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button type="button" onClick={handleSaveItem} className="flex-1" disabled={addSubmitting}>
                            {addSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Add Item")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddDialog(false);
                              setEditingItem(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Inventory Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>
                          Price/Unit{" "}
                          {showGSTInclusive ? "(incl. GST)" : "(excl. GST)"}
                        </TableHead>
                        <TableHead>
                          Total Value{" "}
                          {showGSTInclusive ? "(incl. GST)" : "(excl. GST)"}
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => {
                        const stockStatus = getStockStatus(item);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{item.productName}</div>
                                {item.expiryDate && (
                                  <div className="text-xs text-muted-foreground">
                                    Expires: {item.expiryDate}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              {item.type ? (
                                <Badge variant="secondary" className="text-xs">
                                  {item.type}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 px-2 py-1 rounded-md border bg-muted text-muted-foreground border-border">
                                <Package className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {item.location}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.currentStock}
                                onChange={(e) =>
                                  handleUpdateStock(
                                    item.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 h-8"
                              />
                              <span className="text-xs text-muted-foreground ml-1">
                                {item.unit}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {item.minimumStock} {item.unit}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span>
                                    {formatNZCurrency(
                                      showGSTInclusive
                                        ? item.gstInclusive
                                          ? item.pricePerUnit
                                          : addGST(item.pricePerUnit)
                                        : item.gstInclusive
                                        ? removeGST(item.pricePerUnit)
                                        : item.pricePerUnit
                                    )}
                                  </span>
                                </div>
                                {item.gstInclusive !== showGSTInclusive && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.gstInclusive
                                      ? "GST incl."
                                      : "GST excl."}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col font-medium">
                                <div className="flex items-center">
                                  <span>
                                    {formatNZCurrency(
                                      (() => {
                                        const itemTotal =
                                          item.currentStock * item.pricePerUnit;
                                        return showGSTInclusive
                                          ? item.gstInclusive
                                            ? itemTotal
                                            : addGST(itemTotal)
                                          : item.gstInclusive
                                          ? removeGST(itemTotal)
                                          : itemTotal;
                                      })()
                                    )}
                                  </span>
                                </div>
                                {item.gstInclusive !== showGSTInclusive && (
                                  <div className="text-xs text-muted-foreground">
                                    {showGSTInclusive
                                      ? "incl. GST"
                                      : "excl. GST"}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`flex items-center space-x-1 ${stockStatus.color}`}
                              >
                                {stockStatus.icon}
                                <span className="text-xs font-medium capitalize">
                                  {stockStatus.status}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{item.supplier}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {item.lastUpdated}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => handleStartEdit(item)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Low Stock Alerts</span>
                </CardTitle>
                <CardDescription>
                  Items that need to be restocked soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      All Good!
                    </h3>
                    <p className="text-muted-foreground">
                      No items are currently low on stock.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {item.productName}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              Current: {item.currentStock} {item.unit}
                            </span>
                            <span>
                              Minimum: {item.minimumStock} {item.unit}
                            </span>
                            <span>Supplier: {item.supplier}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">Low Stock</Badge>
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from(new Set(inventory.map((item) => item.location))).map(
                (location) => {
                  const itemsInLocation = inventory.filter(
                    (item) => item.location === location
                  );
                  const locationGSTTotals =
                    calculateTotalWithGST(itemsInLocation);
                  const locationValue = showGSTInclusive
                    ? locationGSTTotals.totalInclusive
                    : locationGSTTotals.totalExclusive;

                  return (
                    <Card
                      key={location}
                      className="border-2 border-border hover:border-border"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{location}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Items:
                            </span>
                            <span className="font-medium">
                              {itemsInLocation.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total Value{" "}
                              {showGSTInclusive ? "(incl. GST)" : "(excl. GST)"}
                              :
                            </span>
                            <span className="font-medium">
                              {formatNZCurrency(locationValue)}
                            </span>
                          </div>
                          {locationGSTTotals.totalGST > 0 && (
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">
                                GST:
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatNZCurrency(locationGSTTotals.totalGST)}
                              </span>
                            </div>
                          )}
                          <div className="mt-3 space-y-1">
                            {itemsInLocation.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="text-xs text-muted-foreground truncate"
                              >
                                {item.productName}
                              </div>
                            ))}
                            {itemsInLocation.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{itemsInLocation.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
