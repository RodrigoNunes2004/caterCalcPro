import { Router } from "express";
import { storage } from "../storage";
import {
  insertEventSchema,
  updateEventSchema,
  insertEventRecipeSchema,
} from "../../shared/schema";

const router = Router();

// Get all events with pagination and search
router.get("/events", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    console.log(
      `Fetching events - page: ${page}, limit: ${limit}, search: ${search}, status: ${status}`
    );

    const events = await storage.getEvents({
      page,
      limit,
      search,
      status,
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get single event with recipes
router.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching event with ID: ${id}`);

    const event = await storage.getEventWithRecipes(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Create new event
router.post("/events", async (req, res) => {
  try {
    console.log("Creating new event:", req.body);

    const eventData = insertEventSchema.parse(req.body);
    const newEvent = await storage.createEvent(eventData);

    console.log("Created event:", newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update event
router.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating event ${id}:`, req.body);

    const updateData = updateEventSchema.parse(req.body);
    const updatedEvent = await storage.updateEvent(id, updateData);

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    console.log("Updated event:", updatedEvent);
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event
router.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting event with ID: ${id}`);

    const success = await storage.deleteEvent(id);

    if (!success) {
      return res.status(404).json({ error: "Event not found" });
    }

    console.log(`Successfully deleted event ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Add recipe to event
router.post("/events/:id/recipes", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Adding recipe to event ${id}:`, req.body);

    const eventRecipeData = insertEventRecipeSchema.parse({
      ...req.body,
      eventId: id,
    });

    const newEventRecipe = await storage.addRecipeToEvent(eventRecipeData);

    console.log("Added recipe to event:", newEventRecipe);
    res.status(201).json(newEventRecipe);
  } catch (error) {
    console.error("Error adding recipe to event:", error);
    res.status(500).json({ error: "Failed to add recipe to event" });
  }
});

// Remove recipe from event
router.delete("/events/:eventId/recipes/:recipeId", async (req, res) => {
  try {
    const { eventId, recipeId } = req.params;
    console.log(`Removing recipe ${recipeId} from event ${eventId}`);

    const success = await storage.removeRecipeFromEvent(eventId, recipeId);

    if (!success) {
      return res.status(404).json({ error: "Event recipe not found" });
    }

    console.log(
      `Successfully removed recipe ${recipeId} from event ${eventId}`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing recipe from event:", error);
    res.status(500).json({ error: "Failed to remove recipe from event" });
  }
});

// Update recipe servings in event
router.put("/events/:eventId/recipes/:recipeId", async (req, res) => {
  try {
    const { eventId, recipeId } = req.params;
    const { plannedServings, notes } = req.body;

    console.log(
      `Updating recipe ${recipeId} in event ${eventId}: servings=${plannedServings}, notes=${notes}`
    );

    const updatedEventRecipe = await storage.updateEventRecipe(
      eventId,
      recipeId,
      {
        plannedServings,
        notes,
      }
    );

    if (!updatedEventRecipe) {
      return res.status(404).json({ error: "Event recipe not found" });
    }

    console.log("Updated event recipe:", updatedEventRecipe);
    res.json(updatedEventRecipe);
  } catch (error) {
    console.error("Error updating event recipe:", error);
    res.status(500).json({ error: "Failed to update event recipe" });
  }
});

// Calculate total event costs
router.get("/events/:id/calculate", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Calculating total costs for event ${id}`);

    const calculation = await storage.calculateEventCosts(id);

    console.log("Event calculation result:", calculation);
    res.json(calculation);
  } catch (error) {
    console.error("Error calculating event costs:", error);
    res.status(500).json({ error: "Failed to calculate event costs" });
  }
});

// Generate shopping list for event
router.get("/events/:id/shopping-list", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Generating shopping list for event ${id}`);

    const shoppingList = await storage.generateEventShoppingList(id);

    console.log("Generated event shopping list:", shoppingList);
    res.json(shoppingList);
  } catch (error) {
    console.error("Error generating event shopping list:", error);
    res.status(500).json({ error: "Failed to generate event shopping list" });
  }
});

// Compare multiple events
router.post("/events/compare", async (req, res) => {
  try {
    const { eventIds } = req.body;

    console.log(`Comparing events: ${eventIds.join(", ")}`);

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Event IDs array is required and must not be empty" });
    }

    const comparison = await storage.compareEvents(eventIds);

    console.log("Event comparison result:", comparison);
    res.json(comparison);
  } catch (error) {
    console.error("Error comparing events:", error);
    res.status(500).json({ error: "Failed to compare events" });
  }
});

export default router;
