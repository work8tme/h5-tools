import React, { ReactNode } from 'react'
import { isFunction } from 'lodash'
import { replaceByRules, ReplaceRules } from './util'

export default class TranslatorClass {
  static getLocale: () => string | undefined
  static translations: any

  static getTranslator<TranslationKey> () {
    type Tag = 'div' | 'span' | typeof React.Fragment

    type TranslatorProps = {
      /** 默认标签为 div */
      tag?: Tag
      id: TranslationKey
      rules?: ReplaceRules
    } & React.HTMLAttributes<HTMLDivElement | HTMLSpanElement>

    const Translator: React.FC<TranslatorProps> = (props: TranslatorProps) => {
      const { tag = 'div', id, rules, ...rest } = props
      const locale = this.getLocale?.()

      if (!locale) {
        return null
      }

      let translation = this.translations?.[id]?.[locale] || ''
      if (!translation) {
        console.warn(`Translation key ${id} not found for locale ${locale}`)
      }

      if (rules) {
        translation = replaceByRules(translation, rules)
      }

      return React.createElement(tag, { ...rest }, translation as string | ReactNode[])
    }

    return Translator
  }

  static get$t<TranslationKey> () {
    const $t = (option: {
      id: TranslationKey
      rules?: ReplaceRules
    }) => {
      const { id, rules } = option
      const locale = this.getLocale?.()

      if (!locale) {
        return ''
      }

      if (rules) {
        return replaceByRules(this.translations[id]?.[locale] || '', rules)
      }

      return this.translations[id]?.[locale] || ''
    }

    return $t
  }

  static init<Locale extends string, TranslationKey extends string> (options: {
    getLocale: () => Locale | undefined
    translations: any
  }) {
    const { getLocale, translations } = options

    if (!isFunction(getLocale)) {
      throw new Error('getLocale must be a function')
    }

    this.getLocale = getLocale
    this.translations = translations

    return {
      Translator: this.getTranslator<TranslationKey>(),
      $t: this.get$t<TranslationKey>(),
    }
  }
}
