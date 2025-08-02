import { NextResponse } from "next/server"
import type { Order } from "@/types/order-types"

// メモリ内でのデータ保存（本番環境では適切なデータベースを使用）
const orders: Order[] = []

export async function GET() {
  try {
    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error("注文データの取得中にエラーが発生しました:", error)
    return NextResponse.json({ success: false, message: "注文データの取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { order } = await request.json()

    if (!order) {
      return NextResponse.json({ success: false, message: "注文データが提供されていません" }, { status: 400 })
    }

    // 注文をメモリに保存
    orders.push(order)

    console.log("新しい注文を受信しました:", order.id)

    return NextResponse.json({
      success: true,
      message: "注文が正常に保存されました",
      orderId: order.id,
    })
  } catch (error: any) {
    console.error("注文の保存中にエラーが発生しました:", error)
    return NextResponse.json({ success: false, message: "注文の保存に失敗しました" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "注文IDまたはステータスが提供されていません" },
        { status: 400 },
      )
    }

    // 注文を検索して更新
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex === -1) {
      return NextResponse.json({ success: false, message: "指定された注文が見つかりません" }, { status: 404 })
    }

    orders[orderIndex].status = status

    console.log(`注文 ${orderId} のステータスを ${status} に更新しました`)

    return NextResponse.json({
      success: true,
      message: "注文ステータスが更新されました",
      order: orders[orderIndex],
    })
  } catch (error: any) {
    console.error("注文ステータスの更新中にエラーが発生しました:", error)
    return NextResponse.json({ success: false, message: "注文ステータスの更新に失敗しました" }, { status: 500 })
  }
}
