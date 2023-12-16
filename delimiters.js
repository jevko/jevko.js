// todo: rename quoter to fencer?
export const defaultOpener = '['
export const defaultCloser = ']'
export const defaultEscaper = '`'
export const defaultFencer = "'"

export const defaultDelimiters = {
  opener: defaultOpener,
  closer: defaultCloser,
  escaper: defaultEscaper,
  fencer: defaultFencer,
}

// todo: require each delimiter to be exactly one code unit
export const normalizeDelimiters = (delims) => {
  const {
    opener = defaultOpener, 
    closer = defaultCloser, 
    escaper = defaultEscaper, 
    fencer = defaultFencer,
  } = delims ?? {}
  const delimiters = [opener, closer, escaper, fencer]
  const delimiterSetSize = new Set(delimiters).size
  if (delimiterSetSize !== delimiters.length) {
    throw Error(`Delimiters must be unique! ${delimiters.length - delimiterSetSize} of them are identical:\n${delimiters.join('\n')}`)
  }

  return {
    opener,
    closer,
    escaper,
    fencer,
    _normalized: true,
  }
}