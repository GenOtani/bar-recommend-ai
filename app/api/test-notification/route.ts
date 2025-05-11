import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { email, slack, line } = await request.json()
    const results = {
      email: null as any,
      slack: null as any,
      line: null as any,
      success: false,
    }

    // メール通知のテスト
    if (email && email.recipientEmail) {
      try {
        // 実際のアプリケーションでは環境変数から取得
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        })

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email.recipientEmail,
          subject: "【テスト】バーテンダーAI - 通知テスト",
          text: `
これはバーテンダーAIからのテスト通知です。

このメールが届いた場合、メール通知の設定は正常に機能しています。
実際の注文があった場合、このメールアドレスに通知が送信されます。

---
バーテンダーAI
          `,
        }

        await transporter.sendMail(mailOptions)
        results.email = { success: true }
      } catch (error: any) {
        results.email = { success: false, error: error.message }
      }
    }

    // Slack通知のテスト
    if (slack && slack.webhookUrl) {
      try {
        const message = {
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "🍸 バーテンダーAI - 通知テスト",
                emoji: true,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "これはバーテンダーAIからのテスト通知です。このメッセージが表示されている場合、Slack通知の設定は正常に機能しています。",
              },
            },
          ],
        }

        const response = await fetch(slack.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        })

        if (response.ok) {
          results.slack = { success: true }
        } else {
          results.slack = { success: false, error: await response.text() }
        }
      } catch (error: any) {
        results.slack = { success: false, error: error.message }
      }
    }

    // LINE通知のテスト
    if (line && line.token) {
      try {
        const params = new URLSearchParams()
        params.append(
          "message",
          "【バーテンダーAI】これはテスト通知です。このメッセージが表示されている場合、LINE通知の設定は正常に機能しています。",
        )

        const response = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${line.token}`,
          },
          body: params,
        })

        if (response.ok) {
          results.line = { success: true }
        } else {
          results.line = { success: false, error: await response.text() }
        }
      } catch (error: any) {
        results.line = { success: false, error: error.message }
      }
    }

    // 少なくとも1つの通知が成功した場合
    results.success = !!(
      (results.email && results.email.success) ||
      (results.slack && results.slack.success) ||
      (results.line && results.line.success)
    )

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "テスト通知の送信中にエラーが発生しました",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
