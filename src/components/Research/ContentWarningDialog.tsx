"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface ContentWarningDialogProps {
  onAddWarning: (warning: ContentWarning) => void;
}

export interface ContentWarning {
  id: string;
  type: string;
  customMessage?: string;
  requireConfirmation: boolean;
}

// Common warning types in journalism
const WARNING_TYPES = [
  { value: "graphic_violence", label: "Graphic Violence" },
  { value: "sexual_content", label: "Sexual Content" },
  { value: "child_abuse", label: "Child Abuse/Exploitation" },
  { value: "suicide", label: "Suicide/Self-Harm" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "medical_distress", label: "Medical Distress" },
  { value: "animal_cruelty", label: "Animal Cruelty" },
  { value: "substance_abuse", label: "Substance Abuse" },
  { value: "trauma", label: "Trauma/PTSD Triggers" },
  { value: "custom", label: "Custom Warning" },
];

// Default messages for each warning type
const DEFAULT_MESSAGES = {
  graphic_violence:
    "This article contains descriptions of graphic violence that some readers may find disturbing.",
  sexual_content:
    "This article contains references to sexual content that may not be suitable for all readers.",
  child_abuse:
    "This article discusses child abuse or exploitation. Reader discretion is strongly advised.",
  suicide:
    "This article contains discussion of suicide or self-harm which may be triggering for some readers.",
  hate_speech:
    "This article contains reports of hate speech or discriminatory language for the purpose of journalistic documentation.",
  medical_distress:
    "This article contains descriptions of medical distress or procedures that some readers may find graphic.",
  animal_cruelty:
    "This article discusses animal cruelty which may be distressing for some readers.",
  substance_abuse:
    "This article contains references to substance abuse that some readers may find triggering.",
  trauma:
    "This article contains content that may trigger traumatic memories for those with PTSD.",
  custom: "",
};

export default function ContentWarningDialog({ onAddWarning }: ContentWarningDialogProps) {
  const [open, setOpen] = useState(false);
  const [warningType, setWarningType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(false);

  const handleAddWarning = () => {
    if (!warningType) return;

    const message = warningType === "custom" ? customMessage : 
      customMessage || DEFAULT_MESSAGES[warningType as keyof typeof DEFAULT_MESSAGES];

    onAddWarning({
      id: Date.now().toString(),
      type: warningType,
      customMessage: message,
      requireConfirmation,
    });

    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setWarningType("");
    setCustomMessage("");
    setRequireConfirmation(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <AlertTriangle className="h-4 w-4" />
          <span>Add Content Warning</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Content Warning</DialogTitle>
          <DialogDescription>
            Create a content warning for sensitive topics that may require reader caution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warning-type">Warning Type</Label>
            <Select 
              value={warningType} 
              onValueChange={(value) => {
                setWarningType(value);
                setCustomMessage(DEFAULT_MESSAGES[value as keyof typeof DEFAULT_MESSAGES] || "");
              }}
            >
              <SelectTrigger id="warning-type">
                <SelectValue placeholder="Select warning type" />
              </SelectTrigger>
              <SelectContent>
                {WARNING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.label}</span>
                      {type.value !== "custom" && (
                        <Badge variant="outline" className="text-xs">
                          Standard
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warning-message">
              Warning Message
              {warningType && warningType !== "custom" && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Pre-filled with standard language)
                </span>
              )}
            </Label>
            <Textarea
              id="warning-message"
              placeholder="Enter content warning message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="require-confirmation"
              checked={requireConfirmation}
              onCheckedChange={setRequireConfirmation}
            />
            <Label htmlFor="require-confirmation">
              Require reader confirmation before displaying content
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            resetForm();
            setOpen(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddWarning}>
            Add Warning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 