import {
  DEFAULT_CHARACTERS,
  DEFAULT_INVENTORY,
  DEFAULT_WEAPONS,
  fullBoardCells
} from "./data/defaults.js";

const STORAGE_KEY = "nte-driveblock-optimizer-state-v1";

export function createDefaultState() {
  return {
    version: 1,
    board: {
      size: 5,
      activeCells: fullBoardCells()
    },
    characters: structuredClone(DEFAULT_CHARACTERS),
    weapons: structuredClone(DEFAULT_WEAPONS),
    inventory: structuredClone(DEFAULT_INVENTORY),
    selectedCharacterId: DEFAULT_CHARACTERS[0].id,
    selectedWeaponId: DEFAULT_WEAPONS[0].id,
    skill: {
      attackMultiplier: 2.5,
      hpMultiplier: 0,
      defenseMultiplier: 0,
      extraDamage: 0
    },
    invalidStats: ["hpPct", "hpFlat", "defensePct", "defenseFlat"],
    topN: 5,
    branchLimit: 100000
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    return migrateState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to load saved state.", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function serializeState(state) {
  return JSON.stringify(state, null, 2);
}

export function parseImportedState(text) {
  const parsed = JSON.parse(text);
  return migrateState(parsed);
}

function migrateState(value) {
  const fallback = createDefaultState();
  return {
    ...fallback,
    ...value,
    board: {
      ...fallback.board,
      ...(value.board ?? {})
    },
    characters: Array.isArray(value.characters) ? value.characters : fallback.characters,
    weapons: Array.isArray(value.weapons) ? value.weapons : fallback.weapons,
    inventory: Array.isArray(value.inventory) ? value.inventory : fallback.inventory,
    skill: {
      ...fallback.skill,
      ...(value.skill ?? {})
    },
    invalidStats: Array.isArray(value.invalidStats) ? value.invalidStats : fallback.invalidStats,
    topN: Number(value.topN) || fallback.topN,
    branchLimit: Number(value.branchLimit) || fallback.branchLimit
  };
}
