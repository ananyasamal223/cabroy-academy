import * as SiIcons from "react-icons/si";
import {
  BarChart3,
  Bot,
  Code2,
  Database,
  FileSpreadsheet,
  GitBranch,
  Mail,
  Megaphone,
  PieChart,
  Share2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

// Each tool: real brand icon name(s) to try in react-icons/si (first match wins),
// a Lucide fallback icon (used if none of the si names exist in the installed
// package version), and the brand's real hex color.
const TOOL_ICONS = {
  "Google Ads": { si: ["SiGoogleads"], fallback: BarChart3, color: "#4285F4" },
  "Meta Ads": { si: ["SiMeta"], fallback: Share2, color: "#0866FF" },
  "Google Analytics": { si: ["SiGoogleanalytics"], fallback: TrendingUp, color: "#E8710A" },
  HubSpot: { si: ["SiHubspot"], fallback: Megaphone, color: "#FF7A59" },
  Mailchimp: { si: ["SiMailchimp"], fallback: Mail, color: "#FFE01B", dark: true },
  Excel: { si: ["SiMicrosoftexcel"], fallback: FileSpreadsheet, color: "#217346" },
  SQL: { si: [], fallback: Database, color: "#00618A" }, // no single generic "SQL" brand mark exists
  "Power BI": { si: ["SiPowerbi"], fallback: PieChart, color: "#F2C811", dark: true },
  Tableau: { si: ["SiTableau"], fallback: BarChart3, color: "#E97627" },
  Python: { si: ["SiPython"], fallback: Code2, color: "#3776AB" },
  ChatGPT: { si: ["SiChatgpt", "SiOpenai"], fallback: Bot, color: "#10A37F" },
  Zapier: { si: ["SiZapier"], fallback: Zap, color: "#FF4A00" },
  Make: { si: ["SiMake"], fallback: Workflow, color: "#6D00CC" },
  n8n: { si: ["SiN8N", "SiN8n"], fallback: GitBranch, color: "#EA4B71" },
};

const DEFAULT = { si: [], fallback: Code2, color: "#334155" };

export default function ToolIcon({ name, size = 16 }) {
  const config = TOOL_ICONS[name] || DEFAULT;

  // Try each candidate real-logo name; use the first one that actually
  // exists in this installed version of react-icons/si.
  let RealIcon = null;
  for (const candidate of config.si) {
    if (SiIcons[candidate]) {
      RealIcon = SiIcons[candidate];
      break;
    }
  }

  const Icon = RealIcon || config.fallback;

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size + 12,
        height: size + 12,
        backgroundColor: `${config.color}1A`,
      }}
    >
      <Icon
        size={size}
        color={config.color}
        style={config.dark ? { filter: "brightness(0.75)" } : undefined}
      />
    </span>
  );
}
