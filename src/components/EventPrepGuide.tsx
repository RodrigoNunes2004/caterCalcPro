import React from "react";
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Thermometer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PrepStep {
  id: string;
  task: string;
  timeRequired: string;
  priority: "high" | "medium" | "low";
  equipment?: string[];
  notes?: string;
}

interface CookingStep {
  id: string;
  step: string;
  duration: string;
  temperature?: string;
  timing: string;
  tips?: string;
}

interface EventPrepData {
  prepList: PrepStep[];
  cookingGuide: CookingStep[];
  totalPrepTime: string;
  servingTemp: string;
  specialNotes: string[];
}

interface EventPrepGuideProps {
  eventType: string;
  guestCount?: number;
}

const EVENT_PREP_DATA: Record<string, EventPrepData> = {
  buffet: {
    prepList: [
      {
        id: "1",
        task: "Prepare all vegetables and proteins 24 hours ahead",
        timeRequired: "3-4 hours",
        priority: "high",
        equipment: ["Sharp knives", "Cutting boards", "Storage containers"],
        notes: "Marinate proteins overnight for better flavor",
      },
      {
        id: "2",
        task: "Set up chafing dishes and warming equipment",
        timeRequired: "45 minutes",
        priority: "high",
        equipment: ["Chafing dishes", "Fuel cans", "Water pans"],
      },
      {
        id: "3",
        task: "Prepare cold salads and desserts",
        timeRequired: "2 hours",
        priority: "medium",
        equipment: ["Mixing bowls", "Serving utensils"],
      },
      {
        id: "4",
        task: "Cook grains and starches in advance",
        timeRequired: "1 hour",
        priority: "medium",
        equipment: ["Large pots", "Steamers"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Start with items that hold temperature well",
        duration: "30 minutes",
        timing: "3 hours before service",
        tips: "Rice, pasta, and roasted vegetables maintain quality longest",
      },
      {
        id: "2",
        step: "Cook proteins to proper internal temperature",
        duration: "45-60 minutes",
        temperature: "165°F for poultry, 145°F for beef",
        timing: "2 hours before service",
      },
      {
        id: "3",
        step: "Prepare sauces and gravies",
        duration: "20 minutes",
        timing: "1 hour before service",
        tips: "Keep warm in separate containers to prevent overcooking",
      },
      {
        id: "4",
        step: "Final plating and garnishing",
        duration: "15 minutes",
        timing: "30 minutes before service",
      },
    ],
    totalPrepTime: "6-8 hours",
    servingTemp: "140°F minimum for hot foods",
    specialNotes: [
      "Maintain food safety temperatures throughout service",
      "Have backup fuel for chafing dishes",
      "Label all dishes with ingredients for allergies",
    ],
  },
  "morning-tea": {
    prepList: [
      {
        id: "1",
        task: "Bake fresh pastries and scones",
        timeRequired: "2 hours",
        priority: "high",
        equipment: ["Ovens", "Baking sheets", "Cooling racks"],
        notes: "Best served within 4 hours of baking",
      },
      {
        id: "2",
        task: "Prepare tea and coffee stations",
        timeRequired: "30 minutes",
        priority: "high",
        equipment: ["Coffee machines", "Tea urns", "Serving accessories"],
      },
      {
        id: "3",
        task: "Cut fresh fruit and arrange platters",
        timeRequired: "45 minutes",
        priority: "medium",
        equipment: ["Sharp knives", "Serving platters", "Garnish tools"],
      },
      {
        id: "4",
        task: "Set up serving area with linens and displays",
        timeRequired: "20 minutes",
        priority: "low",
        equipment: ["Table linens", "Tiered stands", "Serving utensils"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Pre-heat ovens and prepare baking mise en place",
        duration: "15 minutes",
        temperature: "375°F for most pastries",
        timing: "3 hours before service",
      },
      {
        id: "2",
        step: "Bake scones and muffins first",
        duration: "25-30 minutes",
        timing: "2.5 hours before service",
        tips: "These items are best served warm",
      },
      {
        id: "3",
        step: "Prepare coffee and tea service",
        duration: "10 minutes",
        timing: "30 minutes before service",
        tips: "Fresh brew ensures optimal flavor",
      },
      {
        id: "4",
        step: "Final arrangement and warming",
        duration: "15 minutes",
        timing: "15 minutes before service",
      },
    ],
    totalPrepTime: "3-4 hours",
    servingTemp: "Room temperature for most items, hot beverages at 160°F",
    specialNotes: [
      "Keep pastries covered to maintain freshness",
      "Offer variety of teas and coffee options",
      "Provide dairy alternatives for beverages",
    ],
  },
  canapes: {
    prepList: [
      {
        id: "1",
        task: "Prepare canapé bases and toppings separately",
        timeRequired: "4 hours",
        priority: "high",
        equipment: ["Piping bags", "Small molds", "Garnish tools"],
        notes: "Assemble just before service to maintain crispness",
      },
      {
        id: "2",
        task: "Prepare cold spreads and mousses",
        timeRequired: "2 hours",
        priority: "high",
        equipment: ["Food processor", "Fine mesh sieves", "Mixing bowls"],
      },
      {
        id: "3",
        task: "Set up cocktail service area",
        timeRequired: "45 minutes",
        priority: "medium",
        equipment: ["Bar setup", "Glassware", "Ice buckets"],
      },
      {
        id: "4",
        task: "Arrange serving platters and utensils",
        timeRequired: "30 minutes",
        priority: "low",
        equipment: ["Small plates", "Cocktail napkins", "Serving spoons"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Prepare all cold components first",
        duration: "2 hours",
        timing: "4 hours before service",
        tips: "Cold items can be prepared well in advance",
      },
      {
        id: "2",
        step: "Cook hot canapé components",
        duration: "45 minutes",
        temperature: "Various based on item",
        timing: "1 hour before service",
      },
      {
        id: "3",
        step: "Assemble canapés in small batches",
        duration: "30 minutes",
        timing: "30 minutes before service",
        tips: "Work in batches to maintain quality and appearance",
      },
      {
        id: "4",
        step: "Final garnish and presentation",
        duration: "15 minutes",
        timing: "15 minutes before service",
      },
    ],
    totalPrepTime: "5-6 hours",
    servingTemp: "Varied - cold items chilled, hot items at 140°F",
    specialNotes: [
      "Keep hot and cold items separate until service",
      "Use small portion sizes for easy eating",
      "Provide cocktail napkins and small plates",
    ],
  },
  corporate: {
    prepList: [
      {
        id: "1",
        task: "Prepare main course proteins and sides",
        timeRequired: "3 hours",
        priority: "high",
        equipment: ["Ovens", "Steamers", "Holding equipment"],
        notes: "Focus on professional presentation",
      },
      {
        id: "2",
        task: "Set up buffet line or plated service",
        timeRequired: "45 minutes",
        priority: "high",
        equipment: ["Serving dishes", "Warming equipment", "Labels"],
      },
      {
        id: "3",
        task: "Prepare salads and cold accompaniments",
        timeRequired: "1 hour",
        priority: "medium",
        equipment: ["Salad bowls", "Dressing containers", "Serving utensils"],
      },
      {
        id: "4",
        task: "Set up beverage station",
        timeRequired: "20 minutes",
        priority: "low",
        equipment: ["Beverage dispensers", "Cups", "Ice"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Start with longer-cooking items",
        duration: "60 minutes",
        timing: "2 hours before service",
        tips: "Roasts and braised items need time to rest",
      },
      {
        id: "2",
        step: "Prepare starches and vegetables",
        duration: "30 minutes",
        timing: "1 hour before service",
        tips: "Keep vegetables slightly undercooked for holding",
      },
      {
        id: "3",
        step: "Finish sauces and final seasoning",
        duration: "15 minutes",
        timing: "30 minutes before service",
      },
      {
        id: "4",
        step: "Final plating or service setup",
        duration: "15 minutes",
        timing: "15 minutes before service",
      },
    ],
    totalPrepTime: "4-5 hours",
    servingTemp: "140°F for hot items, 40°F for cold items",
    specialNotes: [
      "Professional presentation is key",
      "Accommodate dietary restrictions",
      "Provide clear labeling for all dishes",
    ],
  },
  wedding: {
    prepList: [
      {
        id: "1",
        task: "Prepare all courses according to timeline",
        timeRequired: "8 hours",
        priority: "high",
        equipment: ["Multiple ovens", "Holding equipment", "Plating stations"],
        notes: "Coordinate with wedding timeline and photographer",
      },
      {
        id: "2",
        task: "Set up cocktail hour service",
        timeRequired: "2 hours",
        priority: "high",
        equipment: ["Bars", "Cocktail equipment", "Serving trays"],
      },
      {
        id: "3",
        task: "Prepare wedding cake and desserts",
        timeRequired: "4 hours",
        priority: "medium",
        equipment: ["Cake stands", "Serving utensils", "Storage containers"],
      },
      {
        id: "4",
        task: "Coordinate with venue and vendors",
        timeRequired: "1 hour",
        priority: "high",
        equipment: ["Communication devices", "Timeline sheets"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Begin with appetizers and cocktail hour items",
        duration: "2 hours",
        timing: "4 hours before service",
        tips: "These are served first and can be prepared early",
      },
      {
        id: "2",
        step: "Prepare main course proteins",
        duration: "90 minutes",
        timing: "2.5 hours before service",
        temperature: "Proper internal temperatures for each protein",
      },
      {
        id: "3",
        step: "Cook sides and vegetables",
        duration: "45 minutes",
        timing: "1.5 hours before service",
        tips: "Coordinate timing with main course service",
      },
      {
        id: "4",
        step: "Final plating and service coordination",
        duration: "30 minutes",
        timing: "30 minutes before each course",
      },
    ],
    totalPrepTime: "10-12 hours",
    servingTemp: "Varied by course, maintain proper food safety temperatures",
    specialNotes: [
      "Coordinate with wedding timeline",
      "Have backup plans for outdoor events",
      "Special attention to dietary restrictions and allergies",
    ],
  },
  "afternoon-tea": {
    prepList: [
      {
        id: "1",
        task: "Prepare traditional tea sandwiches",
        timeRequired: "2 hours",
        priority: "high",
        equipment: ["Bread slicers", "Sandwich molds", "Storage containers"],
        notes: "Remove crusts and cut into elegant shapes",
      },
      {
        id: "2",
        task: "Bake fresh scones and pastries",
        timeRequired: "3 hours",
        priority: "high",
        equipment: ["Ovens", "Baking sheets", "Cooling racks"],
      },
      {
        id: "3",
        task: "Prepare clotted cream and preserves",
        timeRequired: "30 minutes",
        priority: "medium",
        equipment: ["Small bowls", "Serving spoons", "Preserving jars"],
      },
      {
        id: "4",
        task: "Set up tiered serving stands and tea service",
        timeRequired: "45 minutes",
        priority: "medium",
        equipment: ["Tiered stands", "Fine china", "Tea service"],
      },
    ],
    cookingGuide: [
      {
        id: "1",
        step: "Bake scones and sweet treats first",
        duration: "90 minutes",
        temperature: "375°F for scones",
        timing: "3 hours before service",
      },
      {
        id: "2",
        step: "Prepare tea sandwiches",
        duration: "60 minutes",
        timing: "2 hours before service",
        tips: "Keep covered with damp cloth to prevent drying",
      },
      {
        id: "3",
        step: "Arrange tiered stands",
        duration: "30 minutes",
        timing: "1 hour before service",
        tips: "Sandwiches on bottom, scones middle, sweets on top",
      },
      {
        id: "4",
        step: "Prepare tea service",
        duration: "15 minutes",
        timing: "30 minutes before service",
      },
    ],
    totalPrepTime: "4-5 hours",
    servingTemp: "Room temperature for most items, hot tea at 160°F",
    specialNotes: [
      "Traditional presentation is important",
      "Offer variety of tea selections",
      "Provide proper afternoon tea etiquette guidance",
    ],
  },
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "low":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export default function EventPrepGuide({
  eventType,
  guestCount = 50,
}: EventPrepGuideProps) {
  const prepData = EVENT_PREP_DATA[eventType];

  if (!prepData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Prep guide not available for this event type.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            <span>Preparation Overview</span>
          </CardTitle>
          <CardDescription>
            Complete prep guide for {guestCount} guests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">Total Prep Time</div>
                <div className="text-sm text-gray-600">
                  {prepData.totalPrepTime}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium">Serving Temperature</div>
                <div className="text-sm text-gray-600">
                  {prepData.servingTemp}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Guest Count</div>
                <div className="text-sm text-gray-600">{guestCount} people</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prep List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Preparation Checklist</span>
          </CardTitle>
          <CardDescription>
            Essential prep tasks organized by priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prepData.prepList.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start space-x-3 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{step.task}</h4>
                    <Badge
                      className={`text-xs ${getPriorityColor(step.priority)}`}
                    >
                      {step.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{step.timeRequired}</span>
                    </div>
                  </div>
                  {step.equipment && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Equipment:{" "}
                      </span>
                      <span className="text-sm text-gray-600">
                        {step.equipment.join(", ")}
                      </span>
                    </div>
                  )}
                  {step.notes && (
                    <div className="flex items-start space-x-1">
                      <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-700">
                        {step.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cooking Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="h-5 w-5 text-blue-600" />
            <span>Cooking Timeline</span>
          </CardTitle>
          <CardDescription>
            Step-by-step cooking sequence for optimal results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prepData.cookingGuide.map((step, index) => (
              <div key={step.id} className="relative">
                {index < prepData.cookingGuide.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-16 bg-blue-200"></div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {step.step}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{step.duration}</span>
                      </div>
                      <div className="font-medium text-blue-600">
                        {step.timing}
                      </div>
                      {step.temperature && (
                        <div className="flex items-center space-x-1">
                          <Thermometer className="h-3 w-3" />
                          <span>{step.temperature}</span>
                        </div>
                      )}
                    </div>
                    {step.tips && (
                      <div className="flex items-start space-x-1">
                        <AlertCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-700">
                          {step.tips}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span>Important Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {prepData.specialNotes.map((note, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{note}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
