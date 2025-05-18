class Utils {
   isUrl = (url: string): boolean => {
      try {
         new URL(url)
         return true
      } catch {
         return false
      }
   }

   makeId = (length: number): string => {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i < length; i++) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
   }
}

const utils = new Utils

export { utils }
export default utils
