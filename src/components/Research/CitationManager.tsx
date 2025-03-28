"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Check,
  BookOpen,
  FileText,
  Link2,
  ClipboardCopy,
  BookMarked,
  ChevronDown,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchTask } from "@/types";

type CitationStyle = "apa" | "mla" | "chicago" | "harvard" | "ieee";

interface CitationManagerProps {
  sources: SearchTask[];
}

export default function CitationManager({ sources }: CitationManagerProps) {
  const { t } = useTranslation();
  const [activeStyle, setActiveStyle] = useState<CitationStyle>("apa");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSources, setFilteredSources] = useState<SearchTask[]>([]);
  
  // Filter sources based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSources(sources);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = sources.filter(source => 
      (source.title?.toLowerCase().includes(term) || false) || 
      source.url.toLowerCase().includes(term)
    );
    setFilteredSources(filtered);
  }, [searchTerm, sources]);
  
  // Reset the "Copied" indicator after a delay
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);
  
  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
  };
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "n.d."; // "no date" abbreviation used in citations
    
    try {
      const date = new Date(dateString);
      
      if (activeStyle === "apa" || activeStyle === "harvard") {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else if (activeStyle === "mla") {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      } else if (activeStyle === "chicago") {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } else if (activeStyle === "ieee") {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };
  
  const getCitation = (source: SearchTask, style: CitationStyle): string => {
    const title = source.title || source.url;
    const author = source.author || "N.A."; // Default to "No Author"
    const publisherName = source.publisherName || extractDomain(source.url);
    const publicationDate = formatDate(source.publicationDate);
    const accessDate = formatDate(new Date().toISOString());
    
    switch (style) {
      case "apa":
        return `${author}. (${publicationDate.includes("n.d.") ? "n.d." : new Date(source.publicationDate || "").getFullYear()}). ${title}. ${publisherName}. Retrieved ${accessDate}, from ${source.url}`;
        
      case "mla":
        return `${author}. "${title}." ${publisherName}, ${publicationDate}, ${source.url}. Accessed ${accessDate}.`;
        
      case "chicago":
        return `${author}. "${title}." ${publisherName}, ${publicationDate}. ${source.url}.`;
        
      case "harvard":
        return `${author} (${publicationDate.includes("n.d.") ? "n.d." : new Date(source.publicationDate || "").getFullYear()}). ${title}. [online] ${publisherName}. Available at: ${source.url} [Accessed ${accessDate}].`;
        
      case "ieee":
        return `${author}, "${title}," ${publisherName}, ${publicationDate.includes("n.d.") ? "n.d." : publicationDate}. [Online]. Available: ${source.url}. [Accessed: ${accessDate}]`;
        
      default:
        return `${title} - ${source.url}`;
    }
  };
  
  const getAllCitations = (): string => {
    return sources.map(source => getCitation(source, activeStyle)).join('\n\n');
  };
  
  const handleCopyAll = () => {
    navigator.clipboard.writeText(getAllCitations());
    setCopiedIndex(-1); // -1 indicates "Copy All" was clicked
  };
  
  const getCitationStyleLabel = (style: CitationStyle): string => {
    switch (style) {
      case "apa": return "APA 7th Edition";
      case "mla": return "MLA 9th Edition";
      case "chicago": return "Chicago 17th Edition";
      case "harvard": return "Harvard";
      case "ieee": return "IEEE";
      default: return style;
    }
  };
  
  if (sources.length === 0) {
    return (
      <Card className="shadow-sm w-full mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Citation Manager</CardTitle>
          <CardDescription>
            No sources available to cite. Add sources to your research to generate citations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm w-full mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Citation Manager</CardTitle>
          <CardDescription>
            Generate and copy properly formatted citations
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Input
              className="pr-8"
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full rounded-l-none"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select 
            value={activeStyle} 
            onValueChange={(value) => setActiveStyle(value as CitationStyle)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Citation style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apa">APA 7th Edition</SelectItem>
              <SelectItem value="mla">MLA 9th Edition</SelectItem>
              <SelectItem value="chicago">Chicago 17th Edition</SelectItem>
              <SelectItem value="harvard">Harvard</SelectItem>
              <SelectItem value="ieee">IEEE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md">
            <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                <span>{getCitationStyleLabel(activeStyle)} Citations</span>
                <Badge variant="outline">
                  {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''}
                </Badge>
              </h3>
              
              <Button 
                variant="outline" 
                size="sm"
                className="h-8"
                onClick={handleCopyAll}
                disabled={copiedIndex === -1}
              >
                {copiedIndex === -1 ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Copied All
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="mr-1 h-4 w-4" />
                    Copy All Citations
                  </>
                )}
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {filteredSources.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No sources match your search criteria.
                </div>
              ) : (
                filteredSources.map((source, index) => (
                  <div key={source.id || index} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1 line-clamp-1">
                          {source.title || source.url}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {source.url}
                        </div>
                        <div className="text-sm border-l-2 border-muted pl-3 py-1 bg-muted/20 rounded-sm">
                          {getCitation(source, activeStyle)}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 self-start"
                        onClick={() => handleCopyToClipboard(getCitation(source, activeStyle), index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Citations are generated automatically based on available metadata. 
          Consider reviewing for accuracy.
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([getAllCitations()], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = `citations-${activeStyle}.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as Text File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
} 