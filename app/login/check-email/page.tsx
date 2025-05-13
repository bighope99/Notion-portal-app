import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Terminal } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-center">メールを確認してください</CardTitle>
          <CardDescription className="text-center">ログイン用のマジックリンクをメールで送信しました</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            メールに記載されているリンクをクリックしてログインを完了してください。 リンクの有効期限は15分です。
          </p>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-left">
              <div className="flex items-center mb-2">
                <Terminal className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">開発環境情報</span>
              </div>
              <p className="text-xs text-gray-600">
                開発環境では、実際にメールは送信されません。コンソールログでマジックリンクを確認してください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
