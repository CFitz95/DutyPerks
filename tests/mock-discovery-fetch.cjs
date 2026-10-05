// Offline integration fixture only. Never used by the deployed application.
const originalFetch=global.fetch;
global.fetch=(input,init)=>{
 const url=new URL(typeof input==='string'?input:input.url??String(input));
 if(url.hostname==='navysealmuseumsd.org') return originalFetch('http://127.0.0.1:3321/fixture?url='+encodeURIComponent(url.href),init);
 return originalFetch(input,init);
};
