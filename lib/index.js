"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const file_type_1 = require("file-type");
const utils_1 = __importDefault(require("./utils"));
const cheerio = __importStar(require("cheerio"));
const async_retry_1 = __importDefault(require("async-retry"));
const creator = `@neoxr.js – Wildan Izzudin`;
exports.short = (url) => new Promise(async (resolve, reject) => {
    try {
        let form = new URLSearchParams;
        form.append('url', url);
        const json = await (await axios_1.default.post('https://s.neoxr.eu/api/short', form)).data;
        resolve(json);
    }
    catch (e) {
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.upload = (i, extension) => new Promise(async (resolve, reject) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        let ext = 'txt';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'txt';
        }
        let form = new form_data_1.default;
        form.append('someFiles', Buffer.from(file), 'file.' + (extension || ext));
        const json = await (0, async_retry_1.default)(async () => {
            const response = await (await axios_1.default.post('https://s.neoxr.eu/api/upload', form, {
                headers: {
                    ...form.getHeaders()
                }
            })).data;
            if (!response.status)
                throw new Error('Failed to Upload!');
            return response;
        }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: (e, n) => { }
        });
        resolve(json);
    }
    catch (e) {
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.tmpfiles = (i, extension, time = 60) => new Promise(async (resolve) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        const parse = await axios_1.default.get('https://tmpfiles.org');
        const cookie = parse?.headers?.['set-cookie']?.join(';');
        const token = cheerio.load(parse.data)('input[name="_token"]')?.attr('value');
        if (!token || !cookie)
            throw new Error('Can\'t get credentials');
        let ext = 'txt';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'txt';
        }
        let form = new form_data_1.default;
        form.append('_token', token);
        form.append('file', Buffer.from(file), utils_1.default.makeId(10) + '.' + (extension || ext));
        form.append('max_views', 0);
        form.append('max_time', time);
        form.append('upload', 'Upload');
        const html = await (await axios_1.default.post('https://tmpfiles.org', form, {
            headers: {
                cookie,
                ...form.getHeaders()
            }
        })).data;
        const $ = cheerio.load(html);
        const component = [];
        $('td').each((i, e) => component.push($(e).text()));
        if (!component[2])
            return resolve({
                creator,
                status: false,
                msg: `upload failed`
            });
        resolve({
            creator,
            status: true,
            data: {
                filename: component[0],
                size: component[1],
                expired: component[3],
                url: component[2]
            }
        });
    }
    catch (e) {
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.imgbb = (i) => new Promise(async (resolve, reject) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const parse = await (await axios_1.default.get('https://imgbb.com', {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
        }));
        const token = parse?.data?.match(/PF\.obj\.config\.auth_token="([^"]*)/)?.[1];
        const cookie = parse?.headers?.['set-cookie']?.join(';');
        if (!token || !cookie)
            throw new Error('Can\'t get credentials');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        let ext = 'jpg';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'jpg';
        }
        let form = new form_data_1.default;
        form.append('source', Buffer.from(file), 'image.' + ext);
        form.append('type', 'file');
        form.append('action', 'upload');
        form.append('timestamp', (Date.now() * 1));
        form.append('auth_token', token);
        const json = await (0, async_retry_1.default)(async () => {
            const response = await (await axios_1.default.post('https://imgbb.com/json', form, {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                    "Origin": "https://imgbb.com",
                    "Referer": "https://imgbb.com/upload",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    cookie,
                    ...form.getHeaders()
                }
            })).data;
            if (response.status_code != 200)
                throw new Error('Failed to Upload!');
            return response;
        }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: (e, n) => { }
        });
        if (json.status_code != 200)
            throw new Error('Failed to Upload!');
        resolve({
            creator,
            status: true,
            original: json,
            data: {
                url: json.image.display_url
            }
        });
    }
    catch (e) {
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.imgkub = (i) => new Promise(async (resolve, reject) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const parse = await (await axios_1.default.get('https://imgkub.com', {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
        }));
        const token = parse.data?.match(/PF\.obj\.config\.auth_token\s=\s"([^"]*)/)?.[1];
        const cookie = parse?.headers?.['set-cookie']?.join(';');
        if (!token || !cookie)
            throw new Error('Can\'t get credentials');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        let ext = 'jpg';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'jpg';
        }
        let form = new form_data_1.default;
        form.append('source', Buffer.from(file), 'image.' + ext);
        form.append('type', 'file');
        form.append('action', 'upload');
        form.append('timestamp', (Date.now() * 1));
        form.append('auth_token', token);
        const json = await (0, async_retry_1.default)(async () => {
            const response = await (await axios_1.default.post('https://imgkub.com/json', form, {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                    "Origin": "https://imgbb.com",
                    "Referer": "https://imgbb.com/upload",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    cookie,
                    ...form.getHeaders()
                }
            })).data;
            if (response.status_code != 200)
                throw new Error('Failed to Upload!');
            return response;
        }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: (e, n) => { }
        });
        if (json.status_code != 200)
            throw new Error('Failed to Upload!');
        resolve({
            creator,
            status: true,
            original: json,
            data: {
                url: json.image.url
            }
        });
    }
    catch (e) {
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.bashupload = (i, extension) => new Promise(async (resolve, reject) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        let ext = 'txt';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'txt';
        }
        let form = new form_data_1.default;
        form.append('json', 'true');
        form.append('file_1', Buffer.from(file), utils_1.default.makeId(10) + '.' + (extension || ext));
        const json = await (0, async_retry_1.default)(async () => {
            const response = await (await axios_1.default.post('https://bashupload.com', form, {
                headers: {
                    accept: 'application/json',
                    origin: 'https://bashupload.com',
                    referer: 'https://bashupload.com/',
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
                }
            })).data;
            if (!response?.file_1?.url)
                throw new Error('Failed to Upload!');
            return response;
        }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: (e, n) => { }
        });
        if (!json?.file_1?.url)
            throw new Error('Failed to Upload!');
        resolve({
            creator,
            status: true,
            data: {
                url: json.file_1.url + '?download=1',
                size: json.file_1.size
            }
        });
    }
    catch (e) {
        console.log(e);
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
exports.catbox = (i, extension) => new Promise(async (resolve, reject) => {
    try {
        if (!Buffer.isBuffer(i) && !utils_1.default.isUrl(i))
            throw new Error('Only buffer and url formats are allowed');
        const file = Buffer.isBuffer(i) ? i : utils_1.default.isUrl(i) ? await (await axios_1.default.get(i, {
            responseType: 'arraybuffer'
        })).data : null;
        let ext = 'txt';
        const parsed = await (0, file_type_1.fromBuffer)(file);
        if (parsed) {
            ext = parsed?.ext || 'txt';
        }
        let form = new form_data_1.default;
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', Buffer.from(file), utils_1.default.makeId(10) + '.' + (extension || ext));
        const json = await (0, async_retry_1.default)(async () => {
            const response = await (await axios_1.default.post('https://catbox.moe/user/api.php', form, {
                headers: {
                    origin: 'https://catbox.moe',
                    referer: 'https://catbox.moe/',
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
                }
            })).data;
            if (!response || (response && !/files/.test(response)))
                throw new Error('Failed to Upload!');
            return response;
        }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: (e, n) => { }
        });
        if (!json || (json && !/files/.test(json)))
            throw new Error('Failed to Upload!');
        resolve({
            creator,
            status: true,
            data: {
                url: json
            }
        });
    }
    catch (e) {
        console.log(e);
        resolve({
            creator,
            status: false,
            msg: e.message
        });
    }
});
