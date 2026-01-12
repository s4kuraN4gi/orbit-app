3. コンポーネント構成図 (Architecture)
Next.jsのディレクトリ構造と、どの部品（Component）を作るかの計画です。 「Atomic Design」を少し崩した、実用的な構成にします。

graph TD
    Page_Dashboard[Page: /dashboard]
    
    subgraph "Organisms (大きな部品)"
        ProjectHeader[ProjectHeader]
        TaskBoard[TaskBoard (Kanban)]
        TaskList[TaskList (WBS)]
        GanttChart[GanttChart]
        TaskDetailModal[TaskDetailModal]
    end
    
    subgraph "Molecules (中くらいの部品)"
        TaskCard[TaskCard]
        TaskRow[TaskRow]
        StatusBadge[StatusBadge]
        AIContextCard[AIContextCard]
    end
    
    subgraph "Atoms (最小部品 / shadcn-ui)"
        Button
        Input
        Select
        Avatar
    end

    Page_Dashboard --> ProjectHeader
    Page_Dashboard --> TaskBoard
    Page_Dashboard --> TaskList
    Page_Dashboard --> GanttChart
    
    TaskBoard --> TaskCard
    TaskList --> TaskRow
    TaskDetailModal --> AIContextCard


TaskCard: カンバンボードでドラッグ＆ドロップされるカード。

TaskRow: WBSリストで表示される1行。インデント機能付き。

AIContextCard: 「AIがどういう経緯でこのタスクを作ったか」を表示する専用カード。