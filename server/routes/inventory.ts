import { Router } from "express";
import { storage } from "../storage.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/inventory - List all inventory items for the org
router.get("/inventory", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const items = await storage.getInventoryItems(orgId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// POST /api/inventory - Create inventory item
router.post("/inventory", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const {
      name,
      category,
      type,
      location,
      currentStock,
      unit,
      pricePerUnit,
      gstInclusive,
      minimumStock,
      supplier,
      expiryDate,
      notes,
    } = req.body;
    if (!name || unit === undefined) {
      return res.status(400).json({ error: "Name and unit are required" });
    }
    const stock = Number(currentStock);
    const minStock = Number(minimumStock);
    const price = Number(pricePerUnit);
    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;
    const item = await storage.createInventoryItem({
      organizationId: orgId,
      name: String(name).trim(),
      category: category ? String(category).trim() : "General",
      type: type ? String(type).trim() : "",
      location: location ? String(location).trim() : "Storage",
      currentStock: Number.isFinite(stock) ? stock : 0,
      unit: String(unit),
      pricePerUnit: Number.isFinite(price) ? price : 0,
      gstInclusive: !!gstInclusive,
      minimumStock: Number.isFinite(minStock) ? minStock : 0,
      supplier: supplier ? String(supplier).trim() : "",
      expiryDate: parsedExpiryDate && !Number.isNaN(parsedExpiryDate.getTime()) ? parsedExpiryDate : null,
      notes: notes ? String(notes) : "",
    });
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    const msg = error?.message || String(error);
    const hint = msg.includes("inventory") && msg.includes("does not exist")
      ? " Run 'pnpm db:push' to create the inventory table."
      : "";
    res.status(500).json({ error: `Failed to create inventory item.${hint}`, details: msg });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put("/inventory/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { id } = req.params;
    const {
      name,
      category,
      type,
      location,
      currentStock,
      unit,
      pricePerUnit,
      gstInclusive,
      minimumStock,
      supplier,
      expiryDate,
      notes,
    } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (type !== undefined) updates.type = String(type).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (currentStock !== undefined) updates.currentStock = Number(currentStock);
    if (unit !== undefined) updates.unit = String(unit);
    if (pricePerUnit !== undefined) updates.pricePerUnit = Number(pricePerUnit);
    if (gstInclusive !== undefined) updates.gstInclusive = !!gstInclusive;
    if (minimumStock !== undefined) updates.minimumStock = Number(minimumStock);
    if (supplier !== undefined) updates.supplier = String(supplier).trim();
    if (expiryDate !== undefined) {
      const parsed = expiryDate ? new Date(expiryDate) : null;
      updates.expiryDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (notes !== undefined) updates.notes = String(notes);
    const item = await storage.updateInventoryItem(id, orgId, updates);
    if (!item) return res.status(404).json({ error: "Inventory item not found" });
    res.json(item);
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete("/inventory/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { id } = req.params;
    const deleted = await storage.deleteInventoryItem(id, orgId);
    if (!deleted) return res.status(404).json({ error: "Inventory item not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting inventory:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

// POST /api/inventory/bulk - Create or update multiple items (for sync from Inventory page)
router.post("/inventory/bulk", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }
    const created = [];
    for (const it of items) {
      const name = (it.productName || it.name || "").toString().trim();
      const unit = (it.unit || "kg").toString();
      const currentStock = Number(it.currentStock) ?? 0;
      const minimumStock = Number(it.minimumStock) ?? 0;
      if (!name) continue;
      const item = await storage.createInventoryItem({
        organizationId: orgId,
        name,
        category: (it.category || "General").toString(),
        type: (it.type || "").toString(),
        location: (it.location || "Storage").toString(),
        currentStock,
        unit,
        pricePerUnit: Number(it.pricePerUnit) || 0,
        gstInclusive: !!it.gstInclusive,
        minimumStock,
        supplier: (it.supplier || "").toString(),
        expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
        notes: (it.notes || "").toString(),
      });
      created.push(item);
    }
    res.status(201).json({ created: created.length, items: created });
  } catch (error) {
    console.error("Error bulk creating inventory:", error);
    res.status(500).json({ error: "Failed to bulk create inventory" });
  }
});

export default router;
