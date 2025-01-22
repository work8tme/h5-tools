import React, { ReactNode } from 'react'

export type Replacer = ReactNode | ((match: string, ...matches: string[]) => ReactNode)

export type ReplaceRules = {
  rule: string | RegExp
  replacer?: Replacer
}[]

export const defaultReplacer = (match: string) => React.createElement('span', null, match)

export const boldReplacer = (match: string) =>
  React.createElement('span', { className: 'bold' }, match)

// 按正则替换
export const replaceReg = (message: string, reg: RegExp, replacer: Replacer) => {
  if (!reg.global) {
    throw new Error('必须使用全局匹配')
  }

  // 结果数组
  const res: React.ReactNode[] = []

  // 目标字符出现位置
  let lastIndex = 0

  // 搜索完整个字符串
  while (lastIndex <= message.length - 1) {
    const cur = reg.exec(message)

    if (!cur) {
      break
    }

    // 目标字符之前的字符
    if (cur.index > 0 && lastIndex < cur.index) {
      const str = message.slice(lastIndex, cur.index)
      res.push(str)
    }

    // 占位字符
    let content = replacer
    if (typeof replacer === 'function') {
      content = replacer(cur[0], ...cur.slice(1))
    }

    // 保存替换字符
    if (typeof content !== 'object') {
      res.push(content as any)
    } else {
      res.push(
        React.cloneElement(content as React.ReactElement, {
          key: `${cur[0]}${res.length}`,
        })
      )
    }

    // 更新字符开始位置
    lastIndex = reg.lastIndex
  }

  // 目标字符之后的字符
  if (lastIndex < message.length) {
    res.push(message.slice(lastIndex))
  }

  return res
}

// 按规则替换
export const replaceByRules = (message: string, rules: ReplaceRules) => {
  const _rules = rules.map(it => ({
    ...it,
    reg: it.rule instanceof RegExp ? it.rule : new RegExp(it.rule, 'g'),
  }))

  if (_rules.some(it => !it.reg.global)) {
    throw new Error('必须使用全局匹配')
  }

  let res: ReactNode[] = [message]

  for (const { reg, replacer = defaultReplacer } of _rules) {
    reg.lastIndex = 0
    res = res
      .map(it => {
        if (typeof it === 'string') {
          return replaceReg(it, reg, replacer)
        }

        return it
      })
      .flat()
  }

  return res
}
