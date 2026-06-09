import {
  BOARD_SIZE,
  RARITIES,
  RARITY_BY_KEY,
  SHAPE_BY_ID,
  SHAPE_KINDS,
  SHAPES,
  STAT_BY_KEY,
  STAT_DEFS,
  STAT_VALUE_RULES,
  makeId
} from "./data/defaults.js";
import { calculateDamage } from "./damage/calc.js";
import {
  clearState,
  createDefaultState,
  loadState,
  parseImportedState,
  saveState,
  serializeState
} from "./storage.js";

let state = loadState();
let results = [];
let runStatus = {
  mode: "idle",
  message: "就绪",
  branches: 0,
  pruned: 0,
  elapsedMs: 0
};
let activeWorker = null;
let isDrawing = false;
let drawIntent = true;

const app = document.querySelector("#app");

render();

function render() {
  const character = getSelectedCharacter();
  const weapon = getSelectedWeapon();
  const currentItems = state.inventory.filter((item) => item.enabled || item.locked);
  const currentDamage = character && weapon
    ? calculateDamage({
        character,
        weapon,
        skill: state.skill,
        items: currentItems
      })
    : null;

  app.innerHTML = `
    <header class="topbar">
      <div>
        <h1>异环空幕伤害最大化计算器</h1>
        <p>NTE DriveBlock Optimizer</p>
      </div>
      <div class="topbar-actions">
        <button class="secondary" id="exportJson">导出 JSON</button>
        <button class="secondary" id="importJsonButton">导入 JSON</button>
        <button class="secondary" id="resetState">重置示例</button>
        <input class="file-input" id="importJson" type="file" accept="application/json,.json" />
      </div>
    </header>

    <main class="workspace">
      <section class="panel config-panel">
        ${renderCharacterPanel(character)}
        ${renderWeaponPanel(weapon)}
        ${renderSkillPanel()}
        ${renderFilterPanel()}
      </section>

      <section class="panel board-panel">
        ${renderBoardPanel()}
        ${renderInventoryPanel()}
      </section>

      <section class="panel result-panel">
        ${renderRunPanel(currentDamage)}
        ${renderResultsPanel()}
      </section>
    </main>
  `;

  bindGlobalActions();
  bindCharacterEvents();
  bindWeaponEvents();
  bindSkillEvents();
  bindFilterEvents();
  bindBoardEvents();
  bindInventoryEvents();
  bindRunEvents();
  syncNewCartridgeRuleValues();
}

function renderCharacterPanel(character) {
  if (!character) {
    return "";
  }
  return `
    <section class="section">
      <div class="section-header">
        <h2>角色</h2>
        <div class="inline-actions">
          <button class="small" id="addCharacter">新增</button>
          <button class="small danger" id="deleteCharacter">删除</button>
        </div>
      </div>
      <label class="field">
        <span>当前角色</span>
        <select id="selectedCharacter">
          ${state.characters
            .map(
              (item) =>
                `<option value="${escapeHtml(item.id)}" ${item.id === state.selectedCharacterId ? "selected" : ""}>${escapeHtml(item.name)}</option>`
            )
            .join("")}
        </select>
      </label>
      <div class="form-grid two">
        ${textInput("名称", character.name, "character", "name")}
        ${numberInput("基础攻击", character.baseAttack, "character", "baseAttack")}
        ${numberInput("基础生命", character.baseHp, "character", "baseHp")}
        ${numberInput("基础防御", character.baseDefense, "character", "baseDefense")}
        ${numberInput("基础暴击率", toPercent(character.baseCritRate), "character", "baseCritRate", "percent")}
        ${numberInput("基础暴击伤害", toPercent(character.baseCritDamage), "character", "baseCritDamage", "percent")}
      </div>
      <div class="preference-row">
        <label class="field">
          <span>偏好类型</span>
          <select data-character-field="preference.shapeKind">
            ${SHAPE_KINDS.map(
              (kind) =>
                `<option value="${kind.key}" ${kind.key === character.preference.shapeKind ? "selected" : ""}>${kind.label}</option>`
            ).join("")}
          </select>
        </label>
        <label class="field">
          <span>叠层属性</span>
          <select data-character-field="preference.stat">
            ${STAT_DEFS.map(
              (stat) =>
                `<option value="${stat.key}" ${stat.key === character.preference.stat ? "selected" : ""}>${stat.label}</option>`
            ).join("")}
          </select>
        </label>
        ${numberInput("每层数值", formatStatInput(character.preference.stat, character.preference.value), "character", "preference.value", statFormat(character.preference.stat))}
      </div>
    </section>
  `;
}

function renderWeaponPanel(weapon) {
  if (!weapon) {
    return "";
  }
  return `
    <section class="section">
      <div class="section-header">
        <h2>武器</h2>
        <div class="inline-actions">
          <button class="small" id="addWeapon">新增</button>
          <button class="small danger" id="deleteWeapon">删除</button>
        </div>
      </div>
      <label class="field">
        <span>当前武器</span>
        <select id="selectedWeapon">
          ${state.weapons
            .map(
              (item) =>
                `<option value="${escapeHtml(item.id)}" ${item.id === state.selectedWeaponId ? "selected" : ""}>${escapeHtml(item.name)}</option>`
            )
            .join("")}
        </select>
      </label>
      <div class="form-grid two">
        ${textInput("名称", weapon.name, "weapon", "name")}
        ${numberInput("基础攻击", weapon.baseAttack, "weapon", "baseAttack")}
        ${numberInput("攻击%", toPercent(weapon.stats.attackPct ?? 0), "weapon-stat", "attackPct", "percent")}
        ${numberInput("暴击率", toPercent(weapon.stats.critRate ?? 0), "weapon-stat", "critRate", "percent")}
        ${numberInput("暴击伤害", toPercent(weapon.stats.critDamage ?? 0), "weapon-stat", "critDamage", "percent")}
        ${numberInput("通用增伤", toPercent(weapon.stats.genericDamageBonus ?? 0), "weapon-stat", "genericDamageBonus", "percent")}
      </div>
    </section>
  `;
}

function renderSkillPanel() {
  return `
    <section class="section">
      <div class="section-header">
        <h2>伤害测算</h2>
      </div>
      <div class="form-grid two">
        ${numberInput("攻击倍率", toPercent(state.skill.attackMultiplier), "skill", "attackMultiplier", "percent")}
        ${numberInput("生命倍率", toPercent(state.skill.hpMultiplier), "skill", "hpMultiplier", "percent")}
        ${numberInput("防御倍率", toPercent(state.skill.defenseMultiplier), "skill", "defenseMultiplier", "percent")}
        ${numberInput("额外伤害值", state.skill.extraDamage, "skill", "extraDamage")}
      </div>
    </section>
  `;
}

function renderFilterPanel() {
  const invalid = new Set(state.invalidStats);
  return `
    <section class="section">
      <div class="section-header">
        <h2>计算控制</h2>
      </div>
      <div class="form-grid two">
        ${numberInput("Top N", state.topN, "state", "topN")}
        ${numberInput("分支阈值", state.branchLimit, "state", "branchLimit")}
      </div>
      <div class="check-list">
        ${STAT_DEFS.map(
          (stat) => `
            <label class="check-item">
              <input type="checkbox" data-invalid-stat="${stat.key}" ${invalid.has(stat.key) ? "checked" : ""} />
              <span>${stat.label}</span>
            </label>
          `
        ).join("")}
      </div>
    </section>
  `;
}

function renderBoardPanel() {
  const active = activeCellSet();
  return `
    <section class="section board-section">
      <div class="section-header">
        <h2>底板</h2>
        <div class="inline-actions">
          <button class="small" id="fillBoard">全开</button>
          <button class="small" id="clearBoard">清空</button>
        </div>
      </div>
      <div class="board-wrap">
        <div class="board-grid" id="boardGrid">
          ${Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
            const r = Math.floor(index / BOARD_SIZE);
            const c = index % BOARD_SIZE;
            const key = `${r},${c}`;
            return `<button class="board-cell ${active.has(key) ? "active" : "blocked"}" data-cell="${key}" aria-label="cell ${key}"></button>`;
          }).join("")}
        </div>
        <div class="shape-library">
          ${SHAPES.map((shape) => renderShapeCard(shape)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderShapeCard(shape) {
  return `
    <div class="shape-card">
      ${renderShapeMini(shape.id)}
      <span>${shape.name}</span>
    </div>
  `;
}

function renderInventoryPanel() {
  return `
    <section class="section inventory-section">
      <div class="section-header">
        <h2>空幕库存</h2>
        <span class="counter">${state.inventory.length} 件</span>
      </div>
      ${renderAddCartridgeForm()}
      <div class="inventory-list">
        ${state.inventory.map((item) => renderInventoryItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderAddCartridgeForm() {
  return `
    <div class="add-form">
      <input id="newCartName" type="text" value="新空幕" aria-label="空幕名称" />
      <select id="newCartRarity" aria-label="品质">
        ${RARITIES.map((rarity) => `<option value="${rarity.key}">${rarity.label}</option>`).join("")}
      </select>
      <select id="newCartShape" aria-label="形状">
        ${SHAPES.map((shape) => `<option value="${shape.id}">${shape.name}</option>`).join("")}
      </select>
      <select id="newCartStatA" aria-label="词条一">
        ${STAT_DEFS.map((stat) => `<option value="${stat.key}">${stat.label}</option>`).join("")}
      </select>
      <input id="newCartValueA" type="number" step="0.01" aria-label="词条一数值" />
      <select id="newCartStatB" aria-label="词条二">
        ${STAT_DEFS.map((stat, index) => `<option value="${stat.key}" ${index === 6 ? "selected" : ""}>${stat.label}</option>`).join("")}
      </select>
      <input id="newCartValueB" type="number" step="0.01" aria-label="词条二数值" />
      <button id="addCartridge">新增</button>
    </div>
  `;
}

function renderInventoryItem(item) {
  const shape = SHAPE_BY_ID[item.shapeId];
  const rarity = RARITY_BY_KEY[item.rarity];
  return `
    <article class="inventory-row ${item.enabled ? "" : "muted"}" data-item-id="${escapeHtml(item.id)}">
      <div class="inventory-toggles">
        <label class="toggle-line">
          <input type="checkbox" data-item-enabled="${escapeHtml(item.id)}" ${item.enabled ? "checked" : ""} />
          <span>参与</span>
        </label>
        <label class="toggle-line">
          <input type="checkbox" data-item-locked="${escapeHtml(item.id)}" ${item.locked ? "checked" : ""} />
          <span>锁定</span>
        </label>
      </div>
      ${renderShapeMini(item.shapeId)}
      <div class="inventory-main">
        <input class="item-name" value="${escapeAttribute(item.name)}" data-item-name="${escapeHtml(item.id)}" />
        <div class="meta-line">
          <span class="rarity" style="--rarity-color: ${rarity.color}">${rarity.label}</span>
          <span>${shape.name}</span>
          <span>${statSummary(item.stats)}</span>
        </div>
      </div>
      <button class="small danger" data-delete-item="${escapeHtml(item.id)}">删除</button>
    </article>
  `;
}

function renderRunPanel(currentDamage) {
  return `
    <section class="section">
      <div class="section-header">
        <h2>结果</h2>
        <div class="inline-actions">
          <button id="runOptimizer">开始计算</button>
          <button class="secondary" id="stopOptimizer" ${activeWorker ? "" : "disabled"}>停止</button>
        </div>
      </div>
      <div class="status-box ${runStatus.mode}">
        <strong>${escapeHtml(runStatus.message)}</strong>
        <span>分支 ${formatInteger(runStatus.branches)} / 剪枝 ${formatInteger(runStatus.pruned)} / ${formatMs(runStatus.elapsedMs)}</span>
      </div>
      ${
        currentDamage
          ? `
            <div class="metric-grid">
              <div><span>当前期望</span><strong>${formatNumber(currentDamage.expectedDamage)}</strong></div>
              <div><span>攻击</span><strong>${formatInteger(currentDamage.stats.attack)}</strong></div>
              <div><span>暴击率</span><strong>${formatPercent(currentDamage.stats.critRate)}</strong></div>
              <div><span>暴击伤害</span><strong>${formatPercent(currentDamage.stats.critDamage)}</strong></div>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderResultsPanel() {
  if (!results.length) {
    return `
      <section class="section result-list">
        <div class="empty-state">暂无方案</div>
      </section>
    `;
  }
  return `
    <section class="section result-list">
      ${results.map((result) => renderResult(result)).join("")}
    </section>
  `;
}

function renderResult(result) {
  const itemMap = new Map(state.inventory.map((item) => [item.id, item]));
  const items = result.itemIds.map((id) => itemMap.get(id)).filter(Boolean);
  return `
    <article class="result-card">
      <div class="result-head">
        <div>
          <span class="rank">#${result.rank}</span>
          <strong>${formatNumber(result.damage.expectedDamage)}</strong>
        </div>
        <span>${result.damage.preferenceCount} 层偏好</span>
      </div>
      <div class="result-body">
        ${renderResultBoard(result)}
        <div class="result-stats">
          <div>基础伤害 ${formatNumber(result.damage.baseDamage)}</div>
          <div>增伤区 ${formatMultiplier(result.damage.damageZone)}</div>
          <div>暴击期望 ${formatMultiplier(result.damage.critExpectation)}</div>
          <div>攻击 ${formatInteger(result.damage.stats.attack)}</div>
          <div>暴击率 ${formatPercent(result.damage.stats.critRate)}</div>
          <div>暴击伤害 ${formatPercent(result.damage.stats.critDamage)}</div>
        </div>
      </div>
      <div class="pill-row">
        ${items.map((item) => `<span class="pill">${escapeHtml(item.name)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderResultBoard(result) {
  const active = activeCellSet();
  const placementByCell = new Map();
  const colors = ["#e4574f", "#2f9f8f", "#d6a12b", "#4078c0", "#9a6fb0", "#5b8c47", "#c66b3d", "#5d7c8a"];
  result.placements.forEach((placement, index) => {
    for (const cell of placement.cells) {
      placementByCell.set(`${cell.r},${cell.c}`, colors[index % colors.length]);
    }
  });
  return `
    <div class="result-board">
      ${Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
        const r = Math.floor(index / BOARD_SIZE);
        const c = index % BOARD_SIZE;
        const key = `${r},${c}`;
        const color = placementByCell.get(key);
        const className = active.has(key) ? "result-cell" : "result-cell blocked";
        return `<span class="${className}" style="${color ? `--piece-color:${color}` : ""}"></span>`;
      }).join("")}
    </div>
  `;
}

function renderShapeMini(shapeId) {
  const shape = SHAPE_BY_ID[shapeId];
  const rows = shape.cells.map((cell) => cell.r);
  const cols = shape.cells.map((cell) => cell.c);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  return `
    <span class="shape-mini" style="--shape-rows:${maxR - minR + 1}; --shape-cols:${maxC - minC + 1};">
      ${shape.cells
        .map(
          (cell) =>
            `<i style="grid-row:${cell.r - minR + 1}; grid-column:${cell.c - minC + 1};"></i>`
        )
        .join("")}
    </span>
  `;
}

function bindGlobalActions() {
  document.querySelector("#exportJson").addEventListener("click", () => {
    const blob = new Blob([serializeState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nte-driveblock-optimizer-state.json";
    link.click();
    URL.revokeObjectURL(url);
  });
  document.querySelector("#importJsonButton").addEventListener("click", () => {
    document.querySelector("#importJson").click();
  });
  document.querySelector("#importJson").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      state = parseImportedState(await file.text());
      results = [];
      runStatus = { mode: "idle", message: "导入完成", branches: 0, pruned: 0, elapsedMs: 0 };
      persistAndRender();
    } catch (error) {
      alert("JSON 无法导入。");
    }
  });
  document.querySelector("#resetState").addEventListener("click", () => {
    if (!confirm("重置为示例数据？")) {
      return;
    }
    stopWorker();
    clearState();
    state = createDefaultState();
    results = [];
    runStatus = { mode: "idle", message: "已重置", branches: 0, pruned: 0, elapsedMs: 0 };
    persistAndRender();
  });
}

function bindCharacterEvents() {
  document.querySelector("#selectedCharacter").addEventListener("change", (event) => {
    state.selectedCharacterId = event.target.value;
    clearResults("角色已切换");
    persistAndRender();
  });
  document.querySelector("#addCharacter").addEventListener("click", () => {
    const base = structuredClone(getSelectedCharacter());
    base.id = makeId("char");
    base.name = "新角色";
    state.characters.push(base);
    state.selectedCharacterId = base.id;
    clearResults("已新增角色");
    persistAndRender();
  });
  document.querySelector("#deleteCharacter").addEventListener("click", () => {
    if (state.characters.length <= 1) {
      return;
    }
    state.characters = state.characters.filter((item) => item.id !== state.selectedCharacterId);
    state.selectedCharacterId = state.characters[0].id;
    clearResults("已删除角色");
    persistAndRender();
  });
  document.querySelectorAll("[data-character-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const character = getSelectedCharacter();
      const field = event.currentTarget.dataset.characterField;
      setNested(character, field, parseFieldValue(event.currentTarget));
      clearResults("角色数据已更新");
      persistAndRender();
    });
  });
}

function bindWeaponEvents() {
  document.querySelector("#selectedWeapon").addEventListener("change", (event) => {
    state.selectedWeaponId = event.target.value;
    clearResults("武器已切换");
    persistAndRender();
  });
  document.querySelector("#addWeapon").addEventListener("click", () => {
    const base = structuredClone(getSelectedWeapon());
    base.id = makeId("weapon");
    base.name = "新武器";
    state.weapons.push(base);
    state.selectedWeaponId = base.id;
    clearResults("已新增武器");
    persistAndRender();
  });
  document.querySelector("#deleteWeapon").addEventListener("click", () => {
    if (state.weapons.length <= 1) {
      return;
    }
    state.weapons = state.weapons.filter((item) => item.id !== state.selectedWeaponId);
    state.selectedWeaponId = state.weapons[0].id;
    clearResults("已删除武器");
    persistAndRender();
  });
  document.querySelectorAll("[data-weapon-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const weapon = getSelectedWeapon();
      weapon[event.currentTarget.dataset.weaponField] = parseFieldValue(event.currentTarget);
      clearResults("武器数据已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-weapon-stat-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const weapon = getSelectedWeapon();
      weapon.stats[event.currentTarget.dataset.weaponStatField] = parseFieldValue(event.currentTarget);
      clearResults("武器词条已更新");
      persistAndRender();
    });
  });
}

function bindSkillEvents() {
  document.querySelectorAll("[data-skill-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      state.skill[event.currentTarget.dataset.skillField] = parseFieldValue(event.currentTarget);
      clearResults("伤害参数已更新");
      persistAndRender();
    });
  });
}

function bindFilterEvents() {
  document.querySelectorAll("[data-state-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const field = event.currentTarget.dataset.stateField;
      state[field] = Math.max(1, Math.floor(Number(event.currentTarget.value) || state[field]));
      clearResults("计算控制已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-invalid-stat]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const key = event.currentTarget.dataset.invalidStat;
      const next = new Set(state.invalidStats);
      if (event.currentTarget.checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      state.invalidStats = [...next];
      clearResults("无效词条已更新");
      persistAndRender();
    });
  });
}

function bindBoardEvents() {
  document.querySelector("#fillBoard").addEventListener("click", () => {
    state.board.activeCells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
      r: Math.floor(index / BOARD_SIZE),
      c: index % BOARD_SIZE
    }));
    clearResults("底板已更新");
    persistAndRender();
  });
  document.querySelector("#clearBoard").addEventListener("click", () => {
    state.board.activeCells = [];
    clearResults("底板已更新");
    persistAndRender();
  });

  const grid = document.querySelector("#boardGrid");
  grid.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("[data-cell]");
    if (!target) {
      return;
    }
    event.preventDefault();
    isDrawing = true;
    const active = activeCellSet();
    drawIntent = !active.has(target.dataset.cell);
    setBoardCell(target.dataset.cell, drawIntent);
    window.addEventListener(
      "pointerup",
      () => {
        if (isDrawing) {
          isDrawing = false;
          clearResults("底板已更新");
          persistAndRender();
        }
      },
      { once: true }
    );
  });
  grid.addEventListener("pointerover", (event) => {
    if (!isDrawing) {
      return;
    }
    const target = event.target.closest("[data-cell]");
    if (!target) {
      return;
    }
    setBoardCell(target.dataset.cell, drawIntent);
  });
}

function bindInventoryEvents() {
  ["newCartRarity", "newCartShape", "newCartStatA", "newCartStatB"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("change", syncNewCartridgeRuleValues);
  });
  document.querySelector("#addCartridge").addEventListener("click", () => {
    const name = document.querySelector("#newCartName").value.trim() || "新空幕";
    const rarity = document.querySelector("#newCartRarity").value;
    const shapeId = document.querySelector("#newCartShape").value;
    const statA = document.querySelector("#newCartStatA").value;
    const statB = document.querySelector("#newCartStatB").value;
    const stats = {};
    stats[statA] = readStatInput("#newCartValueA", statA);
    stats[statB] = Number(stats[statB] ?? 0) + readStatInput("#newCartValueB", statB);
    state.inventory.push({
      id: makeId("cart"),
      name,
      rarity,
      shapeId,
      enabled: true,
      locked: false,
      stats
    });
    clearResults("库存已更新");
    persistAndRender();
  });
  document.querySelectorAll("[data-item-enabled]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const item = getInventoryItem(event.currentTarget.dataset.itemEnabled);
      item.enabled = event.currentTarget.checked;
      if (!item.enabled) {
        item.locked = false;
      }
      clearResults("库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-item-locked]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const item = getInventoryItem(event.currentTarget.dataset.itemLocked);
      item.locked = event.currentTarget.checked;
      if (item.locked) {
        item.enabled = true;
      }
      clearResults("锁定项已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-item-name]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const item = getInventoryItem(event.currentTarget.dataset.itemName);
      item.name = event.currentTarget.value.trim() || item.name;
      clearResults("库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-delete-item]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = event.currentTarget.dataset.deleteItem;
      state.inventory = state.inventory.filter((item) => item.id !== id);
      clearResults("库存已更新");
      persistAndRender();
    });
  });
}

function bindRunEvents() {
  document.querySelector("#runOptimizer").addEventListener("click", runOptimizer);
  document.querySelector("#stopOptimizer").addEventListener("click", () => {
    stopWorker();
    runStatus = {
      mode: "aborted",
      message: "已停止",
      branches: runStatus.branches,
      pruned: runStatus.pruned,
      elapsedMs: runStatus.elapsedMs
    };
    render();
  });
}

function runOptimizer() {
  stopWorker();
  results = [];
  runStatus = {
    mode: "running",
    message: "正在计算",
    branches: 0,
    pruned: 0,
    elapsedMs: 0
  };
  render();

  activeWorker = new Worker(new URL("./worker/optimizer.worker.js", import.meta.url), {
    type: "module"
  });
  activeWorker.addEventListener("message", (event) => {
    const { type } = event.data ?? {};
    if (type === "progress") {
      const progress = event.data.progress;
      runStatus = {
        mode: "running",
        message: `正在计算，已找到 ${progress.found} 个候选`,
        branches: progress.branches,
        pruned: progress.pruned,
        elapsedMs: progress.elapsedMs
      };
      patchStatus();
    }
    if (type === "result") {
      const result = event.data.result;
      results = result.results ?? [];
      runStatus = {
        mode: result.status,
        message: result.message,
        branches: result.meta?.branches ?? 0,
        pruned: result.meta?.pruned ?? 0,
        elapsedMs: result.meta?.elapsedMs ?? 0
      };
      stopWorker();
      render();
    }
    if (type === "error") {
      runStatus = {
        mode: "error",
        message: event.data.message || "计算失败",
        branches: runStatus.branches,
        pruned: runStatus.pruned,
        elapsedMs: runStatus.elapsedMs
      };
      stopWorker();
      render();
    }
  });
  activeWorker.postMessage({
    type: "optimize",
    task: {
      boardCells: state.board.activeCells,
      inventory: state.inventory,
      character: getSelectedCharacter(),
      weapon: getSelectedWeapon(),
      skill: state.skill,
      invalidStats: state.invalidStats,
      topN: state.topN,
      branchLimit: state.branchLimit
    }
  });
}

function patchStatus() {
  const box = document.querySelector(".status-box");
  if (!box) {
    return;
  }
  box.className = `status-box ${runStatus.mode}`;
  box.innerHTML = `
    <strong>${escapeHtml(runStatus.message)}</strong>
    <span>分支 ${formatInteger(runStatus.branches)} / 剪枝 ${formatInteger(runStatus.pruned)} / ${formatMs(runStatus.elapsedMs)}</span>
  `;
}

function stopWorker() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
}

function clearResults(message) {
  results = [];
  runStatus = {
    mode: "idle",
    message,
    branches: 0,
    pruned: 0,
    elapsedMs: 0
  };
}

function syncNewCartridgeRuleValues() {
  const rarity = document.querySelector("#newCartRarity")?.value ?? "gold";
  const shapeId = document.querySelector("#newCartShape")?.value ?? "2-h";
  const statA = document.querySelector("#newCartStatA")?.value ?? "attackPct";
  const statB = document.querySelector("#newCartStatB")?.value ?? "critRate";
  const area = SHAPE_BY_ID[shapeId].area;
  setRuleInputValue("#newCartValueA", statA, STAT_VALUE_RULES[rarity][area][statA] ?? 0);
  setRuleInputValue("#newCartValueB", statB, STAT_VALUE_RULES[rarity][area][statB] ?? 0);
}

function setRuleInputValue(selector, statKey, rawValue) {
  const input = document.querySelector(selector);
  if (!input) {
    return;
  }
  input.value = statFormat(statKey) === "percent" ? toPercent(rawValue).toString() : String(rawValue);
}

function readStatInput(selector, statKey) {
  const value = Number(document.querySelector(selector).value || 0);
  return statFormat(statKey) === "percent" ? value / 100 : value;
}

function setBoardCell(key, active) {
  const cells = activeCellSet();
  if (active) {
    cells.add(key);
  } else {
    cells.delete(key);
  }
  state.board.activeCells = [...cells].map((cellKey) => {
    const [r, c] = cellKey.split(",").map(Number);
    return { r, c };
  });
  saveState(state);
  const cell = document.querySelector(`[data-cell="${key}"]`);
  if (cell) {
    cell.classList.toggle("active", active);
    cell.classList.toggle("blocked", !active);
  }
}

function persistAndRender() {
  saveState(state);
  render();
}

function activeCellSet() {
  return new Set(state.board.activeCells.map((cell) => `${cell.r},${cell.c}`));
}

function getSelectedCharacter() {
  return state.characters.find((item) => item.id === state.selectedCharacterId) ?? state.characters[0];
}

function getSelectedWeapon() {
  return state.weapons.find((item) => item.id === state.selectedWeaponId) ?? state.weapons[0];
}

function getInventoryItem(id) {
  return state.inventory.find((item) => item.id === id);
}

function setNested(target, path, value) {
  const parts = path.split(".");
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = current[parts[index]];
  }
  current[parts.at(-1)] = value;
}

function parseFieldValue(input) {
  if (input.dataset.format === "percent") {
    return Number(input.value || 0) / 100;
  }
  if (input.type === "number") {
    return Number(input.value || 0);
  }
  return input.value;
}

function textInput(label, value, scope, field) {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="text" value="${escapeAttribute(value)}" data-${scope}-field="${field}" />
    </label>
  `;
}

function numberInput(label, value, scope, field, format = "number") {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="number" step="0.01" value="${escapeAttribute(value)}" data-${scope}-field="${field}" data-format="${format}" />
    </label>
  `;
}

function statSummary(stats) {
  return Object.entries(stats ?? {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${STAT_BY_KEY[key]?.label ?? key} ${formatStatValue(key, value)}`)
    .join(" / ");
}

function formatStatInput(statKey, value) {
  return statFormat(statKey) === "percent" ? toPercent(value) : value;
}

function statFormat(statKey) {
  return STAT_BY_KEY[statKey]?.kind === "percent" ? "percent" : "number";
}

function formatStatValue(statKey, value) {
  return statFormat(statKey) === "percent" ? formatPercent(value) : formatInteger(value);
}

function toPercent(value) {
  return Number((Number(value ?? 0) * 100).toFixed(2));
}

function formatPercent(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

function formatMultiplier(value) {
  return `${Number(value ?? 0).toFixed(3)}x`;
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("zh-CN", {
    maximumFractionDigits: 2
  });
}

function formatInteger(value) {
  return Math.round(Number(value ?? 0)).toLocaleString("zh-CN");
}

function formatMs(value) {
  if (!value) {
    return "0 ms";
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }
  return `${(value / 1000).toFixed(2)} s`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
