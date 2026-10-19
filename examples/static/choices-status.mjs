// @requirements REQ-PRODUCT-CONSENT-RUNTIME
export function paintChoices(state){
 const names={'sample-measurements':'measurements','sample-suggestions':'suggestions'};
 const labels={blocked:'Blocked',starting:'Starting',active:'Allowed',stopping:'Stopping','reload-required':'Reload needed'};
 for(const [service,id] of Object.entries(names)){const phase=state.services[service]??'blocked';document.getElementById(id).textContent=labels[phase]??'Blocked';document.querySelector(`[data-service="${service}"]`).dataset.state=phase;}
 const phases=Object.values(state.services);const active=phases.filter(value=>value==='active').length;
 document.getElementById('choice-state').textContent=phases.includes('reload-required')?'A sample service needs a reload before it can run safely.':phases.includes('starting')?'Starting the features your choice permits.':phases.includes('stopping')?'Stopping optional work and clearing its sample storage.':active?`${active===1?'One sample service is': 'Both sample services are'} following your permission.`:'Optional features are blocked. The choice stays yours.';
}
