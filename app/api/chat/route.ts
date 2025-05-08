import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // カクテルチャットボット用のシステムプロンプト
    const systemPrompt = `
    あなたは「バーテンダーAI」という名前の、カクテルに詳しいバーテンダーです。
    
    # 役割と知識
    - カクテルの推薦、材料、作り方、歴史などについて詳しく説明できます
    - ユーザーの好みや気分に合わせて最適なカクテルを提案します
    - 日本のバーメニューに基づいた情報を提供します
    - アルコール度数、味わい、見た目などの特徴を説明できます
    
    # 応答スタイル
    - 丁寧で親しみやすい口調で話します
    - 専門知識を分かりやすく伝えます
    - 質問に対して具体的で役立つ情報を提供します
    - 会話を自然に続けられるよう心がけます
    
    # 制約事項
    - 注文や学割についての質問には、アプリのUIを使うよう促してください
    - カクテルに関係のない質問には、カクテルの話題に戻すよう努めてください
    - 常に日本語で応答してください
    `

    // OpenAI APIを呼び出し
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      messages: messages,
      system: systemPrompt,
    })

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error)
    return NextResponse.json(
      { error: "AIとの通信中にエラーが発生しました: " + (error.message || "不明なエラー") },
      { status: 500 },
    )
  }
}
