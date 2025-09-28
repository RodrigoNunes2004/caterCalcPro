import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  ChefHat,
  Clock,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  Calculator,
} from "lucide-react";

interface EventRecipe {
  id: string;
  name: string;
  plannedServings: number;
  category: string;
  cost: number;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate: string;
  guestCount: number;
  location?: string;
  status: "planning" | "confirmed" | "completed" | "cancelled";
  recipes: EventRecipe[];
  totalCost: number;
  costPerGuest: number;
  createdAt: string;
}

interface EventCardProps {
  event: Event;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  onGenerateShoppingList?: (eventId: string) => void;
  onCalculateCosts?: (eventId: string) => void;
  showActions?: boolean;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onViewDetails,
  onGenerateShoppingList,
  onCalculateCosts,
  showActions = true,
}: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planning":
        return <Clock className="h-3 w-3" />;
      case "confirmed":
        return <Calendar className="h-3 w-3" />;
      case "completed":
        return <ChefHat className="h-3 w-3" />;
      case "cancelled":
        return <Trash2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isUpcoming = new Date(event.eventDate) > new Date();
  const daysUntilEvent = Math.ceil(
    (new Date(event.eventDate).getTime() - new Date().getTime()) /
      (1000 * 3600 * 24)
  );

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 ${
        event.status === "confirmed"
          ? "border-l-4 border-l-green-500"
          : event.status === "planning"
          ? "border-l-4 border-l-yellow-500"
          : event.status === "completed"
          ? "border-l-4 border-l-blue-500"
          : "border-l-4 border-l-gray-300"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {event.name}
            </CardTitle>
            {event.description && (
              <CardDescription className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>
          <Badge className={getStatusColor(event.status)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(event.status)}
              <span>{event.status}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.eventDate)}</span>
            {isUpcoming && daysUntilEvent >= 0 && (
              <Badge variant="outline" className="text-xs">
                {daysUntilEvent === 0
                  ? "Today"
                  : daysUntilEvent === 1
                  ? "Tomorrow"
                  : `${daysUntilEvent} days`}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.guestCount} guests</span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 md:col-span-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Recipes Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center space-x-1">
              <ChefHat className="h-4 w-4" />
              <span>Recipes</span>
              <Badge variant="secondary" className="text-xs">
                {event.recipes.length}
              </Badge>
            </h4>
            {event.recipes.length > 3 && (
              <span className="text-xs text-gray-500">
                and {event.recipes.length - 3} more...
              </span>
            )}
          </div>

          <div className="space-y-1">
            {event.recipes.slice(0, 3).map((recipe) => (
              <div
                key={recipe.id}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{recipe.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {recipe.category}
                  </Badge>
                </div>
                <div className="text-gray-600">
                  {recipe.plannedServings} servings
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Total Cost</span>
              </div>
              <div className="font-semibold text-gray-900">
                ${event.totalCost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                <Users className="h-3 w-3" />
                <span>Per Guest</span>
              </div>
              <div className="font-semibold text-gray-900">
                ${event.costPerGuest.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(event.id)}
              className="flex-1 min-w-0"
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>

            {onGenerateShoppingList && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateShoppingList(event.id)}
                className="flex-1 min-w-0"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Shopping List
              </Button>
            )}

            {onCalculateCosts && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCalculateCosts(event.id)}
                className="flex-1 min-w-0"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Calculate
              </Button>
            )}

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(event.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && event.status === "planning" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(event.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
