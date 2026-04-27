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
  Archive,
  Pencil,
  Trash2,
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

type WorkflowStatus = "in_preparation" | "done" | "archived";

interface OverrideIngredientOption {
  ingredientId: string;
  ingredientName: string;
  defaultUnit: string;
  recipeName: string;
}

interface PrepListSummary {
  id: string;
  eventName: string;
  guestCount: number;
  generatedAt: string;
  prepStatus: WorkflowStatus;
  purchaseStatus: WorkflowStatus;
}

export default function PrepListGenerator({ onSave }: PrepListGeneratorProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState<number>(
    parseInt(import.meta.env.VITE_DEFAULT_GUEST_COUNT || "50", 10) || 50
  );
  const [portionsPerPerson, setPortionsPerPerson] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [prepList, setPrepList] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("setup");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [manualTask, setManualTask] = useState({
    id: "",
    task: "",
    ingredient: "",
    quantity: 0,
    unit: "g",
    category: "other",
  });
  const [overrideOptions, setOverrideOptions] = useState<OverrideIngredientOption[]>([]);
  const [userOverrides, setUserOverrides] = useState<
    Record<string, { quantity: number; unit: string }>
  >({});
  const [savedLists, setSavedLists] = useState<PrepListSummary[]>([]);
  const [selectedSavedListId, setSelectedSavedListId] = useState<string>("");
  const [loadingSavedLists, setLoadingSavedLists] = useState(false);
  const [purchaseItemForm, setPurchaseItemForm] = useState({
    id: "",
    ingredient: "",
    needed: 0,
    unit: "kg",
    currentStock: 0,
    shortfall: 0,
    category: "other",
  });

  // Fetch events and menus
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, menusResponse] = await Promise.all([
          fetch("/api/events", { credentials: "include" }),
          fetch("/api/menus", { credentials: "include" }),
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
          setMenus(menusData.menus || menusData || []);
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

  const loadSavedLists = async () => {
    setLoadingSavedLists(true);
    try {
      const response = await fetch("/api/prep-lists?limit=100", {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to fetch saved prep lists");
      setSavedLists(Array.isArray(data.lists) ? data.lists : []);
    } catch (error) {
      console.error("Failed to load saved prep lists:", error);
    } finally {
      setLoadingSavedLists(false);
    }
  };

  useEffect(() => {
    loadSavedLists();
  }, []);

  useEffect(() => {
    const fetchOverrideOptions = async () => {
      if (!selectedMenus.length) {
        setOverrideOptions([]);
        setUserOverrides({});
        return;
      }
      try {
        const responses = await Promise.all(
          selectedMenus.map((menuId) =>
            fetch(`/api/menus/${menuId}`, { credentials: "include" })
          )
        );
        const details = await Promise.all(
          responses.map(async (response) =>
            response.ok ? response.json() : null
          )
        );
        const optionMap = new Map<string, OverrideIngredientOption>();
        for (const menu of details) {
          if (!menu?.recipes?.length) continue;
          for (const menuRecipe of menu.recipes) {
            const recipeName = menuRecipe?.recipe?.name || "Recipe";
            const ingredients = menuRecipe?.recipe?.ingredients || [];
            for (const recipeIngredient of ingredients) {
              const ingredient = recipeIngredient?.ingredient;
              if (!ingredient?.id || !ingredient?.name) continue;
              if (optionMap.has(ingredient.id)) continue;
              optionMap.set(ingredient.id, {
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                defaultUnit: recipeIngredient.unit || ingredient.defaultUnit || "g",
                recipeName,
              });
            }
          }
        }
        setOverrideOptions(Array.from(optionMap.values()));
      } catch (error) {
        console.error("Failed to fetch override ingredients:", error);
        setOverrideOptions([]);
      }
    };
    fetchOverrideOptions();
  }, [selectedMenus]);

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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          menuIds: selectedMenus,
          guestCount: guestCount,
          portionsPerPerson: portionsPerPerson,
          userOverrides,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = {
          ...data,
          prepTasks: Array.isArray(data.prepTasks) ? data.prepTasks : [],
          purchaseList: Array.isArray(data.purchaseList) ? data.purchaseList : [],
        };
        setPrepList(normalized);
        setSelectedSavedListId(data.id || "");
        await loadSavedLists();
        const prepCount = normalized.prepTasks.length;
        const purchaseCount = normalized.purchaseList.length;
        // Shopping list is on its own tab; open it when there is something to buy, else stay on prep and explain.
        if (purchaseCount > 0) {
          setActiveTab("purchase-list");
        } else {
          setActiveTab("prep-list");
        }
        toast({
          title: "Prep list and shopping list ready",
          description:
            purchaseCount > 0
              ? `${data.eventName}: ${prepCount} prep tasks. ${purchaseCount} item(s) to buy—opened the Shopping list tab.`
              : `${data.eventName}: ${prepCount} prep tasks. Inventory already covers what you need (0 items to buy). Open the Shopping list tab to confirm.`,
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate prep list");
      }
    } catch (error: any) {
      console.error("Error generating prep list:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate prep list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateListStatus = async (
    kind: "prep" | "purchase",
    status: WorkflowStatus
  ) => {
    if (!prepList?.id) return;
    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/prep-lists/${prepList.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update status");
      }
      setPrepList((prev: any) => ({ ...data, menus: data.menus || prev?.menus || [] }));
      await loadSavedLists();
      toast({
        title: "Status updated",
        description:
          kind === "prep" && status === "done"
            ? "Prep list marked done and inventory has been updated."
            : "List status updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Status update failed",
        description: error?.message || "Could not update status.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const addManualTask = async () => {
    if (!prepList?.id) return;
    if (!manualTask.task.trim() || !manualTask.ingredient.trim() || !manualTask.unit.trim()) {
      toast({
        title: "Missing fields",
        description: "Task, ingredient and unit are required.",
        variant: "destructive",
      });
      return;
    }
    const qty = Number(manualTask.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than zero.",
        variant: "destructive",
      });
      return;
    }
    try {
      const isEditing = Boolean(manualTask.id);
      const response = await fetch(
        isEditing
          ? `/api/prep-lists/${prepList.id}/manual-tasks/${manualTask.id}`
          : `/api/prep-lists/${prepList.id}/manual-tasks`,
        {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: manualTask.task,
          ingredient: manualTask.ingredient,
          quantity: qty,
          unit: manualTask.unit,
          category: manualTask.category,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || (isEditing ? "Failed to update task" : "Failed to add task"));
      }
      setPrepList((prev: any) => ({ ...data, menus: data.menus || prev?.menus || [] }));
      await loadSavedLists();
      setManualTask({
        id: "",
        task: "",
        ingredient: "",
        quantity: 0,
        unit: "g",
        category: "other",
      });
      toast({
        title: isEditing ? "Task updated" : "Task added",
        description: isEditing ? "Manual chef task updated." : "Manual chef task added to prep list.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to add task",
        description: error?.message || "Could not add manual task.",
        variant: "destructive",
      });
    }
  };

  const startEditManualTask = (task: any) => {
    setManualTask({
      id: task.id || "",
      task: task.task || "",
      ingredient: task.ingredient || "",
      quantity: Number(task.quantity) || 0,
      unit: task.unit || "g",
      category: task.category || "other",
    });
  };

  const deleteManualTask = async (taskId: string) => {
    if (!prepList?.id || !taskId) return;
    try {
      const response = await fetch(
        `/api/prep-lists/${prepList.id}/manual-tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to delete task");
      setPrepList((prev: any) => ({ ...data, menus: data.menus || prev?.menus || [] }));
      await loadSavedLists();
      if (manualTask.id === taskId) {
        setManualTask({
          id: "",
          task: "",
          ingredient: "",
          quantity: 0,
          unit: "g",
          category: "other",
        });
      }
      toast({ title: "Task deleted", description: "Manual task removed from prep list." });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete task.",
        variant: "destructive",
      });
    }
  };

  const loadSavedPrepList = async () => {
    if (!selectedSavedListId) return;
    try {
      const response = await fetch(`/api/prep-lists/${selectedSavedListId}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to load prep list");
      const normalized = {
        ...data,
        prepTasks: Array.isArray(data.prepTasks) ? data.prepTasks : [],
        purchaseList: Array.isArray(data.purchaseList) ? data.purchaseList : [],
      };
      setPrepList(normalized);
      setActiveTab(
        normalized.purchaseList.length > 0 ? "purchase-list" : "prep-list"
      );
      toast({
        title: "Prep list loaded",
        description: `Loaded ${data.eventName}. ${
          normalized.purchaseList.length
            ? "Opened Shopping list (items to buy)."
            : "No items to buy; inventory may cover the event."
        }`,
      });
    } catch (error: any) {
      toast({
        title: "Load failed",
        description: error?.message || "Could not load prep list.",
        variant: "destructive",
      });
    }
  };

  const deleteSavedPrepList = async () => {
    if (!selectedSavedListId) return;
    const toDelete = savedLists.find((list) => list.id === selectedSavedListId);
    const confirmed = window.confirm(
      `Delete prep list${toDelete?.eventName ? ` for ${toDelete.eventName}` : ""}? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/prep-lists/${selectedSavedListId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete prep list");
      }
      if (prepList?.id === selectedSavedListId) setPrepList(null);
      setSelectedSavedListId("");
      await loadSavedLists();
      toast({ title: "Deleted", description: "Prep list removed from UI and database." });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete prep list.",
        variant: "destructive",
      });
    }
  };

  const savePurchaseItem = async () => {
    if (!prepList?.id) return;
    const ingredient = purchaseItemForm.ingredient.trim();
    const unit = purchaseItemForm.unit.trim();
    if (!ingredient || !unit) {
      toast({
        title: "Missing fields",
        description: "Ingredient and unit are required.",
        variant: "destructive",
      });
      return;
    }
    const needed = Number(purchaseItemForm.needed) || 0;
    const currentStock = Number(purchaseItemForm.currentStock) || 0;
    const shortfall =
      Number(purchaseItemForm.shortfall) > 0
        ? Number(purchaseItemForm.shortfall)
        : Math.max(0, needed - currentStock);
    const isEditing = Boolean(purchaseItemForm.id);
    try {
      const response = await fetch(
        isEditing
          ? `/api/prep-lists/${prepList.id}/purchase-items/${purchaseItemForm.id}`
          : `/api/prep-lists/${prepList.id}/purchase-items`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredient,
            needed,
            unit,
            currentStock,
            shortfall,
            category: purchaseItemForm.category,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to save purchase item");
      setPrepList((prev: any) => ({ ...data, menus: data.menus || prev?.menus || [] }));
      await loadSavedLists();
      setPurchaseItemForm({
        id: "",
        ingredient: "",
        needed: 0,
        unit: "kg",
        currentStock: 0,
        shortfall: 0,
        category: "other",
      });
      toast({
        title: isEditing ? "Purchase item updated" : "Purchase item added",
        description: "Changes saved.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Could not save purchase item.",
        variant: "destructive",
      });
    }
  };

  const startEditPurchaseItem = (item: any) => {
    setPurchaseItemForm({
      id: item.id || "",
      ingredient: item.ingredient || "",
      needed: Number(item.needed) || 0,
      unit: item.unit || "kg",
      currentStock: Number(item.currentStock) || 0,
      shortfall: Number(item.shortfall) || 0,
      category: item.category || "other",
    });
  };

  const deletePurchaseItem = async (itemId: string) => {
    if (!prepList?.id || !itemId) return;
    try {
      const response = await fetch(
        `/api/prep-lists/${prepList.id}/purchase-items/${itemId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to delete purchase item");
      setPrepList((prev: any) => ({ ...data, menus: data.menus || prev?.menus || [] }));
      await loadSavedLists();
      toast({ title: "Deleted", description: "Purchase item deleted." });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete purchase item.",
        variant: "destructive",
      });
    }
  };

  const exportPrepList = () => {
    if (!prepList) return;
    const toBuy = prepList.purchaseList ?? [];

    const content = `# Prep List - ${prepList.eventName}
Generated: ${new Date(prepList.generatedAt).toLocaleString()}
Guest Count: ${prepList.guestCount}
Menus: ${(prepList.menus || []).map((m: any) => m.name).join(", ")}

## Prep Tasks
${prepList.prepTasks
  .map((task: any) =>
    task.quantity != null && task.quantity > 0 && task.unit
      ? `• ${task.task} (${task.quantity} ${task.unit})`
      : `• ${task.task}`
  )
  .join("\n")}

## Shopping list (vs inventory)
${toBuy
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
    const items = prepList.purchaseList ?? [];

    const totalCost = items.reduce(
      (total: number, item: any) => {
        const costPerUnit = 2.5; // Mock cost per unit
        return total + item.shortfall * costPerUnit;
      },
      0
    );

    const content = `# Shopping List - ${prepList.eventName}
Generated: ${new Date(prepList.generatedAt).toLocaleString()}
Guest Count: ${prepList.guestCount}
Total Items: ${items.length}
Estimated Total Cost: $${totalCost.toFixed(2)}

## Items to Purchase
${items
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
            <p><strong>Menus:</strong> ${(prepList.menus || [])
              .map((m: any) => m.name)
              .join(", ")}</p>
            <p><strong>Total Tasks:</strong> ${prepList.prepTasks.length}</p>
          </div>

          ${Object.entries(groupedTasks)
            .map(
              ([category, tasks]: [string, any]) => `
            <div class="category">
              <h3>${
                category === "Dishes"
                  ? "🍽️"
                  : category === "vegetable"
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
                  <div class="task-details">${task.quantity != null && task.quantity > 0 && task.unit ? `Quantity: ${task.quantity} ${task.unit} | ` : ""}Difficulty: Medium</div>
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
    const items = prepList.purchaseList ?? [];

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCost = items.reduce(
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
            <p><strong>Menus:</strong> ${(prepList.menus || [])
              .map((m: any) => m.name)
              .join(", ")}</p>
            <p><strong>Total Items:</strong> ${items.length}</p>
          </div>

          <div class="total-cost">
            <h2>Total Estimated Cost: $${totalCost.toFixed(2)}</h2>
          </div>

          ${items
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
    if (!prepList) return;
    if (onSave) {
      onSave(prepList);
      toast({
        title: "Prep List Saved",
        description: "Prep list has been saved successfully.",
      });
    } else {
      exportPrepList();
      toast({
        title: "Prep List Exported",
        description: "Use Export or Print to save a copy.",
      });
    }
  };

  const setOverrideQuantity = (ingredientId: string, value: number) => {
    setUserOverrides((prev) => {
      const existing = prev[ingredientId];
      const nextValue = Number.isFinite(value) ? value : 0;
      if (nextValue <= 0) {
        const { [ingredientId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [ingredientId]: {
          quantity: nextValue,
          unit: existing?.unit || "g",
        },
      };
    });
  };

  const setOverrideUnit = (ingredientId: string, unit: string, fallbackQty: number) => {
    setUserOverrides((prev) => {
      const existing = prev[ingredientId];
      const quantity = existing?.quantity || fallbackQty || 0;
      if (quantity <= 0) return prev;
      return {
        ...prev,
        [ingredientId]: {
          quantity,
          unit: unit || existing?.unit || "g",
        },
      };
    });
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
            Prep tasks scale from your menus, then the shopping list uses{" "}
            <strong>Inventory</strong> stock to show what you still need to
            buy. After generating, the <strong>Shopping list</strong> tab opens
            when there are items to purchase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                {prepList?.prepTasks?.length != null && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {prepList.prepTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="purchase-list"
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                Shopping list
                {prepList?.purchaseList != null && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {(prepList.purchaseList ?? []).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved Prep Lists</CardTitle>
                  <CardDescription>
                    Load, update, or delete previously generated prep lists from database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={selectedSavedListId} onValueChange={setSelectedSavedListId}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingSavedLists ? "Loading..." : "Select saved prep list"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {savedLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.eventName} - {new Date(list.generatedAt).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={loadSavedPrepList}
                      disabled={!selectedSavedListId}
                    >
                      Load Selected
                    </Button>
                    <Button
                      variant="outline"
                      onClick={deleteSavedPrepList}
                      disabled={!selectedSavedListId}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Event Selection */}
              <div className="space-y-2">
                <Label htmlFor="event-select">Select Event</Label>
                <Select
                  value={selectedEvent}
                  onValueChange={(id) => {
                    setSelectedEvent(id);
                    const ev = events.find((e) => e.id === id);
                    if (ev?.guestCount) setGuestCount(ev.guestCount);
                  }}
                >
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

              {/* Guest Count & Portions per person */}
              <div className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="portionsPerPerson">Portions per person</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPortionsPerPerson(Math.max(0.5, portionsPerPerson - 0.5))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="portionsPerPerson"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={portionsPerPerson}
                      onChange={(e) =>
                        setPortionsPerPerson(Math.max(0.5, parseFloat(e.target.value) || 1))
                      }
                      className="w-24 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPortionsPerPerson(portionsPerPerson + 0.5)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      per guest (e.g. 2–3 for canapés)
                    </span>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Overrides</CardTitle>
                    <CardDescription>
                      Override ingredient quantity/unit before generating the prep list. Overrides apply to matching ingredients across selected menus.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedMenus.length ? (
                      <p className="text-sm text-muted-foreground">
                        Select at least one menu in Setup to configure overrides.
                      </p>
                    ) : overrideOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No ingredient options found yet for selected menus.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {overrideOptions.map((opt) => {
                          const current = userOverrides[opt.ingredientId];
                          return (
                            <div
                              key={opt.ingredientId}
                              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg"
                            >
                              <div className="md:col-span-5">
                                <div className="font-medium">{opt.ingredientName}</div>
                                <div className="text-xs text-muted-foreground">
                                  From: {opt.recipeName}
                                </div>
                              </div>
                              <div className="md:col-span-3">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={current?.quantity ?? ""}
                                  placeholder="Override qty"
                                  onChange={(e) =>
                                    setOverrideQuantity(
                                      opt.ingredientId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Input
                                  value={current?.unit ?? opt.defaultUnit}
                                  onChange={(e) =>
                                    setOverrideUnit(
                                      opt.ingredientId,
                                      e.target.value,
                                      current?.quantity ?? 0
                                    )
                                  }
                                />
                              </div>
                              <div className="md:col-span-2 flex items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUserOverrides((prev) => {
                                      const { [opt.ingredientId]: _removed, ...rest } = prev;
                                      return rest;
                                    })
                                  }
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                      <div className="flex items-center space-x-2">
                        <Select
                          value={prepList.prepStatus || "in_preparation"}
                          onValueChange={(value) =>
                            updateListStatus("prep", value as WorkflowStatus)
                          }
                          disabled={statusUpdating}
                        >
                          <SelectTrigger className="w-[190px]">
                            <SelectValue placeholder="Prep status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_preparation">In preparation</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
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

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {manualTask.id ? "Edit Manual Chef Task" : "Add Manual Chef Task"}
                        </CardTitle>
                        <CardDescription>
                          Add extra work not tied to recipes. This is deducted from inventory when prep is marked done.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <Input
                            placeholder="Task (e.g. Chop extra herbs)"
                            value={manualTask.task}
                            onChange={(e) =>
                              setManualTask((prev) => ({ ...prev, task: e.target.value }))
                            }
                          />
                          <Input
                            placeholder="Ingredient"
                            value={manualTask.ingredient}
                            onChange={(e) =>
                              setManualTask((prev) => ({ ...prev, ingredient: e.target.value }))
                            }
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Qty"
                            value={manualTask.quantity || ""}
                            onChange={(e) =>
                              setManualTask((prev) => ({
                                ...prev,
                                quantity: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <Input
                            placeholder="Unit (g, ml, cup...)"
                            value={manualTask.unit}
                            onChange={(e) =>
                              setManualTask((prev) => ({ ...prev, unit: e.target.value }))
                            }
                          />
                          <div className="flex items-center gap-2">
                            <Button onClick={addManualTask}>
                              {manualTask.id ? "Save Task" : "Add Task"}
                            </Button>
                            {manualTask.id && (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setManualTask({
                                    id: "",
                                    task: "",
                                    ingredient: "",
                                    quantity: 0,
                                    unit: "g",
                                    category: "other",
                                  })
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

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
                            {category === "Dishes" && "🍽️"}
                            {category === "vegetable" && "🥕"}
                            {category === "meat" && "🥩"}
                            {category === "condiment" && "🥫"}
                            {category === "carb" && "🌾"}
                            {category === "dairy" && "🥛"}
                            {(category === "other" || !["Dishes","vegetable","meat","condiment","carb","dairy"].includes(category)) && "📦"}
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
                                  {task.quantity != null && task.quantity > 0 && task.unit ? (
                                    <span className="text-sm text-gray-600">
                                      ({task.quantity} {task.unit})
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.isManual && (
                                    <Badge variant="outline" className="text-xs">
                                      Manual
                                    </Badge>
                                  )}
                                  {task.isManual && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEditManualTask(task)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteManualTask(task.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    Medium
                                  </Badge>
                                </div>
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

            {/* Shopping list (from prep + inventory shortfall) */}
            <TabsContent value="purchase-list" className="space-y-6 mt-6">
              <div
                className="min-h-screen p-6 -m-6"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                {prepList ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Shopping list</h3>
                        <p className="text-sm text-gray-600">
                          From prep requirements vs inventory:{" "}
                          {(prepList.purchaseList ?? []).length} item(s) to buy
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            $
                            {(prepList.purchaseList ?? [])
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
                        <div className="flex items-center space-x-2">
                          <Select
                            value={prepList.purchaseStatus || "in_preparation"}
                            onValueChange={(value) =>
                              updateListStatus("purchase", value as WorkflowStatus)
                            }
                            disabled={statusUpdating}
                          >
                            <SelectTrigger className="w-[190px]">
                              <SelectValue placeholder="Purchase status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_preparation">In preparation</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Button
                            onClick={() => updateListStatus("purchase", "archived")}
                            variant="outline"
                            size="sm"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {purchaseItemForm.id ? "Edit Purchase Item" : "Add Purchase Item"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                            <Input
                              placeholder="Ingredient"
                              value={purchaseItemForm.ingredient}
                              onChange={(e) =>
                                setPurchaseItemForm((prev) => ({ ...prev, ingredient: e.target.value }))
                              }
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Needed"
                              value={purchaseItemForm.needed || ""}
                              onChange={(e) =>
                                setPurchaseItemForm((prev) => ({
                                  ...prev,
                                  needed: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                            <Input
                              placeholder="Unit"
                              value={purchaseItemForm.unit}
                              onChange={(e) =>
                                setPurchaseItemForm((prev) => ({ ...prev, unit: e.target.value }))
                              }
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Current stock"
                              value={purchaseItemForm.currentStock || ""}
                              onChange={(e) =>
                                setPurchaseItemForm((prev) => ({
                                  ...prev,
                                  currentStock: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Shortfall"
                              value={purchaseItemForm.shortfall || ""}
                              onChange={(e) =>
                                setPurchaseItemForm((prev) => ({
                                  ...prev,
                                  shortfall: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <Button onClick={savePurchaseItem}>
                                {purchaseItemForm.id ? "Save" : "Add"}
                              </Button>
                              {purchaseItemForm.id && (
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setPurchaseItemForm({
                                      id: "",
                                      ingredient: "",
                                      needed: 0,
                                      unit: "kg",
                                      currentStock: 0,
                                      shortfall: 0,
                                      category: "other",
                                    })
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {(prepList.purchaseList ?? []).length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <p className="font-medium text-foreground">
                              Nothing to buy for this list
                            </p>
                            <p className="text-sm mt-2 max-w-md mx-auto">
                              Quantities are compared to your{" "}
                              <strong>Inventory</strong> by ingredient name. If
                              your stock covers everything (or names don’t match
                              the recipe), the shopping list is empty. Add
                              missing rows in Inventory or add lines below.
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {(prepList.purchaseList ?? []).map((item: any, index: number) => (
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
                                <div className="flex items-center justify-end gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditPurchaseItem(item)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deletePurchaseItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
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
                      No shopping list yet
                    </h3>
                    <p className="text-gray-600">
                      Go to the Setup tab, pick an event and menus, then
                      generate. The shopping list is built from prep needs vs
                      inventory.
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
