import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { DEFAULT_HOME_LAYOUT, normalizeHomeLayout, type HomeLayout } from "@/lib/home/schema";
import { SETTING_KEYS, setSetting } from "./settings";

/**
 * Published home page layout. Falls back to the shipped layout when nothing
 * has been saved yet or the stored JSON can no longer be parsed, so the home
 * page never breaks on a bad setting.
 */
export async function getHomeLayout(): Promise<HomeLayout> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, SETTING_KEYS.homeLayout),
  });
  if (!row) return DEFAULT_HOME_LAYOUT;
  try {
    const parsed = normalizeHomeLayout(JSON.parse(row.value));
    if (parsed) return parsed;
    console.error("[home] stored layout failed validation; using defaults");
  } catch (err) {
    console.error("[home] stored layout is not valid JSON; using defaults", err);
  }
  return DEFAULT_HOME_LAYOUT;
}

export async function setHomeLayout(layout: HomeLayout): Promise<HomeLayout> {
  await setSetting(SETTING_KEYS.homeLayout, JSON.stringify(layout));
  return layout;
}
