import { parseRoot, textToString } from "./parse.js"

export const jevkoFromString = (str) => {
  let current = {subjevkos: [], suffix: ''}
  const parents = [current]
  const parent = parseRoot(str, {
    prefix: (text) => {
      const {fencelength} = text
      const jevko = {subjevkos: [], suffix: ''}
      current.subjevkos.push({
        prefix: textToString(text), 
        jevko,
        ...(fencelength === undefined? {}: {fencelength})
      })
      parents.push(current)
      current = jevko
    },
    suffix: (text) => {
      const {fencelength} = text
      current.suffix = textToString(text)
      if (fencelength !== undefined) {
        current.fencelength = fencelength
      }
      current = parents.pop()
    },
    end: () => {
      return current
    }
  })
  // parent.opener = opener
  // parent.closer = closer
  // parent.escaper = escaper
  // parent.fencer = fencer
  return parent
}