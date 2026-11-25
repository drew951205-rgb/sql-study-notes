const mixedExam = {
  tables: {
    Member: {
      cols: ["member_id", "member_name", "role"],
      rows: [
        ["M01", "Yuna", "Student"],
        ["M02", "Bo", "Staff"],
        ["M03", "Lin", "Student"],
        ["M04", "Ivy", "Student"],
        ["M05", "Noah", "Staff"],
        ["M06", "Kai", "Student"],
        ["M07", "Mia", "Student"],
        ["M08", "Evan", "Staff"]
      ]
    },
    Site: {
      cols: ["site_id", "site_name", "city", "stars"],
      rows: [
        ["S01", "North", "Taipei", 4],
        ["S02", "River", "Taipei", 5],
        ["S03", "Hill", "Taichung", 5],
        ["S04", "Coast", "Tainan", 3]
      ]
    },
    Gear: {
      cols: ["gear_id", "site_id", "kind", "rate"],
      rows: [
        ["G01", "S01", "Camera", 300],
        ["G02", "S01", "Camera", 550],
        ["G03", "S01", "Audio", 320],
        ["G04", "S02", "Camera", 600],
        ["G05", "S02", "Light", 450],
        ["G06", "S02", "Audio", 350],
        ["G07", "S03", "Camera", 500],
        ["G08", "S03", "Light", 550],
        ["G09", "S04", "Audio", 200],
        ["G10", "S04", "Light", 250]
      ]
    },
    Rental: {
      cols: ["rental_id", "member_id", "gear_id", "status"],
      rows: [
        ["R01", "M01", "G02", "Done"],
        ["R02", "M01", "G03", "Done"],
        ["R03", "M01", "G01", "Done"],
        ["R04", "M02", "G04", "Done"],
        ["R05", "M02", "G05", "Booked"],
        ["R06", "M03", "G06", "Done"],
        ["R07", "M03", "G08", "Done"],
        ["R08", "M04", "G07", "Done"],
        ["R09", "M04", "G04", "Cancelled"],
        ["R10", "M05", "G02", "Done"],
        ["R11", "M05", "G03", "Done"],
        ["R12", "M05", "G01", "Cancelled"],
        ["R13", "M06", "G09", "Done"],
        ["R14", "M06", "G10", "Done"],
        ["R15", "M02", "G06", "Done"]
      ]
    },
    Mentor: {
      cols: ["mentor_id", "mentee_id"],
      rows: [
        ["M01", "M02"],
        ["M01", "M03"],
        ["M02", "M04"],
        ["M03", "M05"],
        ["M03", "M07"],
        ["M05", "M08"]
      ]
    }
  },
  questions: [
    {
      format: "sql",
      points: 12,
      ordered: true,
      expression: `SELECT r.rental_id, m.member_name, g.gear_id, g.rate
FROM Rental AS r
JOIN Member AS m ON r.member_id = m.member_id
JOIN Gear AS g ON r.gear_id = g.gear_id
JOIN Site AS s ON g.site_id = s.site_id
WHERE s.city = 'Taipei'
  AND r.status = 'Done'
  AND g.rate >= 350
ORDER BY g.rate DESC, r.rental_id ASC;`,
      cols: ["rental_id", "member_name", "gear_id", "rate"],
      rows: [
        ["R04", "Bo", "G04", 600],
        ["R01", "Yuna", "G02", 550],
        ["R10", "Noah", "G02", 550],
        ["R06", "Lin", "G06", 350],
        ["R15", "Bo", "G06", 350]
      ],
      note: "接上 Member、Gear 和 Site 後，保留台北、狀態為 Done 且費率至少 350 的租借。R06 和 R15 的費率剛好是 350，也要保留。同費率時按 rental_id 升冪排列。"
    },
    {
      format: "sql",
      points: 12,
      ordered: true,
      expression: `SELECT g.kind, g.gear_id, m.member_name, g.rate
FROM Gear AS g
JOIN Rental AS r ON g.gear_id = r.gear_id
JOIN Member AS m ON r.member_id = m.member_id
WHERE g.rate = (
    SELECT MAX(g2.rate)
    FROM Gear AS g2
    WHERE g2.kind = g.kind
)
  AND r.status = 'Done'
  AND m.role = 'Student'
ORDER BY g.rate ASC, r.rental_id ASC;`,
      cols: ["kind", "gear_id", "member_name", "rate"],
      rows: [["Audio", "G06", "Lin", 350], ["Light", "G08", "Lin", 550]],
      note: "先從 Gear 算出同類器材的最高費率。Camera 的最高價是 G04，但它唯一完成的租借由 Staff 借用。Audio 的 G06 和 Light 的 G08 都有 Student 完成的租借。G06 另有一筆 Staff 紀錄，該筆會被篩掉。"
    },
    {
      format: "sql",
      points: 10,
      ordered: false,
      expression: `SELECT s.site_id, s.site_name
FROM Site AS s
WHERE NOT EXISTS (
    SELECT 1
    FROM Gear AS g
    JOIN Rental AS r ON g.gear_id = r.gear_id
    WHERE g.site_id = s.site_id
      AND r.status = 'Cancelled'
);`,
      cols: ["site_id", "site_name"],
      rows: [["S03", "Hill"], ["S04", "Coast"]],
      note: "R12 的器材屬於 S01，R09 的器材屬於 S02。這兩個站點各有一筆取消紀錄。NOT EXISTS 會留下找不到取消紀錄的 S03 和 S04。"
    },
    {
      format: "sql",
      points: 16,
      ordered: true,
      expression: `WITH RECURSIVE Team(member_id, depth) AS (
    SELECT mentee_id, 1
    FROM Mentor
    WHERE mentor_id = 'M01'
    UNION ALL
    SELECT f.mentee_id, t.depth + 1
    FROM Mentor AS f
    JOIN Team AS t ON f.mentor_id = t.member_id
)
SELECT t.member_id, m.member_name, t.depth,
       COUNT(r.rental_id) AS done_count
FROM Team AS t
JOIN Member AS m ON t.member_id = m.member_id
LEFT JOIN Rental AS r
    ON t.member_id = r.member_id AND r.status = 'Done'
GROUP BY t.member_id, m.member_name, t.depth
ORDER BY t.depth ASC, t.member_id ASC;`,
      cols: ["member_id", "member_name", "depth", "done_count"],
      rows: [
        ["M02", "Bo", 1, 2],
        ["M03", "Lin", 1, 2],
        ["M04", "Ivy", 2, 1],
        ["M05", "Noah", 2, 2],
        ["M07", "Mia", 2, 0],
        ["M08", "Evan", 3, 0]
      ],
      note: "從 M01 找出第 1 層 M02、M03，再找出第 2 層 M04、M05、M07 和第 3 層 M08。LEFT JOIN 的 ON 條件只接上 Done 紀錄。M07 和 M08 仍會出現在結果中，COUNT(r.rental_id) 是 0。"
    },
    {
      format: "algebra",
      points: 12,
      ordered: false,
      expression: `A ← σ_{city = 'Taipei'}(Site)
B ← π_{gear_id, kind, rate}(A ⋈ σ_{rate ≥ 450}(Gear))
C ← σ_{status ≠ 'Done'}(Rental) ⋈ B
RESULT ← π_{rental_id, member_name, kind, status}(C ⋈ Member)`,
      cols: ["rental_id", "member_name", "kind", "status"],
      rows: [["R05", "Bo", "Light", "Booked"], ["R09", "Ivy", "Camera", "Cancelled"]],
      note: "台北且費率至少 450 的器材是 G02、G04、G05。接上狀態不等於 Done 的 Rental，只剩 G05 的 R05 和 G04 的 R09。最後依 member_id 接上會員姓名。"
    },
    {
      format: "algebra",
      points: 12,
      ordered: false,
      expression: `A ← π_{gear_id}(σ_{site_id = 'S01'}(Gear))
B ← π_{member_id, gear_id}(σ_{status = 'Done'}(Rental))
C ← B ÷ A
RESULT ← π_{member_id, member_name}(C ⋈ Member)`,
      cols: ["member_id", "member_name"],
      rows: [["M01", "Yuna"]],
      note: "S01 有 G01、G02、G03。除法要求三件器材都有 Done 紀錄。M01 的 R01～R03 涵蓋全部。M05 的 G01 紀錄是 Cancelled，少了這一件。"
    },
    {
      format: "algebra",
      points: 10,
      ordered: false,
      expression: `T ← σ_{status = 'Done'}(Rental) ⋈ Gear ⋈ Site
A ← π_{member_id}(σ_{kind = 'Audio' ∧ city = 'Taipei'}(T))
B ← π_{member_id}(σ_{kind = 'Light' ∧ city = 'Taichung'}(T))
RESULT ← π_{member_id, member_name}((A ∪ B) ⋈ Member)`,
      cols: ["member_id", "member_name"],
      rows: [["M01", "Yuna"], ["M02", "Bo"], ["M03", "Lin"], ["M05", "Noah"]],
      note: "A 有 M01、M02、M03、M05，B 有 M03。聯集後 M03 只列一次，再接上 Member 補出四名會員的姓名。"
    },
    {
      format: "algebra",
      points: 16,
      ordered: false,
      expression: `A ← π_{member_id}(σ_{role = 'Student'}(Member))
B ← π_{gear_id}(Gear ⋈ σ_{stars = 5}(Site))
C ← π_{member_id}(σ_{status = 'Done'}(Rental) ⋈ B)
RESULT ← π_{member_id, member_name}((A − C) ⋈ Member)`,
      cols: ["member_id", "member_name"],
      rows: [["M01", "Yuna"], ["M06", "Kai"], ["M07", "Mia"]],
      note: "A 是 M01、M03、M04、M06、M07。五星站點是 S02 和 S03，曾在這兩個站點完成租借的會員是 M02、M03、M04。從 A 扣掉 C 後剩 M01、M06、M07。"
    }
  ]
};
