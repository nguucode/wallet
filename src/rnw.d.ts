// react-native-web accepts these DOM props on View/Pressable/Text (it renders <a href> for links); @types/react-native does not list them.
import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    href?: string
    hrefAttrs?: { target?: string; rel?: string; download?: boolean }
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    dataSet?: Record<string, string>
  }
  interface PressableProps {
    href?: string
    hrefAttrs?: { target?: string; rel?: string; download?: boolean }
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean
    'aria-pressed'?: boolean
  }
  interface TextProps {
    href?: string
  }
  interface TextInputProps {
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    type?: string
    spellCheck?: boolean
  }
}
