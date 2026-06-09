import {
  BOARD_SIZE,
  CASSETTE_AFFIX_KEYS,
  CASSETTE_MAIN_AFFIX_KEYS,
  DRIVE_BLOCK_AFFIX_KEYS,
  RARITIES,
  RARITY_BY_KEY,
  SHAPE_BY_ID,
  SHAPE_KINDS,
  SHAPES,
  STAT_BY_KEY,
  STAT_DEFS,
  getCassetteAffixValue,
  getCassetteMainAffixValue,
  getDriveBlockAffixValue,
  getDriveBlockBaseStats,
  makeAffixes,
  makeId,
  resolveCassetteMainAffix
} from "./data/defaults.js";
import { chooseBestCassette } from "./damage/calc.js";
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
  const currentBlocks = state.driveBlocks.filter((item) => item.enabled || item.locked);
  const currentCassetteChoice =
    character && weapon
      ? chooseBestCassette(
          { character, weapon, skill: state.skill, statTables: state.statTables },
          selectableCassettes(),
          currentBlocks
        )
      : null;
  const currentDamage = currentCassetteChoice?.damage ?? null;

  app.innerHTML = `
    <header class="topbar">
      <div>
        <h1>异环驱动块伤害最大化计算器</h1>
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
        ${renderDataTablePanel()}
      </section>

      <section class="panel board-panel">
        ${renderBoardPanel()}
        ${renderDriveBlockPanel()}
        ${renderCassettePanel()}
      </section>

      <section class="panel result-panel">
        ${renderRunPanel(currentDamage, currentCassetteChoice?.cassette ?? null)}
        ${renderResultsPanel()}
      </section>
    </main>
  `;

  bindGlobalActions();
  bindCharacterEvents();
  bindWeaponEvents();
  bindSkillEvents();
  bindFilterEvents();
  bindDataTableEvents();
  bindBoardEvents();
  bindDriveBlockEvents();
  bindCassetteEvents();
  bindRunEvents();
}

function renderCharacterPanel(character) {
  if (!character) return "";
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
          ${state.characters.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.selectedCharacterId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
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
            ${SHAPE_KINDS.map((kind) => `<option value="${kind.key}" ${kind.key === character.preference.shapeKind ? "selected" : ""}>${kind.label}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>叠层属性</span>
          <select data-character-field="preference.stat">
            ${statOptions(DRIVE_BLOCK_AFFIX_KEYS, character.preference.stat)}
          </select>
        </label>
        ${numberInput("每层数值", formatStatInput(character.preference.stat, character.preference.value), "character", "preference.value", statFormat(character.preference.stat))}
      </div>
    </section>
  `;
}

function renderWeaponPanel(weapon) {
  if (!weapon) return "";
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
          ${state.weapons.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.selectedWeaponId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
        </select>
      </label>
      <div class="form-grid two">
        ${textInput("名称", weapon.name, "weapon", "name")}
        ${numberInput("基础攻击", weapon.baseAttack, "weapon", "baseAttack")}
        ${numberInput("攻击力百分比", toPercent(weapon.stats.attackPct ?? 0), "weapon-stat", "attackPct", "percent")}
        ${numberInput("暴击率", toPercent(weapon.stats.critRate ?? 0), "weapon-stat", "critRate", "percent")}
        ${numberInput("暴击伤害", toPercent(weapon.stats.critDamage ?? 0), "weapon-stat", "critDamage", "percent")}
        ${numberInput("通用伤害增强", toPercent(weapon.stats.genericDamageBonus ?? 0), "weapon-stat", "genericDamageBonus", "percent")}
      </div>
    </section>
  `;
}

function renderSkillPanel() {
  return `
    <section class="section">
      <div class="section-header"><h2>伤害测算</h2></div>
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
      <div class="section-header"><h2>计算控制</h2></div>
      <div class="form-grid two">
        ${numberInput("Top N", state.topN, "state", "topN")}
        ${numberInput("分支阈值", state.branchLimit, "state", "branchLimit")}
        <label class="field">
          <span>填充优先级</span>
          <select data-state-field="fillPriority">
            <option value="2" ${state.fillPriority === 2 ? "selected" : ""}>优先 II 型（2格）</option>
            <option value="3" ${state.fillPriority === 3 ? "selected" : ""}>优先 III 型（3格）</option>
            <option value="4" ${state.fillPriority === 4 ? "selected" : ""}>优先 IV 型（4格）</option>
          </select>
        </label>
      </div>
      <div class="check-list">
        ${STAT_DEFS.map((stat) => `
          <label class="check-item">
            <input type="checkbox" data-invalid-stat="${stat.key}" ${invalid.has(stat.key) ? "checked" : ""} />
            <span>${stat.label}</span>
          </label>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDataTablePanel() {
  return `
    <section class="section data-table-section">
      <div class="section-header">
        <h2>数据表</h2>
      </div>
      <div class="data-table-block">
        <h3>驱动块每格基础属性</h3>
        <div class="table-grid base-table">
          <span></span>
          ${RARITIES.map((rarity) => `<strong>${rarity.label}</strong>`).join("")}
          ${["attackFlat", "hpFlat"].map((statKey) => `
            <span>${STAT_BY_KEY[statKey].label}</span>
            ${RARITIES.map((rarity) => dataTableInput("driveBlockBasePerCell", rarity.key, statKey)).join("")}
          `).join("")}
        </div>
      </div>
      <div class="data-table-block">
        <h3>驱动块每格词条数值</h3>
        <div class="table-grid stat-table">
          <span></span>
          ${RARITIES.map((rarity) => `<strong>${rarity.label}</strong>`).join("")}
          ${DRIVE_BLOCK_AFFIX_KEYS.map((statKey) => `
            <span>${STAT_BY_KEY[statKey].label}</span>
            ${RARITIES.map((rarity) => dataTableInput("driveBlockAffixPerCell", rarity.key, statKey)).join("")}
          `).join("")}
        </div>
      </div>
      <div class="data-table-block">
        <h3>卡带主词条固定数值</h3>
        <div class="table-grid stat-table">
          <span></span>
          ${RARITIES.map((rarity) => `<strong>${rarity.label}</strong>`).join("")}
          ${CASSETTE_MAIN_AFFIX_KEYS.map((statKey) => `
            <span>${STAT_BY_KEY[statKey].label}</span>
            ${RARITIES.map((rarity) => dataTableInput("cassetteMainAffixValues", rarity.key, statKey)).join("")}
          `).join("")}
        </div>
      </div>
      <div class="data-table-block">
        <h3>卡带副词条固定数值</h3>
        <div class="table-grid stat-table">
          <span></span>
          ${RARITIES.map((rarity) => `<strong>${rarity.label}</strong>`).join("")}
          ${CASSETTE_AFFIX_KEYS.map((statKey) => `
            <span>${STAT_BY_KEY[statKey].label}</span>
            ${RARITIES.map((rarity) => dataTableInput("cassetteAffixValues", rarity.key, statKey)).join("")}
          `).join("")}
        </div>
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
          ${SHAPES.map((shape) => `
            <div class="shape-card">
              ${renderShapeMini(shape.id)}
              <span>${shape.name}</span>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="required-shapes">
        <div class="section-header compact">
          <h3>必选形状</h3>
          <button class="small" id="clearRequiredShapes">清空</button>
        </div>
        <div class="required-add-row">
          <select id="requiredShapeSelect">${SHAPES.map((shape) => `<option value="${shape.id}">${shape.name}</option>`).join("")}</select>
          <button id="addRequiredShape">添加</button>
        </div>
        <div class="pill-row">
          ${state.requiredShapes.length ? state.requiredShapes.map((shapeId, index) => {
            const shape = SHAPE_BY_ID[shapeId];
            return `<button class="pill removable-pill" data-remove-required-shape="${index}">${shape?.name ?? shapeId} ×</button>`;
          }).join("") : `<span class="muted-text">未设置必选形状</span>`}
        </div>
      </div>
    </section>
  `;
}

function renderDriveBlockPanel() {
  return `
    <section class="section inventory-section">
      <div class="section-header">
        <h2>驱动块库存</h2>
        <span class="counter">${state.driveBlocks.length} 件</span>
      </div>
      <div class="compact-form">
        <input id="newBlockName" type="text" value="新驱动块" aria-label="驱动块名称" />
        <select id="newBlockRarity" aria-label="品质">${RARITIES.map((rarity) => `<option value="${rarity.key}">${rarity.label}</option>`).join("")}</select>
        <select id="newBlockShape" aria-label="形状">${SHAPES.map((shape) => `<option value="${shape.id}">${shape.name}</option>`).join("")}</select>
        <button id="addDriveBlock">新增</button>
      </div>
      <div class="inventory-list">
        ${state.driveBlocks.map((item) => renderDriveBlockItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderDriveBlockItem(item) {
  const shape = SHAPE_BY_ID[item.shapeId];
  const rarity = RARITY_BY_KEY[item.rarity];
  return `
    <article class="inventory-row block-row ${item.enabled ? "" : "muted"}" data-block-id="${escapeHtml(item.id)}">
      <div class="inventory-toggles">
        <label class="toggle-line">
          <input type="checkbox" data-block-enabled="${escapeHtml(item.id)}" ${item.enabled ? "checked" : ""} />
          <span>参与</span>
        </label>
        <label class="toggle-line">
          <input type="checkbox" data-block-locked="${escapeHtml(item.id)}" ${item.locked ? "checked" : ""} />
          <span>锁定</span>
        </label>
      </div>
      ${renderShapeMini(item.shapeId)}
      <div class="inventory-main">
        <div class="item-title-row">
          <input class="item-name" value="${escapeAttribute(item.name)}" data-block-name="${escapeHtml(item.id)}" />
          <select data-block-rarity="${escapeHtml(item.id)}">${rarityOptions(item.rarity)}</select>
          <select data-block-shape="${escapeHtml(item.id)}">${shapeOptions(item.shapeId)}</select>
        </div>
        <div class="meta-line">
          <span class="rarity" style="--rarity-color: ${rarity.color}">${rarity.label}</span>
          <span>${shape.name}</span>
          <span>${baseStatSummary(item)}</span>
          <span>${affixSummaryForItem("block", item)}</span>
          ${legacySummary(item)}
        </div>
        ${renderAffixEditor("block", item.id, item.affixes, DRIVE_BLOCK_AFFIX_KEYS)}
      </div>
      <button class="small danger" data-delete-block="${escapeHtml(item.id)}">删除</button>
    </article>
  `;
}

function renderCassettePanel() {
  return `
    <section class="section inventory-section">
      <div class="section-header">
        <h2>卡带库存</h2>
        <span class="counter">${state.cassettes.length} 件</span>
      </div>
      <div class="compact-form">
        <input id="newCassetteName" type="text" value="新卡带" aria-label="卡带名称" />
        <select id="newCassetteRarity" aria-label="品质">${RARITIES.map((rarity) => `<option value="${rarity.key}">${rarity.label}</option>`).join("")}</select>
        <button id="addCassette">新增</button>
      </div>
      <div class="inventory-list">
        ${state.cassettes.map((item) => renderCassetteItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderCassetteItem(item) {
  const rarity = RARITY_BY_KEY[item.rarity];
  return `
    <article class="inventory-row cassette-row ${item.enabled ? "" : "muted"}" data-cassette-id="${escapeHtml(item.id)}">
      <div class="inventory-toggles">
        <label class="toggle-line">
          <input type="checkbox" data-cassette-enabled="${escapeHtml(item.id)}" ${item.enabled ? "checked" : ""} />
          <span>启用</span>
        </label>
      </div>
      <div class="cassette-badge">卡带</div>
      <div class="inventory-main">
        <div class="item-title-row">
          <input class="item-name" value="${escapeAttribute(item.name)}" data-cassette-name="${escapeHtml(item.id)}" />
          <select data-cassette-rarity="${escapeHtml(item.id)}">${rarityOptions(item.rarity)}</select>
        </div>
        <div class="meta-line">
          <span class="rarity" style="--rarity-color: ${rarity.color}">${rarity.label}</span>
          <span>主词条 ${affixLabel(resolveCassetteMainAffix(item, state.statTables))}</span>
          <span>${affixSummaryForItem("cassette", item)}</span>
          ${legacySummary(item)}
        </div>
        <div class="affix-grid main-affix">
          <label class="affix-editor">
            <span>主词条</span>
            <select data-cassette-main-key="${escapeHtml(item.id)}">${statOptions(CASSETTE_MAIN_AFFIX_KEYS, item.mainAffix.statKey)}</select>
            <strong>${formatStatValue(item.mainAffix.statKey, getCassetteMainAffixValue(item, item.mainAffix.statKey, state.statTables))}</strong>
          </label>
        </div>
        ${renderAffixEditor("cassette", item.id, item.affixes, CASSETTE_AFFIX_KEYS)}
      </div>
      <button class="small danger" data-delete-cassette="${escapeHtml(item.id)}">删除</button>
    </article>
  `;
}

function renderRunPanel(currentDamage, currentCassette) {
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
              <div><span>自动卡带</span><strong>${escapeHtml(currentCassette?.name ?? "未佩戴")}</strong></div>
              <div><span>攻击</span><strong>${formatInteger(currentDamage.stats.attack)}</strong></div>
              <div><span>暴击率</span><strong>${formatPercent(currentDamage.stats.critRate)}</strong></div>
              <div><span>暴击伤害</span><strong>${formatPercent(currentDamage.stats.critDamage)}</strong></div>
              <div><span>增伤区</span><strong>${formatMultiplier(currentDamage.damageZone)}</strong></div>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderResultsPanel() {
  if (!results.length) {
    return `<section class="section result-list"><div class="empty-state">暂无方案</div></section>`;
  }
  return `<section class="section result-list">${results.map((result) => renderResult(result)).join("")}</section>`;
}

function renderResult(result) {
  const blockMap = new Map(state.driveBlocks.map((item) => [item.id, item]));
  const cassetteMap = new Map(state.cassettes.map((item) => [item.id, item]));
  const blocks = (result.driveBlockIds ?? result.itemIds ?? []).map((id) => blockMap.get(id)).filter(Boolean);
  const cassette = result.cassetteId ? cassetteMap.get(result.cassetteId) : null;
  return `
    <article class="result-card">
      <div class="result-head">
        <div>
          <span class="rank">#${result.rank}</span>
          <strong>${formatNumber(result.damage.expectedDamage)}</strong>
        </div>
        <span>${result.damage.preferenceCount} 层偏好 / 卡带：${escapeHtml(cassette?.name ?? "未佩戴")}</span>
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
        ${blocks.map((item) => `<span class="pill">${escapeHtml(item.name)}</span>`).join("")}
        <span class="pill cassette-pill">卡带：${escapeHtml(cassette?.name ?? "未佩戴")}</span>
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

function renderAffixEditor(kind, id, affixes, allowedKeys) {
  return `
    <div class="affix-grid">
      ${affixes.map((affix, index) => `
        <label class="affix-editor">
          <span>词条 ${index + 1}</span>
          <select data-${kind}-affix-key="${escapeHtml(id)}" data-affix-index="${index}">
            ${statOptions(allowedKeys, affix.statKey)}
          </select>
          <strong>${formatAutoAffixValue(kind, id, affix.statKey)}</strong>
        </label>
      `).join("")}
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
      ${shape.cells.map((cell) => `<i style="grid-row:${cell.r - minR + 1}; grid-column:${cell.c - minC + 1};"></i>`).join("")}
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
  document.querySelector("#importJsonButton").addEventListener("click", () => document.querySelector("#importJson").click());
  document.querySelector("#importJson").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state = parseImportedState(await file.text());
      clearResults("导入完成");
      persistAndRender();
    } catch (error) {
      alert("JSON 无法导入。");
    }
  });
  document.querySelector("#resetState").addEventListener("click", () => {
    if (!confirm("重置为示例数据？")) return;
    stopWorker();
    clearState();
    state = createDefaultState();
    clearResults("已重置");
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
    if (state.characters.length <= 1) return;
    state.characters = state.characters.filter((item) => item.id !== state.selectedCharacterId);
    state.selectedCharacterId = state.characters[0].id;
    clearResults("已删除角色");
    persistAndRender();
  });
  document.querySelectorAll("[data-character-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      setNested(getSelectedCharacter(), event.currentTarget.dataset.characterField, parseFieldValue(event.currentTarget));
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
    if (state.weapons.length <= 1) return;
    state.weapons = state.weapons.filter((item) => item.id !== state.selectedWeaponId);
    state.selectedWeaponId = state.weapons[0].id;
    clearResults("已删除武器");
    persistAndRender();
  });
  document.querySelectorAll("[data-weapon-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      getSelectedWeapon()[event.currentTarget.dataset.weaponField] = parseFieldValue(event.currentTarget);
      clearResults("武器数据已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-weapon-stat-field]").forEach((input) => {
    input.addEventListener("change", (event) => {
      getSelectedWeapon().stats[event.currentTarget.dataset.weaponStatField] = parseFieldValue(event.currentTarget);
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
      if (event.currentTarget.checked) next.add(key);
      else next.delete(key);
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
  document.querySelector("#addRequiredShape").addEventListener("click", () => {
    state.requiredShapes.push(document.querySelector("#requiredShapeSelect").value);
    clearResults("必选形状已更新");
    persistAndRender();
  });
  document.querySelector("#clearRequiredShapes").addEventListener("click", () => {
    state.requiredShapes = [];
    clearResults("必选形状已更新");
    persistAndRender();
  });
  document.querySelectorAll("[data-remove-required-shape]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.requiredShapes.splice(Number(event.currentTarget.dataset.removeRequiredShape), 1);
      clearResults("必选形状已更新");
      persistAndRender();
    });
  });

  const grid = document.querySelector("#boardGrid");
  grid.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("[data-cell]");
    if (!target) return;
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
    if (!isDrawing) return;
    const target = event.target.closest("[data-cell]");
    if (target) setBoardCell(target.dataset.cell, drawIntent);
  });
}

function bindDataTableEvents() {
  document.querySelectorAll("[data-table-section]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const section = event.currentTarget.dataset.tableSection;
      const rarity = event.currentTarget.dataset.tableRarity;
      const statKey = event.currentTarget.dataset.tableStat;
      state.statTables[section][rarity][statKey] = readStatInputValue(event.currentTarget.value, statKey);
      clearResults("数据表已更新");
      persistAndRender();
    });
  });
}

function bindDriveBlockEvents() {
  document.querySelector("#addDriveBlock").addEventListener("click", () => {
    state.driveBlocks.push({
      id: makeId("block"),
      name: document.querySelector("#newBlockName").value.trim() || "新驱动块",
      rarity: document.querySelector("#newBlockRarity").value,
      shapeId: document.querySelector("#newBlockShape").value,
      enabled: true,
      locked: false,
      affixes: makeAffixes()
    });
    clearResults("驱动块库存已更新");
    persistAndRender();
  });
  document.querySelectorAll("[data-block-enabled]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const item = getDriveBlock(event.currentTarget.dataset.blockEnabled);
      item.enabled = event.currentTarget.checked;
      if (!item.enabled) item.locked = false;
      clearResults("驱动块库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-block-locked]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const item = getDriveBlock(event.currentTarget.dataset.blockLocked);
      item.locked = event.currentTarget.checked;
      if (item.locked) item.enabled = true;
      clearResults("锁定驱动块已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-block-name]").forEach((input) => {
    input.addEventListener("change", (event) => {
      getDriveBlock(event.currentTarget.dataset.blockName).name = event.currentTarget.value.trim() || "驱动块";
      clearResults("驱动块库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-block-rarity]").forEach((select) => {
    select.addEventListener("change", (event) => {
      getDriveBlock(event.currentTarget.dataset.blockRarity).rarity = event.currentTarget.value;
      clearResults("驱动块库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-block-shape]").forEach((select) => {
    select.addEventListener("change", (event) => {
      getDriveBlock(event.currentTarget.dataset.blockShape).shapeId = event.currentTarget.value;
      clearResults("驱动块库存已更新");
      persistAndRender();
    });
  });
  bindAffixEvents("block", getDriveBlock, "驱动块词条已更新");
  document.querySelectorAll("[data-delete-block]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.driveBlocks = state.driveBlocks.filter((item) => item.id !== event.currentTarget.dataset.deleteBlock);
      clearResults("驱动块库存已更新");
      persistAndRender();
    });
  });
}

function bindCassetteEvents() {
  document.querySelector("#addCassette").addEventListener("click", () => {
    state.cassettes.push({
      id: makeId("cassette"),
      name: document.querySelector("#newCassetteName").value.trim() || "新卡带",
      rarity: document.querySelector("#newCassetteRarity").value,
      enabled: true,
      mainAffix: { statKey: "elementDamageBonus", value: 0 },
      affixes: makeAffixes()
    });
    clearResults("卡带库存已更新");
    persistAndRender();
  });
  document.querySelectorAll("[data-cassette-enabled]").forEach((input) => {
    input.addEventListener("change", (event) => {
      getCassette(event.currentTarget.dataset.cassetteEnabled).enabled = event.currentTarget.checked;
      clearResults("卡带库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-cassette-name]").forEach((input) => {
    input.addEventListener("change", (event) => {
      getCassette(event.currentTarget.dataset.cassetteName).name = event.currentTarget.value.trim() || "卡带";
      clearResults("卡带库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-cassette-rarity]").forEach((select) => {
    select.addEventListener("change", (event) => {
      getCassette(event.currentTarget.dataset.cassetteRarity).rarity = event.currentTarget.value;
      clearResults("卡带库存已更新");
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-cassette-main-key]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const cassette = getCassette(event.currentTarget.dataset.cassetteMainKey);
      cassette.mainAffix = { statKey: event.currentTarget.value, value: 0 };
      clearResults("卡带主词条已更新");
      persistAndRender();
    });
  });
  bindAffixEvents("cassette", getCassette, "卡带词条已更新");
  document.querySelectorAll("[data-delete-cassette]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.cassettes = state.cassettes.filter((item) => item.id !== event.currentTarget.dataset.deleteCassette);
      clearResults("卡带库存已更新");
      persistAndRender();
    });
  });
}

function bindAffixEvents(kind, getter, message) {
  document.querySelectorAll(`[data-${kind}-affix-key]`).forEach((select) => {
    select.addEventListener("change", (event) => {
      const item = getter(event.currentTarget.dataset[`${kind}AffixKey`]);
      const index = Number(event.currentTarget.dataset.affixIndex);
      item.affixes[index] = { statKey: event.currentTarget.value, value: 0 };
      clearResults(message);
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
  runStatus = { mode: "running", message: "正在计算", branches: 0, pruned: 0, elapsedMs: 0 };
  render();

  activeWorker = new Worker(new URL("./worker/optimizer.worker.js", import.meta.url), { type: "module" });
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
      driveBlocks: state.driveBlocks,
      cassettes: state.cassettes,
      character: getSelectedCharacter(),
      weapon: getSelectedWeapon(),
      skill: state.skill,
      statTables: state.statTables,
      requiredShapes: state.requiredShapes,
      fillPriority: state.fillPriority,
      invalidStats: state.invalidStats,
      topN: state.topN,
      branchLimit: state.branchLimit
    }
  });
}

function patchStatus() {
  const box = document.querySelector(".status-box");
  if (!box) return;
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
  runStatus = { mode: "idle", message, branches: 0, pruned: 0, elapsedMs: 0 };
}

function selectableCassettes() {
  const invalid = new Set(state.invalidStats);
  return state.cassettes.filter((cassette) => cassette.enabled && !hasInvalidAffix(cassette, invalid));
}

function hasInvalidAffix(item, invalidStats) {
  const affixes = [...(item.affixes ?? [])];
  if (item.mainAffix) affixes.push(item.mainAffix);
  return affixes.some((affix) => invalidStats.has(affix?.statKey) && Number(affix?.value ?? 0) !== 0);
}

function setBoardCell(key, active) {
  const cells = activeCellSet();
  if (active) cells.add(key);
  else cells.delete(key);
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

function getDriveBlock(id) {
  return state.driveBlocks.find((item) => item.id === id);
}

function getCassette(id) {
  return state.cassettes.find((item) => item.id === id);
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
  if (input.dataset.format === "percent") return Number(input.value || 0) / 100;
  if (input.type === "number") return Number(input.value || 0);
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

function statOptions(keys, selected) {
  return keys
    .map((key) => `<option value="${key}" ${key === selected ? "selected" : ""}>${STAT_BY_KEY[key]?.label ?? key}</option>`)
    .join("");
}

function rarityOptions(selected) {
  return RARITIES.map((rarity) => `<option value="${rarity.key}" ${rarity.key === selected ? "selected" : ""}>${rarity.label}</option>`).join("");
}

function shapeOptions(selected) {
  return SHAPES.map((shape) => `<option value="${shape.id}" ${shape.id === selected ? "selected" : ""}>${shape.name}</option>`).join("");
}

function dataTableInput(section, rarity, statKey) {
  const value = state.statTables?.[section]?.[rarity]?.[statKey] ?? 0;
  return `
    <input
      type="number"
      step="0.01"
      value="${escapeAttribute(formatStatInput(statKey, value))}"
      data-table-section="${section}"
      data-table-rarity="${rarity}"
      data-table-stat="${statKey}"
      data-format="${statFormat(statKey)}"
    />
  `;
}

function baseStatSummary(item) {
  const stats = getDriveBlockBaseStats(item, state.statTables);
  return `基础 ${STAT_BY_KEY.attackFlat.label} ${formatInteger(stats.attackFlat)} / ${STAT_BY_KEY.hpFlat.label} ${formatInteger(stats.hpFlat)}`;
}

function affixSummaryForItem(kind, item) {
  return item.affixes
    .map((affix) => {
      const value = kind === "block"
        ? getDriveBlockAffixValue(item, affix.statKey, state.statTables)
        : getCassetteAffixValue(item, affix.statKey, state.statTables);
      return affixLabel({ statKey: affix.statKey, value });
    })
    .filter(Boolean)
    .join(" / ");
}

function formatAutoAffixValue(kind, id, statKey) {
  const item = kind === "block" ? getDriveBlock(id) : getCassette(id);
  const value = kind === "block"
    ? getDriveBlockAffixValue(item, statKey, state.statTables)
    : getCassetteAffixValue(item, statKey, state.statTables);
  return formatStatValue(statKey, value);
}

function affixLabel(affix) {
  if (!affix) return "";
  return `${STAT_BY_KEY[affix.statKey]?.label ?? affix.statKey} ${formatStatValue(affix.statKey, affix.value)}`;
}

function legacySummary(item) {
  const entries = Object.entries(item.legacyStats ?? {}).filter(([, value]) => Number(value) !== 0);
  if (!entries.length) return "";
  return `<span>旧字段 ${entries.map(([key, value]) => `${escapeHtml(key)} ${formatNumber(value)}`).join(" / ")}</span>`;
}

function readStatInputValue(value, statKey) {
  const numericValue = Number(value || 0);
  return statFormat(statKey) === "percent" ? numericValue / 100 : numericValue;
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
  return Number(value ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function formatInteger(value) {
  return Math.round(Number(value ?? 0)).toLocaleString("zh-CN");
}

function formatMs(value) {
  if (!value) return "0 ms";
  if (value < 1000) return `${Math.round(value)} ms`;
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
