"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const mocha_1=require("mocha"),assert_1=__importDefault(require("assert")),__1=__importDefault(require(".."));mocha_1.describe("Cache Test",(function(){var e;this.beforeAll((function(){e=new __1.default({ttl:2e4,max:4})})),mocha_1.describe("Check 1",(function(){mocha_1.it("should insert tree elements",(function(){e.set("key1","value1").set("key2",2).set(3,{value:1}),assert_1.default.strictEqual(e.size,3)})),mocha_1.it("Should returns 3",(function(){assert_1.default.strictEqual(e.get("key2"),2)})),mocha_1.it('Should returns "value1"',(function(){assert_1.default.strictEqual(e.get("key1"),"value1")})),mocha_1.it("Should returns obj",(function(){assert_1.default.deepStrictEqual(e.get(3),{value:1})}))})),mocha_1.describe("LRU",(function(){mocha_1.it("should keep last 4 elements only",(function(){e.set("ky1","v"),e.set("k2","v"),e.set("ky3","v"),e.set("ky4","v"),e.set("ky5","v"),e.set("ky6","v"),e.set("ky7","v"),e.set("ky8","v"),e.set("ky9","v"),assert_1.default.strictEqual(e.size,e.max)}))})),mocha_1.describe("TTL",(function(){mocha_1.it("Should delete item after 4 seconds",(function(e){this.timeout(5e3);var t=new __1.default({ttl:3e3});t.set("k",1),t.set("k2",2),t.set("k3",3),t.setPermanent("k5","hello world"),setTimeout((function(){console.log("---k5>>",t.get("k5")),console.log("--size: ",t.size),e(t.tmpSize>0?new Error("Expected one element"):null)}),4e3)}))}))}));