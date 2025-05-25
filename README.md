## Helper Functions

> A collection of upload and shortener functions ready to use.

<p align="center">

[![npm version](https://badgen.net/npm/v/@neoxr/helper)](https://badgen.net/npm/v/express) [![Npm package monthly downloads](https://badgen.net/npm/dm/@neoxr/helper)](https://npmjs.com/package/@neoxr/helper) ![GitHub repo size](https://img.shields.io/github/repo-size/neoxr/helper?style=flat) ![Types](https://badgen.net/npm/types/@neoxr/helper)

</p>

### 1. Open's API (Neoxr)

```js
import { short, upload } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote file URL.
 * @param input Buffer (binary file) or string (URL)
 * @param ext String (extension) - optional
 * @returns Promise<Response>
 * Information : support all extension
 */
upload(input: Buffer | String, ext: String).then(console.log)

/**
 * Shortens a given URL.
 * @param {string} url - The full URL to shorten.
 * @returns {Promise<string>} A promise that resolves to the shortened URL.
 */
short(input: String).then(console.log)
```
**Site :** [https://s.neoxr.eu](https://s.neoxr.eu)

### 2. TmpFiles

```js
import { tmpfiles } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote file URL.
 * @param input Buffer (binary file) or string (URL)
 * @param ext String (extension) - optional
 * @returns Promise<Response>
 * Information : support all extension exclude (.js)
 */
tmpfiles(input: Buffer | String, ext: String).then(console.log)
```
**Site :** [https://tmpfiles.org](https://tmpfiles.org)

### 3. ImgBB

```js
import { imgbb } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote image URL.
 * @param input Buffer (binary file) or string (URL)
 * @returns Promise<Response>
 * Information : image only
 */
imgbb(input: Buffer | String).then(console.log)
```
**Site :** [https://imgbb.com](https://imgbb.com)

### 4. ImgKub

```js
import { imgkub } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote image URL.
 * @param input Buffer (binary file) or string (URL)
 * @returns Promise<Response>
 * Information : image only
 */
imgkub(input: Buffer | String).then(console.log)
```
**Site :** [https://imgkub.com](https://imgkub.com)

### 5. Bash Upload

```js
import { bashupload } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote file URL.
 * @param input Buffer (binary file) or string (URL)
 * @param ext String (extension) - optional
 * @returns Promise<Response>
 * Information : support all extension
 */
bashupload(input: Buffer | String, ext: String).then(console.log)
```
**Site :** [https://bashupload.com](https://bashupload.com)

### 6. Catbox

```js
import { catbox } from '@neoxr/helper'

/**
 * Uploads a file from a Buffer or a remote file URL.
 * @param input Buffer (binary file) or string (URL)
 * @param ext String (extension) - optional
 * @returns Promise<Response>
 * Information : support all extension
 */
catbox(input: Buffer | String, ext: String).then(console.log)
```
**Site :** [https://catbox.moe](https://catbox.moe)