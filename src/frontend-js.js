import { getJsState } from "./frontend-state.js";
import { getJsSidebar } from "./frontend-sidebar.js";
import { getJsChat } from "./frontend-chat.js";
import { getJsUsage } from "./frontend-usage.js";
import { getJsFiles } from "./frontend-files.js";
import { getJsSettings } from "./frontend-settings.js";
import { getJsGuide } from "./frontend-guide.js";
import { getJsShortcuts } from "./frontend-shortcuts.js";
import { getJsInit } from "./frontend-init.js";
import { getJsImport } from "./frontend-import.js";

export function getFrontendJs() {
  return "<script>"
    + getJsState()
    + getJsSidebar()
    + getJsChat()
    + getJsUsage()
    + getJsFiles()
    + getJsSettings()
    + getJsGuide()
    + getJsShortcuts()
    + getJsInit()
    + getJsImport()
    + "</script></body></html>";
}
