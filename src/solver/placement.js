import { chooseBestCassette, itemDamageDelta } from "../damage/calc.js";
import { BOARD_SIZE, SHAPE_BY_ID } from "../data/defaults.js";

export function optimizeDriveBlocks(task, onProgress = () => {}) {
  const startedAt = performance.now();
  const boardSet = new Set(task.boardCells.map(coordKey));
  const driveBlocks = task.driveBlocks ?? task.inventory ?? [];
  const lockedIds = new Set(driveBlocks.filter((item) => item.locked).map((item) => item.id));
  const invalidStats = new Set(task.invalidStats ?? []);
  const topN = Math.max(1, Number(task.topN ?? 5));
  const branchLimit = Math.max(1, Number(task.branchLimit ?? 100000));
  const fillPriority = [2, 3, 4].includes(Number(task.fillPriority)) ? Number(task.fillPriority) : 3;
  const requiredShapeCounts = countRequiredShapes(task.requiredShapes ?? []);

  let branches = 0;
  let pruned = 0;
  let lastProgressAt = 0;
  let abortedReason = "";

  const selectedBlocks = driveBlocks
    .filter((item) => item.enabled || item.locked)
    .filter((item) => item.locked || !hasInvalidAffix(item, invalidStats))
    .filter((item) => SHAPE_BY_ID[item.shapeId]);

  const cassetteCandidates = (task.cassettes ?? [])
    .filter((cassette) => cassette.enabled)
    .filter((cassette) => !hasInvalidAffix(cassette, invalidStats));

  const selectedIds = new Set(selectedBlocks.map((item) => item.id));
  for (const lockedId of lockedIds) {
    if (!selectedIds.has(lockedId)) {
      return {
        status: "no-solution",
        message: "存在被锁定但未参与计算的驱动块。",
        results: [],
        meta: { branches, pruned, elapsedMs: performance.now() - startedAt }
      };
    }
  }

  for (const [shapeId, count] of Object.entries(requiredShapeCounts)) {
    const available = selectedBlocks.filter((item) => item.shapeId === shapeId).length;
    if (available < count) {
      return {
        status: "no-solution",
        message: "参与计算的驱动块不足以满足必选形状。",
        results: [],
        meta: { branches, pruned, elapsedMs: performance.now() - startedAt }
      };
    }
  }

  if (!boardSet.size) {
    return {
      status: "no-solution",
      message: "底板没有可用格。",
      results: [],
      meta: { branches, pruned, elapsedMs: performance.now() - startedAt }
    };
  }

  const selectedArea = selectedBlocks.reduce((sum, item) => sum + SHAPE_BY_ID[item.shapeId].area, 0);
  if (selectedArea < boardSet.size) {
    return {
      status: "no-solution",
      message: "参与计算的驱动块总面积不足。",
      results: [],
      meta: { branches, pruned, elapsedMs: performance.now() - startedAt }
    };
  }

  const context = {
    character: task.character,
    weapon: task.weapon,
    skill: task.skill,
    statTables: task.statTables
  };

  const scores = new Map(selectedBlocks.map((item) => [item.id, itemDamageDelta(context, item)]));
  const blocksById = new Map(selectedBlocks.map((item) => [item.id, item]));
  const candidateIds = selectedBlocks
    .map((item) => item.id)
    .sort((a, b) => {
      const aLocked = lockedIds.has(a) ? 1 : 0;
      const bLocked = lockedIds.has(b) ? 1 : 0;
      if (aLocked !== bLocked) {
        return bLocked - aLocked;
      }
      const aPriority = SHAPE_BY_ID[blocksById.get(a).shapeId].area === fillPriority ? 1 : 0;
      const bPriority = SHAPE_BY_ID[blocksById.get(b).shapeId].area === fillPriority ? 1 : 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
    });

  const results = [];
  const seenItemSets = new Set();
  const initialRequiredIds = new Set(candidateIds.filter((id) => lockedIds.has(id)));

  function dfs(cellsLeft, unusedIds, requiredIds, requiredShapesLeft, placements) {
    if (abortedReason) {
      return;
    }
    if (branches >= branchLimit) {
      abortedReason = "方案过多，请增加锁定驱动块或减少参与计算的库存数量。";
      return;
    }

    const now = performance.now();
    if (now - lastProgressAt > 180) {
      lastProgressAt = now;
      onProgress({
        branches,
        pruned,
        found: results.length,
        elapsedMs: now - startedAt
      });
    }

    if (!cellsLeft.size) {
      if (!requiredIds.size && requiredShapeSatisfied(requiredShapesLeft)) {
        addResult(placements);
      }
      return;
    }

    if (!areaFeasible(cellsLeft.size, unusedIds, requiredIds)) {
      pruned += 1;
      return;
    }

    const minRemainingArea = getMinArea(unusedIds);
    if (minRemainingArea && hasTinyIsland(cellsLeft, minRemainingArea)) {
      pruned += 1;
      return;
    }

    const anchor = getTopLeft(cellsLeft);
    const orderedIds = orderCandidates(unusedIds, requiredIds, requiredShapesLeft);

    for (const itemId of orderedIds) {
      const item = blocksById.get(itemId);
      const shape = SHAPE_BY_ID[item.shapeId];
      branches += 1;

      const placedCells = tryPlace(shape, anchor, cellsLeft);
      if (!placedCells) {
        continue;
      }

      const nextCells = new Set(cellsLeft);
      for (const key of placedCells.keys) {
        nextCells.delete(key);
      }

      const nextUnused = new Set(unusedIds);
      nextUnused.delete(itemId);
      const nextRequired = new Set(requiredIds);
      nextRequired.delete(itemId);
      const nextRequiredShapes = decrementShapeRequirement(requiredShapesLeft, item.shapeId);
      dfs(nextCells, nextUnused, nextRequired, nextRequiredShapes, [
        ...placements,
        {
          itemId,
          cells: placedCells.coords
        }
      ]);
      if (abortedReason) {
        return;
      }
    }
  }

  function orderCandidates(unusedIds, requiredIds, requiredShapesLeft) {
    return candidateIds.filter((id) => unusedIds.has(id)).sort((a, b) => {
      const aRequired = requiredIds.has(a) ? 1 : 0;
      const bRequired = requiredIds.has(b) ? 1 : 0;
      if (aRequired !== bRequired) {
        return bRequired - aRequired;
      }
      const aShapeRequired = (requiredShapesLeft[blocksById.get(a).shapeId] ?? 0) > 0 ? 1 : 0;
      const bShapeRequired = (requiredShapesLeft[blocksById.get(b).shapeId] ?? 0) > 0 ? 1 : 0;
      if (aShapeRequired !== bShapeRequired) {
        return bShapeRequired - aShapeRequired;
      }
      const aPriority = SHAPE_BY_ID[blocksById.get(a).shapeId].area === fillPriority ? 1 : 0;
      const bPriority = SHAPE_BY_ID[blocksById.get(b).shapeId].area === fillPriority ? 1 : 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
    });
  }

  function areaFeasible(areaLeft, unusedIds, requiredIds) {
    let requiredArea = 0;
    const optionalAreas = [];
    for (const id of unusedIds) {
      const area = SHAPE_BY_ID[blocksById.get(id).shapeId].area;
      if (requiredIds.has(id)) {
        requiredArea += area;
      } else {
        optionalAreas.push(area);
      }
    }

    const optionalTarget = areaLeft - requiredArea;
    if (optionalTarget < 0) {
      return false;
    }
    if (optionalTarget === 0) {
      return true;
    }

    const reachable = Array(optionalTarget + 1).fill(false);
    reachable[0] = true;
    for (const area of optionalAreas) {
      for (let value = optionalTarget; value >= area; value -= 1) {
        reachable[value] = reachable[value] || reachable[value - area];
      }
    }
    return reachable[optionalTarget];
  }

  function getMinArea(unusedIds) {
    let min = Infinity;
    for (const id of unusedIds) {
      min = Math.min(min, SHAPE_BY_ID[blocksById.get(id).shapeId].area);
    }
    return Number.isFinite(min) ? min : 0;
  }

  function addResult(placements) {
    const driveBlockIds = placements.map((placement) => placement.itemId).sort();
    const itemSetKey = driveBlockIds.join("|");
    if (seenItemSets.has(itemSetKey)) {
      return;
    }
    seenItemSets.add(itemSetKey);

    const placedBlocks = driveBlockIds.map((id) => blocksById.get(id));
    const best = chooseBestCassette(context, cassetteCandidates, placedBlocks);

    results.push({
      rank: 0,
      damage: best.damage,
      placements: placements.map((placement) => ({
        itemId: placement.itemId,
        cells: placement.cells
      })),
      driveBlockIds,
      itemIds: driveBlockIds,
      cassetteId: best.cassette?.id ?? null
    });
    results.sort((a, b) => b.damage.expectedDamage - a.damage.expectedDamage);
    if (results.length > topN) {
      results.length = topN;
    }
  }

  dfs(boardSet, new Set(candidateIds), initialRequiredIds, requiredShapeCounts, []);

  const elapsedMs = performance.now() - startedAt;
  const ranked = results.map((result, index) => ({
    ...result,
    rank: index + 1
  }));

  if (abortedReason) {
    return {
      status: "aborted",
      message: abortedReason,
      results: ranked,
      meta: { branches, pruned, elapsedMs }
    };
  }

  if (!ranked.length) {
    return {
      status: "no-solution",
      message: "没有找到完全填满底板的组合。",
      results: [],
      meta: { branches, pruned, elapsedMs }
    };
  }

  return {
    status: "done",
    message: "计算完成。",
    results: ranked,
    meta: { branches, pruned, elapsedMs }
  };
}

export const optimizeInventory = optimizeDriveBlocks;

export function coordKey(coord) {
  return `${coord.r},${coord.c}`;
}

export function parseCoordKey(key) {
  const [r, c] = key.split(",").map(Number);
  return { r, c };
}

export function tryPlace(shape, anchor, cellsLeft) {
  const coords = [];
  const keys = [];
  for (const cell of shape.cells) {
    const coord = {
      r: anchor.r + cell.r,
      c: anchor.c + cell.c
    };
    if (
      coord.r < 0 ||
      coord.r >= BOARD_SIZE ||
      coord.c < 0 ||
      coord.c >= BOARD_SIZE ||
      !cellsLeft.has(coordKey(coord))
    ) {
      return null;
    }
    coords.push(coord);
    keys.push(coordKey(coord));
  }
  return { coords, keys };
}

export function getTopLeft(cells) {
  let best = null;
  for (const key of cells) {
    const coord = parseCoordKey(key);
    if (!best || coord.r < best.r || (coord.r === best.r && coord.c < best.c)) {
      best = coord;
    }
  }
  return best;
}

function hasInvalidAffix(item, invalidStats) {
  const affixes = [...(item.affixes ?? [])];
  if (item.mainAffix) {
    affixes.push(item.mainAffix);
  }
  return affixes.some((affix) => invalidStats.has(affix?.statKey) && Number(affix?.value ?? 0) !== 0);
}

function countRequiredShapes(shapeIds) {
  const counts = {};
  for (const shapeId of shapeIds) {
    if (SHAPE_BY_ID[shapeId]) {
      counts[shapeId] = (counts[shapeId] ?? 0) + 1;
    }
  }
  return counts;
}

function decrementShapeRequirement(requiredShapesLeft, shapeId) {
  if (!requiredShapesLeft[shapeId]) {
    return requiredShapesLeft;
  }
  return {
    ...requiredShapesLeft,
    [shapeId]: requiredShapesLeft[shapeId] - 1
  };
}

function requiredShapeSatisfied(requiredShapesLeft) {
  return Object.values(requiredShapesLeft).every((count) => count <= 0);
}

function hasTinyIsland(cells, minArea) {
  const remaining = new Set(cells);
  while (remaining.size) {
    const start = remaining.values().next().value;
    const stack = [start];
    remaining.delete(start);
    let size = 0;
    while (stack.length) {
      const key = stack.pop();
      size += 1;
      const coord = parseCoordKey(key);
      for (const next of neighbors(coord)) {
        const nextKey = coordKey(next);
        if (remaining.has(nextKey)) {
          remaining.delete(nextKey);
          stack.push(nextKey);
        }
      }
    }
    if (size < minArea) {
      return true;
    }
  }
  return false;
}

function neighbors(coord) {
  return [
    { r: coord.r - 1, c: coord.c },
    { r: coord.r + 1, c: coord.c },
    { r: coord.r, c: coord.c - 1 },
    { r: coord.r, c: coord.c + 1 }
  ].filter((next) => next.r >= 0 && next.r < BOARD_SIZE && next.c >= 0 && next.c < BOARD_SIZE);
}
