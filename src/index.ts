import axios from 'axios'
import FormData from 'form-data'
import { fromBuffer as getExtension } from 'file-type'
import util from './utils'
import * as cheerio from 'cheerio'
import retry from 'async-retry'
import { randomUUID } from 'node:crypto'

class Uploader {
   #creator = `@neoxr.js – Wildan Izzudin`
   #timeout = 15000

   short = async (url: string): Promise<any> => {
      try {
         const form = new URLSearchParams()
         form.append('url', url)
         const json = await (await axios.post('https://s.neoxr.eu/api/short', form, {
            timeout: this.#timeout
         })).data
         return json
      } catch (e) {
         return this.fallbackShort(url)
      }
   }

   fallbackShort = async (url: string): Promise<any> => {
      try {
         const form = new URLSearchParams()
         form.append('url', url)
         const json = await (await axios.post('https://neoxr-uploader.hf.space/api/short', form)).data
         return json
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   upload = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         const json = await retry(async () => {
            const response = await (await axios.post('https://s.neoxr.eu/api/upload', form, {
               timeout: this.#timeout,
               headers: {
                  ...form.getHeaders()
               }
            })).data
            if (!response.status) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })
         return json
      } catch (e: any) {
         console.error(`Upload primary failed (${e.message})`)
         return this.fallbackUpload(i, filename, extension)
      }
   }

   fallbackUpload = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         const json = await retry(async () => {
            const response = await (await axios.post('https://neoxr-uploader.hf.space/api/upload', form, {
               timeout: this.#timeout,
               headers: {
                  ...form.getHeaders()
               }
            })).data
            if (!response.status) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 2,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })
         return json
      } catch (e) {
         return this.tmpfiles(i, filename, extension)
      }
   }

   tmpfiles = async (i: Buffer | string, filename?: string, extension?: string, time: number = 60): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         const parse = await axios.get('https://tmpfiles.org')
         const cookie = parse?.headers?.['set-cookie']?.join(';')
         const token = cheerio.load(parse.data)('input[name="_token"]')?.attr('value')
         if (!token || !cookie) throw new Error('Can\'t get credentials')
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('_token', token)
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         form.append('max_views', 0)
         form.append('max_time', time)
         form.append('upload', 'Upload')
         const html = await (await axios.post('https://tmpfiles.org', form, {
            timeout: this.#timeout,
            headers: {
               cookie,
               ...form.getHeaders()
            }
         })).data
         const $ = cheerio.load(html)
         const fileUrl = $('a.download').attr('href')
         if (!fileUrl) return {
            creator: this.#creator,
            status: false,
            msg: 'Failed to Upload!'
         }
         return {
            creator: this.#creator,
            status: true,
            data: {
               filename: $('h2.file-title').text()?.trim(),
               size: $('a.download').text()?.match(/\(([\d.]+\s*[a-zA-Z]+)\)/)?.[1]?.trim(),
               url: fileUrl
            }
         }
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   imgbb = async (i: Buffer | string, filename?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const parse = await axios.get('https://imgbb.com', {
            headers: {
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
         })
         const token = parse?.data?.match(/PF\.obj\.config\.auth_token="([^"]*)/)?.[1]
         const cookie = parse?.headers?.['set-cookie']?.join(';')
         if (!token || !cookie) throw new Error('Can\'t get credentials')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'jpg'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'jpg'
         }
         const form = new FormData()
         form.append('source', Buffer.from(file), (filename || util.makeId(10)) + '.' + ext)
         form.append('type', 'file')
         form.append('action', 'upload')
         form.append('timestamp', (Date.now() * 1))
         form.append('auth_token', token)
         const json = await retry(async () => {
            const response = await (await axios.post('https://imgbb.com/json', form, {
               timeout: this.#timeout,
               headers: {
                  "Accept": "*/*",
                  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                  "Origin": "https://imgbb.com",
                  "Referer": "https://imgbb.com/upload",
                  "Referrer-Policy": "strict-origin-when-cross-origin",
                  cookie,
                  ...form.getHeaders()
               }
            })).data
            if (response.status_code != 200) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: () => { }
         })
         if (json.status_code != 200) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            original: json,
            data: {
               url: json.image.display_url
            }
         }
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   imgkub = async (i: Buffer | string, filename?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const parse = await axios.get('https://imgkub.com', {
            timeout: this.#timeout,
            headers: {
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
         })
         const token = parse.data?.match(/PF\.obj\.config\.auth_token\s=\s"([^"]*)/)?.[1]
         const cookie = parse?.headers?.['set-cookie']?.join(';')
         if (!token || !cookie) throw new Error('Can\'t get credentials')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'jpg'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'jpg'
         }
         const form = new FormData()
         form.append('source', Buffer.from(file), (filename || util.makeId(10)) + '.' + ext)
         form.append('type', 'file')
         form.append('action', 'upload')
         form.append('timestamp', (Date.now() * 1))
         form.append('auth_token', token)
         const json = await retry(async () => {
            const response = await (await axios.post('https://imgkub.com/json', form, {
               headers: {
                  "Accept": "*/*",
                  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                  "Origin": "https://imgbb.com",
                  "Referer": "https://imgbb.com/upload",
                  "Referrer-Policy": "strict-origin-when-cross-origin",
                  cookie,
                  ...form.getHeaders()
               }
            })).data
            if (response.status_code != 200) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
            onRetry: () => { }
         })
         if (json.status_code != 200) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            original: json,
            data: {
               url: json.image.url
            }
         }
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   uguu = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('files[]', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         const json = await retry(async () => {
            const response = await (await axios.post('https://uguu.se/upload.php', form, {
               timeout: this.#timeout,
               headers: {
                  origin: 'https://uguu.se',
                  referer: 'https://uguu.se/',
                  ...form.getHeaders(),
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
               }
            })).data
            if (!response?.success) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })
         if (!json?.success) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            data: json.files[0]
         }
      } catch (e: any) {
         console.error(e)
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   catbox = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('reqtype', 'fileupload')
         form.append('userhash', '')
         form.append('fileToUpload', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         const json = await retry(async () => {
            const response = await (await axios.post('https://catbox.moe/user/api.php', form, {
               timeout: this.#timeout,
               headers: {
                  origin: 'https://catbox.moe',
                  referer: 'https://catbox.moe/',
                  ...form.getHeaders(),
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
               }
            })).data
            if (!response || (response && !/files/.test(response))) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })
         if (!json || (json && !/files/.test(json))) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            data: {
               url: json
            }
         }
      } catch (e: any) {
         console.error(e)
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   studiointermedia = async (i: Buffer | string, filename?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const parse = await axios.get('https://www.studiointermedia.com/upload', {
            timeout: this.#timeout,
            headers: {
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
         })
         const token = parse.data?.match(/PF\.obj\.config\.auth_token\s=\s"([^"]*)/)?.[1]
         const cookie = parse?.headers?.['set-cookie']?.join(';')
         if (!token || !cookie) throw new Error('Can\'t get credentials')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'jpg'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'jpg'
         }
         const form = new FormData()
         form.append('source', Buffer.from(file), (filename || util.makeId(10)) + '.' + ext)
         form.append('type', 'file')
         form.append('action', 'upload')
         form.append('timestamp', (Date.now() * 1))
         form.append('auth_token', token)
         form.append('expiration', '')
         form.append('nsfw', '1')
         const json = await retry(async () => {
            const response = await (await axios.post('https://www.studiointermedia.com/json', form, {
               headers: {
                  "Accept": "*/*",
                  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                  "Origin": "https://www.studiointermedia.com",
                  "Referer": "https://www.studiointermedia.com/upload",
                  "Referrer-Policy": "strict-origin-when-cross-origin",
                  cookie,
                  ...form.getHeaders()
               }
            })).data
            if (response.status_code != 200) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })
         if (json.status_code != 200) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            original: json,
            data: {
               url: json.image.url
            }
         }
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   quax = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('files[]', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         form.append('expiry', '-1')
         const json = await (await axios.post('https://qu.ax/upload', form, {
            timeout: this.#timeout,
            headers: {
               origin: 'https://qu.ax',
               referer: 'https://qu.ax/',
               ...form.getHeaders(),
               'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
            }
         })).data
         if (!json.success) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            data: json?.files?.[0]
         }
      } catch (e: any) {
         console.error(e)
         return {
            creator: this.#creator,
            status: false,
            msg: e?.response?.data?.message || e.message
         }
      }
   }

   crypty = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))

         const json = await (await axios.post('https://cdn.crypty.workers.dev', form, {
            timeout: this.#timeout,
            headers: form.getHeaders()
         })).data

         if (!json.status) throw new Error('Failed to Upload!')
         return json
      } catch (e: any) {
         console.error(e)
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   tempimage = async (i: Buffer | string, filename?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const parse = await axios.get('https://www.temp-image.com', {
            headers: {
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
            }
         })
         const token = cheerio.load(parse.data)('meta[name="csrf-token"]')?.attr('content')
         const cookie = parse?.headers?.['set-cookie']?.join(';')
         if (!token || !cookie) throw new Error('Can\'t get credentials')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'jpg'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'jpg'
         }
         const form = new FormData()
         form.append('dzuuid', randomUUID())
         form.append('dzchunkindex', '0')
         form.append('dztotalfilesize', file.length)
         form.append('dzchunksize', file.length)
         form.append('dztotalchunkcount', '1')
         form.append('dzchunkbyteoffset', '0')
         form.append('size', file.length)
         form.append('type', parsed?.mime)
         form.append('password', '')
         form.append('upload_auto_delete', '0')
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + ext)
         const json = await retry(async () => {
            const response = await (await axios.post('https://www.temp-image.com/upload', form, {
               timeout: this.#timeout,
               headers: {
                  "Accept": "*/*",
                  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
                  "Origin": "https://www.temp-image.com",
                  "Referer": "https://www.temp-image.com/",
                  "Referrer-Policy": "strict-origin-when-cross-origin",
                  cookie,
                  "X-CSRF-TOKEN": token,
                  "X-Requested-With": "XMLHttpRequest",
                  ...form.getHeaders()
               }
            })).data
            if (!response.direct_link) throw new Error('Failed to Upload!')
            return response
         }, {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 1500,
            onRetry: () => { }
         })

         if (!json.direct_link) throw new Error('Failed to Upload!')
         return {
            creator: this.#creator,
            status: true,
            original: json,
            data: {
               url: json.direct_link
            }
         }
      } catch (e: any) {
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }

   x0 = async (i: Buffer | string, filename?: string, extension?: string): Promise<any> => {
      try {
         if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
         const file = Buffer.isBuffer(i) ? i : util.isUrl(i) ? await (await axios.get(i, {
            responseType: 'arraybuffer'
         })).data : null
         let ext = 'txt'
         const parsed = await getExtension(file)
         if (parsed) {
            ext = parsed?.ext || 'txt'
         }
         const form = new FormData()
         form.append('file', Buffer.from(file), (filename || util.makeId(10)) + '.' + (extension || ext))
         form.append('formatted', 'true')
         form.append('submit', 'Upload')
         form.append('keep_name', 'true')

         const html = await (await axios.post('https://x0.at', form, {
            timeout: this.#timeout,
            headers: form.getHeaders()
         })).data

         const $ = cheerio.load(html)
         const fileUrl = $('a').attr('href')
         if (!fileUrl) return {
            creator: this.#creator,
            status: false,
            msg: 'Failed to Upload!'
         }

         return {
            creator: this.#creator,
            status: true,
            data: {
               url: fileUrl
            }
         }
      } catch (e: any) {
         console.error(e)
         return {
            creator: this.#creator,
            status: false,
            msg: e.message
         }
      }
   }
}

export = new Uploader()