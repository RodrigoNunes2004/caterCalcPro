import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  Clock,
  DollarSign,
  ChefHat,
  Coffee,
  Utensils,
  Wine,
  Cake,
  Star,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import EventPrepGuide from "@/components/EventPrepGuide";
import Navigation from "@/components/Navigator";

interface EventType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  avgGuests: string;
  duration: string;
  avgCost: string;
  popular: boolean;
  color: string;
}

const EVENT_TYPES: EventType[] = [
  {
    id: "buffet",
    name: "Buffet Events",
    description:
      "Large-scale buffet catering for corporate events, conferences, and celebrations",
    icon: <Utensils className="h-6 w-6" />,
    avgGuests: "50-200",
    duration: "2-4 hours",
    avgCost: "$15-25/person",
    popular: true,
    color: "orange",
  },
  {
    id: "morning-tea",
    name: "Morning Tea",
    description:
      "Light refreshments, pastries, and beverages for morning meetings and events",
    icon: <Coffee className="h-6 w-6" />,
    avgGuests: "10-50",
    duration: "1-2 hours",
    avgCost: "$8-15/person",
    popular: true,
    color: "blue",
  },
  {
    id: "canapes",
    name: "Canapés & Cocktails",
    description:
      "Elegant finger foods and appetizers for cocktail parties and receptions",
    icon: <Wine className="h-6 w-6" />,
    avgGuests: "30-100",
    duration: "2-3 hours",
    avgCost: "$12-20/person",
    popular: true,
    color: "purple",
  },
  {
    id: "corporate",
    name: "Corporate Lunches",
    description:
      "Professional catering for business meetings, seminars, and corporate events",
    icon: <Users className="h-6 w-6" />,
    avgGuests: "20-100",
    duration: "1-2 hours",
    avgCost: "$18-30/person",
    popular: false,
    color: "green",
  },
  {
    id: "wedding",
    name: "Wedding Receptions",
    description:
      "Full-service wedding catering with multiple courses and special dietary options",
    icon: <Cake className="h-6 w-6" />,
    avgGuests: "80-300",
    duration: "4-6 hours",
    avgCost: "$35-65/person",
    popular: false,
    color: "pink",
  },
  {
    id: "afternoon-tea",
    name: "Afternoon Tea",
    description:
      "Traditional afternoon tea service with scones, sandwiches, and pastries",
    icon: <Coffee className="h-6 w-6" />,
    avgGuests: "15-40",
    duration: "2-3 hours",
    avgCost: "$20-35/person",
    popular: false,
    color: "indigo",
  },
];

interface Event {
  id: string;
  name: string;
  description: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  venue: string;
  budgetPercentage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
  name: string;
  description: string;
  eventType: string;
  date: string;
  guestCount: number;
  venue: string;
  budgetPercentage: number;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [selectedPrepGuide, setSelectedPrepGuide] = useState<string>("buffet");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    eventType: "",
    date: "",
    guestCount: 50,
    venue: "",
    budgetPercentage: 0,
  });

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = (eventType: string) => {
    setSelectedEventType(eventType);
    setFormData((prev) => ({ ...prev, eventType }));
    setIsCreateDialogOpen(true);
  };

  const handleCreateNewEvent = () => {
    setFormData({
      name: "",
      description: "",
      eventType: "",
      date: "",
      guestCount: 50,
      venue: "",
      budgetPercentage: 0,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.name ||
      !formData.eventType ||
      !formData.date ||
      !formData.guestCount
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send data to backend
      const eventData = {
        name: formData.name,
        description: formData.description,
        eventType: formData.eventType,
        eventDate: formData.date,
        guestCount: formData.guestCount,
        venue: formData.venue,
        budgetPercentage: formData.budgetPercentage,
        status: "planning" as const,
      };

      console.log("Creating event:", eventData);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const createdEvent = await response.json();
      console.log("Event created successfully:", createdEvent);

      toast({
        title: "Event Created",
        description: `${formData.name} has been successfully created!`,
      });

      setIsCreateDialogOpen(false);
      resetForm();

      // Refresh events list
      const refreshResponse = await fetch("/api/events");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      eventType: "",
      date: "",
      guestCount: 50,
      venue: "",
      budgetPercentage: 0,
    });
  };

  const handleEditEvent = (event: Event) => {
    setFormData({
      name: event.name,
      description: event.description,
      eventType: event.eventType,
      date: event.eventDate.split("T")[0], // Convert to YYYY-MM-DD format
      guestCount: event.guestCount,
      venue: event.venue,
      budgetPercentage: parseFloat(event.budgetPercentage) || 0,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Event Deleted",
          description: "Event has been successfully deleted.",
        });

        // Refresh events list
        const refreshResponse = await fetch("/api/events");
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setEvents(data.events || []);
        }
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      orange: "border-orange-200 hover:border-orange-300",
      blue: "border-blue-200 hover:border-blue-300",
      purple: "border-purple-200 hover:border-purple-300",
      green: "border-green-200 hover:border-green-300",
      pink: "border-pink-200 hover:border-pink-300",
      indigo: "border-indigo-200 hover:border-indigo-300",
    };
    return (
      colorMap[color as keyof typeof colorMap] ||
      "border-gray-200 hover:border-gray-300"
    );
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      orange: "text-orange-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      green: "text-green-600",
      pink: "text-pink-600",
      indigo: "text-indigo-600",
    };
    return colorMap[color as keyof typeof colorMap] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                Event Management
              </h1>
            </div>
            <Navigation
              showCreateButton={true}
              createButtonText="New Event"
              createButtonAction={handleCreateNewEvent}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Plan Your Perfect Event
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose from our specialized catering menus designed for different
            types of events and occasions.
          </p>
        </div>

        <Tabs defaultValue="event-types" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="event-types">Event Types</TabsTrigger>
            <TabsTrigger value="recent-events">Recent Events</TabsTrigger>
            <TabsTrigger value="prep-guides">Prep Guides</TabsTrigger>
          </TabsList>

          <TabsContent value="event-types" className="space-y-6">
            {/* Popular Event Types */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="text-xl font-semibold text-foreground">
                  Popular Event Types
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {EVENT_TYPES.filter((type) => type.popular).map((eventType) => (
                  <Card
                    key={eventType.id}
                    className={`hover:shadow-lg transition-all cursor-pointer ${getColorClasses(
                      eventType.color
                    )}`}
                    onClick={() => handleCreateEvent(eventType.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2 rounded-lg bg-muted ${getIconColorClasses(
                            eventType.color
                          )}`}
                        >
                          {eventType.icon}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {eventType.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {eventType.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Users className="h-3 w-3" />
                            <span>Guests</span>
                          </div>
                          <div className="font-medium">
                            {eventType.avgGuests}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Duration</span>
                          </div>
                          <div className="font-medium">
                            {eventType.duration}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            <span>Average Cost</span>
                          </div>
                          <div className="font-medium text-lg">
                            {eventType.avgCost}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateEvent(eventType.id);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Plan Event
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Event Types */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                All Event Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EVENT_TYPES.map((eventType) => (
                  <Card
                    key={eventType.id}
                    className={`hover:shadow-lg transition-all cursor-pointer ${getColorClasses(
                      eventType.color
                    )}`}
                    onClick={() => handleCreateEvent(eventType.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2 rounded-lg bg-muted ${getIconColorClasses(
                            eventType.color
                          )}`}
                        >
                          {eventType.icon}
                        </div>
                        {eventType.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {eventType.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {eventType.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Users className="h-3 w-3" />
                            <span>Guests</span>
                          </div>
                          <div className="font-medium">
                            {eventType.avgGuests}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Duration</span>
                          </div>
                          <div className="font-medium">
                            {eventType.duration}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            <span>Average Cost</span>
                          </div>
                          <div className="font-medium text-lg">
                            {eventType.avgCost}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateEvent(eventType.id);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Plan Event
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recent-events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">
                Recent Events
              </h3>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleCreateNewEvent}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading events...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <Badge
                          variant={
                            event.status === "confirmed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {
                          EVENT_TYPES.find(
                            (type) => type.id === event.eventType
                          )?.name
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guests:</span>
                          <span className="font-medium">
                            {event.guestCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Venue:</span>
                          <span className="font-medium">
                            {event.venue || "TBD"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {event.budgetPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditEvent(event)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State for Recent Events */}
            {!loading && events.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No events yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start planning your first event to see it here.
                  </p>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={handleCreateNewEvent}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Plan Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="prep-guides" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Chef Preparation Guides
                </h3>
                <p className="text-muted-foreground">
                  Detailed prep lists and cooking guides for each event type
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-gray-600">
                  Select event type:
                </span>
                <select
                  value={selectedPrepGuide}
                  onChange={(e) => setSelectedPrepGuide(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {EVENT_TYPES.map((eventType) => (
                    <option key={eventType.id} value={eventType.id}>
                      {eventType.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <EventPrepGuide eventType={selectedPrepGuide} guestCount={100} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Plan a new catering event with all the details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-name">Event Name *</Label>
                <Input
                  id="event-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="event-type">Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((eventType) => (
                      <SelectItem key={eventType.id} value={eventType.id}>
                        {eventType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the event"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Event Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="guest-count">Guest Count *</Label>
                <Input
                  id="guest-count"
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guestCount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Number of guests"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  placeholder="Event venue or location"
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget Margin (%)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budgetPercentage || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgetPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Optional profit margin percentage"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Add a profit margin percentage to the base cost
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
