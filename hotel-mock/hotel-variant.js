const hotelVariantQuestions = [
  {
    format: "sql",
    points: 12,
    ordered: true,
    expression: `SELECT b.book_id, h.city, r.type, r.price
FROM Booking AS b
JOIN Room AS r ON b.room_id = r.room_id
JOIN Hotel AS h ON r.hotel_id = h.hotel_id
WHERE h.city IN ('Hualien', 'Kaohsiung')
  AND r.type IN ('Single', 'Suite')
  AND r.price >= 130
ORDER BY r.price ASC, b.book_id ASC;`,
    cols: ["book_id", "city", "type", "price"],
    rows: [
      ["B020", "Kaohsiung", "Suite", 130],
      ["B015", "Hualien", "Suite", 143],
      ["B001", "Kaohsiung", "Single", 168],
      ["B016", "Hualien", "Suite", 184],
      ["B010", "Kaohsiung", "Suite", 239],
      ["B011", "Kaohsiung", "Suite", 250]
    ],
    note: "每筆訂房用 room_id 查房型和價格，再用 hotel_id 查城市。城市、房型與價格三個條件都要符合。B020 剛好 130，可以保留。B014 的房價是 129，會被篩掉。"
  },
  {
    format: "sql",
    points: 12,
    ordered: true,
    expression: `SELECT h.hotel_id, r.room_id, c.name AS customer_name, r.price
FROM Room AS r
JOIN Booking AS b ON r.room_id = b.room_id
JOIN Customer AS c ON b.cust_id = c.cust_id
JOIN Hotel AS h ON r.hotel_id = h.hotel_id
WHERE r.type = 'Double'
  AND r.price > (
    SELECT AVG(r2.price)
    FROM Room AS r2
    WHERE r2.hotel_id = r.hotel_id
  )
ORDER BY h.hotel_id ASC, b.book_id ASC;`,
    cols: ["hotel_id", "room_id", "customer_name", "price"],
    rows: [
      ["H001", "R0103", "Linet Morrieson", 247],
      ["H004", "R0403", "Antonius Wildman", 163],
      ["H009", "R0903", "Erin Formie", 245],
      ["H010", "R1001", "Herminia Hargey", 180],
      ["H013", "R1301", "Evey Moreton", 158]
    ],
    note: "AVG 用同一間飯店的全部房間計算。以 H010 為例，平均為 (180 + 105 + 185) ÷ 3，約 156.67。R1001 價格 180 且為 Double，有訂房紀錄，所以入選。"
  },
  {
    format: "sql",
    points: 10,
    ordered: false,
    expression: `SELECT c.cust_id, c.name
FROM Customer AS c
WHERE EXISTS (
  SELECT 1
  FROM Booking AS b
  JOIN Room AS r ON b.room_id = r.room_id
  JOIN Hotel AS h ON r.hotel_id = h.hotel_id
  WHERE b.cust_id = c.cust_id AND h.stars = 5
)
AND NOT EXISTS (
  SELECT 1
  FROM Booking AS b
  JOIN Room AS r ON b.room_id = r.room_id
  JOIN Hotel AS h ON r.hotel_id = h.hotel_id
  WHERE b.cust_id = c.cust_id AND h.stars = 4
);`,
    cols: ["cust_id", "name"],
    rows: [["C003", "Tyne Halbard"], ["C011", "Erin Formie"], ["C027", "Antonius Wildman"]],
    note: "第一個條件需要至少一筆五星飯店的訂房。第二個條件要求四星飯店的訂房為零。C015 和 C035 兩種飯店都訂過，因此只留下 C003、C011、C027。"
  },
  {
    format: "sql",
    points: 16,
    ordered: true,
    expression: `WITH RECURSIVE Ancestor (cust_id, depth) AS (
  SELECT referrer_id, 1
  FROM CustomerReferral
  WHERE referred_id = 'C029'
  UNION ALL
  SELECT f.referrer_id, a.depth + 1
  FROM CustomerReferral AS f
  JOIN Ancestor AS a ON f.referred_id = a.cust_id
)
SELECT a.cust_id, c.name, a.depth,
       COUNT(r.room_id) AS suite_count
FROM Ancestor AS a
JOIN Customer AS c ON a.cust_id = c.cust_id
LEFT JOIN Booking AS b ON a.cust_id = b.cust_id
LEFT JOIN Room AS r ON b.room_id = r.room_id AND r.type = 'Suite'
GROUP BY a.cust_id, c.name, a.depth
ORDER BY a.depth ASC, a.cust_id ASC;`,
    cols: ["cust_id", "name", "depth", "suite_count"],
    rows: [
      ["C040", "Ingrim Tillot", 1, 0],
      ["C024", "Gardner Forker", 2, 0],
      ["C035", "Suzanna Hartrick", 3, 2]
    ],
    note: "從 C029 往上找推薦人，依序得到 C040、C024、C035。最後一個 LEFT JOIN 只對上 Suite，COUNT(r.room_id) 只算對到房號的列。C035 的 B010 與 B013 各算一筆，其餘兩人是 0。"
  },
  {
    format: "algebra",
    points: 12,
    ordered: false,
    expression: `H ← ρ_{H(hotel_id, hotel_name, city, stars, tel)}(Hotel)
C ← ρ_{C(cust_id, customer_name, country, gender)}(Customer)
A ← σ_{(city = 'Tainan' ∨ city = 'Kaohsiung') ∧ stars ≥ 4}(H)
B ← σ_{price > 150 ∧ price ≤ 200}(Room)
T ← (A ⋈ B) ⋈ Booking ⋈ C
RESULT ← π_{book_id, customer_name, hotel_name, price}(T)`,
    cols: ["book_id", "customer_name", "hotel_name", "price"],
    rows: [
      ["B009", "Antonius Wildman", "Maple Leaf Suites", 163],
      ["B012", "Evey Moreton", "Coral Sands Hotel", 158]
    ],
    note: "先改名以區分飯店名稱和顧客姓名，再篩出符合城市與星等的飯店，以及符合價格區間的房間。自然連接依序用 hotel_id、room_id、cust_id 對上資料，剩下 B009 與 B012。"
  },
  {
    format: "algebra",
    points: 12,
    ordered: false,
    expression: `A ← π_{type}(σ_{hotel_id = 'H001'}(Room))
B ← π_{cust_id, type}(Booking ⋈ Room)
C ← B ÷ A
RESULT ← π_{cust_id, name}(C ⋈ Customer)`,
    cols: ["cust_id", "name"],
    rows: [["C035", "Suzanna Hartrick"]],
    note: "H001 的房型集合有 Suite 和 Double。B 列出每位顧客訂過的房型，範圍含所有飯店。C035 在 H005 訂過 Double，也在 H007 和 H001 訂過 Suite，所以通過除法的條件。"
  },
  {
    format: "algebra",
    points: 10,
    ordered: false,
    expression: `T ← σ_{country = 'Taiwan'}(Customer) ⋈ Booking ⋈ Room
A ← π_{hotel_id}(T)
B ← π_{hotel_id}(σ_{price > 240}(Room))
RESULT ← π_{hotel_id, name}((A ∩ B) ⋈ Hotel)`,
    cols: ["hotel_id", "name"],
    rows: [["H001", "Emerald Bay Hotel"], ["H009", "Sunrise Harbor Resort"]],
    note: "A 有 H001、H003、H005、H007、H009。B 有 H001、H009、H011、H012。取交集後，留下同時出現在兩份名單中的 H001 和 H009。"
  },
  {
    format: "algebra",
    points: 16,
    ordered: false,
    expression: `A ← π_{hotel_id}(σ_{stars ≥ 4}(Hotel))
B ← π_{hotel_id}(Booking ⋈ Room)
C ← A − B
RESULT ← π_{hotel_id, name}(C ⋈ Hotel)`,
    cols: ["hotel_id", "name"],
    rows: [["H015", "Silver Cloud Resort"]],
    note: "A 是至少四星的飯店，B 是有任何訂房紀錄的飯店。差集留下至少四星且沒有訂房紀錄的 H015。再接回 Hotel 得到飯店名稱。"
  }
];
