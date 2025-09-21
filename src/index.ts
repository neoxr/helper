import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer as getExtension } from 'file-type'
import util from './utils'
import * as cheerio from 'cheerio'
import retry from 'async-retry'
import { v4 as uuidv4 } from 'uuid'
const creator = `@neoxr.js – Wildan Izzudin`

exports.short = (url: string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      let form = new URLSearchParams
      form.append('url', url)
      const json = await (await axios.post('https://s.neoxr.eu/api/short', form)).data
      resolve(json)
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.upload = (i: Buffer | string, extension?: string): Promise<any> => new Promise(async (resolve, reject) => {
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
      let form = new FormData
      form.append('file', Buffer.from(file), 'file.' + (extension || ext))
      const json = await retry(async () => {
         const response = await (await axios.post('https://s.neoxr.eu/api/upload', form, {
            headers: {
               ...form.getHeaders()
            }
         })).data
         if (!response.status) throw new Error('Failed to Upload!')
         return response
      }, {
         retries: 5,
         factor: 2,
         minTimeout: 1000,
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })
      resolve(json)
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.tmpfiles = (i: Buffer | string, extension?: string, time: number = 60): Promise<any> => new Promise(async resolve => {
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
      let form = new FormData
      form.append('_token', token)
      form.append('file', Buffer.from(file), util.makeId(10) + '.' + (extension || ext))
      form.append('max_views', 0)
      form.append('max_time', time)
      form.append('upload', 'Upload')
      const html = await (await axios.post('https://tmpfiles.org', form, {
         headers: {
            cookie,
            ...form.getHeaders()
         }
      })).data
      const $ = cheerio.load(html)
      const component: any = []
      $('td').each((i, e) => component.push($(e).text()))
      if (!component[2]) return resolve({
         creator,
         status: false,
         msg: `upload failed`
      })
      resolve({
         creator,
         status: true,
         data: {
            filename: component[0],
            size: component[1],
            expired: component[3],
            url: component[2]
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.imgbb = (i: Buffer | string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const parse = await (await axios.get('https://imgbb.com', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
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
      let form = new FormData
      form.append('source', Buffer.from(file), 'image.' + ext)
      form.append('type', 'file')
      form.append('action', 'upload')
      form.append('timestamp', (Date.now() * 1))
      form.append('auth_token', token)
      const json = await retry(async () => {
         const response = await (await axios.post('https://imgbb.com/json', form, {
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
         onRetry: (e, n) => { }
      })
      if (json.status_code != 200) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         original: json,
         data: {
            url: json.image.display_url
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.imgkub = (i: Buffer | string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const parse = await (await axios.get('https://imgkub.com', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
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
      let form = new FormData
      form.append('source', Buffer.from(file), 'image.' + ext)
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
         onRetry: (e, n) => { }
      })
      if (json.status_code != 200) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         original: json,
         data: {
            url: json.image.url
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.bashupload = (i: Buffer | string, extension?: string): Promise<any> => new Promise(async (resolve, reject) => {
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
      let form = new FormData
      form.append('json', 'true')
      form.append('file_1', Buffer.from(file), util.makeId(10) + '.' + (extension || ext))
      const json = await retry(async () => {
         const response = await (await axios.post('https://bashupload.com', form, {
            headers: {
               accept: 'application/json',
               origin: 'https://bashupload.com',
               referer: 'https://bashupload.com/',
               ...form.getHeaders(),
               'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
            }
         })).data
         if (!response?.file_1?.url) throw new Error('Failed to Upload!')
         return response
      }, {
         retries: 5,
         factor: 2,
         minTimeout: 1000,
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })
      if (!json?.file_1?.url) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         data: {
            url: json.file_1.url + '?download=1',
            size: json.file_1.size
         }
      })
   } catch (e) {
      console.log(e)
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.catbox = (i: Buffer | string, extension?: string): Promise<any> => new Promise(async (resolve, reject) => {
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
      let form = new FormData
      form.append('reqtype', 'fileupload')
      form.append('userhash', '')
      form.append('fileToUpload', Buffer.from(file), util.makeId(10) + '.' + (extension || ext))
      const json = await retry(async () => {
         const response = await (await axios.post('https://catbox.moe/user/api.php', form, {
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
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })
      if (!json || (json && !/files/.test(json))) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         data: {
            url: json
         }
      })
   } catch (e) {
      console.log(e)
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.studiointermedia = (i: Buffer | string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const parse = await (await axios.get('https://www.studiointermedia.com/upload', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
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
      let form = new FormData
      form.append('source', Buffer.from(file), 'image.' + ext)
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
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })
      if (json.status_code != 200) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         original: json,
         data: {
            url: json.image.url
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.imghost = (i: Buffer | string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !util.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const parse = await (await axios.get('https://imghost.online/en', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
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
      let form = new FormData
      form.append('dzuuid', uuidv4())
      form.append('dzchunkindex', '0')
      form.append('dztotalfilesize', file.length)
      form.append('dzchunksize', file.length)
      form.append('dztotalchunkcount', '1')
      form.append('dzchunkbyteoffset', '0')
      form.append('size', file.length)
      form.append('type', parsed?.mime)
      form.append('password', '')
      form.append('upload_auto_delete', '0')
      form.append('file', Buffer.from(file), 'image.' + ext)
      const json = await retry(async () => {
         const response = await (await axios.post('https://imghost.online/upload', form, {
            headers: {
               "Accept": "*/*",
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
               "Origin": "https://imghost.online",
               "Referer": "https://imghost.online/",
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
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })

      if (!json.direct_link) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         original: json,
         data: {
            url: json.direct_link
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})

exports.quax = (i: Buffer | string, extension?: string): Promise<any> => new Promise(async (resolve, reject) => {
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
      let form = new FormData
      form.append('files[]', Buffer.from(file), util.makeId(10) + '.' + (extension || ext))
      form.append('expiry', '-1')
      const json = await retry(async () => {
         const response = await (await axios.post('https://qu.ax/upload.php', form, {
            headers: {
               origin: 'https://qu.ax',
               referer: 'https://qu.ax/',
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
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })
      if (!json.success) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         data: json?.files?.[0]
      })
   } catch (e) {
      console.log(e)
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})