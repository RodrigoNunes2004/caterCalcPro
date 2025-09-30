import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Users,
  Search,
  Calculator,
  Download,
  Save,
  Plus,
  Minus,
  CheckCircle,
  Settings,
  Edit3,
  List,
  ShoppingCart,
  Printer,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  name: string;
  eventDate: string;
  guestCount: number;
  venue: string;
  eventType: string;
}

interface Menu {
  id: string;
  name: string;
  description: string;
  category: string;
  recipes: any[];
  totalRecipes?: number;
}

interface PrepListGeneratorProps {
  onSave?: (prepList: any) => void;
}

export default function PrepListGenerator({ onSave }: PrepListGeneratorProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState<number>(50);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [prepList, setPrepList] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch events and menus
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, menusResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/menus"),
        ]);

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.events || []);
        } else {
          console.error("Failed to fetch events:", eventsResponse.status);
          setEvents([]);
        }

        if (menusResponse.ok) {
          const menusData = await menusResponse.json();
          setMenus(menusData || []);
        } else {
          console.error("Failed to fetch menus:", menusResponse.status);
          setMenus([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Filter menus based on search term
  const filteredMenus = Array.isArray(menus)
    ? menus.filter(
        (menu) =>
          menu?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menu?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menu?.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleMenuToggle = (menuId: string | undefined) => {
    if (!menuId) return;
    setSelectedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const generatePrepList = async () => {
    if (!selectedEvent || selectedMenus.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select an event and at least one menu.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/prep-lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          menuIds: selectedMenus,
          guestCount: guestCount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrepList(data);
        setShowResults(true);
        toast({
          title: "Prep List Generated",
          description: `Generated prep list for ${data.eventName}`,
        });
      } else {
        throw new Error("Failed to generate prep list");
      }
    } catch (error) {
      console.error("Error generating prep list:", error);
      toast({
        title: "Error",
        description: "Failed to generate prep list. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPrepList = () => {
    if (!prepList) return;

    const content = `# Prep List - ${prepList.eventName}
Generated: ${new Date(prepList.generatedAt).toLocaleString()}
Guest Count: ${prepList.guestCount}
Menus: ${prepList.menus.map((m: any) => m.name).join(", ")}

## Prep Tasks
${prepList.prepTasks
  .map((task: any) => `• ${task.task} (${task.quantity} ${task.unit})`)
  .join("\n")}

## Purchase List
${prepList.purchaseList
  .map((item: any) => `• ${item.ingredient} (${item.shortfall} ${item.unit})`)
  .join("\n")}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-list-${prepList.eventName}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPurchaseList = () => {
    if (!prepList) return;

    const totalCost = prepList.purchaseList.reduce(
      (total: number, item: any) => {
        const costPerUnit = 2.5; // Mock cost per unit
        return total + item.shortfall * costPerUnit;
      },
      0
    );

    const content = `# Shopping List - ${prepList.eventName}
Generated: ${new Date(prepList.generatedAt).toLocaleString()}
Guest Count: ${prepList.guestCount}
Total Items: ${prepList.purchaseList.length}
Estimated Total Cost: $${totalCost.toFixed(2)}

## Items to Purchase
${prepList.purchaseList
  .map((item: any) => {
    const itemCost = item.shortfall * 2.5;
    return `• ${item.ingredient}
  Need: ${item.needed} ${item.unit}
  Available: ${item.currentStock} ${item.unit}
  To buy: ${item.shortfall} ${item.unit}
  Cost: $${itemCost.toFixed(2)}
  Status: ${item.currentStock > 0 ? "Partial stock" : "Not in stock"}`;
  })
  .join("\n\n")}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-${prepList.eventName}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPrepList = () => {
    if (!prepList) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const groupedTasks = prepList.prepTasks.reduce((acc: any, task: any) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {});

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prep List - ${prepList.eventName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #ea580c; margin-bottom: 10px; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .category { margin-bottom: 25px; }
            .category h3 { color: #374151; border-bottom: 2px solid #ea580c; padding-bottom: 5px; }
            .task { margin: 10px 0; padding: 8px; background: #f9fafb; border-left: 4px solid #ea580c; }
            .task-details { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .summary { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍳 Chef Prep List</h1>
            <h2>${prepList.eventName}</h2>
          </div>
          
          <div class="info">
            <p><strong>Generated:</strong> ${new Date(
              prepList.generatedAt
            ).toLocaleString()}</p>
            <p><strong>Guest Count:</strong> ${prepList.guestCount}</p>
            <p><strong>Menus:</strong> ${prepList.menus
              .map((m: any) => m.name)
              .join(", ")}</p>
            <p><strong>Total Tasks:</strong> ${prepList.prepTasks.length}</p>
          </div>

          ${Object.entries(groupedTasks)
            .map(
              ([category, tasks]: [string, any]) => `
            <div class="category">
              <h3>${
                category === "vegetable"
                  ? "🥕"
                  : category === "meat"
                  ? "🥩"
                  : category === "condiment"
                  ? "🥫"
                  : category === "carb"
                  ? "🌾"
                  : "📦"
              } ${category.charAt(0).toUpperCase() + category.slice(1)} (${
                tasks.length
              } tasks)</h3>
              ${tasks
                .map(
                  (task: any) => `
                <div class="task">
                  <strong>${task.task}</strong>
                  <div class="task-details">Quantity: ${task.quantity} ${task.unit} | Difficulty: Medium</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}

          <div class="summary">
            <h3>📋 Summary</h3>
            <p><strong>Total Ingredients:</strong> ${
              prepList.summary.totalIngredients
            }</p>
            <p><strong>Total Prep Tasks:</strong> ${
              prepList.summary.totalPrepTasks
            }</p>
            <p><strong>Estimated Prep Time:</strong> ${
              prepList.summary.estimatedPrepTime
            } minutes</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const printPurchaseList = () => {
    if (!prepList) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCost = prepList.purchaseList.reduce(
      (total: number, item: any) => {
        const costPerUnit = 2.5; // Mock cost per unit
        return total + item.shortfall * costPerUnit;
      },
      0
    );

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopping List - ${prepList.eventName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #ea580c; margin-bottom: 10px; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .total-cost { background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .total-cost h2 { color: #ea580c; margin: 0; }
            .item { margin: 15px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .item-name { font-size: 18px; font-weight: bold; color: #374151; }
            .item-cost { font-size: 18px; font-weight: bold; color: #ea580c; }
            .item-details { color: #6b7280; margin-bottom: 8px; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status.partial { background: #fef3c7; color: #92400e; }
            .status.none { background: #fee2e2; color: #991b1b; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Shopping List</h1>
            <h2>${prepList.eventName}</h2>
          </div>
          
          <div class="info">
            <p><strong>Generated:</strong> ${new Date(
              prepList.generatedAt
            ).toLocaleString()}</p>
            <p><strong>Guest Count:</strong> ${prepList.guestCount}</p>
            <p><strong>Menus:</strong> ${prepList.menus
              .map((m: any) => m.name)
              .join(", ")}</p>
            <p><strong>Total Items:</strong> ${prepList.purchaseList.length}</p>
          </div>

          <div class="total-cost">
            <h2>Total Estimated Cost: $${totalCost.toFixed(2)}</h2>
          </div>

          ${prepList.purchaseList
            .map((item: any) => {
              const itemCost = item.shortfall * 2.5;
              return `
              <div class="item">
                <div class="item-header">
                  <div class="item-name">${item.ingredient}</div>
                  <div class="item-cost">$${itemCost.toFixed(2)}</div>
                </div>
                <div class="item-details">
                  <strong>Need:</strong> ${item.needed} ${item.unit} • 
                  <strong>Available:</strong> ${item.currentStock} ${
                item.unit
              } • 
                  <strong>To buy:</strong> ${item.shortfall} ${item.unit}
                </div>
                <div>
                  <span class="status ${
                    item.currentStock > 0 ? "partial" : "none"
                  }">
                    ${item.currentStock > 0 ? "Partial stock" : "Not in stock"}
                  </span>
                </div>
              </div>
            `;
            })
            .join("")}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const savePrepList = () => {
    if (prepList && onSave) {
      onSave(prepList);
      toast({
        title: "Prep List Saved",
        description: "Prep list has been saved successfully.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Prep List Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive prep lists for your catering events with
            automatic scaling and inventory checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4 p-1 rounded-lg">
              <TabsTrigger
                value="setup"
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all"
              >
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger
                value="overrides"
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all"
              >
                <Edit3 className="h-4 w-4" />
                Custom Overrides
              </TabsTrigger>
              <TabsTrigger
                value="prep-list"
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all"
              >
                <List className="h-4 w-4" />
                Prep List
              </TabsTrigger>
              <TabsTrigger
                value="purchase-list"
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                Purchase List
              </TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6 mt-6">
              {/* Event Selection */}
              <div className="space-y-2">
                <Label htmlFor="event-select">Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} -{" "}
                        {new Date(event.eventDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Menu Selection with Search */}
              <div className="space-y-2">
                <Label>Select Menus</Label>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search menus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Menu Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {Array.isArray(filteredMenus) &&
                    filteredMenus.map((menu) => (
                      <Card
                        key={menu?.id}
                        className={`border-2 transition-colors cursor-pointer ${
                          selectedMenus.includes(menu?.id)
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                        onClick={() => handleMenuToggle(menu?.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedMenus.includes(menu?.id)}
                              onChange={() => handleMenuToggle(menu?.id)}
                            />
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {menu?.name || "Unnamed Menu"}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {menu?.description ||
                                  "No description available"}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Recipes:</span>
                              <span className="font-medium">
                                {menu?.totalRecipes || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Category:</span>
                              <Badge variant="secondary" className="text-xs">
                                {menu?.category || "Uncategorized"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <Label htmlFor="guestCount">Guest Count</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="guestCount"
                    type="number"
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(guestCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>guests</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={generatePrepList}
                  disabled={
                    !selectedEvent || selectedMenus.length === 0 || loading
                  }
                  className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Generate Prep List
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Custom Overrides Tab */}
            <TabsContent value="overrides" className="space-y-6 mt-6">
              <div
                className="min-h-screen p-6 -m-6"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                <div className="text-center py-8">
                  <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Custom Overrides
                  </h3>
                  <p className="text-gray-600">
                    Customize ingredient quantities and overrides will be
                    available here.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Prep List Tab */}
            <TabsContent value="prep-list" className="space-y-6 mt-6">
              <div
                className="min-h-screen p-6 -m-6"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                {prepList ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Chef Prep List
                        </h3>
                        <p className="text-sm text-gray-600">
                          {prepList.prepTasks.length} tasks for{" "}
                          {prepList.guestCount} guests
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={exportPrepList}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button
                          onClick={printPrepList}
                          variant="outline"
                          size="sm"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                        <Button
                          onClick={savePrepList}
                          variant="outline"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Group tasks by category */}
                    {Object.entries(
                      prepList.prepTasks.reduce((acc: any, task: any) => {
                        if (!acc[task.category]) {
                          acc[task.category] = [];
                        }
                        acc[task.category].push(task);
                        return acc;
                      }, {})
                    ).map(([category, tasks]: [string, any]) => (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 capitalize">
                            {category === "vegetable" && "🥕"}
                            {category === "meat" && "🥩"}
                            {category === "condiment" && "🥫"}
                            {category === "carb" && "🌾"}
                            {category === "other" && "📦"}
                            {category} ({tasks.length} tasks)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {tasks.map((task: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <CheckCircle className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {task.task}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ({task.quantity} {task.unit})
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Medium
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Prep List Generated
                    </h3>
                    <p className="text-gray-600">
                      Go to the Setup tab to generate a prep list for your
                      event.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Purchase List Tab */}
            <TabsContent value="purchase-list" className="space-y-6 mt-6">
              <div
                className="min-h-screen p-6 -m-6"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                {prepList ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Shopping List</h3>
                        <p className="text-sm text-gray-600">
                          {prepList.purchaseList.length} items to purchase
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            $
                            {prepList.purchaseList
                              .reduce((total: number, item: any) => {
                                const costPerUnit = 2.5; // Mock cost per unit
                                return total + item.shortfall * costPerUnit;
                              }, 0)
                              .toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Estimated cost
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={exportPurchaseList}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          <Button
                            onClick={printPurchaseList}
                            variant="outline"
                            size="sm"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {prepList.purchaseList.map((item: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {item.ingredient}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Need: {item.needed} {item.unit} • Available:{" "}
                                  {item.currentStock} {item.unit} • To buy:{" "}
                                  {item.shortfall} {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  ${(item.shortfall * 2.5).toFixed(2)}
                                </div>
                                <Badge
                                  variant={
                                    item.currentStock > 0
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {item.currentStock > 0
                                    ? "Partial stock"
                                    : "Not in stock"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Purchase List Generated
                    </h3>
                    <p className="text-gray-600">
                      Go to the Setup tab to generate a purchase list for your
                      event.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
