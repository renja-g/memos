import { observer } from "mobx-react-lite";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  HomeIcon,
  InboxIcon,
  PaperclipIcon,
  ArchiveIcon,
  SettingsIcon,
  CompassIcon,
  FileTextIcon,
  HashIcon,
} from "lucide-react";
import { memoStore, userStore, memoFilterStore } from "@/store";
import { Routes } from "@/router";
import { State } from "@/types/proto/api/v1/common";

/**
 * A global command palette (⌘K / Ctrl+K) powered by cmdk + shadcn/ui.
 *
 * Features implemented in this initial version:
 * 1. Quick navigation to core routes (Home, Inbox, etc.)
 * 2. Jump to recently updated memos (top 20 by display time)
 * 3. Filter by tag – selecting a tag adds it to the current memo filters
 */
const CommandPalette = observer(() => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Fetch latest memos when the palette is opened for the first time.
  const [hasFetchedMemos, setHasFetchedMemos] = useState(false);

  useEffect(() => {
    if (open && !hasFetchedMemos) {
      memoStore
        .fetchMemos({
          parent: "", // workspace root
          state: State.NORMAL,
          orderBy: "display_time desc",
          pageSize: 20,
        })
        .finally(() => setHasFetchedMemos(true));
    }
  }, [open, hasFetchedMemos]);

  // Global keyboard shortcuts to toggle the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on mac, Ctrl+K otherwise
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Static navigation actions
  const staticActions = useMemo(
    () => [
      { id: "home", label: "Home", path: Routes.ROOT, icon: <HomeIcon /> },
      { id: "inbox", label: "Inbox", path: Routes.INBOX, icon: <InboxIcon /> },
      { id: "attachments", label: "Attachments", path: Routes.ATTACHMENTS, icon: <PaperclipIcon /> },
      { id: "archived", label: "Archived", path: Routes.ARCHIVED, icon: <ArchiveIcon /> },
      { id: "settings", label: "Settings", path: Routes.SETTING, icon: <SettingsIcon /> },
      { id: "explore", label: "Explore", path: Routes.EXPLORE, icon: <CompassIcon /> },
    ],
    []
  );

  const memoItems = memoStore.state.memos;
  const tagItems = Object.keys(userStore.state.tagCount).sort();

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      setOpen(false);
    },
    [navigate]
  );

  const handleMemoSelect = (name: string) => {
    const uid = name.split("/").pop();
    if (uid) {
      handleNavigate(`/memos/${uid}`);
    }
  };

  const handleTagSelect = (tag: string) => {
    memoFilterStore.addFilter({ factor: "tagSearch", value: tag });
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {staticActions.map((action) => (
            <CommandItem key={action.id} onSelect={() => handleNavigate(action.path)}>
              {action.icon}
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {memoItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Memos">
              {memoItems.map((memo) => (
                <CommandItem key={memo.name} onSelect={() => handleMemoSelect(memo.name)}>
                  <FileTextIcon />
                  <span>{memo.content.slice(0, 50) || memo.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tagItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {tagItems.map((tag) => (
                <CommandItem key={tag} onSelect={() => handleTagSelect(tag)}>
                  <HashIcon />
                  <span>#{tag}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
});

export default CommandPalette; 