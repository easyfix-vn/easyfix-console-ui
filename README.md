# EasyFix Console UI

EasyFix console shared React component library. Components use the `Easy` prefix and match the EasyFix micro frontend stack: React 18, TypeScript, Tailwind CSS 4 and Base UI.

## Install

During local development, install from the sibling folder:

```bash
cd easyfix_fe/easyfix_console_ui
npm install
npm run build

cd ../microfe-app-demo
npm install ../easyfix_console_ui
```

After publishing to npm, replace the `file:` dependency with a released version:

```json
{
  "dependencies": {
    "@easyfix/console-ui": "^0.1.0"
  }
}
```

## Usage

Import the styles once in the host application entry file:

```ts
import "@easyfix/console-ui/styles.css";
```

Then import components from the package:

```tsx
import {
  EasyButton,
  EasyLocaleSwitch,
  EasyPageContainer,
} from "@easyfix/console-ui";

export function Example() {
  return (
    <EasyPageContainer header={<h1>Console</h1>}>
      <EasyButton loading={false}>Submit</EasyButton>
      <EasyLocaleSwitch
        value="vi"
        onChange={(locale) => console.log(locale)}
      />
    </EasyPageContainer>
  );
}
```

## Components

### EasyPageContainer

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | Page content |
| `className` | `string` | Root class name |
| `contentClassName` | `string` | Content wrapper class name |
| `header` | `ReactNode` | Header slot |
| `footer` | `ReactNode` | Footer slot |

### EasyTreeSelectPanel

| Prop | Type | Description |
| --- | --- | --- |
| `treeData` | `EasyTreeNode[]` | Tree source data |
| `selected` | `string` | Selected node id |
| `onSelect` | `(node) => void` | Selection callback |
| `searchActions` | `ReactNode` | Search and add button slot |
| `actions` | `ReactNode` | Right side content/action slot |
| `renderItem` | `(node, state) => ReactNode` | Custom tree node renderer |

### EasyButton

| Prop | Type | Description |
| --- | --- | --- |
| `variant` | `default \\| secondary \\| destructive \\| destructive-outline \\| outline \\| ghost \\| link` | Visual style |
| `size` | `default \\| xs \\| sm \\| lg \\| xl \\| icon*` | Button size |
| `loading` | `boolean` | Shows loading spinner and disables the button |
| `disabled` | `boolean` | Disables the button |

### EasyButtonGroup

| Prop | Type | Description |
| --- | --- | --- |
| `orientation` | `horizontal \\| vertical` | Group direction |
| `attached` | `boolean` | Merge adjacent button borders |

### EasyIcons

Re-exports `lucide-react` and includes `EasyFixLogoIcon` and `EasyConsoleIcon`.

### EasyLocaleSwitch

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current locale |
| `onChange` | `(locale) => void` | Locale change callback |
| `locales` | `EasyLocaleOption[]` | Locale options |
| `showLabel` | `boolean` | Show text label next to the flag |

Flags use `flag-icons` classes, not emoji. Default mapping: `vi -> vn`, `zh-CN -> cn`, `en-US -> gb`.

### EasyTabContainer

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `EasyTabItem[]` | Tab labels and content |
| `variant` | `default \\| underline` | Tab list style |
| `defaultValue` | `string` | Initial tab |

Low-level exports are also available: `EasyTabs`, `EasyTabsList`, `EasyTabsTrigger`, `EasyTabsContent`.

### EasyDrawer

| Prop | Type | Description |
| --- | --- | --- |
| `trigger` | `ReactNode` | Trigger element |
| `title` | `ReactNode` | Header title |
| `description` | `ReactNode` | Header description |
| `footer` | `ReactNode` | Footer slot |
| `position` | `right \\| left \\| top \\| bottom` | Drawer placement |

Low-level exports are also available for custom composition: `EasyDrawerRoot`, `EasyDrawerTrigger`, `EasyDrawerPopup`, `EasyDrawerClose`, `EasyDrawerPrimitive`.
