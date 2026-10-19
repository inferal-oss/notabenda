// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
/** @requirements REQ-IT-REPROMPT Solicitation guard. It never grants or extends permission. */
import type { PromptPolicy } from './types.js';

export interface PromptPolicyMemory {
  profile: 'it-garante-2021';
  /** Missing for legacy withholding with no recorded processing revision. */
  processingRevision?: string;
  at: number;
  outcome: 'withheld' | 'all-granted';
}
export interface PromptPolicyDecision {
  profile: 'it-garante-2021';
  version: '2021-06-10.1';
  reason: 'no-prior-withholding' | 'prior-state-unavailable' | 'withholding-floor' | 'material-change' | 'six-months-elapsed';
  allowsPrompt: boolean;
  requiresChoice: boolean;
  nextEligibleAt?: string;
  requirementIds: ['REQ-IT-REPROMPT'];
  sourceIds: ['SRC-IT-GUIDE'];
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value,key));
export const isProcessingRevision = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(value);
export function isPromptPolicy(value: unknown): value is PromptPolicy {
  if (!object(value) || !exact(value,['profile','processingRevision',...(value.materialChange === undefined ? [] : ['materialChange'])]) || value.profile !== 'it-garante-2021' || !isProcessingRevision(value.processingRevision)) return false;
  const change = value.materialChange;
  return change === undefined || object(change) && exact(change,['fromRevision','summary']) && isProcessingRevision(change.fromRevision) && change.fromRevision !== value.processingRevision && typeof change.summary === 'string' && change.summary.trim().length > 0 && change.summary.length <= 1000 && new TextEncoder().encode(change.summary).length <= 1000 && !/[\u0000-\u001f\u007f]/u.test(change.summary);
}
export function samePromptPolicy(a:PromptPolicy|undefined,b:PromptPolicy|undefined):boolean {
  return !a&&!b || !!a&&!!b&&a.profile===b.profile&&a.processingRevision===b.processingRevision&&a.materialChange?.fromRevision===b.materialChange?.fromRevision&&a.materialChange?.summary===b.materialChange?.summary;
}

/** Bounded local metadata, never authenticated evidence. Invalid metadata cannot confer permission. */
export function parsePromptPolicyMemory(value: unknown, now: number): PromptPolicyMemory | undefined {
  if (!object(value) || !exact(value,['profile','at','outcome',...(value.processingRevision === undefined ? [] : ['processingRevision'])]) || value.profile !== 'it-garante-2021' || !Number.isSafeInteger(value.at) || Number(value.at) < 0 || Number(value.at) > now || Number(value.at) > 8640000000000000 - 366 * 86400000 || typeof value.outcome!=='string' || !['withheld','all-granted'].includes(value.outcome) || value.processingRevision !== undefined && !isProcessingRevision(value.processingRevision)) return undefined;
  return { profile: value.profile, at: Number(value.at), outcome: value.outcome as PromptPolicyMemory['outcome'], ...(value.processingRevision === undefined ? {} : { processingRevision: value.processingRevision as string }) };
}

/** Six UTC calendar months, clamping the day to the destination month's last day. */
export function sixCalendarMonthsAfter(at: number): number {
  const date = new Date(at), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 6);
  const end = new Date(date.getTime()); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
  date.setUTCDate(Math.min(day, end.getUTCDate()));
  return date.getTime();
}

/** Equal-time withholding/current-revision acknowledgement wins conservatively. */
export function latestPromptPolicyMemory(policy: PromptPolicy, memories: readonly (PromptPolicyMemory | undefined)[]): PromptPolicyMemory | undefined {
  return memories.filter((memory): memory is PromptPolicyMemory => !!memory).sort((a,b) => b.at - a.at || Number(b.processingRevision === policy.processingRevision) - Number(a.processingRevision === policy.processingRevision) || Number(b.outcome === 'withheld') - Number(a.outcome === 'withheld'))[0];
}

export function evaluatePromptPolicy(policy: PromptPolicy, memory: PromptPolicyMemory | undefined, now: number, stateAvailable: boolean): PromptPolicyDecision {
  const base = { profile: policy.profile, version: '2021-06-10.1' as const, requirementIds: ['REQ-IT-REPROMPT'] as ['REQ-IT-REPROMPT'], sourceIds: ['SRC-IT-GUIDE'] as ['SRC-IT-GUIDE'] };
  if (!memory || memory.outcome === 'all-granted') return { ...base, reason: stateAvailable ? 'no-prior-withholding' : 'prior-state-unavailable', allowsPrompt: true, requiresChoice: false };
  if (policy.materialChange && memory.processingRevision === policy.materialChange.fromRevision && memory.processingRevision !== policy.processingRevision) return { ...base, reason: 'material-change', allowsPrompt: true, requiresChoice: true };
  const until = sixCalendarMonthsAfter(memory.at);
  return { ...base, reason: now < until ? 'withholding-floor' : 'six-months-elapsed', allowsPrompt: now >= until, requiresChoice: false, nextEligibleAt: new Date(until).toISOString() };
}
