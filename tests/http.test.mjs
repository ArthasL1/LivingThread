import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

test('local service pairs an extension, rejects webpage origins, and protects session state', async () => {
  const port=44317;
  const child=spawn(process.execPath,['server/main.mjs'], {cwd:process.cwd(),windowsHide:true,env:{...process.env,LIVINGTHREAD_PORT:String(port),LIVINGTHREAD_RUNTIME:`.runtime/http-test-${randomUUID()}`},stdio:['ignore','pipe','pipe']});
  let startup=''; child.stdout.on('data',d=>startup+=d);child.stderr.on('data',d=>startup+=d);
  try {
    const base=`http://127.0.0.1:${port}`;
    let healthy=false;
    for(let i=0;i<40;i++){try{const response=await fetch(base+'/health');if(response.ok){healthy=true;break;}}catch{}await delay(50);}
    assert.ok(healthy,`Server failed to start: ${startup}`);
    assert.equal((await fetch(base+'/api/state')).status,401);
    const bad=await fetch(base+'/api/pair',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:'{}'});
    assert.equal(bad.status,403);
    const origin='chrome-extension://'+'a'.repeat(32);
    const pair=await fetch(base+'/api/pair',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
    assert.equal(pair.status,200);
    const {token}=await pair.json();assert.equal(token.length,64);
    const headers={Authorization:`Bearer ${token}`,Origin:origin,'Content-Type':'application/json'};
    const state=await (await fetch(base+'/api/state',{headers})).json();assert.equal(state.session.enabled,false);
    assert.equal((await fetch(base+'/api/state',{headers:{...headers,Origin:'https://unrelated.example'}})).status,401);
    const paused=await (await fetch(base+'/api/session',{method:'POST',headers,body:'{"enabled":false}'})).json();assert.equal(paused.session.enabled,false);
  }finally{child.kill();}
});
