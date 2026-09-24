export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  perform: () => void;
}

function scoreCommand(query: string, command: PaletteCommand): number {
  const label = command.label.toLowerCase();
  if (label === query) return 5;
  if (label.startsWith(query)) return 4;
  if (label.includes(query)) return 3;

  const keywords = (command.keywords ?? []).map((keyword) => keyword.toLowerCase());
  if (keywords.some((keyword) => keyword === query || keyword.startsWith(query))) return 2;
  if (keywords.some((keyword) => keyword.includes(query))) return 1;
  return 0;
}

export function rankCommands(query: string, commands: PaletteCommand[]): PaletteCommand[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return commands;

  return commands
    .map((command) => ({ command, score: scoreCommand(trimmed, command) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.command.label.localeCompare(b.command.label))
    .map((entry) => entry.command);
}
