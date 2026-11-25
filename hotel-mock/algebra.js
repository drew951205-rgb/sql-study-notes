const algebraExam = {
  tables: {
    Reader: {
      cols: ["reader_id", "name", "department"],
      rows: [
        ["S01", "安琪", "資管"],
        ["S02", "柏宇", "資工"],
        ["S03", "承恩", "資管"],
        ["S04", "朵拉", "企管"],
        ["S05", "宇晴", "資工"],
        ["S06", "宜庭", "企管"]
      ]
    },
    Book: {
      cols: ["book_id", "title", "category"],
      rows: [
        ["B01", "SQL 入門", "資料庫"],
        ["B02", "資料庫設計", "資料庫"],
        ["B03", "網頁設計", "網頁"],
        ["B04", "JavaScript 實作", "網頁"],
        ["B05", "機器學習入門", "AI"],
        ["B06", "生成式 AI", "AI"]
      ]
    },
    Loan: {
      cols: ["reader_id", "book_id", "branch"],
      rows: [
        ["S01", "B01", "Main"],
        ["S01", "B02", "East"],
        ["S01", "B03", "East"],
        ["S02", "B01", "East"],
        ["S02", "B04", "Main"],
        ["S02", "B05", "Main"],
        ["S03", "B02", "Main"],
        ["S03", "B03", "Main"],
        ["S03", "B04", "East"],
        ["S04", "B03", "East"],
        ["S04", "B05", "East"],
        ["S04", "B06", "Main"],
        ["S05", "B01", "Main"],
        ["S05", "B03", "East"],
        ["S05", "B05", "East"]
      ]
    }
  },
  questions: [
    {
      expression: `A ← π_{book_id}(σ_{branch = 'Main'}(Loan))
B ← π_{book_id}(σ_{branch = 'East'}(Loan))
C ← A − B
RESULT ← π_{book_id, title, category}(C ⋈ Book)`,
      cols: ["book_id", "title", "category"],
      rows: [["B06", "生成式 AI", "AI"]],
      note: "A 包含 B01～B06，B 包含 B01～B05。A − B 只留下 B06，再依 book_id 接上 Book 補出書名與類別。"
    },
    {
      expression: `L1 ← ρ_{L1(r1, b1, s1)}(Loan)
L2 ← ρ_{L2(r2, b2, s2)}(Loan)
T ← σ_{r1 = r2 ∧ s1 = s2 ∧ b1 < b2}(L1 × L2)
RESULT ← π_{b1, b2}(T)`,
      cols: ["b1", "b2"],
      rows: [["B02", "B03"], ["B03", "B05"], ["B04", "B05"]],
      note: "兩份 Loan 各自重新命名欄位後再配對。保留同一讀者、同一分館且 b1 小於 b2 的組合。S01 和 S03 都形成 (B02, B03)，S04 和 S05 都形成 (B03, B05)。投影只留下書號，重複書對合成一列。"
    },
    {
      expression: `T ← Loan ⋈ Book
A ← π_{category}(σ_{reader_id = 'S02'}(T))
B ← π_{reader_id, category}(T)
C ← B ÷ A
RESULT ← π_{reader_id, name}(C ⋈ Reader)`,
      cols: ["reader_id", "name"],
      rows: [["S02", "柏宇"], ["S05", "宇晴"]],
      note: "S02 借過 B01、B04、B05，涵蓋資料庫、網頁、AI。B ÷ A 找借書紀錄涵蓋這三種類別的讀者。S02 和 S05 都符合。"
    },
    {
      expression: `T ← Loan ⋈ Book
A ← π_{reader_id}(σ_{category = 'AI'}(T))
B ← π_{reader_id}(σ_{branch = 'Main'}(T))
C ← π_{reader_id}(σ_{category = '網頁' ∧ branch = 'East'}(T))
D ← (A ∩ B) − C
RESULT ← π_{reader_id, name, department}(D ⋈ Reader)`,
      cols: ["reader_id", "name", "department"],
      rows: [["S02", "柏宇", "資工"]],
      note: "A ∩ B 留下 S02、S04、S05。他們都借過 AI 書，也都在 Main 借過書。C 包含 S01、S03、S04、S05，扣掉 C 後只剩 S02。"
    }
  ]
};
