import { saveAs } from "file-saver";
import type { Source } from "@/types";

export function downloadFile(
  content: string,
  filename: string,
  fileType: string
) {
  // Prepending a BOM sequence at the beginning of the text file to encoded as UTF-8.
  const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
  const file = new File([BOM, content], filename, { type: fileType });
  saveAs(file);
}

export interface ExportData {
  title: string;
  finalReport: string;
  sources: Source[];
  claims?: Array<{
    id: string;
    text: string;
    status: string;
    details?: string;
  }>;
  metadata?: {
    articleType?: string;
    createdAt?: string;
    wordCount?: number;
  };
}

/**
 * Export article as JSON format
 * Includes structured data with article content, sources, metadata, and claims
 */
export function exportAsJSON(data: ExportData): string {
  const exportData = {
    title: data.title,
    content: data.finalReport,
    metadata: {
      articleType: data.metadata?.articleType || "news",
      createdAt: data.metadata?.createdAt || new Date().toISOString(),
      wordCount: data.metadata?.wordCount || data.finalReport.split(/\s+/).length,
      exportFormat: "JSON",
      version: "1.0"
    },
    sources: data.sources.map(source => ({
      id: source.id,
      url: source.url,
      title: source.title,
      sourceType: source.sourceType,
      credibilityScore: source.credibilityScore,
      publicationDate: source.publicationDate,
      biasAssessment: source.biasAssessment,
      authorName: source.authorName,
      publisherName: source.publisherName
    })),
    claims: data.claims || []
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export article as HTML format
 * Includes embedded styles for web publishing
 */
export function exportAsHTML(data: ExportData): string {
  // Convert markdown to HTML-like structure
  const contentLines = data.finalReport.split("\n");
  let htmlContent = "";

  for (const line of contentLines) {
    if (line.startsWith("# ")) {
      htmlContent += `    <h1>${escapeHtml(line.substring(2))}</h1>\n`;
    } else if (line.startsWith("## ")) {
      htmlContent += `    <h2>${escapeHtml(line.substring(3))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      htmlContent += `    <h3>${escapeHtml(line.substring(4))}</h3>\n`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      htmlContent += `    <li>${escapeHtml(line.substring(2))}</li>\n`;
    } else if (line.trim() === "") {
      htmlContent += "\n";
    } else {
      // Convert bold markdown (**text**) to <strong>
      let processedLine = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      // Convert italic markdown (*text*) to <em>
      processedLine = processedLine.replace(/\*(.+?)\*/g, "<em>$1</em>");
      // Convert links [text](url) to <a>
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

      htmlContent += `    <p>${processedLine}</p>\n`;
    }
  }

  // Build sources section
  let sourcesHTML = "";
  if (data.sources.length > 0) {
    sourcesHTML = `
    <hr>
    <section class="sources">
      <h2>Sources (${data.sources.length})</h2>
      <ol>
${data.sources.map(source => `        <li>
          <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(source.title || source.url)}
          </a>
          ${source.credibilityScore ? `<span class="credibility">(Credibility: ${source.credibilityScore}/10)</span>` : ""}
          ${source.sourceType ? `<span class="source-type">[${source.sourceType}]</span>` : ""}
        </li>`).join("\n")}
      </ol>
    </section>`;
  }

  // Build claims section
  let claimsHTML = "";
  if (data.claims && data.claims.length > 0) {
    claimsHTML = `
    <hr>
    <section class="claims">
      <h2>Verified Claims</h2>
      <ul class="claims-list">
${data.claims.map(claim => `        <li class="claim-item status-${claim.status}">
          <strong>${escapeHtml(claim.text)}</strong>:
          <span class="status">${claim.status}</span>
          ${claim.details ? `<p class="details">${escapeHtml(claim.details)}</p>` : ""}
        </li>`).join("\n")}
      </ul>
    </section>`;
  }

  // Complete HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Deep Journalist">
  <meta name="article-type" content="${data.metadata?.articleType || "news"}">
  <title>${escapeHtml(data.title)}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
      background-color: #fff;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 1rem 0 1.5rem;
      line-height: 1.2;
      color: #000;
    }
    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem;
      color: #222;
    }
    h3 {
      font-size: 1.4rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem;
      color: #333;
    }
    p {
      margin: 1rem 0;
      text-align: justify;
    }
    li {
      margin: 0.5rem 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 2px solid #ddd;
      margin: 2rem 0;
    }
    .sources, .claims {
      margin-top: 2rem;
    }
    .sources ol {
      padding-left: 1.5rem;
    }
    .credibility {
      color: #666;
      font-size: 0.9rem;
      margin-left: 0.5rem;
    }
    .source-type {
      color: #888;
      font-size: 0.85rem;
      margin-left: 0.5rem;
      font-style: italic;
    }
    .claims-list {
      list-style: none;
      padding: 0;
    }
    .claim-item {
      padding: 1rem;
      margin: 0.75rem 0;
      border-left: 4px solid #ddd;
      background-color: #f9f9f9;
    }
    .claim-item.status-verified {
      border-left-color: #22c55e;
      background-color: #f0fdf4;
    }
    .claim-item.status-unverified {
      border-left-color: #eab308;
      background-color: #fefce8;
    }
    .claim-item.status-disputed {
      border-left-color: #f97316;
      background-color: #fff7ed;
    }
    .claim-item.status-false {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    .claim-item .status {
      text-transform: capitalize;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .claim-item .details {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
      font-style: italic;
    }
    strong {
      font-weight: 600;
    }
    em {
      font-style: italic;
    }
    @media print {
      body {
        padding: 0;
      }
    }
    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      h1 {
        font-size: 2rem;
      }
      h2 {
        font-size: 1.5rem;
      }
      h3 {
        font-size: 1.2rem;
      }
    }
  </style>
</head>
<body>
  <article>
${htmlContent}
${sourcesHTML}
${claimsHTML}
  </article>

  <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.9rem; color: #666; text-align: center;">
    <p>Generated with Deep Journalist on ${new Date().toLocaleDateString()}</p>
  </footer>
</body>
</html>`;

  return html;
}

/**
 * Export article as plain text format
 * Clean text without any formatting or markup
 */
export function exportAsPlainText(data: ExportData): string {
  let plainText = "";

  // Title
  plainText += data.title.replace(/^#\s+/, "").replace(/\*\*/g, "");
  plainText += "\n" + "=".repeat(data.title.length) + "\n\n";

  // Content - remove all markdown formatting
  const contentLines = data.finalReport.split("\n");
  for (const line of contentLines) {
    // Remove markdown headers
    let cleanLine = line.replace(/^#{1,6}\s+/, "");

    // Remove bold and italic markdown
    cleanLine = cleanLine.replace(/\*\*(.+?)\*\*/g, "$1");
    cleanLine = cleanLine.replace(/\*(.+?)\*/g, "$1");

    // Convert links [text](url) to "text (url)"
    cleanLine = cleanLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

    // Remove list markers but keep content
    cleanLine = cleanLine.replace(/^[-*]\s+/, "  • ");

    plainText += cleanLine + "\n";
  }

  // Sources section
  if (data.sources.length > 0) {
    plainText += "\n" + "-".repeat(60) + "\n";
    plainText += `\nSOURCES (${data.sources.length})\n\n`;

    data.sources.forEach((source, idx) => {
      plainText += `${idx + 1}. ${source.title || source.url}\n`;
      plainText += `   URL: ${source.url}\n`;
      if (source.credibilityScore) {
        plainText += `   Credibility: ${source.credibilityScore}/10\n`;
      }
      if (source.sourceType) {
        plainText += `   Type: ${source.sourceType}\n`;
      }
      plainText += "\n";
    });
  }

  // Claims section
  if (data.claims && data.claims.length > 0) {
    plainText += "\n" + "-".repeat(60) + "\n";
    plainText += "\nVERIFIED CLAIMS\n\n";

    data.claims.forEach((claim) => {
      plainText += `• ${claim.text}: ${claim.status}\n`;
      if (claim.details) {
        plainText += `  ${claim.details}\n`;
      }
      plainText += "\n";
    });
  }

  // Footer
  plainText += "\n" + "-".repeat(60) + "\n";
  plainText += `Generated with Deep Journalist on ${new Date().toLocaleString()}\n`;

  return plainText;
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
