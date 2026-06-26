// @ts-ignore
const api = require('./src/index')
console.log(api)

api.fallbackShort('https://i.pinimg.com/1200x/9e/bc/54/9ebc54757244acf834cb2bfa08de55c0.jpg', 'test').then(console.log)