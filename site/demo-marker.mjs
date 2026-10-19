// @requirements REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-A11Y
// Project-website framing only. Never apply this to retained artifact downloads.
export const demoMarker='<aside class="demo-corner" aria-label="Demonstration">Demo</aside>';
export function markDemoPage(html){
 if(html.includes('class="demo-corner"'))return html;
 return html.replace('</head>','<link rel="stylesheet" href="/assets/demo-marker.css"></head>').replace(/(<body\b[^>]*>)/u,'$1'+demoMarker);
}
export async function markDemoResponse(response){
 if(!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);headers.delete('Content-Length');
 return new Response(markDemoPage(await response.text()),{status:response.status,statusText:response.statusText,headers});
}
