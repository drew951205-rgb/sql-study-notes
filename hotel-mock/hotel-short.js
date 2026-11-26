const hotelShortQuestions = [
  {
    "format": "sql",
    "points": 25,
    "ordered": true,
    "cols": [
      "hotel_id",
      "name",
      "booking_count"
    ],
    "expression": "SELECT h.hotel_id, h.name, COUNT(b.book_id) AS booking_count\nFROM Hotel AS h\nJOIN Room AS r ON h.hotel_id = r.hotel_id\nLEFT JOIN Booking AS b ON r.room_id = b.room_id\nWHERE h.city = 'Taipei'\nGROUP BY h.hotel_id, h.name\nHAVING COUNT(b.book_id) <= 1\nORDER BY booking_count ASC, h.hotel_id ASC;",
    "note": "以飯店分組，COUNT(b.book_id) 只計入有訂房編號的列。H015 沒有訂房，所以計數是 0。H006 有 B007，計數是 1。HAVING 保留這兩家，最後按訂房數由小到大排序。",
    "rows": [
      [
        "H015",
        "Silver Cloud Resort",
        0
      ],
      [
        "H006",
        "Ocean Pearl Resort",
        1
      ]
    ]
  },
  {
    "format": "sql",
    "points": 25,
    "ordered": true,
    "cols": [
      "book_id",
      "hotel_id",
      "room_id",
      "price"
    ],
    "expression": "SELECT b.book_id, r.hotel_id, r.room_id, r.price\nFROM Booking AS b\nJOIN Room AS r ON b.room_id = r.room_id\nWHERE r.type = 'Suite'\n  AND r.price < (\n    SELECT AVG(r2.price)\n    FROM Room AS r2\n    WHERE r2.hotel_id = r.hotel_id\n  )\nORDER BY b.book_id ASC;",
    "note": "子查詢用同一家飯店的全部房間計算平均價。外層逐筆檢查是否訂了 Suite，且該房價嚴格低於平均。例如 H011 的平均價約為 197.33，B016 訂的套房是 184，所以保留。",
    "rows": [
      [
        "B013",
        "H001",
        "R0101",
        97
      ],
      [
        "B014",
        "H003",
        "R0303",
        129
      ],
      [
        "B016",
        "H011",
        "R1103",
        184
      ],
      [
        "B020",
        "H007",
        "R0703",
        130
      ]
    ]
  },
  {
    "format": "algebra",
    "points": 25,
    "ordered": false,
    "cols": [
      "hotel_id",
      "name"
    ],
    "expression": "T ← Booking ⋈ Room\nA ← π_{hotel_id}(σ_{type = 'Single'}(T))\nB ← π_{hotel_id}(σ_{type = 'Suite'}(T))\nRESULT ← π_{hotel_id, name}((A ∩ B) ⋈ Hotel)",
    "note": "A 和 B 都只留下飯店編號。H003 的 R0302 有單人房訂房，R0303 有套房訂房，因此在兩份名單都出現。交集後接回 Hotel 查名稱。",
    "rows": [
      [
        "H003",
        "Blue Horizon Inn"
      ]
    ]
  },
  {
    "format": "algebra",
    "points": 25,
    "ordered": false,
    "cols": [
      "city"
    ],
    "expression": "A ← π_{type}(σ_{hotel_id = 'H012'}(Room))\nB ← π_{city, type}(Hotel ⋈ Room)\nRESULT ← B ÷ A",
    "note": "A 列出 H012 的三種房型。B 把所有飯店的房型按城市整理。B ÷ A 保留三種房型都找得到的城市，同一城市的房型可以分布在不同飯店。",
    "rows": [
      [
        "Taipei"
      ],
      [
        "Kaohsiung"
      ],
      [
        "Tainan"
      ]
    ]
  }
];
