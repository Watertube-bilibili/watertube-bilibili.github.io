#!/usr/bin/env node
/* SPDX-License-Identifier: AGPL-3.0-only
 * Structural and behavioral audit. Scientific correctness still needs expert review.
 * Run: node tests/catalog-audit.js [--partial] [--network]
 * --partial makes absent work-in-progress files warnings, never malformed data.
 * --network checks unique cited source URLs; blocked URLs remain unverified warnings.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const partial = process.argv.includes('--partial');
const network = process.argv.includes('--network');
const subjects = ['physics', 'chemistry', 'biology'];
const terms = new Set(['7上', '7下', '8上', '8下', '9上', '9下']);
const kinds = new Set(['学生实验', '演示实验', '小实验', '拓展探究', '操作练习', '设计练习', '资料分析']);
const errors = [], warnings = [], notes = [];
const context = vm.createContext({window: {}, console, Math, Date, Promise, URL, setTimeout, clearTimeout});
const issue = (where, message, warning = false) => (warning ? warnings : errors).push(`${where}: ${message}`);
const text = value => typeof value === 'string' && value.trim().length > 0;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const isUrl = value => {try {return /^https?:$/.test(new URL(value).protocol);} catch {return false;}};
function load(relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {issue(relative, 'required file is absent', partial); return false;}
  try {vm.runInContext(fs.readFileSync(full, 'utf8'), context, {filename: relative, timeout: 5000}); return true;}
  catch (error) {issue(relative, `script load failed: ${error.message}`); return false;}
}
function stringField(object, key, where) {
  if (!text(object?.[key])) issue(where, `${key} must be a nonempty string`);
}
function strings(object, key, where, minimum = 1) {
  const values = object?.[key];
  if (!Array.isArray(values) || values.length < minimum || values.some(x => !text(x)))
    issue(where, `${key} must contain at least ${minimum} nonempty string(s)`);
}
function processSteps(value, where, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum) {issue(where, `requires ${minimum} substantive step(s)`); return;}
  value.forEach((step, i) => {stringField(step, 'title', `${where}[${i}]`); stringField(step, 'text', `${where}[${i}]`);});
}
function badNumbers(value, where) {
  if (typeof value === 'number' && !Number.isFinite(value)) issue(where, 'nonfinite numeric result');
  else if (Array.isArray(value)) value.forEach((x, i) => badNumbers(x, `${where}[${i}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => badNumbers(v, `${where}.${k}`));
}
function atomsInFormula(formula) {
  const ascii = formula.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, c => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)));
  const tokens = ascii.match(/[A-Z][a-z]?|\d+|[()]/g) || [];
  if (tokens.join('') !== ascii) throw new Error(`cannot parse formula ${formula}`);
  let i = 0;
  function group() {
    const total = {};
    while (i < tokens.length && tokens[i] !== ')') {
      let part;
      if (tokens[i] === '(') {i++; part = group(); if (tokens[i++] !== ')') throw new Error('unclosed formula group');}
      else {const symbol = tokens[i++]; if (!/^[A-Z][a-z]?$/.test(symbol)) throw new Error('invalid element'); part = {[symbol]: 1};}
      const factor = /^\d+$/.test(tokens[i] || '') ? Number(tokens[i++]) : 1;
      for (const [element, count] of Object.entries(part)) total[element] = (total[element] || 0) + count * factor;
    }
    return total;
  }
  const result = group(); if (i !== tokens.length) throw new Error('unexpected formula suffix'); return result;
}
function checkChemicalReaction(reaction, result, where) {
  if (Math.abs(reaction.ma + reaction.mb - reaction.products.reduce((sum, p) => sum + p[1], 0)) > 1e-8)
    issue(where, 'reaction reference masses violate mass conservation');
  if (finite(result.balanceError) && Math.abs(result.balanceError) > 1e-7) issue(where, 'computed reaction violates mass conservation');
  try {
    const equation = reaction.eq.replace(/（[^）]*）|\([^A-Z()]*[\u3400-\u9fff][^)]*\)/g, '').replace(/[\s↑↓]/g, '');
    const sides = equation.split(/→|=/);
    if (sides.length !== 2) throw new Error('expected two equation sides');
    const totals = sides.map(side => {
      const sum = {};
      for (const term of side.split('+')) {
        const match = term.match(/^(\d+)?(.+)$/), coefficient = Number(match[1] || 1);
        for (const [element, count] of Object.entries(atomsInFormula(match[2]))) sum[element] = (sum[element] || 0) + coefficient * count;
      }
      return sum;
    });
    for (const element of new Set([...Object.keys(totals[0]), ...Object.keys(totals[1])]))
      if (totals[0][element] !== totals[1][element]) issue(where, `unbalanced chemical equation for ${element}: ${reaction.eq}`);
  } catch (error) {issue(where, `reaction equation audit failed: ${error.message}`);}
}
for(const file of fs.readdirSync(path.join(root,'dist/modules/physics')).filter(f=>f.endsWith('.js')))load('dist/modules/physics/'+file);
function paramsFor(entry) {return {...entry.modelParams, ...Object.fromEntries((entry.controls || []).map(c => [c.key, c.value]))};}
function casesFor(entry) {
  const base = paramsFor(entry), cases = [{name: 'default', params: base}];
  for (const control of entry.controls || []) {
    const values = Array.isArray(control.options) ? control.options.map(o => o.value) : [control.min, control.max];
    for (const value of values) if (value !== control.value)
      cases.push({name: `${control.key}=${value}`, key: control.key, params: {...base, [control.key]: value}});
  }
  return cases;
}
function checkResult(result, where) {
  if (!result || typeof result !== 'object') {issue(where, 'simulate must return a result object'); return;}
  if (!Array.isArray(result.readings) || result.readings.length === 0) issue(where, 'readings must be nonempty');
  else result.readings.forEach((r, i) => {
    stringField(r, 'label', `${where}.readings[${i}]`);
    if (!(finite(r.value) || text(r.value) || r.value === null)) issue(where, `reading ${i} must be finite, explanatory text or explicitly unavailable (null)`);
    if (typeof r.unit !== 'string') issue(where, `reading ${i} must specify unit (empty string is valid)`);
  });
  processSteps(result.process, `${where}.process`);
  stringField(result, 'conclusion', where);
  if (/尚未建立|未建立.{0,8}模型|未支持.{0,8}模型|不支持的模型|unknown model/i.test(result.conclusion || ''))
    issue(where, 'catalog points to an unsupported simulation model');
  if (result.graph) {
    stringField(result.graph, 'xLabel', `${where}.graph`); stringField(result.graph, 'yLabel', `${where}.graph`);
    if (!Array.isArray(result.graph.points) || result.graph.points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(finite)))
      issue(where, 'graph.points must contain finite [x,y] pairs');
  }
  if (result.table) {
    const {headers, rows} = result.table;
    if (!Array.isArray(headers) || !headers.every(text) || !Array.isArray(rows) || rows.some(r => !Array.isArray(r) || r.length !== headers.length))
      issue(where, 'table rows must match nonempty headers');
  }
  badNumbers(result, where);
  if (result.reaction?.eq && Array.isArray(result.reaction.products)) checkChemicalReaction(result.reaction, result, where);
}
function checkSvg(svg, where) {
  if (!text(svg) || !/<(?:g|path|rect|circle|line|text|ellipse|polygon|polyline)\b/.test(svg)) issue(where, 'render must return substantive SVG content');
  if (/\b(?:NaN|Infinity|undefined)\b/.test(svg || '')) issue(where, 'invalid numeric/string token in SVG');
  if (/<script\b|\bon\w+\s*=/i.test(svg || '')) issue(where, 'SVG must not contain script/event handlers');
}
function checkCoverage(subject, ids, sourceIds) {
  const relative = `research/${subject}-coverage.json`, file = path.join(root, relative);
  if (!fs.existsSync(file)) {issue(relative, 'explicit final coverage mapping is absent', partial); return;}
  let data; try {data = JSON.parse(fs.readFileSync(file, 'utf8'));} catch (error) {issue(relative, error.message); return;}
  let references = 0, sourceUrls = 0, resolvedSources = 0;
  const mappingKeys = /^(?:implementationIds?|experimentIds?|labIds?|catalogIds?)$/i;
  function walk(value, location) {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${location}[${i}]`));
    else if (value && typeof value === 'object') for (const [key, v] of Object.entries(value)) {
      const at = `${location}.${key}`;
      if (mappingKeys.test(key)) for (const id of Array.isArray(v) ? v : [v]) {
        if (id === null || id === '') {issue(at, 'unimplemented / unresolved activity', true); continue;}
        references++; if (typeof id !== 'string' || !ids.has(id)) issue(at, `unknown implementation ID ${JSON.stringify(id)}`);
      }
      if (/^(sourceUrl|evidenceUrl|url)$/.test(key)) {sourceUrls++; if (!isUrl(v)) issue(at, 'not an HTTP(S) source URL');}
      if (/^sourceIds?$/.test(key)) for (const sourceId of Array.isArray(v) ? v : [v]) {
        if (!sourceIds.has(sourceId)) issue(at, `unknown source ID ${JSON.stringify(sourceId)}`);
        else resolvedSources++;
      }
      if (/^(verification|status)$/.test(key) && !text(v)) issue(at, 'verification/status cannot be empty');
      walk(v, at);
    }
  }
  walk(data, relative);
  if (references === 0) issue(relative, 'no implementation references found; define explicit implementationId(s) mappings');
  if (sourceUrls + resolvedSources === 0) issue(relative, 'coverage has no auditable source URLs or resolved source IDs', true);
  const baseline = data.baseline?.ncet2023 || data.baseline;
  const baselineItems = baseline?.items || baseline?.entries;
  const expected = {physics: 68, chemistry: 35, biology: 56}[subject];
  if (!Array.isArray(baselineItems)) issue(relative, 'NCET 2023 baseline must explicitly enumerate its numbered activities');
  else {
    const numbers = baselineItems.map(item => Number(item.number ?? item.ncetId));
    const missing = Array.from({length: expected}, (_, i) => i + 1).filter(n => !numbers.includes(n));
    const invalid = numbers.filter(n => !Number.isInteger(n) || n < 1 || n > expected);
    if (missing.length) issue(relative, `NCET baseline numbers absent: ${missing.join(', ')}`);
    if (invalid.length || new Set(numbers).size !== numbers.length) issue(relative, 'NCET baseline numbers are duplicated or invalid');
    const limited = baselineItems.filter(item => /partial|missing|pending|部分|待|缺/.test([item.status, item.catalogCoverage].filter(Boolean).join(' ')));
    if (limited.length) issue(relative, `NCET activities with declared limits: ${limited.map(x => x.number ?? x.ncetId).join(', ')}`, true);
    notes.push(`${subject}: NCET ${numbers.length}/${expected} numbered mappings; ${limited.length} explicitly partial/missing/pending`);
  }
  notes.push(`${subject}: ${references} explicit coverage references checked (references are not proof of exhaustive coverage)`);
}
async function main() {
  for (const subject of subjects) load(`dist/catalog/sources-${subject}.js`);
  for (const subject of subjects) load(`dist/catalog/${subject}.js`);
  for (const subject of subjects) load(`dist/modules/${subject}.js`);
  const catalogs = context.window.LAB_CATALOG || [], sources = context.window.LAB_SOURCES || [];
  const ids = new Set(), sourceIds = new Set();
  for (const source of sources) {
    const at = `source ${source.id || '(missing id)'}`;
    for (const key of ['id', 'title', 'url', 'publisher', 'checked', 'scope', 'edition']) stringField(source, key, at);
    if (sourceIds.has(source.id)) issue(at, 'duplicate source ID'); sourceIds.add(source.id);
    if (!isUrl(source.url)) issue(at, 'source URL must be HTTP(S)');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checked || '')) issue(at, 'checked must be YYYY-MM-DD');
    if (/example\.(?:com|org)|TODO|待填写/i.test(source.url || '')) issue(at, 'placeholder URL');
  }
  let scenarios = 0, rendered = 0, engineEntries = 0;
  for (const entry of catalogs) {
    const at = `experiment ${entry.id || '(missing id)'}`;
    for (const key of ['id', 'subject', 'term', 'chapter', 'title', 'kind', 'objective', 'conclusion', 'model', 'modelNote']) stringField(entry, key, at);
    if (ids.has(entry.id)) issue(at, 'duplicate experiment ID'); ids.add(entry.id);
    if (!subjects.includes(entry.subject)) issue(at, 'unknown subject');
    if (!terms.has(entry.term)) issue(at, 'unknown grade/term');
    if (!kinds.has(entry.kind)) issue(at, 'unknown experiment kind');
    if (entry.relatedTerms && (!Array.isArray(entry.relatedTerms) || entry.relatedTerms.some(t => !terms.has(t)))) issue(at, 'invalid relatedTerms');
    for (const key of ['tags', 'sourceIds', 'apparatus', 'observations', 'examPoints', 'pitfalls']) strings(entry, key, at);
    strings(entry, 'steps', at, 2); strings(entry, 'safety', at, 0);
    for (const sourceId of entry.sourceIds || []) if (!sourceIds.has(sourceId)) issue(at, `unknown sourceId ${sourceId}`, partial && sources.length === 0);
    if (!Array.isArray(entry.questions) || !entry.questions.length) issue(at, 'requires answered practice questions');
    else entry.questions.forEach((q, i) => {stringField(q, 'q', `${at}.questions[${i}]`); stringField(q, 'a', `${at}.questions[${i}]`);});
    for (const key of ['title', 'given', 'answer']) stringField(entry.workedExample, key, `${at}.workedExample`);
    processSteps(entry.workedExample?.steps, `${at}.workedExample.steps`, 3);
    if (/TODO|待补充|敬请期待/.test(JSON.stringify(entry))) issue(at, 'placeholder teaching content found');
    if (!['live','playback'].includes(entry.interaction?.mode) || !text(entry.interaction?.reason)) issue(at,'requires an explicit reviewed interaction mode and teaching reason');
    if (!Array.isArray(entry.controls) || !entry.controls.length) issue(at, 'requires at least one meaningful control');
    const keys = new Set();
    for (const control of entry.controls || []) {
      const ca = `${at}.control ${control.key}`;
      stringField(control, 'key', ca); stringField(control, 'label', ca);
      if (keys.has(control.key)) issue(ca, 'duplicate parameter key'); keys.add(control.key);
      if (Array.isArray(control.options)) {
        if (control.options.length < 2) issue(ca, 'selector needs at least two distinct options');
        const opts = new Set();
        control.options.forEach(o => {stringField(o, 'label', ca); if (opts.has(o.value)) issue(ca, 'duplicate option value'); opts.add(o.value);});
        if (!opts.has(control.value)) issue(ca, 'default is absent from options');
      } else {
        for (const key of ['min', 'max', 'step', 'value']) if (!finite(control[key])) issue(ca, `${key} must be finite`);
        if (!(control.min < control.max) || !(control.step > 0)) issue(ca, 'bounds must increase and step must be positive');
        if (control.value < control.min || control.value > control.max) issue(ca, 'default is out of bounds');
        const tick = (control.value - control.min) / control.step;
        if (Number.isFinite(tick) && Math.abs(tick - Math.round(tick)) > 1e-6) issue(ca, 'default does not lie on slider step grid', true);
        if (typeof control.unit !== 'string') issue(ca, 'numeric control must specify unit');
      }
    }
    const mod = context.window.LAB_MODULES?.[entry.subject];
    if (!mod || typeof mod.simulate !== 'function' || typeof mod.render !== 'function') {issue(at, 'subject simulate/render module is not callable', partial); continue;}
    // Physics must use the real browser Godot RPC; no fabricated engine fallback in this Node audit.
    if (entry.subject === 'physics' || entry.requiresPhysics) {
      engineEntries++;
      try {checkSvg(mod.render(entry, paramsFor(entry), null, 0), `${at}.initialRender`); rendered++;}
      catch (error) {issue(at, `initial renderer failed: ${error.message}`);}
      continue;
    }
    let defaultSignature;
    const changedControls = new Set();
    for (const scenario of casesFor(entry)) {
      const where = `${at} (${scenario.name})`;
      try {
        const result = await mod.simulate(entry, scenario.params, 1); scenarios++; checkResult(result, where);
        let svgStates = '';
        for (const progress of [0, 0.5, 1]) {const svg = mod.render(entry, scenario.params, result, progress); checkSvg(svg, `${where}.render(${progress})`); rendered++; svgStates += svg;}
        // Exclude echoed input parameters: an inert slider must not pass merely because its value is returned.
        const signature = JSON.stringify({readings: result.readings, process: result.process, conclusion: result.conclusion, table: result.table, graph: result.graph}) + svgStates;
        if (scenario.name === 'default') defaultSignature = signature;
        else if (signature !== defaultSignature) changedControls.add(scenario.key);
      } catch (error) {issue(where, `simulation/render failed: ${error.message}`);}
    }
    // A control can correctly be inactive under default conditions (e.g. resting an
    // already mixed solution). Check one changed condition before reporting it inert.
    if (defaultSignature) for (const control of entry.controls || []) if (!changedControls.has(control.key)) {
      const targetValues = control.options ? control.options.map(o => o.value) : [control.min, control.max];
      const signatureAt = async params => {
        const result = await mod.simulate(entry, params, 1); scenarios++; checkResult(result, `${at}.conditionalControl`);
        const svg = mod.render(entry, params, result, 0.5); rendered++; checkSvg(svg, `${at}.conditionalControl.render`);
        return JSON.stringify({readings: result.readings, process: result.process, conclusion: result.conclusion, table: result.table, graph: result.graph}) + svg;
      };
      try {
        for (const other of entry.controls || []) {
          if (other.key === control.key || changedControls.has(control.key)) continue;
          const alternates = (other.options ? other.options.map(o => o.value) : [other.min, other.max]).filter(v => v !== other.value);
          for (const alternate of alternates) {
            const params = {...paramsFor(entry), [other.key]: alternate}, baseline = await signatureAt(params);
            for (const value of targetValues) if (value !== control.value && await signatureAt({...params, [control.key]: value}) !== baseline) {
              changedControls.add(control.key); break;
            }
            if (changedControls.has(control.key)) break;
          }
        }
      } catch (error) {issue(at, `conditional control check failed: ${error.message}`);}
      if (!changedControls.has(control.key)) issue(at, `control ${control.key}: tested values and conditional probes leave displayed result and SVG unchanged`, true);
    }
    try {checkSvg(mod.render(entry, paramsFor(entry), null, 0), `${at}.initialRender`); rendered++;}
    catch (error) {issue(at, `initial renderer failed: ${error.message}`);}
  }
  for (const subject of subjects) {
    const entries = catalogs.filter(e => e.subject === subject);
    if (!entries.length) issue(subject, 'no catalog entries loaded', partial);
    notes.push(`${subject}: ${entries.length} catalog entries, ${new Set(entries.map(e => e.model)).size} model families`);
    checkCoverage(subject, new Set(entries.map(e => e.id)), sourceIds);
  }
  if (network) for (const url of new Set(sources.map(s => s.url).filter(isUrl))) {
    try {const response = await fetch(url, {signal: AbortSignal.timeout(15000), redirect: 'follow'}); await response.body?.cancel();
      if (!response.ok) issue(url, `HTTP ${response.status}: source availability not verified`, true);
      else notes.push(`source reachable: ${url}`);
    } catch (error) {issue(url, `source fetch unverified: ${error.message}`, true);}
  }
  notes.push(`${scenarios} simulation scenarios (default, control boundaries/options, conditional probes); ${rendered} SVG states checked`);
  notes.push(`${engineEntries} engine-dependent entries require real-browser Godot RPC tests; this Node audit checks their initial renderer but never fabricates engine output.`);
  console.log(notes.join('\n'));
  if (warnings.length) console.log(`\nWARNINGS (${warnings.length})\n${warnings.join('\n')}`);
  if (errors.length) console.error(`\nFAILURES (${errors.length})\n${errors.join('\n')}`);
  console.log(`\n${errors.length ? 'FAIL' : 'PASS'}: ${catalogs.length} entries, ${sources.length} sources. Scientific coverage and source interpretation still require manual review.`);
  process.exitCode = errors.length ? 1 : 0;
}
main().catch(error => {console.error(error.stack); process.exitCode = 1;});
