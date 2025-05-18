"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          ルール
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GROWSポータルのルール</DialogTitle>
          <DialogDescription>効果的な学習と成長のためのガイドライン</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div>
            <div>
              <h2 className="text-xl font-bold mb-4">【講座の新ルールについて】</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">①アウトプットは"習慣化"</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    週に1回以上、アウトプットを投稿してください。
                    内容は自由ですが、以下のようなテーマが投稿しやすいです。
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                    <li>今週の気づき・学び</li>
                    <li>実践したこと＆その結果</li>
                    <li>壁に感じたことと、それに対して考えたこと</li>
                    <li>他メンバーの投稿に対しての感想やリプライでもOK</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-600">
                    ※3週間以上アウトプットがない場合は、個別確認のうえ、継続について相談させていただきます。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">②見るだけ禁止！アーカイブも"能動的に"</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    アーカイブを見るだけで終わらせないように、以下のいずれかをルール化します：
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                    <li>視聴後24時間以内に「印象に残ったこと・実践したいこと」を投稿</li>
                    <li>毎回視聴前に「今日、自分は何を得たいか？」を投稿し、視聴後に感想で締める</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">③コメントは「ギフト」</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    アウトプット投稿には、できるだけ<strong>コメント（感想・共感・質問）</strong>
                    やスタンプを送り合うようにしましょう。
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                    <li>誰かの言葉で自分が前に進��たら、それは最高のギフト</li>
                    <li>見守りメンバーではなく、"場をつくるメンバー"へ</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">④月1振り返り（シェアタイム）</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    月末に一度、「今月の成果・変化・学びの振り返り」を全員で投稿。
                    →希望者のみ、Zoomなどでのシェアタイムも実施予定（任意）
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">⑤誰かの「がんばり」が、誰かの「前進」になる</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    この場では、「正解のアウトプット」や「成果だけの報告」は求めません。
                    うまくいかなかったことも、悩んでいることも、全部が"価値ある学び"です。
                    遠慮せず、素直に出していくことが、最強の成長スピードになります。
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold mt-8 mb-4">【このGROWSポータルの使い方】</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">■予定とアーカイブ</h3>
                  <div className="mt-2 space-y-4">
                    <div>
                      <h4 className="font-medium">①セミナー・イベントスケジュール</h4>
                      <p className="text-sm text-gray-600">
                        今後のセミナーやイベントのスケジュール・zoomリンクが確認できます。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">②個人コンサルテーション（予約可能）</h4>
                      <p className="text-sm text-gray-600">
                        個別面談可能な日程をスケジュールに入れています。（1時間枠）
                        <br />
                        クリックすると、予約が可能です。
                        <br />
                        最低月1回面談日を予約しましょう。（最大3回まで）
                        <br />
                        ※予約後、必ず個人コンサル事前アンケートフォームの入力・送信をお願いします。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">③アーカイブ</h4>
                      <p className="text-sm text-gray-600">これまでのセミナーアーカイブが視聴できます。</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">■タスクと提出物</h3>
                  <div className="mt-2 space-y-4">
                    <div>
                      <h4 className="font-medium">①タスク</h4>
                      <p className="text-sm text-gray-600">出された課題の中で完了したものにチェックをお願いします。</p>
                    </div>
                    <div>
                      <h4 className="font-medium">②提出物</h4>
                      <p className="text-sm text-gray-600">
                        メニューやトークスクリプトなど、私と共有が必要な資料についてはこちらから共有お願いします。
                        <br />
                        <br />
                        月1回（毎月10日まで）月次報告フォームの入力・送信をお願いします。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
