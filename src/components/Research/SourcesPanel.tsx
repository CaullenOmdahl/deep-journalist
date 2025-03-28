"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  BarChart3, Check, ChevronDown, ChevronUp, ExternalLink, 
  Filter, Info, Search, SortAsc, SortDesc, Trash2, X 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTaskStore } from "@/store/task";
import { SearchTask } from "@/types";
import SourceValidator from "@/components/Research/SourceValidator";
import { assessDomainReputation, SourceType } from "@/utils/domain-reputation";
import { extractDomainFromUrl } from "@/utils/url-extractor";

interface SourcesPanelProps {
  sources?: SearchTask[];
  onRemoveSource?: (id: string) => void;
  onUpdateSourceCategory?: (id: string, category: SourceType) => void;
}

export default function SourcesPanel({ 
  sources = [], 
  onRemoveSource,
  onUpdateSourceCategory
}: SourcesPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SourceType | "all">("all");
  const [sortBy, setSortBy] = useState<"credibility" | "date">("credibility");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filteredSources, setFilteredSources] = useState<SearchTask[]>([]);
  
  useEffect(() => {
    // Apply filtering and sorting
    let filtered = [...sources];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(source => 
        source.title.toLowerCase().includes(query) || 
        source.url.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (activeTab !== "all") {
      filtered = filtered.filter(source => {
        if (!source.sourceType) {
          const domain = extractDomainFromUrl(source.url);
          const assessment = assessDomainReputation(domain);
          return assessment.type === activeTab;
        }
        return source.sourceType === activeTab;
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "credibility") {
        const scoreA = a.credibilityScore || 5;
        const scoreB = b.credibilityScore || 5;
        return sortOrder === "desc" ? scoreB - scoreA : scoreA - scoreB;
      } else { // sort by date
        const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
        const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
    });
    
    setFilteredSources(filtered);
  }, [sources, searchQuery, activeTab, sortBy, sortOrder]);
  
  const sourcesByType = {
    all: sources.length,
    primary: sources.filter(s => s.sourceType === "primary").length,
    secondary: sources.filter(s => s.sourceType === "secondary").length,
    official: sources.filter(s => s.sourceType === "official").length,
    analysis: sources.filter(s => s.sourceType === "analysis").length,
    commentary: sources.filter(s => s.sourceType === "commentary").length,
  };
  
  const sourceTypeLabels = {
    primary: "Primary Sources",
    secondary: "Secondary Sources",
    official: "Official Sources",
    analysis: "Analysis",
    commentary: "Commentary"
  };

  const handleRemove = (id: string) => {
    if (onRemoveSource) {
      onRemoveSource(id);
    }
  };
  
  const handleUpdateCategory = (id: string, category: SourceType) => {
    if (onUpdateSourceCategory) {
      onUpdateSourceCategory(id, category);
    }
  };
  
  const handleSortChange = (key: "credibility" | "date") => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };
  
  const getBiasDistribution = () => {
    const distribution = {
      'left': 0,
      'center-left': 0,
      'center': 0,
      'center-right': 0,
      'right': 0,
      'unknown': 0
    };
    
    sources.forEach(source => {
      if (source.biasAssessment) {
        distribution[source.biasAssessment as keyof typeof distribution]++;
      } else {
        const domain = extractDomainFromUrl(source.url);
        const assessment = assessDomainReputation(domain);
        distribution[assessment.bias as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  };
  
  const biasDistribution = getBiasDistribution();
  const totalSources = sources.length;
  
  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Sources Panel</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-8">
                  <Filter className="h-4 w-4" />
                  Sort & Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="flex justify-between cursor-pointer"
                  onClick={() => handleSortChange("credibility")}
                >
                  Credibility
                  {sortBy === "credibility" && (
                    sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex justify-between cursor-pointer"
                  onClick={() => handleSortChange("date")}
                >
                  Publication Date
                  {sortBy === "date" && (
                    sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>View Options</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setActiveTab("all")}
                >
                  All Sources
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as SourceType | "all")}>
        <TabsList className="grid grid-cols-6 mx-4">
          <TabsTrigger value="all" className="text-xs">
            All ({sourcesByType.all})
          </TabsTrigger>
          <TabsTrigger value="primary" className="text-xs">
            Primary ({sourcesByType.primary})
          </TabsTrigger>
          <TabsTrigger value="secondary" className="text-xs">
            Secondary ({sourcesByType.secondary})
          </TabsTrigger>
          <TabsTrigger value="official" className="text-xs">
            Official ({sourcesByType.official})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs">
            Analysis ({sourcesByType.analysis})
          </TabsTrigger>
          <TabsTrigger value="commentary" className="text-xs">
            Opinion ({sourcesByType.commentary})
          </TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-4 px-0">
          {filteredSources.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[50%]">Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="xs" 
                        className="font-medium h-auto px-1 -ml-1"
                        onClick={() => handleSortChange("credibility")}
                      >
                        Credibility
                        {sortBy === "credibility" && (
                          sortOrder === "desc" ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronUp className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Bias</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSources.map((source) => {
                    const domain = extractDomainFromUrl(source.url);
                    const assessment = source.credibilityScore ? null : assessDomainReputation(domain);
                    
                    return (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center"
                          >
                            {source.title}
                            <ExternalLink className="h-3 w-3 ml-1 inline text-muted-foreground" />
                          </a>
                          <div className="text-xs text-muted-foreground">
                            {domain}
                            {source.publicationDate && (
                              <span className="ml-2">
                                {new Date(source.publicationDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="xs" className="h-7">
                                {source.sourceType || (assessment?.type || "secondary")} <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              {(Object.keys(sourceTypeLabels) as Array<SourceType>).map((type) => (
                                <DropdownMenuItem 
                                  key={type}
                                  className="flex justify-between cursor-pointer"
                                  onClick={() => handleUpdateCategory(source.id, type)}
                                >
                                  {sourceTypeLabels[type]}
                                  {(source.sourceType || assessment?.type) === type && (
                                    <Check className="h-4 w-4" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">
                              {source.credibilityScore || assessment?.score || 5}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">/10</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {source.biasAssessment || assessment?.bias || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemove(source.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center py-8 text-muted-foreground">
              {searchQuery 
                ? "No sources match your search criteria" 
                : activeTab !== "all" 
                  ? `No ${activeTab} sources found` 
                  : "No sources added yet"}
            </div>
          )}
        </CardContent>
      </Tabs>
      
      {sources.length > 0 && (
        <CardFooter className="border-t pt-4 flex-col items-start gap-3">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Source Perspective Balance
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p className="text-sm">
                      This visualization shows the balance of perspectives across your sources. 
                      A good journalistic article should incorporate diverse viewpoints.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {totalSources > 0 && (
                <>
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(biasDistribution.left / totalSources) * 100}%` }} 
                  />
                  <div 
                    className="bg-orange-400" 
                    style={{ width: `${(biasDistribution["center-left"] / totalSources) * 100}%` }} 
                  />
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${(biasDistribution.center / totalSources) * 100}%` }} 
                  />
                  <div 
                    className="bg-blue-400" 
                    style={{ width: `${(biasDistribution["center-right"] / totalSources) * 100}%` }} 
                  />
                  <div 
                    className="bg-purple-500" 
                    style={{ width: `${(biasDistribution.right / totalSources) * 100}%` }} 
                  />
                  <div 
                    className="bg-gray-400" 
                    style={{ width: `${(biasDistribution.unknown / totalSources) * 100}%` }} 
                  />
                </>
              )}
            </div>
            <div className="flex justify-between mt-1 text-xs">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                <span>Left</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                <span>Center-Left</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span>Center</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                <span>Center-Right</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                <span>Right</span>
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 