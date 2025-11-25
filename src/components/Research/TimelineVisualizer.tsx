"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  CalendarDays,
  Info,
  AlertTriangle,
  Check,
  ExternalLink,
  ChevronDown,
  X,
  Search,
  FileText,
  Filter,
  BarChart3,
  List,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SearchTask } from "@/types";
import { buildTimeline, TimelineEvent, Timeline } from "@/utils/timeline-builder";

interface TimelineVisualizerProps {
  sources: SearchTask[];
  mainContent?: string;
}

export default function TimelineVisualizer({ sources, mainContent }: TimelineVisualizerProps) {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<Record<string, boolean>>({
    high: true,
    medium: true,
    low: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Generate timeline on component mount or when sources/content changes
  useEffect(() => {
    if (sources.length > 0 || mainContent) {
      const newTimeline = buildTimeline(sources, mainContent, {
        includeLowConfidence: false,
        categorizeEvents: true,
        detectConflicts: true,
        includeSourceInfo: true,
      });
      setTimeline(newTimeline);
    }
  }, [sources, mainContent]);

  // Calculate filtered events based on active filters
  const filteredEvents = useMemo(() => {
    if (!timeline) return [];

    return timeline.events.filter(event => {
      // Apply category filter
      if (activeFilter !== "all" && event.category !== activeFilter) {
        return false;
      }

      // Apply confidence filter
      if (!confidenceFilter[event.confidence]) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          event.title.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [timeline, activeFilter, confidenceFilter, searchTerm]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get color for event category
  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'announcement': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'policy': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'conflict': return 'bg-red-100 text-red-800 border-red-200';
      case 'disaster': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'economy': return 'bg-green-100 text-green-800 border-green-200';
      case 'science': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'health': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'politics': return 'bg-violet-100 text-violet-800 border-violet-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get icon for confidence level
  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return <Check className="h-4 w-4 text-green-500" />;
      case 'medium': return <Info className="h-4 w-4 text-blue-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Toggle a specific confidence level
  const toggleConfidence = (level: string) => {
    setConfidenceFilter(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  if (!timeline || timeline.events.length === 0) {
    return (
      <Card className="shadow-sm w-full mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
          <CardDescription>
            No timeline events could be extracted from the available sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-muted" />
              <p>Add more sources with date references to generate a timeline.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create an array of categories with their counts for the filter
  const categories = useMemo(() => {
    const counts: Record<string, number> = { all: timeline.events.length };

    timeline.events.forEach(event => {
      const category = event.category || 'general';
      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
      id: category,
      label: category === 'all' ? 'All Events' :
        category.charAt(0).toUpperCase() + category.slice(1),
      count
    }));
  }, [timeline]);

  return (
    <Card className="shadow-sm w-full mt-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{timeline.title}</CardTitle>
            <CardDescription>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} from {timeline.startDate.toLocaleDateString()} to {timeline.endDate.toLocaleDateString()}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                className="pl-8 w-56"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-9">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Event Confidence</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={confidenceFilter.high}
                  onCheckedChange={() => toggleConfidence('high')}
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    High Confidence
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={confidenceFilter.medium}
                  onCheckedChange={() => toggleConfidence('medium')}
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Medium Confidence
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={confidenceFilter.low}
                  onCheckedChange={() => toggleConfidence('low')}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Low Confidence
                  </div>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${viewMode === 'list' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map(category => (
            <Badge
              key={category.id}
              variant="outline"
              className={`cursor-pointer ${activeFilter === category.id
                  ? getCategoryColor(category.id)
                  : 'hover:bg-muted'
                }`}
              onClick={() => setActiveFilter(category.id)}
            >
              {category.label} ({category.count})
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events match the current filters.
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="border rounded-md p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-start gap-1 mt-1 mr-1">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div className="h-full w-px bg-muted mx-auto mt-1"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <time className="text-sm text-muted-foreground font-medium">
                        {formatDate(event.date)}
                      </time>
                      <div className="flex items-center gap-2">
                        {event.category && (
                          <Badge variant="outline" className={getCategoryColor(event.category)}>
                            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                          </Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {getConfidenceIcon(event.confidence)}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{event.confidence.charAt(0).toUpperCase() + event.confidence.slice(1)} confidence event</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <h3 className="text-base font-medium mt-1">
                      {event.title}
                    </h3>

                    <p className="text-sm mt-2 text-muted-foreground">
                      {event.description}
                    </p>

                    {event.conflicts && event.conflicts.length > 0 && (
                      <div className="mt-2 text-xs flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Conflicting information detected</span>
                      </div>
                    )}

                    {event.sourceUrl && (
                      <div className="mt-3 flex items-center text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <a
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate max-w-xs"
                        >
                          {event.sourceTitle || event.sourceUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border rounded-md p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <time className="text-sm text-muted-foreground font-medium">
                    {formatDate(event.date)}
                  </time>
                  <div className="flex items-center gap-2">
                    {event.category && (
                      <Badge variant="outline" className={getCategoryColor(event.category)}>
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </Badge>
                    )}
                    {getConfidenceIcon(event.confidence)}
                  </div>
                </div>

                <h3 className="text-base font-medium">
                  {event.title}
                </h3>

                <p className="text-sm mt-2 text-muted-foreground flex-1 line-clamp-3">
                  {event.description}
                </p>

                {event.sourceUrl && (
                  <div className="mt-3 flex items-center text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate max-w-xs"
                    >
                      {event.sourceTitle || event.sourceUrl}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-xs text-muted-foreground">
          Timeline automatically generated from source content. Events marked with lower confidence may need verification.
        </p>
      </CardFooter>
    </Card>
  );
} 