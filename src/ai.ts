import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, Entry } from './types'
import { moodOf } from './types'

const SYSTEM_PROMPT = `你是「拾绪」里的一位老朋友。用户在这个 app 里记录自己一生中好的情绪、坏的情绪、领悟到的情绪。

你说话像深夜里坐在对面的朋友：温和、真诚、不说教。
- 用口语化的中文，回复通常两三句，不要长篇大论
- 先接住情绪，再回应内容；不要急着给建议，除非对方在要建议
- 可以温柔地追问，但一次最多问一个问题
- 不要用「作为AI」之类的话，不要过度使用感叹号和表情`

/** 把最近的记录整理成上下文，让 AI 认识此刻的用户 */
function entriesContext(entries: Entry[]): string {
  const recent = [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  if (recent.length === 0) return ''
  const lines = recent.map((e) => {
    const d = new Date(e.createdAt)
    const date = `${d.getMonth() + 1}月${d.getDate()}日`
    const body = e.text ? `：${e.text.slice(0, 60)}` : ''
    return `- ${date}（${moodOf(e.mood).label}）${e.line}${body}`
  })
  return `\n\n以下是用户最近在拾绪里的记录，仅在对方聊到相关话题时自然地参考，不要主动逐条提起：\n${lines.join('\n')}`
}

/**
 * 有 API Key 时直连 Claude（流式）；没有时用本地陪伴式回复兜底。
 * onText 收到增量文本；返回完整回复。
 */
export async function streamReply(
  apiKey: string,
  history: ChatMessage[],
  entries: Entry[],
  onText: (delta: string) => void,
): Promise<string> {
  if (!apiKey) {
    return localReply(history, onText)
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + entriesContext(entries),
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  })
  stream.on('text', (delta) => onText(delta))
  const final = await stream.finalMessage()
  return final.content
    .filter((b): b is Extract<(typeof final.content)[number], { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

/** 未配置 API Key 时的本地兜底：简单的陪伴式回应 */
async function localReply(history: ChatMessage[], onText: (delta: string) => void): Promise<string> {
  const last = history[history.length - 1]?.content ?? ''
  let reply: string
  if (/难过|难受|累|烦|哭|崩溃|痛/.test(last)) {
    reply = '听起来今天真的不容易。愿意的话，跟我说说是从什么时候开始有这种感觉的？'
  } else if (/开心|高兴|太好了|哈哈|开森|喜欢/.test(last)) {
    reply = '隔着屏幕都感觉到你在笑。这种时刻值得记下来，是什么让今天这么亮？'
  } else if (/\?|？|吗|怎么办/.test(last)) {
    reply = '这个问题我想陪你一起慢慢捋。你自己心里，有没有一个隐约倾向的答案？'
  } else {
    reply = '我在听。想到什么就说什么，不用组织语言。'
  }
  reply += '\n\n（提示：在右上角设置里填入 Anthropic API Key，就能和真正的 AI 朋友聊天了）'

  // 模拟逐字输出的手感
  for (const ch of reply) {
    onText(ch)
    await new Promise((r) => setTimeout(r, 12))
  }
  return reply
}
