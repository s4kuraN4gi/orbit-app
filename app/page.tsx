import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  GanttChartSquare, 
  Sparkles, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-xl">Orbit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">ログイン</Button>
          </Link>
          <Link href="/login">
            <Button>無料で始める</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI搭載のプロジェクト管理
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
            チームの生産性を
            <br />
            次のレベルへ
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Orbitは、JiraとRedmineの長所を融合した次世代のプロジェクト管理ツール。
            AI連携でタスク管理をよりスマートに。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="px-8 h-12 text-base">
                無料で始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-8 h-12 text-base">
                デモを見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">すべてを一箇所で管理</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            リスト、カンバン、ガントチャート。あなたのスタイルに合わせた表示が可能です。
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<LayoutDashboard className="h-8 w-8" />}
            title="リストビュー"
            description="シンプルで効率的なタスク一覧。階層構造でWBSを簡単に管理。"
          />
          <FeatureCard
            icon={<KanbanSquare className="h-8 w-8" />}
            title="カンバンボード"
            description="ドラッグ＆ドロップでタスクのステータスを直感的に変更。"
          />
          <FeatureCard
            icon={<GanttChartSquare className="h-8 w-8" />}
            title="ガントチャート"
            description="プロジェクトのスケジュールを視覚化。依存関係も一目で把握。"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">AIが支える新しい働き方</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              CursorやAntigravityなどのAIツールと連携。
              AIからのタスク提案をそのまま管理できます。
            </p>
            <ul className="space-y-4">
              <BenefitItem text="AIが生成したタスクをワンクリックで取り込み" />
              <BenefitItem text="タスクの背景情報（AIコンテキスト）を常に参照可能" />
              <BenefitItem text="プロジェクトごとに整理されたタスク管理" />
              <BenefitItem text="サブタスクで詳細なWBS構造を実現" />
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 aspect-square flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium">AI × プロジェクト管理</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐOrbitを始めよう
          </h2>
          <p className="text-blue-100 mb-8">
            無料で始められます。クレジットカードは不要です。
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="px-8 h-12 text-base">
              無料アカウントを作成
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span>Orbit</span>
          </div>
          <p>© 2026 Orbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
}
