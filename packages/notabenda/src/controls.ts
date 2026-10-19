// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
import type { ConsentStateController, ConsentSnapshot } from './consent.js';
import { defaultConsentWording } from './consent-notice.js';

export interface ControlsOptions { consent: ConsentStateController; preferencesLabel?: string }
export interface MountedControls { destroy(options?: {preservePreferences?: boolean}): void }

/** @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y REQ-EU-FAIR-CHOICE REQ-ES-CHOICE REQ-EU-CONSENT REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-REACT
 * A nonmodal initial notice; only an explicit action opens the native modal dialog.
 */
export function mountControls(container: HTMLElement, options: ControlsOptions): MountedControls {
  const { consent } = options;
  const config = consent.getConfig();
  const policy = config.consent!;
  const archivedNotice=consent.getNotice();
  const wording = archivedNotice?.wording??defaultConsentWording(config);
  const doc = container.ownerDocument;
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
    const result = doc.createElement(tag); if (className) result.className = className; if (text) result.textContent = text; return result;
  };
  const root = element('div', 'nb-controls');
  const trigger = element('button', 'nb-preferences-trigger', options.preferencesLabel ?? 'Privacy choices'); trigger.type = 'button';
  const message = element('p', 'nb-control-status'); message.setAttribute('role', 'status');
  const notice = element('section', 'nb-consent-notice'); notice.setAttribute('aria-label', 'Optional cookie choices');
  const title = element('h2', undefined, wording.title);
  const summary = element('p', undefined, wording.summary);
  const actions = element('div', 'nb-choice-actions');
  const button = (text: string, action: () => void, className = 'nb-choice-button') => { const result = element('button', className, text); result.type = 'button'; result.addEventListener('click', action); return result; };
  const finishNoticeAction = () => { if (notice.hidden) trigger.focus({ preventScroll: true }); };
  const reject = () => { consent.rejectAll(); finishNoticeAction(); };
  const accept=button(wording.acceptLabel, () => { consent.acceptAll(); finishNoticeAction(); });
  actions.append(button(wording.rejectLabel, reject), accept);
  const secondary = element('div', 'nb-choice-secondary');
  const preferences = button(wording.preferencesLabel, () => consent.openPreferences(), 'nb-text-button');
  secondary.append(preferences, button(wording.dismissLabel, () => { consent.dismiss(); finishNoticeAction(); }, 'nb-text-button'));
  const cookieLink = element('a', undefined, 'Cookie policy'); cookieLink.href = archivedNotice?.documents.cookies.url??config.documents.cookies.route; secondary.append(cookieLink);
  const noticeMessage = element('p', 'nb-control-status'); noticeMessage.setAttribute('role', 'status');
  const retryButtons:HTMLButtonElement[]=[];
  const retry=()=>{const b=button('Try recording again',()=>{void consent.retryEvidence();},'nb-text-button');b.hidden=true;retryButtons.push(b);return b;};
  notice.append(title, summary, noticeMessage, retry(), actions, secondary);

  const drawer = element('dialog', 'nb-preferences');
  if (typeof drawer.showModal !== 'function') throw new Error('Built-in controls require native dialog support. Use the headless controller for a custom interface.');
  const heading = element('h2', undefined, wording.preferencesTitle); heading.tabIndex = -1;
  const headingId = `nb-preferences-${config.site.id}-${++controlId}`; heading.id = headingId; drawer.setAttribute('aria-labelledby', headingId);
  drawer.id = `${headingId}-dialog`;
  for (const entry of [trigger, preferences]) { entry.setAttribute('aria-haspopup', 'dialog'); entry.setAttribute('aria-controls', drawer.id); }
  const header = element('div', 'nb-preferences-header'); header.append(heading, button(wording.closeLabel, () => consent.closePreferences(), 'nb-text-button'));
  const body = element('div', 'nb-preferences-body');
  body.append(element('p', undefined, wording.preferencesIntro));
  body.append(element('p', 'nb-essential-note', wording.essentialNote));
  const inputs = new Map<string, HTMLInputElement>();
  for (const purpose of policy.purposes) {
    const fact = config.purposes.find(item => item.id === purpose.id)!;
    const row = element('label', 'nb-purpose');
    const input = element('input'); input.type = 'checkbox'; input.name = purpose.id;input.disabled=consent.getSnapshot().scopeGuards.blockedPurposeIds.includes(purpose.id);
    const copy = element('span');
    const label = element('strong', undefined, fact.name); label.id = `${headingId}-${purpose.id}-label`;
    const description = element('span', 'nb-purpose-description', fact.description); description.id = `${headingId}-${purpose.id}-description`;
    copy.append(label, description);
    const providers = config.services.filter(service => policy.services.some(s => s.id === service.id) && service.purposeIds.includes(purpose.id)).map(service => `${service.name} (${service.provider})`);
    const services = element('span', 'nb-purpose-description', `Services: ${providers.join(', ')}`); services.id = `${headingId}-${purpose.id}-services`; copy.append(services);
    input.setAttribute('aria-labelledby', label.id); input.setAttribute('aria-describedby', `${description.id} ${services.id}`);
    if(input.disabled){const guard=element('span','nb-purpose-description','This option needs a separate supported process and stays off here.');guard.id=`${headingId}-${purpose.id}-guard`;copy.append(guard);input.setAttribute('aria-describedby', `${description.id} ${services.id} ${guard.id}`);}
    row.append(input, copy); body.append(row); inputs.set(purpose.id, input);
  }
  const links = element('nav', 'nb-legal-links'); links.setAttribute('aria-label', 'Privacy information');
  for (const kind of ['privacy','cookies'] as const) { const link = element('a', undefined, config.documents[kind].title); link.href = archivedNotice?.documents[kind].url??config.documents[kind].route; links.append(link); }
  const drawerMessage = element('p', 'nb-control-status'); drawerMessage.setAttribute('role', 'status');
  for (const status of [message, noticeMessage, drawerMessage]) status.tabIndex = -1;
  body.append(links, drawerMessage,retry());
  const footer = element('div', 'nb-preferences-footer');
  const save=button(wording.saveLabel, () => {
    const result = consent.choose(Object.fromEntries([...inputs].map(([id, input]) => [id, input.checked])));
    if (result.persisted) consent.closePreferences();
  });
  footer.append(button(wording.rejectLabel, () => { const result = consent.rejectAll(); if (result.persisted) consent.closePreferences(); }),save);
  drawer.append(header, body, footer);const outsideRetry=retry(); root.append(trigger, message, outsideRetry, notice, drawer); container.append(root);
  function syncSave():void {const state=consent.getSnapshot();save.disabled=state.destroyed||!!state.evidence&&!state.evidence.canGrant&&[...inputs.values()].some(input=>input.checked);}
  for(const input of inputs.values())input.addEventListener('change',syncSave);
  let opener: HTMLElement | undefined; let opened = false; let previousChoices = ''; let removed = false;
  // Whole-dialog scrolling is the fallback. Pin chrome only when text leaves a useful body viewport.
  drawer.dataset.nbScroll = 'dialog';
  const Resize = doc.defaultView?.ResizeObserver;
  const layoutObserver = Resize ? new Resize(() => measureDrawer()) : undefined;
  function measureDrawer(): void {
    if (removed || !drawer.open || !layoutObserver) return;
    const style = doc.defaultView!.getComputedStyle(body);
    const font = Number.parseFloat(style.fontSize) || 16;
    const minimum = 6 * font + (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
    const available = drawer.clientHeight - header.offsetHeight - footer.offsetHeight;
    const next = available >= minimum + (drawer.dataset.nbScroll === 'body' ? -2 : 2) ? 'body' : 'dialog';
    const focused = doc.activeElement;
    if (drawer.dataset.nbScroll !== next) drawer.dataset.nbScroll = next;
    // Resize/reflow reveals the same control; it must not move focus or change a draft choice.
    if (focused instanceof doc.defaultView!.HTMLElement && drawer.contains(focused)) {
      const port = (next === 'body' && body.contains(focused) ? body : drawer).getBoundingClientRect();
      const rect = focused.getBoundingClientRect();
      if (rect.top < port.top || rect.bottom > port.bottom || rect.left < port.left || rect.right > port.right)
        focused.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
    }
  }
  for (const part of [drawer, header, footer]) layoutObserver?.observe(part);
  function update(state: ConsentSnapshot): void {
    if (removed) return;
    // Remember ownership before disabling/hiding anything; native browsers can move focus to body.
    const focused = doc.activeElement; const ownedFocus = focused !== null && root.contains(focused);
    const keyboardFocus = ownedFocus && focused.matches(':focus-visible');
    const choices = JSON.stringify(state.purposes);
    const storageMessage = state.persistence === 'unavailable' ? 'Preferences cannot be saved in this browser. Optional services stay off. A previous saved choice may return on a later visit if browser storage cannot be cleared.' : '';
    const reloadMessage = Object.values(state.services).includes('reload-required') ? 'An optional service could not be stopped or initialized safely. Reload this page to finish resetting it.' : '';
    const receiptMessage=state.evidence?({checking:'Checking your saved choice… Optional services stay off.',saving:'Saving your choice… Optional services stay off until confirmed.',recorded:'Your choices have been recorded.',error:"We couldn't confirm your choice was recorded. Optional services stay off.",review:'Review your choices before allowing optional services.',stale:'This notice has changed. Reload to review the current version.',expired:'This choice was not confirmed in time or has expired. Choose again to allow optional services.',unavailable:'A choice record could not be created. Optional services stay off. You can still reject optional purposes.',retired:'This choice context has closed. Optional services stay off. Contact the site operator if you need a new privacy workflow.',idle:'',destroyed:''}[state.evidence.status]):'';
    // @requirements REQ-PRODUCT-PRIVACY-SIGNALS Cookie grants do not override processing restrictions.
    const signalMessage=state.privacySignals?.globalPrivacyControl==='observed'?'Global Privacy Control is active. Services covered by this site’s signal policy stay off in this browser. Cookie choices do not override this restriction.':state.privacySignals?.globalPrivacyControl==='unavailable'?'Global Privacy Control could not be checked. Services covered by this site’s signal policy stay off in this browser.':'';
    const processingMessage=state.processingChoices?(state.processingChoices.status==='recorded'?'A processing restriction is recorded for this context. Cookie choices do not remove it.':state.processingChoices.blockedActivities.length?'Processing restrictions are pending or could not be confirmed. Covered services stay off; cookie choices do not override them.':''):'';
    message.textContent = [state.destroyed ? 'Privacy choices are unavailable.' : '',storageMessage, reloadMessage,receiptMessage,signalMessage,processingMessage].filter(Boolean).join(' ');
    notice.hidden = state.destroyed || state.preferencesOpen || !state.shouldPrompt || !policy.purposes.length;
    message.hidden = !message.textContent || !notice.hidden || state.preferencesOpen;
    noticeMessage.textContent = message.textContent; noticeMessage.hidden = !noticeMessage.textContent;
    trigger.disabled = state.destroyed;
    for (const entry of [trigger, preferences]) entry.setAttribute('aria-expanded', String(state.preferencesOpen));
    accept.disabled=state.destroyed||policy.purposes.every(p=>state.scopeGuards.blockedPurposeIds.includes(p.id))||!!state.evidence&&!state.evidence.canGrant;
    for(const b of retryButtons)b.hidden=!state.evidence?.canRetry;
    outsideRetry.hidden=outsideRetry.hidden||!notice.hidden||state.preferencesOpen;
    if (state.preferencesOpen && !opened) {
      opener = doc.activeElement && 'focus' in doc.activeElement ? doc.activeElement as HTMLElement : trigger;
      for (const [id, input] of inputs) input.checked = state.purposes[id] === 'granted';
      drawerMessage.textContent = message.textContent; drawerMessage.hidden = !drawerMessage.textContent;
      opened = true; drawer.showModal(); measureDrawer(); heading.focus();
    } else if (opened && state.preferencesOpen) {
      if (choices !== previousChoices) for (const [id, input] of inputs) input.checked = state.purposes[id] === 'granted';
      drawerMessage.textContent = [message.textContent, choices !== previousChoices ? 'Current choices changed. Review the selections before saving.' : ''].filter(Boolean).join(' '); drawerMessage.hidden = !drawerMessage.textContent;
    } else if (opened) {
      opened = false; drawer.close();
      const destination = opener?.isConnected && opener.getClientRects().length ? opener : trigger;
      destination.focus({ preventScroll: true });
    }
    previousChoices = choices;
    syncSave();
    // Background updates must not steal focus from the page or another choice control.
    if (ownedFocus && (doc.activeElement === focused || doc.activeElement === doc.body) &&
        (focused.closest('[hidden]') || ('disabled' in focused && focused.disabled))) {
      const destination = opened ? (drawerMessage.hidden ? heading : drawerMessage) :
        !notice.hidden ? (noticeMessage.hidden ? actions.querySelector('button')! : noticeMessage) : message.hidden ? trigger : message;
      destination.focus({preventScroll: !keyboardFocus});
    }
  }
  trigger.addEventListener('click', () => consent.openPreferences());
  drawer.addEventListener('cancel', event => { event.preventDefault(); consent.closePreferences(); });
  drawer.addEventListener('close', () => { if (opened && !removed) consent.closePreferences(); });
  const unsubscribe = consent.subscribe(update);
  return { destroy(options = {}) { if (removed) return; if (opened && !options.preservePreferences) consent.closePreferences(); removed = true; layoutObserver?.disconnect(); unsubscribe(); if (opened) { opened = false; drawer.close(); } root.remove(); } };
}
let controlId = 0;
