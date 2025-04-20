"use client";
import {
  useRef,
  useLayoutEffect,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Save, CodeXml, Eye } from "lucide-react";
import { Crepe } from "@milkdown/crepe";
import { editorViewOptionsCtx } from "@milkdown/kit/core";
import { replaceAll } from "@milkdown/kit/utils";
import { commonmark } from "@milkdown/preset-commonmark";
import { diagram } from "@xiangfa/milkdown-plugin-diagram";
import { math } from "@xiangfa/milkdown-plugin-math";
import { MarkdownEditor } from "@xiangfa/mdeditor";
import FloatingMenu from "@/components/FloatingMenu";
import { Button } from "@/components/Button";
import { cn } from "@/utils/style";

import "@milkdown/crepe/theme/common/style.css";
import "./style.css";

type EditorProps = {
  className?: string;
  value: string;
  onChange?: (value: string) => void;
  tools?: ReactNode;
  readOnly?: boolean;
};

function MilkdownEditor(props: EditorProps) {
  const { className, value: defaultValue, onChange, tools, readOnly = false } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const milkdownEditorRef = useRef<HTMLDivElement>(null);
  const markdownEditorRef = useRef<HTMLDivElement>(null);
  const [milkdownEditor, setMilkdownEditor] = useState<Crepe | null>(null);
  const [markdownEditor, setMarkdownEditor] = useState<MarkdownEditor | null>(null);
  const [mode, setMode] = useState<"markdown" | "WYSIWYM">("WYSIWYM");
  const [editable, setEditable] = useState<boolean>(!readOnly);
  const [markdown, setMarkdown] = useState<string>(defaultValue || "");
  const [editorReady, setEditorReady] = useState<boolean>(false);
  
  function handleEditable(enable: boolean) {
    milkdownEditor?.setReadonly(!enable);
    setEditable(enable);
  }

  function updateContent(content: string) {
    if (mode === "WYSIWYM") {
      if (milkdownEditor?.editor.status === "Created") {
        try {
          replaceAll(content)(milkdownEditor.editor.ctx as any);
        } catch (error) {
          console.error("Failed to update milkdown content:", error);
        }
      }
    } else if (mode === "markdown") {
      if (markdownEditor?.status === "create") {
        try {
          markdownEditor.update(content);
        } catch (error) {
          console.error("Failed to update markdown content:", error);
        }
      }
    }
  }

  function changeMode(mode: "markdown" | "WYSIWYM") {
    if (editorReady) {
      updateContent(markdown);
    }
    setMode(mode);
    if (!editable && !readOnly) handleEditable(true);
  }

  function save() {
    changeMode("WYSIWYM");
    handleEditable(false);
    if (onChange) {
      onChange(markdown);
    }
  }

  useEffect(() => {
    if (!editorReady) return;
    
    const timer = setTimeout(() => {
      try {
        if (mode === "WYSIWYM" && milkdownEditor) {
          if (milkdownEditor.editor.status === "Created") {
            replaceAll(defaultValue || "")(milkdownEditor.editor.ctx as any);
          }
        } else if (mode === "markdown" && markdownEditor) {
          if (markdownEditor.status === "create") {
            markdownEditor.update(defaultValue || "");
          }
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mode, milkdownEditor, markdownEditor, defaultValue, editorReady]);

  // Initialize the WYSIWYM editor
  useLayoutEffect(() => {
    if (!milkdownEditorRef.current) {
      console.warn("Milkdown editor ref not available");
      return;
    }

    let crepe: Crepe | null = null;
    
    const initEditor = async () => {
      try {      
        // Create editor instance with correct configuration
        crepe = new Crepe({
          root: milkdownEditorRef.current,
          defaultValue: "",  // Start with empty - we'll set content after initialization
          features: {
            [Crepe.Feature.ImageBlock]: false,
            [Crepe.Feature.Latex]: false,
          },
          featureConfigs: {
            [Crepe.Feature.Placeholder]: {
              text: t("editor.placeholder"),
            },
          },
        });
        
        // Apply each plugin individually with type assertions to avoid version conflicts
        crepe.editor.use(commonmark as any);
        crepe.editor.use(diagram as any);
        crepe.editor.use(math as any);
        
        // Create the editor after plugins are loaded
        await crepe.editor.create();
        
        // Configure after creation
        crepe.editor.config((ctx) => {
          // Use any to bypass type checking for editorViewOptionsCtx
          (ctx as any).update(editorViewOptionsCtx, (prev: any) => ({
            ...prev,
            attributes: {
              class: "milkdown-editor mx-auto outline-none",
              spellcheck: "false",
            },
          }));
        });
        
        // Set read-only state
        await crepe.setReadonly(readOnly);
        
        console.log("Milkdown editor created successfully");
        setMilkdownEditor(crepe);
        
        // Set content and mark as ready
        if (defaultValue && crepe) {
          try {
            // Use any to bypass type issues
            replaceAll(defaultValue)(crepe.editor.ctx as any);
          } catch (error) {
            console.error("Failed to set initial content:", error);
          }
        }
        
        setEditorReady(true);
        
        // Set up listeners
        crepe.on((listener) => {
          listener.markdownUpdated((ctx, markdown) => {
            setMarkdown(markdown);
            if (readOnly && onChange) {
              onChange(markdown);
            }
          });
        });
      } catch (error) {
        console.error("Error during Milkdown editor initialization:", error);
      }
    };

    initEditor();
    
    return () => {
      try {
        if (crepe) {
          crepe.destroy();
        }
      } catch (error) {
        console.error("Error destroying Milkdown editor:", error);
      }
    };
  }, [t, defaultValue, readOnly, onChange]);

  useLayoutEffect(() => {
    if (!markdownEditorRef.current) {
      console.warn("Markdown editor ref not available");
      return;
    }
    
    let editor: MarkdownEditor | null = null;
    
    try {
      editor = new MarkdownEditor({
        root: markdownEditorRef.current,
        defaultValue: defaultValue || "",
        onChange: (value) => {
          setMarkdown(value);
          if (readOnly && onChange) {
            onChange(value);
          }
        },
      });

      editor.create().then(() => {
        console.log("Markdown editor created successfully");
        setMarkdownEditor(editor);
      }).catch(error => {
        console.error("Failed to create Markdown editor:", error);
      });
    } catch (error) {
      console.error("Error during Markdown editor initialization:", error);
    }

    return () => {
      try {
        if (editor) {
          editor.destroy();
        }
      } catch (error) {
        console.error("Error destroying Markdown editor:", error);
      }
    };
  }, [defaultValue, readOnly, onChange]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "milkdown-editor prose prose-slate dark:prose-invert max-w-full",
          { hidden: mode !== "WYSIWYM" }
        )}
        ref={milkdownEditorRef}
      ></div>
      <div
        className={cn(
          "markdown-editor text-base whitespace-break-spaces print:hidden",
          {
            hidden: mode !== "markdown",
          }
        )}
        ref={markdownEditorRef}
      ></div>
      {!readOnly && (
        <FloatingMenu targetRef={containerRef} fixedTopOffset={16}>
          <div className="flex flex-col gap-1 border rounded-full py-2 p-1 bg-white/95 dark:bg-slate-800/95 print:hidden">
            {mode === "WYSIWYM" ? (
              <Button
                className="float-menu-button"
                title="Markdown"
                side="left"
                sideoffset={8}
                variant="ghost"
                onClick={() => changeMode("markdown")}
              >
                <CodeXml />
              </Button>
            ) : (
              <Button
                className="float-menu-button"
                title={t("editor.WYSIWYM")}
                side="left"
                sideoffset={8}
                variant="ghost"
                onClick={() => changeMode("WYSIWYM")}
              >
                <Eye />
              </Button>
            )}
            {editable ? (
              <Button
                className="float-menu-button"
                title={t("editor.save")}
                side="left"
                sideoffset={8}
                size="icon"
                variant="ghost"
                onClick={() => save()}
              >
                <Save />
              </Button>
            ) : (
              <Button
                className="float-menu-button"
                title={t("editor.edit")}
                side="left"
                sideoffset={8}
                size="icon"
                variant="ghost"
                onClick={() => handleEditable(true)}
              >
                <Pencil />
              </Button>
            )}
            {tools ? tools : null}
          </div>
        </FloatingMenu>
      )}
    </div>
  );
}

export default MilkdownEditor;
