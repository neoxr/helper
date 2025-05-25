"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = void 0;
class Utils {
    constructor() {
        this.isUrl = (url) => {
            try {
                new URL(url);
                return true;
            }
            catch {
                return false;
            }
        };
        this.makeId = (length) => {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        };
    }
}
const utils = new Utils;
exports.utils = utils;
exports.default = utils;
