// @requirements REQ-PRODUCT-CF-RECOVERY-REHEARSAL
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {createRecoveryFixture} from '../../../scripts/fixtures/starter-recovery.mjs';

test('hydrated recovery fixture cannot clear isolation through source seeding',async()=>{
 const raw=createSyntheticStorage([]),storage={...raw,list:options=>raw.list({prefix:'',...options}),transaction:callback=>raw.transaction(tx=>callback({...tx,list:options=>tx.list({prefix:'',...options})}))};
 const fixture=createRecoveryFixture(storage,{});
 assert.equal(await fixture.isolated(),true);
 await fixture.run('hydrate',{schemaVersion:1,kind:'synthetic-do-kv-backup',entries:[['notabenda/test',{retained:true}]]});
 await assert.rejects(()=>fixture.run('seed'),/Seed only a new source fixture/);
 assert.equal(await fixture.isolated(),true);
 assert.deepEqual(await fixture.run('replay'),{blocked:true,code:'recovery-isolated'});
 assert.deepEqual(await storage.get('notabenda/test'),{retained:true});
 await assert.rejects(()=>fixture.run('hydrate',{schemaVersion:1,kind:'synthetic-do-kv-backup',entries:[]}),/empty disposable target/);
});
