"use client"

import type React from "react"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, VolumeX, ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { cocktails, foods, categorizedCocktails } from "@/data/menu-data"
import type { CartItem, Order } from "@/types/order-types"
import { useOrderStore } from "@/store/order-store"

interface UserInterfaceProps {
  tableNumber: string
}

type Message = {
  role: "user" | "assistant"
  content: string
  cocktails?: any[]
}

export function UserInterface({ tableNumber }: UserInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！バーのカクテルアドバイザーです。どのようなカクテルをお探しですか？お好みや気分をお聞かせください。注文もできますので、お気軽にお申し付けください。",
    },
  ])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // グローバルステートから注文履歴を取得
  const { orders, addOrder } = useOrderStore()

  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // カートの合計金額を計算
  const cartTotal = cart.reduce((total, item) => {
    let price = item.priceValue * item.quantity
    if (isStudent) {
      // 学割対象外のアイテムを除外
      if (item.id !== "パスタスナック") {
        price -= 100 * item.quantity
      }
    }
    return total + price
  }, 0)

  useEffect(() => {
    // Web Speech API のサポートチェック
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("このブラウザは音声認識をサポートしていません。")
      return
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.lang = "ja-JP"
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleUserInput(transcript)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("音声認識エラー:", event.error)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    // 音声合成の初期化
    synthesisRef.current = new SpeechSynthesisUtterance()
    synthesisRef.current.lang = "ja-JP"
    synthesisRef.current.rate = 0.9 // 少し遅めに設定（0.1〜10の範囲、デフォルトは1）
    synthesisRef.current.pitch = 1.0 // 音の高さ（0〜2の範囲、デフォルトは1）

    // 利用可能な音声から日本語の音声を選択
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices()
      const japaneseVoices = voices.filter((voice) => voice.lang.includes("ja") || voice.name.includes("Japanese"))

      if (japaneseVoices.length > 0) {
        // 日本語の音声が見つかった場合は最初のものを使用
        synthesisRef.current!.voice = japaneseVoices[0]
        console.log("日本語の音声を設定しました:", japaneseVoices[0].name)
      } else {
        console.warn("日本語の音声が見つかりませんでした。デフォルトの音声を使用します。")
      }
    }

    synthesisRef.current.onend = () => {
      setIsSpeaking(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (error) {
        console.error("音声認識の開始に失敗しました:", error)
      }
    }
  }

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      if (synthesisRef.current) {
        // 長い文章を適切に区切って読み上げる
        const sentences = text.split(/[。.!?！？]/g).filter((s) => s.trim().length > 0)

        // 文章を読み上げる関数
        const speakSentences = (index = 0) => {
          if (index >= sentences.length) return

          const sentence = sentences[index] + "。" // 句点を追加
          synthesisRef.current!.text = sentence

          synthesisRef.current!.onend = () => {
            // 次の文章を読み上げる
            speakSentences(index + 1)

            // 最後の文章が終わったらフラグを更新
            if (index === sentences.length - 1) {
              setIsSpeaking(false)
            }
          }

          window.speechSynthesis.speak(synthesisRef.current!)
        }

        // 読み上げ開始
        speakSentences()
        setIsSpeaking(true)
      }
    }
  }

  // OpenAI APIを呼び出す関数
  const callOpenAI = async (userMessages: Message[]) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: userMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      toast({
        title: "エラーが発生しました",
        description: "AIとの通信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
      return "申し訳ありません、エラーが発生しました。もう一度お試しください。"
    } finally {
      setIsLoading(false)
    }
  }

  // ユーザー入力を処理する関数
  const handleUserInput = async (input: string) => {
    // ユーザーのメッセージを追加
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])

    // 注文関連のキーワード処理（ローカル処理）
    if (input.toLowerCase().includes("注文") || input.toLowerCase().includes("オーダー")) {
      if (cart.length === 0) {
        const localResponse: Message = {
          role: "assistant",
          content: "カートに商品がありません。メニューから商品を選んでカートに追加してください。",
        }
        setMessages((prev) => [...prev, localResponse])
        return
      } else {
        const localResponse: Message = {
          role: "assistant",
          content: `現在のカートには${cart.length}点の商品が入っています。合計金額は${cartTotal}円です。注文を確定するには、画面右上のカートアイコンをクリックして、テーブル番号を入力してください。`,
        }
        setMessages((prev) => [...prev, localResponse])
        return
      }
    }

    // 学割関連のキーワード処理（ローカル処理）
    if (input.toLowerCase().includes("学割") || input.toLowerCase().includes("学生")) {
      setIsStudent(true)
      const localResponse: Message = {
        role: "assistant",
        content:
          "学生割引を適用しました。ドリンクとフードが100円引きになります（パスタスナックを除く）。お会計時に学生証のご提示をお願いします。お通しは無料です。",
      }
      setMessages((prev) => [...prev, localResponse])
      return
    }

    // OpenAI APIを呼び出して応答を取得
    const apiMessages = messages.concat(userMessage)
    const aiResponse = await callOpenAI(apiMessages)

    // AIの応答をメッセージに追加
    const assistantMessage: Message = {
      role: "assistant",
      content: aiResponse,
    }

    setMessages((prev) => [...prev, assistantMessage])

    // 自動的に応答を読み上げる
    if (synthesisRef.current && !isSpeaking) {
      toggleSpeaking(aiResponse)
    }

    // カクテル推薦の処理（キーワードに基づいて）
    const lowerInput = input.toLowerCase()
    let recommendedCocktails: any[] = []

    // 特定の好みやキーワードに基づく推薦
    if (lowerInput.includes("爽やか") || lowerInput.includes("さっぱり") || lowerInput.includes("すっきり")) {
      recommendedCocktails = cocktails
        .filter((c) => c.tags.includes("爽やか") || c.tags.includes("さっぱり") || c.tags.includes("すっきり"))
        .slice(0, 3)
    } else if (lowerInput.includes("甘い") || lowerInput.includes("フルーティー")) {
      recommendedCocktails = cocktails
        .filter((c) => c.tags.includes("甘い") || c.tags.includes("フルーティー") || c.tags.includes("トロピカル"))
        .slice(0, 3)
    } else if (lowerInput.includes("強め") || lowerInput.includes("強い")) {
      recommendedCocktails = cocktails
        .filter((c) => c.category === "スタンダード" || c.category === "ハイボールとサワー")
        .slice(0, 3)
    }

    // 推薦カクテルがある場合、メッセージに追加
    if (recommendedCocktails.length > 0) {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            cocktails: recommendedCocktails,
          },
        ]
      })
    }
  }

  const selectCocktail = (cocktail: any) => {
    handleUserInput(`${cocktail.name}について教えて`)
  }

  // 注文ボタンのクリックハンドラ
  const handleOrderClick = (item: any, isFood = false) => {
    setSelectedItem(item)
    setSelectedQuantity(1)
    setQuantityDialogOpen(true)
  }

  // 数量確定ハンドラ
  const confirmQuantity = () => {
    if (selectedItem) {
      addToCart(selectedItem, selectedItem.category === "フード", selectedQuantity)
      setQuantityDialogOpen(false)
      setSelectedItem(null)
    }
  }

  // カートに商品を追加
  const addToCart = (item: any, isFood = false, initialQuantity = 1) => {
    setCart((prevCart) => {
      // 既にカートに同じ商品があるか確認
      const existingItemIndex = prevCart.findIndex((cartItem) => cartItem.id === item.name)

      if (existingItemIndex >= 0) {
        // 既存のアイテムの数量を増やす
        const updatedCart = [...prevCart]
        updatedCart[existingItemIndex].quantity += initialQuantity
        return updatedCart
      } else {
        // 新しいアイテムをカートに追加
        return [
          ...prevCart,
          {
            id: item.name,
            name: item.name,
            price: item.price,
            quantity: initialQuantity,
            priceValue: item.priceValue,
          },
        ]
      }
    })

    toast({
      title: "カートに追加しました",
      description: `${item.name}をカートに追加しました。`,
    })
  }

  // カート内の商品の数量を変更
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // 数量が0以下の場合はカートから削除
      removeFromCart(itemId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  // カートから商品を削除
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
  }

  const sendOrderToSpreadsheet = async (order: Order) => {
    try {
      const response = await fetch("/api/spreadsheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order }),
      })

      const data = await response.json()

      if (data.success || data.mockSuccess) {
        console.log("注文データがスプレッドシートに送信されました")
        return true
      } else {
        console.error("スプレッドシートへの送信に失敗:", data.message)
        return false
      }
    } catch (error) {
      console.error("スプレッドシートAPIの呼び出しに失敗:", error)
      return false
    }
  }

  // カート内の注文を確定する処理
  const handleOrderConfirm = (e: React.MouseEvent) => {
    e.preventDefault() // デフォルトの動作を防止
    console.log("注文確定ボタンがクリックされました")

    if (cart.length === 0) {
      toast({
        title: "カートが空です",
        description: "注文を確定するには、カートに商品を追加してください。",
        variant: "destructive",
      })
      return
    }

    // 新しい注文を作成
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      items: [...cart],
      totalAmount: cartTotal,
      status: "提供済み",
      tableNumber,
      timestamp: new Date(),
    }

    console.log("作成された注文:", newOrder)

    // グローバルステートに注文を追加
    addOrder(newOrder)
    console.log("注文がグローバルステートに追加されました")

    // スプレッドシートに注文データを送信
    sendOrderToSpreadsheet(newOrder)
      .then((success) => {
        if (!success) {
          toast({
            title: "スプレッドシートへの送信に失敗しました",
            description: "注文は保存されましたが、スプレッドシートには反映されていません。",
            variant: "warning",
          })
        }
      })
      .catch((err) => {
        console.error("注文データの送信中にエラーが発生しました:", err)
        toast({
          title: "エラーが発生しました",
          description: "注文データの送信中にエラーが発生しました。",
          variant: "destructive",
        })
      })

    // カートをクリア
    setCart([])

    // 成功メッセージ
    toast({
      title: "注文が確定しました",
      description: `注文番号: ${newOrder.id}、合計金額: ${newOrder.totalAmount}円`,
    })

    // チャットに注文確認メッセージを追加
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `ご注文ありがとうございます！注文番号: ${newOrder.id}、合計金額: ${newOrder.totalAmount}円です。まもなくお持ちします。`,
      },
    ])
  }

  return (
    <div className="w-full max-w-2xl">
      {/* 数量選択ダイアログ */}
      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">数量選択</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedItem ? selectedItem.name : ""}の注文数を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-8 text-center">{selectedQuantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => setSelectedQuantity(selectedQuantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              キャンセル
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={confirmQuantity}>
              カートに追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="chat" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="chat">チャット</TabsTrigger>
          <TabsTrigger value="menu">メニュー</TabsTrigger>
          <TabsTrigger value="history">注文履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
            <CardHeader className="border-b border-zinc-700">
              <CardTitle className="text-amber-400">カクテルチャット</CardTitle>
              <CardDescription className="text-zinc-400">お好みのカクテルについてお聞かせください</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="flex gap-3 max-w-[80%]">
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                            <AvatarFallback className="bg-amber-600">AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user" ? "bg-amber-600 text-white" : "bg-zinc-700 text-zinc-100"
                            }`}
                          >
                            {message.content}

                            {/* カクテル推薦がある場合 */}
                            {message.cocktails && message.cocktails.length > 0 && (
                              <div className="mt-3 space-y-3">
                                {message.cocktails.map((cocktail, idx) => (
                                  <div key={idx} className="bg-zinc-800 rounded-md p-3">
                                    <div className="font-bold text-amber-400 mb-1 flex justify-between items-center">
                                      <span>{cocktail.name}</span>
                                      <span className="text-sm font-normal text-zinc-400">{cocktail.price}</span>
                                    </div>
                                    <div className="text-sm mb-2">{cocktail.description}</div>
                                    <div className="text-xs text-zinc-400 mb-2">
                                      材料: {cocktail.ingredients.join(", ")}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {cocktail.tags.slice(0, 5).map((tag: string, tagIdx: number) => (
                                        <Badge
                                          key={tagIdx}
                                          variant="outline"
                                          className="bg-zinc-900 text-amber-400 border-amber-600"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="w-full bg-amber-600 hover:bg-amber-700"
                                      onClick={() => handleOrderClick(cocktail)}
                                    >
                                      カートに追加
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {message.role === "assistant" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-6 text-xs text-zinc-400 hover:text-amber-400"
                              onClick={() => toggleSpeaking(message.content)}
                            >
                              {isSpeaking ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                              {isSpeaking ? "停止" : "読み上げ"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[80%]">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                          <AvatarFallback className="bg-amber-600">AI</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-zinc-700 text-zinc-100 flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>考え中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t border-zinc-700 p-4">
              <div className="flex w-full items-center gap-2">
                {isListening ? (
                  <Button
                    onClick={toggleListening}
                    variant="destructive"
                    className="rounded-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    <MicOff className="h-5 w-5 mr-2" />
                    停止
                  </Button>
                ) : (
                  <Button
                    onClick={toggleListening}
                    variant="default"
                    className="rounded-full bg-amber-600 hover:bg-amber-700"
                    disabled={isLoading}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    話しかける
                  </Button>
                )}
                <p className="text-sm text-zinc-400 flex-1 text-center">
                  {isListening ? "聞いています..." : "マイクボタンを押して話しかけてください"}
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
            <CardHeader className="border-b border-zinc-700 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-amber-400">ドリンク＆フードメニュー</CardTitle>
                <CardDescription className="text-zinc-400">
                  営業時間：18:00〜23:00（ラストオーダー22:15）
                  <br />
                  お通し：500円（学生は無料）・学割：全ドリンク・フード100円引き
                </CardDescription>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2 px-4 py-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>カート</span>
                    {cart.length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-amber-400">カート</SheetTitle>
                    <SheetDescription className="text-zinc-400">
                      {isStudent ? "学生割引が適用されています（パスタスナックを除く）" : ""}
                    </SheetDescription>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="py-6 text-center text-zinc-400">カートに商品がありません</div>
                  ) : (
                    <div className="py-4">
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center border-b border-zinc-700 pb-2"
                          >
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-zinc-400">
                                {item.price} × {item.quantity}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between font-bold">
                          <span>合計</span>
                          <span>{cartTotal}円</span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="student-discount"
                            checked={isStudent}
                            onChange={(e) => setIsStudent(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="student-discount" className="text-white">
                            学生割引を適用する
                          </Label>
                        </div>

                        <div className="pt-4">
                          <Button
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            onClick={handleOrderConfirm}
                            disabled={cart.length === 0}
                          >
                            注文を確定する
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-6">
                  {Object.entries(categorizedCocktails).map(([category, drinks]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-bold text-amber-400 border-b border-zinc-700 pb-2">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {drinks.map((drink, idx) => (
                          <div key={idx} className="bg-zinc-700 rounded-md p-3 hover:bg-zinc-600 transition-colors">
                            <div className="font-bold text-white mb-1 flex justify-between">
                              <span>{drink.name}</span>
                              <span className="text-sm font-normal text-zinc-400">{drink.price}</span>
                            </div>
                            <div className="text-xs text-zinc-300 mb-1">材料: {drink.ingredients.join(", ")}</div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {drink.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
                                <Badge
                                  key={tagIdx}
                                  variant="outline"
                                  className="bg-zinc-800 text-amber-400 border-amber-600 text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  selectCocktail(drink)
                                  setActiveTab("chat")
                                }}
                              >
                                詳細
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleOrderClick(drink)}
                              >
                                注文
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-amber-400 border-b border-zinc-700 pb-2">フードメニュー</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {foods.map((food, idx) => (
                        <div key={idx} className="bg-zinc-700 rounded-md p-3">
                          <div className="font-bold text-white mb-1 flex justify-between">
                            <span>{food.name}</span>
                            <span className="text-sm font-normal text-zinc-400">{food.price}</span>
                          </div>
                          <div className="text-sm text-zinc-300 mb-3">{food.description}</div>
                          {food.limitedQuantity && <div className="text-xs text-amber-400 mb-3">※数量限定</div>}
                          {!food.isStudentDiscountApplicable && (
                            <div className="text-xs text-zinc-400 mb-3">※学割対象外</div>
                          )}
                          <Button
                            size="sm"
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleOrderClick(food, true)}
                          >
                            注文
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
            <CardHeader className="border-b border-zinc-700">
              <CardTitle className="text-amber-400">あなたの注文履歴</CardTitle>
              <CardDescription className="text-zinc-400">
                テーブル {tableNumber} の注文履歴を表示しています
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                {orders.filter((order) => order.tableNumber === tableNumber).length === 0 ? (
                  <div className="py-6 text-center text-zinc-400">注文履歴がありません</div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .filter((order) => order.tableNumber === tableNumber)
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((order) => (
                        <div key={order.id} className="bg-zinc-700 rounded-md p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <div className="font-bold text-amber-400">{order.id}</div>
                              <div className="text-sm text-zinc-400">{new Date(order.timestamp).toLocaleString()}</div>
                            </div>
                            <Badge className={order.status === "提供済み" ? "bg-green-600" : "bg-red-600"}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 mt-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.name} × {item.quantity}
                                </span>
                                <span>{item.price}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-zinc-600 mt-3 pt-3 flex justify-between font-bold">
                            <span>合計</span>
                            <span>{order.totalAmount}円</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
