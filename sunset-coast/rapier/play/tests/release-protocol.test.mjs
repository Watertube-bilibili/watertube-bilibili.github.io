import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_RELEASE,DISPLAY_RELEASE} from '../release-notes.js';
test('visible 1.0 branding preserves shipped native bridge handshake version',()=>{assert.equal(CURRENT_RELEASE,'2.0.0-beta.1');assert.match(DISPLAY_RELEASE,/1\.0 Beta/);});
