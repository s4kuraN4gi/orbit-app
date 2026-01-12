1. 画面遷移図 (Screen Transition Map)
Orbitは「シンプルさ」が売りなので、ページ数は極力少なくし、SPA（Single Page Application）としてスムーズに動く設計にします。



graph TD
    User((User)) --> Login[/Login Page/]
    Login --> |Auth Success| Dashboard[/Dashboard (Main)/]
    
    subgraph "Main Application"
        Dashboard --> |Tab Switch| ListView[List View (WBS)]
        Dashboard --> |Tab Switch| BoardView[Board View (Kanban)]
        Dashboard --> |Tab Switch| GanttView[Gantt Chart]
        
        Dashboard --> |Click Task| TaskModal[Task Detail Modal]
        Dashboard --> |Settings| Settings[Settings Page]
    end

    subgraph "Background / API"
        ExternalAI[IDE / Antigravity] -.-> |POST API| API_Endpoint(("/api/tasks/bulk-create"))
        API_Endpoint -.-> |Create| Dashboard
    end





【画面構成リスト】

/login: ログイン画面（Supabase Auth UIを使用）。

/dashboard: メイン画面。ヘッダーにプロジェクト切り替え、メインエリアに「リスト/カンバン/ガント」のタブ表示。

/settings: プロジェクト設定、APIキー発行など。

Task Modal: ページ遷移せず、画面の上に重なって表示されるダイアログ（操作性を高めるためURL遷移させない）。