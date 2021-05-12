"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert_1 = __importDefault(require("assert"));
const __1 = __importDefault(require(".."));
mocha_1.describe('Cache Test', function () {
    var cache;
    this.beforeAll(function () {
        cache = new __1.default({
            ttl: 20000,
            max: 4
        });
    });
    // this.beforeEach(function(){
    //     cache.clearAll();
    // });
    mocha_1.describe('Check 1', function () {
        mocha_1.it('should insert tree elements', function () {
            cache.set('key1', 'value1')
                .set('key2', 2)
                .set(3, { value: 1 });
            assert_1.default.strictEqual(cache.size, 3);
        });
        mocha_1.it('Should returns 3', function () {
            assert_1.default.strictEqual(cache.get('key2'), 2);
        });
        mocha_1.it('Should returns "value1"', function () {
            assert_1.default.strictEqual(cache.get('key1'), 'value1');
        });
        mocha_1.it('Should returns obj', function () {
            assert_1.default.deepStrictEqual(cache.get(3), { value: 1 });
        });
        // it('shoould remove items after 70 seconds', function(cb){
        //     setTimeout(function(){
        //         var error= null
        //         try {
        //             Assert.strictEqual(cache.size, 0);
        //         } catch (err) {
        //             error= err
        //         }
        //         cb(error);
        //     }, 70000);
        // });
    });
    mocha_1.describe('LRU', function () {
        mocha_1.it('should keep last 4 elements only', function () {
            cache.set('ky1', 'v');
            cache.set('k2', 'v');
            cache.set('ky3', 'v');
            cache.set('ky4', 'v');
            cache.set('ky5', 'v');
            cache.set('ky6', 'v');
            cache.set('ky7', 'v');
            cache.set('ky8', 'v');
            cache.set('ky9', 'v');
            assert_1.default.strictEqual(cache.size, cache.max);
        });
    });
});

//# sourceMappingURL=test.js.map
