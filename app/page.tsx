"use client"

import { useState, useEffect } from "react"
import { Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { UserInterface } from "@/components/user-interface"
import { AdminInterface } from "@/components/admin-interface"

// カートアイテムの型定義
type CartItem = {
  id: string
  name: string
  price: string
  quantity: number
  priceValue: number
}

// 注文の型定義
type Order = {
  id: string
  items: CartItem[]
  totalAmount: number
  status: "提供済み" | "キャンセル"
  tableNumber: string
  timestamp: Date
}

// バーメニューに基づいたカクテルのデータベース
const cocktails = [
  // ハイボール・サワー系
  {
    name: "ハイボール",
    ingredients: ["ウイスキー", "ソーダ"],
    description: "ウイスキーをソーダで割った爽やかな飲み物。すっきりとした味わいが特徴です。",
    tags: [
      "ウイスキー",
      "爽やか",
      "定番",
      "さっぱり",
      "炭酸",
      "透明",
      "食事に合う",
      "オールシーズン",
      "初心者向け",
      "男性人気",
    ],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ジンジャーハイボール",
    ingredients: ["ウイスキー", "ジンジャーエール"],
    description: "ウイスキーをジンジャーエールで割った、ジンジャーの風味が効いた飲み物。",
    tags: ["ウイスキー", "スパイシー", "さっぱり", "炭酸", "ジンジャー", "食事に合う", "冬向き", "刺激的", "温まる"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "コークハイボール",
    ingredients: ["ウイスキー", "コーラ"],
    description: "ウイスキーをコーラで割った、甘さと炭酸感が楽しめる飲み物。",
    tags: ["ウイスキー", "甘い", "炭酸", "茶色", "カフェイン", "デザート", "初心者向け", "女性人気"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "レモンサワー",
    ingredients: ["焼酎", "レモン", "ソーダ"],
    description: "焼酎にレモンとソーダを加えた、爽やかな酸味が特徴のサワー。",
    tags: ["焼酎", "爽やか", "さっぱり", "酸味", "炭酸", "透明", "柑橘系", "夏向き", "食事に合う", "定番"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ライムサワー",
    ingredients: ["焼酎", "ライム", "ソーダ"],
    description: "焼酎にライムとソーダを加えた、爽やかな酸味が特徴のサワー。",
    tags: ["焼酎", "爽やか", "さっぱり", "酸味", "炭酸", "透明", "柑橘系", "夏向き", "食事に合う", "南国風"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "巨峰サワー",
    ingredients: ["焼酎", "巨峰シロップ", "ソーダ"],
    description: "焼酎に巨峰シロップとソーダを加えた、フルーティーな味わいのサワー。",
    tags: ["焼酎", "フルーティー", "甘い", "紫色", "炭酸", "デザート", "女性人気", "和風", "季節限定"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カルピスサワー",
    ingredients: ["焼酎", "カルピス", "ソーダ"],
    description: "焼酎にカルピスとソーダを加えた、まろやかな甘さが特徴のサワー。",
    tags: ["焼酎", "甘い", "まろやか", "乳製品", "白色", "炭酸", "デザート", "女性人気", "初心者向け"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "緑茶ハイ",
    ingredients: ["焼酎", "緑茶"],
    description: "焼酎を緑茶で割った、すっきりとした味わいのお茶割り。",
    tags: ["焼酎", "さっぱり", "和風", "緑色", "カフェイン", "食事に合う", "ノンカーボネイト", "健康的"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ウーロンハイ",
    ingredients: ["焼酎", "ウーロン茶"],
    description: "焼酎をウーロン茶で割った、すっきりとした味わいのお茶割り。",
    tags: ["焼酎", "さっぱり", "和風", "茶色", "カフェイン", "食事に合う", "ノンカーボネイト", "定番"],
    category: "ハイボールとサワー",
    price: "500円",
    priceValue: 500,
  },

  // 果実酒・リキュール系
  {
    name: "梅酒ロック",
    ingredients: ["梅酒", "氷"],
    description: "梅酒を氷で冷やしてそのまま楽しむ飲み方。梅の風味を存分に味わえます。",
    tags: ["梅酒", "フルーティー", "甘い", "琥珀色", "和風", "食後酒", "ストレート", "女性人気", "香り高い"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "梅酒水割り",
    ingredients: ["梅酒", "水"],
    description: "梅酒を水で割った、まろやかな味わいの飲み物。",
    tags: ["梅酒", "まろやか", "甘い", "琥珀色", "和風", "ノンカーボネイト", "初心者向け", "香り高い"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "梅酒ソーダ割り",
    ingredients: ["梅酒", "ソーダ"],
    description: "梅酒をソーダで割った、爽やかな炭酸感が楽しめる飲み物。",
    tags: ["梅酒", "爽やか", "炭酸", "琥珀色", "和風", "夏向き", "食前酒", "香り高い"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カシスオレンジ",
    ingredients: ["カシスリキュール", "オレンジジュース"],
    description: "カシスリキュールをオレンジジュースで割った、フルーティーな味わいのカクテル。",
    tags: ["カシス", "フルーティー", "甘い", "初心者向け", "オレンジ色", "ノンカーボネイト", "女性人気", "ビタミン"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カシスソーダ",
    ingredients: ["カシスリキュール", "ソーダ"],
    description: "カシスリキュールをソーダで割った、爽やかな炭酸感が楽しめるカクテル。",
    tags: ["カシス", "爽やか", "炭酸", "さっぱり", "赤色", "夏向き", "食前酒", "女性人気"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カシスグレープフルーツ",
    ingredients: ["カシスリキュール", "グレープフルーツジュース"],
    description: "カシスリキュールをグレープフルーツジュースで割った、ほのかな苦味と甘みのバランスが良いカクテル。",
    tags: ["カシス", "フルーティー", "さっぱり", "ほろ苦", "ピンク色", "ノンカーボネイト", "ビタミン", "女性人気"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "パッソアオレンジ",
    ingredients: ["パッションフルーツリキュール", "オレンジジュース"],
    description: "パッションフルーツリキュールをオレンジジュースで割った、トロピカルな味わいのカクテル。",
    tags: [
      "パッションフルーツ",
      "フルーティー",
      "トロピカル",
      "甘い",
      "オレンジ色",
      "ノンカーボネイト",
      "ビタミン",
      "女性人気",
    ],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "パッソアパイン",
    ingredients: ["パッションフルーツリキュール", "パイナップルジュース"],
    description: "パッションフルーツリキュールをパイナップルジュースで割った、南国感あふれるカクテル。",
    tags: [
      "パッションフルーツ",
      "フルーティー",
      "トロピカル",
      "甘い",
      "黄色",
      "ノンカーボネイト",
      "ビタミン",
      "女性人気",
      "南国風",
    ],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "パッソアソーダ",
    ingredients: ["パッションフルーツリキュール", "ソーダ"],
    description: "パッションフルーツリキュールをソーダで割った、爽やかな炭酸感が楽しめるカクテル。",
    tags: ["パッションフルーツ", "爽やか", "炭酸", "さっぱり", "黄色", "夏向き", "食前酒", "女性人気"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ファジーネーブル",
    ingredients: ["ピーチリキュール", "オレンジジュース"],
    description: "ピーチリキュールをオレンジジュースで割った、桃の甘い香りが特徴のカクテル。",
    tags: [
      "ピーチ",
      "フルーティー",
      "甘い",
      "初心者向け",
      "オレンジ色",
      "ノンカーボネイト",
      "ビタミン",
      "女性人気",
      "香り高い",
    ],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ピーチパイン",
    ingredients: ["ピーチリキュール", "パイナップルジュース"],
    description: "ピーチリキュールをパイナップルジュースで割った、トロピカルな甘さが特徴のカクテル。",
    tags: [
      "ピーチ",
      "フルーティー",
      "トロピカル",
      "甘い",
      "黄色",
      "ノンカーボネイト",
      "ビタミン",
      "女性人気",
      "南国風",
    ],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ピーチソーダ",
    ingredients: ["ピーチリキュール", "ソーダ"],
    description: "ピーチリキュールをソーダで割った、爽やかな炭酸感が楽しめるカクテル。",
    tags: ["ピーチ", "爽やか", "炭酸", "さ���ぱり", "透明", "夏向き", "食前酒", "女性人気", "香り高い"],
    category: "果実酒とリキュール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カルーアミルク",
    ingredients: ["カルーアリキュール", "牛乳"],
    description: "コーヒーリキュールを牛乳で割った、まろやかな甘さが特徴のカクテル。",
    tags: [
      "コーヒー",
      "まろやか",
      "甘い",
      "デザート",
      "茶色",
      "乳製品",
      "女性人気",
      "食後酒",
      "カフェイン",
      "ノンカーボネイト",
    ],
    category: "ミルクカクテル",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "抹茶ミルク",
    ingredients: ["抹茶リキュール", "牛乳"],
    description: "抹茶リキュールを牛乳で割った、和風テイストのまろやかなカクテル。",
    tags: [
      "抹茶",
      "まろやか",
      "和風",
      "デザート",
      "緑色",
      "乳製品",
      "女性人気",
      "食後酒",
      "ノンカーボネイト",
      "ほろ苦",
    ],
    category: "ミルクカクテル",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "カシスミルク",
    ingredients: ["カシスリキュール", "牛乳"],
    description: "カシスリキュールを牛乳で割った、ベリーの風味とミルクのまろやかさが楽しめるカクテル。",
    tags: [
      "カシス",
      "まろやか",
      "甘い",
      "デザート",
      "ピンク色",
      "乳製品",
      "女性人気",
      "食後酒",
      "ノンカーボネイト",
      "フルーティー",
    ],
    category: "ミルクカクテル",
    price: "500円",
    priceValue: 500,
  },

  // スタンダードカクテル
  {
    name: "スクリュードライバー",
    ingredients: ["ウォッカ", "オレンジジュース"],
    description: "ウォッカをオレンジジュースで割った、シンプルながら人気の高いカクテル。",
    tags: [
      "ウォッカ",
      "フルーティー",
      "さっぱり",
      "定番",
      "オレンジ色",
      "柑橘系",
      "朝食",
      "ビタミン",
      "ノンカーボネイト",
      "初心者向け",
    ],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "モスコミュール",
    ingredients: ["ウォッカ", "ジンジャーエール", "ライム"],
    description: "ウォッカとジンジャーエール、ライムを組み合わせた、スパイシーな味わいのカクテル。",
    tags: ["ウォッカ", "スパイシー", "さっぱり", "定番", "透明", "炭酸", "ジンジャー", "柑橘系", "刺激的", "食前酒"],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ブルドッグ",
    ingredients: ["ジン", "グレープフルーツジュース"],
    description: "ジンをグレープフルーツジュースで割った、ほろ苦さと爽やかさが特徴のカクテル。",
    tags: [
      "ジン",
      "フルーティー",
      "ほろ苦",
      "さっぱり",
      "ピンク色",
      "柑橘系",
      "ビタミン",
      "ノンカーボネイト",
      "大人向け",
    ],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ソルティドッグ",
    ingredients: ["ジン", "グレープフルーツジュース", "塩"],
    description: "ジンとグレープフルーツジュース、塩を組み合わせた、塩味がアクセントのカクテル。",
    tags: [
      "ジン",
      "フルーティー",
      "ほろ苦",
      "塩味",
      "ピンク色",
      "柑橘系",
      "ビタミン",
      "ノンカーボネイト",
      "大人向け",
      "食前酒",
    ],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ジントニック",
    ingredients: ["ジン", "トニックウォーター"],
    description: "ジンをトニックウォーターで割った、すっきりとした苦味が特徴のカクテル。",
    tags: ["ジン", "すっきり", "ほろ苦", "定番", "透明", "炭酸", "ハーブ", "食前酒", "大人向け", "クラシック"],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ジンバック",
    ingredients: ["ジン", "ジンジャーエール"],
    description: "ジンをジンジャーエールで割った、スパイシーな風味が楽しめるカクテル。",
    tags: [
      "ジン",
      "スパイシー",
      "さっぱり",
      "透明",
      "炭酸",
      "ジンジャー",
      "食前酒",
      "大人向け",
      "クラシック",
      "刺激的",
    ],
    category: "スタンダード",
    price: "500円",
    priceValue: 500,
  },

  // ノンアルコール
  {
    name: "ノンアルコールビール",
    ingredients: ["ノンアルコールビール"],
    description: "アルコール0%のビールテイスト飲料。ビールの風味を楽しみたい方におすすめ。",
    tags: ["ノンアルコール", "ビール風", "さっぱり", "黄色", "炭酸", "食事に合う", "ドライバー向け", "健康的", "苦味"],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ノンアルコールハイボール",
    ingredients: ["ノンアルコールウイスキー風", "ソーダ"],
    description: "アルコール0%のハイボール風飲料。ウイスキーの風味とソーダの爽快感が楽しめます。",
    tags: [
      "ノンアルコール",
      "ハイボール風",
      "爽やか",
      "琥珀色",
      "炭酸",
      "食事に合う",
      "ドライバー向け",
      "健康的",
      "大人向け",
    ],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "シンデレラ",
    ingredients: ["オレンジジュース", "パイナップルジュース", "レモンジュース"],
    description: "オレンジ、パイナップル、レモンを組み合わせた、黄色い色合いが特徴のノンアルコールカクテル。",
    tags: [
      "ノンアルコール",
      "フルーティー",
      "さっぱり",
      "黄色",
      "柑橘系",
      "トロピカル",
      "ビタミン",
      "朝食",
      "健康的",
      "子供OK",
    ],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "シャーリーテンプル",
    ingredients: ["ジンジャーエール", "グレナデンシロップ"],
    description: "ジンジャーエールとグレナデンシロップを組み合わせた、赤い色合いが特徴のノンアルコールカクテル。",
    tags: ["ノンアルコール", "甘い", "赤色", "炭酸", "ジンジャー", "子供OK", "インスタ映え", "女性人気", "パーティー"],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "ブルーラグーン",
    ingredients: ["ブルーキュラソーシロップ", "レモネード"],
    description: "ブルーキュラソーシロップとレモネードを組み合わせた、青い色合いが特徴のノンアルコールカクテル。",
    tags: [
      "ノンアルコール",
      "爽やか",
      "青色",
      "柑橘系",
      "インスタ映え",
      "夏向き",
      "子供OK",
      "パーティー",
      "甘酸っぱい",
    ],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },
  {
    name: "サラトガクーラー",
    ingredients: ["ライムジュース", "ミントシロップ", "ソーダ"],
    description: "ライムジュースとミントシロップ、ソーダを組み合わせた、緑色の爽やかなノンアルコールカクテル。",
    tags: ["ノンアルコール", "爽やか", "さっぱり", "緑色", "炭酸", "柑橘系", "ハーブ", "夏向き", "子供OK", "健康的"],
    category: "ノンアルコール",
    price: "500円",
    priceValue: 500,
  },

  // ソフトドリンク
  {
    name: "ウーロン茶",
    ingredients: ["ウーロン茶"],
    description: "香ばしい風味が特徴の中国茶。すっきりとした味わいで、食事との相性も抜群です。",
    tags: [
      "ノンアルコール",
      "お茶",
      "さっぱり",
      "茶色",
      "ノンカーボネイト",
      "カフェイン",
      "食事に合う",
      "健康的",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "緑茶",
    ingredients: ["緑茶"],
    description: "日本の伝統的なお茶。さっぱりとした味わいで、リフレッシュしたいときにおすすめ。",
    tags: [
      "ノンアルコール",
      "お茶",
      "さっぱり",
      "和風",
      "緑色",
      "ノンカーボネイト",
      "カフェイン",
      "食事に合う",
      "健康的",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "コーヒー",
    ingredients: ["コーヒー"],
    description: "香り高いコーヒー。アイスでもホットでもお楽しみいただけます。",
    tags: [
      "ノンアルコール",
      "コーヒー",
      "苦味",
      "茶色",
      "ノンカーボネイト",
      "カフェイン",
      "食後",
      "健康的",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "カルピスソーダ",
    ingredients: ["カルピス", "ソーダ"],
    description: "カルピスをソーダで割った、まろやかな甘さと爽やかな炭酸感が楽しめる飲み物。",
    tags: ["ノンアルコール", "甘い", "炭酸", "白色", "乳製品", "さっぱり", "子供OK", "女性人気", "ドライバー向け"],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "コーラ",
    ingredients: ["コーラ"],
    description: "定番の炭酸飲料。甘さと炭酸感が特徴です。",
    tags: ["ノンアルコール", "甘い", "炭酸", "茶色", "カフェイン", "食事に合う", "子供OK", "定番", "ドライバー向け"],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "ジンジャーエール",
    ingredients: ["ジンジャーエール"],
    description: "ジンジャーの風味が効いた炭酸飲料。スパイシーな味わいが特徴です。",
    tags: [
      "ノンアルコール",
      "スパイシー",
      "炭酸",
      "透明",
      "ジンジャー",
      "食事に合う",
      "子供OK",
      "刺激的",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "オレンジジュース",
    ingredients: ["オレンジジュース"],
    description: "フレッシュなオレンジの風味が楽しめるジュース。",
    tags: [
      "ノンアルコール",
      "フルーティー",
      "甘い",
      "オレンジ色",
      "柑橘系",
      "ビタミン",
      "朝食",
      "子供OK",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "パイナップルジュース",
    ingredients: ["パイナップルジュース"],
    description: "トロピカルな甘さが特徴のパイナップルジュース。",
    tags: [
      "ノンアルコール",
      "フルーティー",
      "トロピカル",
      "甘い",
      "黄色",
      "ビタミン",
      "南国風",
      "子供OK",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
  {
    name: "グレープフルーツジュース",
    ingredients: ["グレープフルーツジュース"],
    description: "ほのかな苦味と酸味が特徴のグレープフルーツジュース。",
    tags: [
      "ノンアルコール",
      "フルーティー",
      "ほろ苦",
      "さっぱり",
      "ピンク色",
      "柑橘系",
      "ビタミン",
      "朝食",
      "子供OK",
      "ドライバー向け",
    ],
    category: "ソフトドリンク",
    price: "400円",
    priceValue: 400,
  },
]

// フードメニュー
const foods = [
  {
    name: "パスタスナック",
    description: "サクサク食感のパスタスナック。おつまみにぴったりです。",
    price: "200円",
    priceValue: 200,
    isStudentDiscountApplicable: false,
  },
  {
    name: "じゃがバター",
    description: "ホクホクのじゃがいもにバターをたっぷりと。シンプルながら人気のメニューです。",
    price: "300円",
    priceValue: 300,
    isStudentDiscountApplicable: true,
  },
  {
    name: "ホットサンド",
    description: "チーズとハムのホットサンド。数量限定のため、お早めにどうぞ。",
    price: "400円",
    priceValue: 400,
    isStudentDiscountApplicable: true,
    limitedQuantity: true,
  },
  {
    name: "日替わり丼/プレート",
    description: "シェフ特製の日替わりメニュー。その日の気分でお楽しみください。",
    price: "600円",
    priceValue: 600,
    isStudentDiscountApplicable: true,
  },
]

// カテゴリー別にカクテルを整理
const categorizedCocktails = {
  ハイボールとサワー: cocktails.filter((c) => c.category === "ハイボールとサワー"),
  果実酒とリキュール: cocktails.filter((c) => c.category === "果実酒とリキュール"),
  ミルクカクテル: cocktails.filter((c) => c.category === "ミルクカクテル"),
  スタンダード: cocktails.filter((c) => c.category === "スタンダード"),
  ノンアルコール: cocktails.filter((c) => c.category === "ノンアルコール"),
  ソフトドリンク: cocktails.filter((c) => c.category === "ソフトドリンク"),
}

// 管理者パスワード（実際のアプリでは環境変数や安全な認証システムを使用すべき）
const ADMIN_PASSWORD = "Gengen20024017"

export default function CocktailChatbot() {
  // 以下の変数定義の後に、テーブル番号入力ダイアログの状態を追加
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 追加: テーブル番号入力ダイアログの状態
  const [tableInputDialogOpen, setTableInputDialogOpen] = useState(true)
  const [tableNumber, setTableNumber] = useState("")

  useEffect(() => {
    // コンポーネントマウント時にテーブル番号ダイアログを表示
    if (!tableNumber) {
      setTableInputDialogOpen(true)
    }
  }, [tableNumber])

  // 管理者ログイン処理
  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setLoginDialogOpen(false)
      setPassword("")
      setIsPasswordIncorrect(false)
      toast({
        title: "管理者モードに切り替えました",
        description: "管理者機能が利用可能になりました。",
      })
    } else {
      setIsPasswordIncorrect(true)
    }
  }

  // 管理者ログアウト処理
  const handleAdminLogout = () => {
    setIsAdmin(false)
    toast({
      title: "ユーザーモードに切り替えました",
      description: "通常の機能が利用可能になりました。",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-4 flex flex-col items-center">
      <header className="w-full max-w-2xl text-center mb-6 relative flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => setLoginDialogOpen(true)}
          >
            {isAdmin ? <Lock className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
            {isAdmin ? "管理者モード" : "ユーザーモード"}
          </Button>
          <h1 className="text-3xl font-bold text-amber-400">バーテンダーAI</h1>
          <div className="w-[100px]"></div> {/* 右側のスペース確保 */}
        </div>
        <p className="text-zinc-400">
          {isAdmin ? "管理者モード - 注文管理とデータ分析" : "あなたの好みに合わせたカクテルをご提案します"}
        </p>
      </header>

      {/* 管理者ログインダイアログ */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {isAdmin ? "管理者モードからログアウト" : "管理者モードにログイン"}
            </DialogTitle>
          </DialogHeader>
          {isAdmin ? (
            <div className="py-4">
              <p className="text-zinc-300">管理者モードからログアウトしますか？</p>
            </div>
          ) : (
            <div className="py-4">
              <Label htmlFor="password" className="text-white">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setIsPasswordIncorrect(false)
                }}
                className={`bg-zinc-700 border-zinc-600 text-white ${isPasswordIncorrect ? "border-red-500" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdminLogin()
                  }
                }}
              />
              {isPasswordIncorrect && <p className="text-red-500 text-sm mt-1">パスワードが正しくありません</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              キャンセル
            </Button>
            {isAdmin ? (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAdminLogout}>
                ログアウト
              </Button>
            ) : (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAdminLogin}>
                ログイン
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* テーブル番号選択ダイアログ */}
      <Dialog
        open={tableInputDialogOpen}
        onOpenChange={(open) => {
          // テーブル番号が選択されていない場合はダイアログを閉じられないようにする
          if (!tableNumber && !open) {
            return
          }
          setTableInputDialogOpen(open)
        }}
      >
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">テーブル番号を選択してください</DialogTitle>
            <DialogDescription className="text-zinc-400">
              注文や履歴確認のためにテーブル番号が必要です
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={tableNumber} onValueChange={setTableNumber} className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <div key={num} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={num.toString()}
                    id={`table-${num}`}
                    className="text-amber-400 border-amber-400"
                  />
                  <Label htmlFor={`table-${num}`} className="text-white">
                    テーブル {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (tableNumber) {
                  setTableInputDialogOpen(false)
                  toast({
                    title: "テーブル番号を設定しました",
                    description: `テーブル番号: ${tableNumber}`,
                  })
                } else {
                  toast({
                    title: "テーブル番号を選択してください",
                    variant: "destructive",
                  })
                }
              }}
              disabled={!tableNumber}
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* インターフェース切り替え */}
      {isAdmin ? <AdminInterface /> : <UserInterface tableNumber={tableNumber} />}

      <footer className="text-center text-zinc-500 text-sm mt-4">
        {isAdmin ? (
          <p>管理者モード - 全ての機能にアクセスできます</p>
        ) : (
          <>
            <p>カクテルの種類や好みを話しかけてみてください</p>
            <p className="mt-1">例: 「爽やかなカクテルが飲みたい」「ジンベースのおすすめは？」「学割について教えて」</p>
          </>
        )}
      </footer>

      <Toaster />
    </div>
  )
}
