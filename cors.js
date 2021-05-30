var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;
var cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    // requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2', 'origin', 'referrer', 'x-requested-with'],
    setHeaders:{'origin':'http://jirasw.t-mobile.com'}
}).listen(port, host, function() {
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║  Unable to establish open communication with remote API Host.  ║
    ╿  CORS headers set to prevent internal localhost access to all  ╿
   ⊙⎨  systems, including AUTHENTICATED USERS on secured ENTERPRISE  ⎬⊙ 
    ╽  NETWORK nodes barring all traffic & communication with APIs.  ╽
    ║  Let's fix that, shall we?    ❝𝑫𝒐𝒏'𝒕 𝒈𝒆𝒕 𝒎𝒂𝒅... 𝑮𝒆𝒕 𝑰𝑵❞  - 𝓙𝓙  ║
    ╚════════════════════════════════════════════════════════════════╝
      
  Executing:
    HTTP-Assisted Circumventing Kerberos Security...
      [Onserving]...    Can't Obtain Required Services    [...CORS [✓] ]
      [Probing]...      Connection Augmentation Needed    [...CAN  [✓] ]
      [Evaluating]...   Gathering Endpoint Targets        [...GET  [✓] ]
      [Negotiating].... Bypassing Enterprise Network TCP  [...BENT [✓] ]
      [OPEN]            ${host}:${port}`);
});
    
