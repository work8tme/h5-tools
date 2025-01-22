# 翻译组件

快速创建翻译组件

## 基本使用

```jsx
import { TranslatorClass } from '@ksztone/zt-ui';

const { Translator, $t } = TranslatorClass.init({
  getLocale: () => 'tw',
  translations: {
    hello: {
      tw: '你好',
      en: 'Hello',
    },
    world: {
      tw: '世界',
      en: 'World',
    },
    $t: {
      tw: '這是 $t 方法',
      en: 'This is $t method',
    },
    自定义标签: {
      tw: '自定义标签',
      en: 'Custom tag',
    },
    'use-rules': {
      tw: '使用规则替换: 你好 {s}, {b}',
      en: 'Use rule replacement: Hello {s}, {b}',
    },
  },
});

// export { $t };
// export default Translator;

export default () => {
  // 使用 $t 方法
  const hello = $t({ id: '$t' });
  // <Translator id="use-rules" tag="span" rules={[{ '{s}': 'good boy' }]} />
  return (
    <div style={{ fontSize: '20px' }}>
      <Translator id="hello" />
      <Translator id="world" />

      <div>{hello}</div>
      {/* 自定义标签 */}
      <Translator id="自定义标签" tag="span" />

      {/* 使用规则替换 */}
      <Translator
        id="use-rules"
        tag="p"
        rules={[
          { rule: '{s}', replacer: '这是被替换的内容s' },
          { rule: '{b}', replacer: '这是被替换的内容b' },
        ]}
      />
    </div>
  );
};
```

## 翻译格式

```js
const translations = {
  hello: {
    tw: '你好',
    en: 'Hello',
  },
  world: {
    tw: '世界',
    en: 'World',
  },
};
```
