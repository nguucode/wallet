declare module '*?raw' {
  const content: string
  export default content
}

declare module '*.yaml?json' {
  const data: unknown
  export default data
}

declare module '*.css'
declare module 'react-native-web'
