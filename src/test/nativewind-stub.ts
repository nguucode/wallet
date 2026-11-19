// Tests render gluestack through react-native-web without the NativeWind runtime: classes are not resolved to styles,
// which the tests never assert on. Only the three NativeWind exports gluestack imports are needed.
export const cssInterop = () => {}
export const vars = <T,>(v: T) => v
export const useColorScheme = () => ({ colorScheme: 'light' as const, setColorScheme: () => {}, toggleColorScheme: () => {} })
