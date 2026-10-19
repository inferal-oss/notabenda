// @requirements REQ-EU-ORDER-CONFIRMATION REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {claimPaidOrderConfirmation,settlePaidOrderConfirmation} from './order-confirmations.js';
import type {PaidOrderContext} from './order-context.js';
import type {OrderConfirmationLease} from './order-confirmations.js';
import type {HistoryStorage} from './history.js';
import {boundedText} from './records.js';
import {contractActionIso} from './contract-action-policy.js';

export interface OrderConfirmationAttempt {
  /** Use lease.deliveryId for downstream idempotency, including after timeout/restart. */
  lease: OrderConfirmationLease;
  signal: AbortSignal;
}
export interface OrderConfirmationDispatchOptions {
  /** Resolve only after the configured endpoint durably accepts this stable job. */
  deliver(attempt: OrderConfirmationAttempt): Promise<{providerRef: string}>;
  leaseMs?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
}
export interface OrderConfirmationDispatchResult {
  provider: 'not-invoked' | 'accepted' | 'uncertain';
  settlement: 'not-claimed' | 'settled' | 'lease-lost' | 'unknown';
  deliveryId?: string;
}
interface Options {
  deliver: OrderConfirmationDispatchOptions['deliver'];
  leaseMs: number;
  timeoutMs: number;
  maxAttempts: number;
  signal?: AbortSignal;
}
const SETTLEMENT_RESERVE_MS = 100;
function options(value: OrderConfirmationDispatchOptions): Options {
  if (!value || typeof value !== 'object') throw new TypeError('Invalid confirmation dispatch options.');
  const {deliver, signal} = value;
  const leaseMs = value.leaseMs ?? 60000;
  const timeoutMs = value.timeoutMs ?? Math.min(30000, leaseMs - SETTLEMENT_RESERVE_MS);
  const maxAttempts = value.maxAttempts ?? 10;
  if (typeof deliver !== 'function' || !Number.isInteger(leaseMs) || leaseMs < 1000 || leaseMs > 300000 ||
      !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > leaseMs - SETTLEMENT_RESERVE_MS ||
      !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100 ||
      signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError('Invalid confirmation dispatch options.');
  }
  return {deliver, leaseMs, timeoutMs, maxAttempts, ...(signal ? {signal} : {})};
}
function accepted(input: unknown): string {
  if (!input || typeof input !== 'object' || Object.getPrototypeOf(input) !== Object.prototype) throw new Error('Uncertain provider outcome.');
  const fields = Object.getOwnPropertyDescriptors(input);
  if (Reflect.ownKeys(fields).length !== 1 || !fields.providerRef || !('value' in fields.providerRef) ||
      !boundedText(fields.providerRef.value, 200) || !fields.providerRef.value.trim()) throw new Error('Uncertain provider outcome.');
  return fields.providerRef.value;
}
function remaining(context: PaidOrderContext, lease: OrderConfirmationLease, minimum: number): {budget: number; at: number} {
  const now = context.now?.() ?? new Date();
  if (!(now instanceof Date) || !contractActionIso(now.toISOString())) throw new Error('Invalid dispatch clock.');
  const at = now.getTime();
  if (!Number.isFinite(at) || at < minimum) throw new Error('Regressing dispatch clock.');
  return {budget: Date.parse(lease.expiresAt) - at - SETTLEMENT_RESERVE_MS, at};
}

async function run(storage: HistoryStorage, context: PaidOrderContext, settings: Options): Promise<OrderConfirmationDispatchResult> {
  if (settings.signal?.aborted) return {provider: 'not-invoked', settlement: 'not-claimed'};
  let lease: OrderConfirmationLease | undefined;
  try {
    lease = await claimPaidOrderConfirmation(storage, context, {leaseMs: settings.leaseMs, maxAttempts: settings.maxAttempts});
  } catch {
    // The claim transaction may have committed before its response was lost.
    return {provider: 'not-invoked', settlement: 'unknown'};
  }
  if (!lease) return {provider: 'not-invoked', settlement: 'not-claimed'};

  let provider: OrderConfirmationDispatchResult['provider'] = 'not-invoked';
  let providerRef: string | undefined;
  let started = false;
  let highWater = Date.parse(lease.expiresAt) - settings.leaseMs;
  const readBudget = () => {const value = remaining(context, lease!, highWater); highWater = value.at; return value.budget;};
  const controller = new AbortController();
  const interrupted = new Error('Confirmation dispatch interrupted.');
  let rejectInterruption!: (reason: Error) => void;
  const interruption = new Promise<never>((_, reject) => {rejectInterruption = reject;});
  void interruption.catch(() => {});
  const abort = () => {controller.abort(); rejectInterruption(interrupted);};
  settings.signal?.addEventListener('abort', abort, {once: true});
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Install abort handling before the final check. Storage latency consumes the lease.
    if (settings.signal?.aborted) abort();
    const budget = Math.min(settings.timeoutMs, readBudget());
    if (budget < 1) abort();
    else timer = setTimeout(abort, budget);
    const delivery = Promise.resolve().then(async () => {
      const budget = readBudget();
      const attempt = {lease: structuredClone(lease!), signal: controller.signal};
      if (budget < 1 || controller.signal.aborted) throw interrupted;
      started = true;
      return accepted(await settings.deliver(attempt));
    });
    // Both branches remain observed after timeout; late results never settle again.
    providerRef = await Promise.race([delivery, interruption]);
    provider = 'accepted';
  } catch {
    provider = started ? 'uncertain' : 'not-invoked';
  } finally {
    clearTimeout(timer);
    settings.signal?.removeEventListener('abort', abort);
  }

  try {
    const result = await settlePaidOrderConfirmation(storage, lease,
      provider === 'accepted' ? {status: 'accepted', providerRef: providerRef!} : {status: 'uncertain'}, context);
    return {provider, settlement: result.settled ? 'settled' : 'lease-lost', deliveryId: lease.deliveryId};
  } catch {
    // Settlement may have committed. Do not turn persistence uncertainty into provider rejection.
    return {provider, settlement: 'unknown', deliveryId: lease.deliveryId};
  }
}

/** One bounded host callback. No network adapter, public route, scheduler or automatic retry. */
export async function dispatchPaidOrderConfirmation(storage:HistoryStorage,context:PaidOrderContext,input:OrderConfirmationDispatchOptions):Promise<OrderConfirmationDispatchResult>{
 return run(storage,{...context},options(input));
}
