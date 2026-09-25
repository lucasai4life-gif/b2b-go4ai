# 2 đề xuất + 1 bản kết trang chủ GO4AI — Đào tạo AI cho doanh nghiệp

Prototype nội bộ, **chưa publish**. Mở `index.html` để so sánh hai đề xuất, hoặc mở thẳng
`ban-ket.html` để xem bản dựng cuối ghép từ cả hai.

| File | Nội dung |
|---|---|
| `index.html` | Trang so sánh: chọn phương án (A · B · bản kết), bảng khác biệt, bảng ánh xạ nội dung, nguồn thiết kế |
| `de-xuat-a.html` | **Đề xuất A — “Chứng minh năng lực”**, bố cục theo `b2b.go4ai.org` |
| `de-xuat-b.html` | **Đề xuất B — “Lộ trình vận hành”**, bố cục theo `b2b.go4ai.org/how-it-works` |
| `ban-ket.html` | **Bản kết A + B** — bản dựng cuối, ghép theo từng section (xem §2) |
| `assets/css/go4ai.css` | Hệ thống thiết kế port từ theme LucasGo4ai đang chạy |
| `assets/js/proposal.js` | Không phụ thuộc thư viện: reveal, FAQ, stepper, marquee, counter |
| `assets/js/motion-impact.js` | Chuyển động khối “Bằng chứng”, port từ section “Tác động” của b2b (**§7**) |
| `assets/vendor/` | GSAP 3.15.0 + ScrollTrigger 3.15.0, copy nguyên văn từ theme |
| `_qa/` | Harness kiểm chứng (headless Chrome + DOM probe + **harness CDP**), script kiểm cấu trúc, ảnh render |

> **§7 là phần chuyển động.** Khối “Bằng chứng” của `ban-ket.html` có một hiệu ứng cuộn ghim học từ
> section “Tác động” của `b2b.go4ai.org`. Hiệu ứng nằm sau một gate nên **A, B, mobile, bản in, no-JS
> và `prefers-reduced-motion` đều giữ nguyên bố cục tĩnh**. Nếu chỉ đọc một mục trong tài liệu này,
> đọc §7.6 — nó ghi lại hai cái bẫy đo lường đã suýt cho kết luận sai.

---

## 1. Hai đề xuất khác nhau ở đâu

Cùng một bộ nội dung, cùng hệ thống thiết kế. Khác ở **thứ tự** và ở **thiết bị bố cục được đặt làm trung tâm**.

| | Đề xuất A | Đề xuất B |
|---|---|---|
| Mẫu bố cục | Trang chủ b2b.go4ai.org | b2b.go4ai.org/how-it-works |
| Hero | Hai cột, canvas minh hoạ + 3 số liệu nổi | Lưới 1.2 / 1, sơ đồ làn vai trò |
| Khối vấn đề | So sánh **Trước / Sau**, marker tròn ✕ và ✓ | Bốn **guide-block** hai cột |
| Điểm nhấn giữa trang | Lưới **bento 6 ô** | **Stepper dính** 7 bước, nền xanh toàn dải |
| Số liệu | 4 vòng tròn + vòng accent giữa | Dải 4 cột có đường kẻ |
| Chương trình | Ba thẻ 3 cột | Ba guide-block hai cột |
| “Sau đào tạo” | Khối tối, 6 thẻ | Hai cột **Câu hỏi cũ / Câu hỏi mới** + 6 thẻ sáng |
| Case | Media trái | Media phải |

---

## 2. Bản kết A + B — `ban-ket.html`

Bản dựng cuối lấy **thứ tự khối của B** làm xương, rồi thay từng khối bằng bản của A hoặc B.

| # | Khối | Lấy từ | Ghi chú |
|---|---|---|---|
| 1 | Hero | **A** | hai cột, canvas vòng năng lực, 3 số liệu nổi |
| 2 | Định vị — “Sau khi học AI…” | **B** | khối căn giữa |
| 3 | Vấn đề doanh nghiệp | **B** | bốn guide-block hai cột |
| 4 | Cách học — 7 bước | **B** | stepper dính, nền `--green-700` |
| 5 | Đầu ra phải nhìn thấy được | **A** | lưới bento 6 ô |
| 6 | Bằng chứng — 1.000+ / 20 / 10 / ~70% | **A** | bốn vòng tròn + vòng accent |
| 7 | GO4AI đào tạo như thế nào | **B** | ba guide-block |
| 8 | Case thực tế | **A** | media trái — **nền đổi gray → white** (§2.3) |
| 9 | Sau đào tạo | **A** | khối tối, 6 thẻ + chuỗi 6 bước |
| 10 | Logo wall | **A** | marquee hai chiều |
| 11 | FAQ | **A** | 6 câu, accordion |
| 12 | Lucas + CTA cuối | **A** | — |

Header, notice và footer lấy theo **B** (menu “Vấn đề · Cách học · Nhận được gì · Case thực tế ·
Lucas Đặng”, cột footer “Lộ trình”) vì thứ tự đó khớp với thứ tự khối của bản kết. Khối
“tuyên bố” của A (khối 3 trong A) không được đưa vào — câu chốt của nó đã nằm nguyên trong khối
định vị của B.

### 2.1 Hai câu “Không chỉ học cách dùng ChatGPT…” giờ chỉ còn một chỗ

Trong A, hai câu này là `.hero__points` của hero. Trong B, **đúng hai câu đó** là thân của khối
định vị. Bản kết giữ hero của A nhưng **gỡ `.hero__points`** để đoạn văn chỉ xuất hiện một lần —
ở khối 2, nơi nó là luận điểm của cả khối. Không chữ nào bị mất: câu chữ nằm nguyên ở khối 2.
Muốn trả lại danh sách hai dòng trong hero thì phải bỏ đoạn tương ứng ở khối 2 — không thể giữ cả hai.

### 2.2 Câu hỏi trung tâm xuất hiện hai lần — **cần Lucas chốt**

“Sau khi học AI, người học làm được gì tốt hơn trước?” là h2 của khối 2 (theo B) **và** là chữ
trong vòng accent giữa bốn vòng số liệu của khối 6 (theo A). Cả hai khối đều được yêu cầu lấy
nguyên, nên câu này lặp nguyên văn, cách nhau bốn khối. Hai cách xử lý, đều cần người quyết:

1. **Giữ làm điệp khúc** — khối 2 nêu câu hỏi, khối 6 trả lời bằng số liệu. Không sửa gì.
2. **Đổi chữ trong vòng accent** — nhưng mọi phương án thay thế đều là chữ mới, không có trong brief.

Bản kết đang để nguyên (phương án 1), vì tự đặt câu chữ mới là việc của người duyệt, không phải
của bản dựng.

### 2.3 Nền khối Case đổi từ `--gray` sang `--white`

Trong A, khối Chương trình và khối Case đều là `section--gray`, nhưng cách nhau bởi khối Cách học
(`section--white`). Ở bản kết, Cách học chuyển lên vị trí 4, nên Chương trình (B, gray) và Case
(A, gray) nằm liền nhau và dính thành một dải. Case đổi sang nền trắng. Đo lại thì `.case__media`
vẫn tách khỏi nền nhờ viền `--gray-100` và lớp gradient xanh — xem `_qa/evidence/c-case.png`.

Nhịp nền đo được của bản kết, không có cặp liền nhau nào trùng màu:

```
#f2f6f5 hero  |  #ffffff định vị  |  #f2f6f5 vấn đề  |  #06694f cách học
#f2f6f5 nhận được gì  |  #ffffff bằng chứng  |  #f2f6f5 chương trình  |  #ffffff case
#15171a sau đào tạo  |  #f2f6f5 logo  |  #ffffff FAQ  |  #f2f6f5 liên hệ
```

---

## 3. Nội dung 9 phần của brief đi vào đâu

Không bỏ phần nào. Một số đoạn văn dài được tách thành danh sách để đọc nhanh hơn.

| Phần | Nội dung | A | B |
|---|---|---|---|
| 1 | Hero | Hero hai cột | Hero lưới 1.2 / 1 |
| 2 | Bằng chứng (1.000+ / 20 / 10 / ~70%) | Vòng tròn số liệu (khối 5) | Dải số liệu 4 cột (khối 6) |
| 3 | Vấn đề doanh nghiệp | Trước / Sau (khối 2) + dải tuyên bố (khối 3) | Bốn guide-block (khối 3) |
| 4 | Ba nhóm chương trình | Ba thẻ 3 cột (khối 6) | Ba guide-block (khối 7) |
| 5 | Cách học — 7 bước | Timeline 7 bước (khối 7) | Stepper dính (khối 4) |
| 6 | Doanh nghiệp nhận được gì | Lưới bento 6 ô (khối 4) | Khối tối 6 thẻ (khối 5) |
| 7 | Case thực tế | Khối 8 | Khối 8 |
| 8 | Sau đào tạo | Khối tối (khối 10) | Khối 9 |
| 9 | Lucas + CTA cuối | Khối 12 | Khối 12 |

### Nội dung thêm vào để lấp bố cục — cần duyệt

1. **Bốn dòng ở cột “Khi GO4AI vào”** (đề xuất A, khối 2). Bố cục Trước / Sau cần 4 dòng mỗi cột, brief chỉ có 4 vấn đề. Bốn dòng này là **diễn giải lại các câu đã có trong brief** (mục 4 “Theo phòng ban”, mục 6 “Chỉ số”, mục 6 “AI Passport”, mục 1 “đầu ra có thể sử dụng”), không phải số liệu hay cam kết mới.
2. **Mô tả ngắn cho 7 bước của mục 5 và 6 bước của mục 8.** Brief chỉ có nhãn bước. Bản mô tả dùng chính ngôn ngữ của brief, nhưng chưa được duyệt.
3. **6 câu FAQ.** Soạn từ nội dung đã có trong brief (không thêm dữ kiện). Riêng câu về ~70% dùng đúng câu miễn trừ trong brief.
4. **Logo đối tác và media case là placeholder có nhãn.** Tên đối tác lấy từ dải logo của trang chủ b2b.go4ai.org.

---

## 4. Hệ thống thiết kế: port, không phỏng đoán

Nguồn: theme **LucasGo4ai** đang chạy — `go4ai.webflow.shared.72c645715.min.css` và `<style>` inline của trang đã publish.

| Nhóm | Giá trị dùng | Nguồn |
|---|---|---|
| Nền / chữ | `#f2f6f5` · `#15171a` | theme `:root`, `body` |
| Coral (nút) | `#ce3c2b` | `:root` |
| Green | `#08906c` · blue-700 `#2b4d60` | `:root` |
| Gradient chữ | `linear-gradient(265.26deg, #08906c 38.04%, #1f9c7b 94.86%)` | inline `<style>` (stop cuối đã đổi — xem §6) |
| Thang tiêu đề | xl 4.5 · l 3.625 · m 2.25 · s 1.75 · xs 1.375 rem | `:root` |
| Nút | bán kính 5rem, padding 16/40px | `.button` |
| Khung | 85rem, padding ngang 2.5rem | `.container`, `.padding_global` |
| Nhịp section | 100–120px | `.section.main-large` |
| Marker Trước/Sau | vòng 32px, viền 1px | `.benefit_marker` |
| Thẻ bento | bán kính 24px, accent `#c24b3e` / green / blue-700 | `.built-card` |
| Stepper dính | aside 24.375rem sticky, panel viền trái, marker 48px lệch 4.5rem | `.hiw-left_panel`, `.hiw-right_panel`, `.hiw-card_marker` |
| Marquee logo | mask 8% hai đầu, dịch −50%, dừng khi hover | inline `<style>` |

**Font.** Theme khai báo Switzer cho tiêu đề, nhưng hai file woff2 đang publish là subset latin-only, không có dấu tiếng Việt. Prototype dùng **Archivo** (đủ dấu tiếng Việt) cho cả tiêu đề và nội dung, **Azeret Mono** cho số và nhãn — đúng trạng thái cuối mà trang live đạt được qua fallback, nhưng tất định.

---

## 5. Kiểm chứng

Chạy bằng headless Chrome thật, đo bằng DOM probe. Harness ở `_qa/`:
`python _qa/run.py <phase>` với `phase` ∈ `nojs · behavior · contrast · overflow` (cần một static
server ở cổng 8765), `python _qa/check-structure.py` cho kiểm cấu trúc, và `_qa/shot.html` để chụp
một dải viewport thật. Cả bốn trang — kể cả `ban-ket.html` — đều nằm trong danh sách đo của probe.

### 5.1 Cấu trúc

```
index.html        unclosed 0 · mismatch 0 · id trùng 0 · anchor hỏng 0 · asset thiếu 0
de-xuat-a.html    unclosed 0 · mismatch 0 · id trùng 0 · anchor hỏng 0 · asset thiếu 0
de-xuat-b.html    unclosed 0 · mismatch 0 · id trùng 0 · anchor hỏng 0 · asset thiếu 0
ban-ket.html      unclosed 0 · mismatch 0 · id trùng 0 · anchor hỏng 0 · asset thiếu 0
```
CSS: `depth EOF = 0`, không có block mở mà không đóng (đếm sau khi strip comment).

### 5.2 Tràn ngang — `scrollWidth > clientWidth`

36 phép đo (4 trang × 320/390/430/600/768/900/1080/1280/1440px), **0 hàng lỗi, 0 tràn, 0 lỗi
content-fit**. Kết quả thô: `_qa/evidence/overflow-20260916.json`.

Thước đo đã được kiểm chứng lại bằng **canary** (`_qa/canary-wide.html` — một trang cố tình rộng
1400px, đo qua `_qa/probe-overflow-canary.html`): probe báo đúng
`over = 1080 @320px … 120 @1280px, 0 @1440px`, trùng khớp con số ghi ở phiên trước. Nghĩa là 36
hàng `docOver = 0` ở trên là số đo thật, không phải probe rỗng.

### 5.3 Tương phản WCAG

**0 lỗi** trên cả bốn trang. Tỉ lệ được tính trên **màu nền hiệu dụng thật**, kể cả gradient (đọc stop của gradient và lấy stop xấu nhất) và chữ cắt gradient.

### 5.4 Không có JS

Render lại với toàn bộ `<script>` bị gỡ khỏi HTML — **nội dung hiển thị đầy đủ**, không phần tử nào bị ẩn:

| Trang | `has-js` | Ký tự nội dung | Section | Phần tử bị ẩn |
|---|---|---|---|---|
| index | không | 6.707 | 5 | **0** |
| A | không | 11.705 | 12 | **0** |
| B | không | 12.194 | 12 | **0** |
| bản kết | không | 12.286 | 12 | **0** |

Ảnh render không-JS trùng khớp với ảnh có-JS theo từng dải 1000px.

### 5.5 Tương tác

| Kiểm | Kết quả |
|---|---|
| Marquee logo | track nhân bản đúng (10 = 5×2, 12 = 6×2) trên cả bốn trang |
| Stepper 7 bước | bản kết: 7 block / 7 progress / **1** block `is--active`, marker đảo sang nền trắng, số `#06694f` |
| Aside dính | giữ nguyên `top = 112px` khi panel cuộn qua block 2 → 4 |
| FAQ | mở 0 → 74px, `aria-expanded` true; đóng về 0 |
| Chuyển động khối Bằng chứng | 4 mốc keyframe + 2 biên, đo trong renderer thật có rAF — xem **§7.6** |
| Counter | về đúng `1.000+ / 20 / 10` |
| Reveal | 32/32 phần tử hiện |
| Nhịp nền | bản kết: 12 khối, **0 cặp liền nhau trùng màu** (`_qa/probe-sections.html`) |

### 5.6 Ảnh render của bản kết — `_qa/evidence/`

`c-hero.png` · `c-van-de.png` · `c-cach-hoc.png` · `c-nhan-duoc.png` · `c-bang-chung.png` ·
`c-chuong-trinh.png` · `c-case.png` · `c-mobile-390.png` · `c-mobile-cach-hoc.png`

Ảnh của trang so sánh sau khi thêm thẻ thứ ba: `index-pick-1440.png` · `index-pick-1024.png`.

Chụp bằng `_qa/shot.html` (cuộn tới đúng section rồi mới chụp). `--screenshot` trần của Chrome chỉ
chụp được đỉnh tài liệu, nên không dùng được cho các khối nằm sâu trong trang.

---

## 6. Lỗi tìm được và đã sửa

Ghi lại cả lỗi thật và lỗi của chính thước đo.

### 6.1 Lỗi thật

| # | Lỗi | Đo được | Sửa |
|---|---|---|---|
| 1 | **Vòng accent che nhãn số liệu** (A) | Nhãn “Người tham gia các chương tr…” bị vòng xanh che một nửa | Dựng lại thành lưới 3×3: số liệu ở 4 góc, accent ở ô giữa. Khoảng cách từ tâm tới tâm vòng góc là 47,1% so với tổng bán kính 33,3% → không thể chồng |
| 2 | **Stepper không bao giờ active** (B) | `is--active = 0` ở mọi vị trí cuộn | Bỏ IntersectionObserver, chuyển sang tính theo sự kiện scroll: block nào cắt đường giữa viewport thì active |
| 3 | **FAQ không đóng được** | Panel kẹt ở `height: 74px` sau khi bấm đóng | Bỏ toàn bộ tính toán chiều cao + `rAF` + `transitionend`, chuyển sang `grid-template-rows: 0fr → 1fr` bằng class |
| 4 | **Tràn ngang ở 320–390px** | `.lucas` giữ 358px trong viewport 320px → tràn 77px; nút `white-space: nowrap` cần 332px trong cột 305px | Thêm `min-width: 0` cho item grid/flex + `overflow-wrap`; dưới 480px cho nút xuống dòng |
| 5 | **Không màu chữ nào đạt AA trên nền `#08906c`** | Trắng trên `#08906c` chỉ đạt **4,03:1** (cần 4,5) | Nền section xanh đổi sang `#06694f` (trắng đạt **6,69:1** — con số 6,14 ghi ở đây trước đây là SAI, đã tính lại bằng công thức WCAG ở §7.6), giữ `#08906c` cho marker và viền |
| 6 | **Chữ cắt gradient không đạt ngưỡng chữ lớn** | Stop sáng `#34bf99` trên `#f2f6f5` chỉ đạt **2,14:1** (cần 3,0) | Đổi stop sáng sang `#1f9c7b` → 3,18:1 |
| 7 | **Chữ gradient trên nền tối** | 1,66:1 trên dải tuyên bố | Trên mọi nền tối, chữ gradient đổi thành trắng đặc |
| 8 | **Gradient thương hiệu tối chưa đủ** | `#08906c` ở đầu sáng → trắng chỉ 4,03:1 | Đổi `--grad-dark` thành `#03322a → #06694f` |
| 9 | **Nhiều nhãn nhỏ dưới ngưỡng** | gray-500 = 3,73–4,06:1 · gray-400 = 2,93:1 · green-500 = 3,70:1 · coral-500 = 4,48:1 | Thêm `--green-700 #06694f` và `--coral-600 #b8351f` cho mọi chỗ màu **mang chữ** ở cỡ body; đẩy gray-400/500 → gray-600. Màu gốc giữ cho fill, viền, marker |
| 10 | **Chữ mờ trong khối tối** | gray-600 trên `#15171a` = 3,06:1 | Thêm rule riêng cho `.dark-panel` |
| 11 | **Hai khối liền nhau cùng nền ở bản kết** | `_qa/probe-sections.html`: `#chuong-trinh` và `#case` cùng ra `#f2f6f5` → hai khối dính thành một dải, không còn ranh giới | Đổi khối Case của bản kết sang `section--white`. Đo lại: 12 khối, 0 cặp liền nhau trùng màu (§2.3) |
| 12 | **Một câu xuất hiện hai lần ở bản kết** | “Không chỉ học cách dùng ChatGPT, Claude hay một công cụ mới. Người học phải tạo được đầu ra…” có ở hero của A (`.hero__points`) và ở thân khối định vị của B — trùng nguyên văn, cách nhau một màn hình | Gỡ `.hero__points` khỏi hero của bản kết; câu chữ nằm nguyên ở khối định vị (§2.1) |

### 6.2 Lỗi của thước đo (suýt cho kết luận sai)

Đây là phần quan trọng nhất, vì mỗi lần đều **suýt báo “đạt”**.

1. **27/27 hàng là `SecurityError`, không phải số đo.** iframe `file://` bị chặn truy cập tài liệu; probe bắt exception rồi trả `{error}`, còn script tổng hợp đọc `docOver` mặc định `0` → in ra “0 tràn”. **Bài học: probe rỗng không phải bằng chứng vắng mặt.** Đã thêm kiểm tra `typeof docOver === 'number'` và đếm hàng lỗi.
2. **Probe đo nhầm trang 404.** `src="index.html"` từ `/_qa/` phân giải thành `/_qa/index.html`. `scrollHeight` = 900 tố cáo điều này. Đã đổi sang đường dẫn tuyệt đối từ gốc **và** thêm guard: tài liệu nạp vào phải có `.site-header`, nếu không thì báo lỗi.
3. **`--disable-javascript` không có tác dụng** trong Chrome headless=new bản này — `<html>` vẫn có `class="has-js"` và 33 phần tử `is--in`. Ảnh “no-JS” đầu tiên thực chất là ảnh có JS (trùng MD5). Đã kiểm lại bằng cách gỡ `<script>` khỏi HTML.
4. **Chữ cắt gradient bị tính là nền.** `getComputedStyle().backgroundColor` của span gradient là trong suốt, còn `background-image` là **màu chữ**, không phải mặt nền. Probe cũ lấy chính gradient đó làm nền → báo 1,74:1 sai. Đã bỏ qua `background-image` khi `background-clip: text`.
5. **Nền gradient bị bỏ qua.** Section tối dùng `background: linear-gradient(...)`, `background-color` trong suốt → probe đi ngược lên `body` và lấy `#f2f6f5`, báo “chữ trắng trên nền sáng”. Đã parse stop của gradient và lấy stop sáng nhất làm trường hợp xấu nhất.
6. **Headless không giao sự kiện vòng đời render.** IntersectionObserver (kể cả observer tạo mới trong probe) trả **0 callback**; `scroll` và `requestAnimationFrame` cũng không chạy trong chế độ `--dump-dom`. Đây là lý do stepper “trông như hỏng”. Đã xử lý bằng cách: (a) chuyển stepper sang scroll-driven để không phụ thuộc IO, (b) trong probe, dispatch sự kiện `scroll` thủ công để kiểm logic xử lý — còn việc trình duyệt tự phát sự kiện khi người dùng cuộn là bảo đảm của nền tảng, không phải code của mình.
7. **`rootMargin` của observer tạo trong trang cha không đo được** phần tử trong iframe. Mọi kết luận về stepper phải lấy từ observer **trong chính tài liệu đó**, hoặc từ phép đo hình học trực tiếp.

---

## 7. Chuyển động khối “Bằng chứng” — port từ section “Tác động” của b2b.go4ai.org

Yêu cầu: học chuyển động của section “Tác động” trên `b2b.go4ai.org` và áp vào khối
“Bằng chứng / Được xây từ thực tế triển khai, / không chỉ từ phòng học.” của `ban-ket.html`.

### 7.1 Chuyển động đó là gì — đọc từ bundle, không nhìn bằng mắt

Trang b2b đã mirror **không** nhúng `.wf-ix` nào, nên chuyển động không nằm trong markup. Nó là
**Webflow IX2 (Interactions 2.0)** và spec nằm trong bundle runtime. Đã đếm `actionLists` /
`keyframes` / `actionListId` trên cả 5 chunk Webflow: chỉ
`webflow.schunk.f47de7179923cc70.js` có chúng (`actionLists` ở offset 159433).

```
Action list  : "a-17"  title "Impact Circles"
Event        : "e-42" / "e-58"  SCROLLING_IN_VIEW + GENERAL_CONTINUOUS_ACTION
Continuous   : group "a-17-p", SCROLL_PROGRESS, smoothing 80
               startsEntering true · +offset 30   |   startsExiting false · +offset 30

kf 30  .impact-item.is--01..04  TRANSFORM_MOVE  → (0, 0)
kf 40  .impact-content          STYLE_OPACITY  → 1
kf 60  .impact-item.is--01 →(50,50)  .is--02 →(-50,50)  .is--03 →(50,-50)  .is--04 →(-50,-50)
       .impact-content          STYLE_OPACITY  → 0
kf 70  .impact-item-accent      TRANSFORM_SCALE → 0
kf 80  .impact-item-accent      TRANSFORM_SCALE → 1
```

Đọc hình học: b2b xếp 4 vòng tròn thành **lưới 2×2** (`.impact-item{width:50%}`), nên “±50%” là dịch
đúng **một ô**. Đĩa accent của b2b nằm ở giữa và bị ẩn lúc nghỉ (CSS `transform: scale(0)`), nên kết
cục là: bốn vòng tròn trôi vào giữa → nhãn mờ đi → đĩa accent lớn lên đúng chỗ chúng vừa để lại.

Cách dịch sang GSAP: `smoothing 80 → scrub: 0.8` · `kf 0..100 → timeline time 0..1` (pad bằng một
tween rỗng ở vị trí 1 để kf ánh xạ 1:1 sang tiến độ cuộn). Spec gốc được chép nguyên văn vào đầu
`assets/js/motion-impact.js` để phiên sau không phải trích lại từ bundle.

### 7.2 Vì sao giai đoạn ghim dùng lưới 2×2 chứ không phải 3×3 của bản tĩnh

Bản tĩnh dùng lưới 3×3 (§6.1 mục 1) vì ở đó đĩa accent **hiện lúc nghỉ** và sẽ che nhãn nếu chồng.
Nhưng 3×3 không dùng được cho khối ghim, và đây là **số học, không phải thẩm mỹ**:

| | 3×3 | 2×2 |
|---|---|---|
| Quan hệ kích thước | `listW = 3 × đường kính` | `listW = 2 × đường kính` |
| Để có vòng tròn 299px (cỡ bản tĩnh) | `listW = 897` ⇒ **cao 897px** | `listW = 600` ⇒ **cao 600px** |
| Trong 100svh 900px, trừ header 75px và khối tiêu đề 168px | không còn chỗ (897 + 168 + 40 > 900) | vừa (600 + 168 + 40 = 808 ≤ 825) |

Ép 3×3 vào 100svh thì vòng tròn co còn 188px và **chữ bị cắt** bởi `overflow:hidden` +
`border-radius:50%` — đã chụp được: “chương trìn…”, “hoặc” → “oặc”, chú thích của ô ~70% mất gần hết.
Lưới 2×2 cũng chính là hình học thật của b2b, nên phép dịch dùng lại **đúng con số của b2b (±50%)**
thay vì ±100% tự suy ra. Đo được ở 1440×900: `itemW = 277` (bản tĩnh 299), dịch ở kf60 = **±138 =
đúng 50% của 277**.

Lưới 2×2 và mọi style khác của chuyển động đều nằm dưới gate `html.motion-impact`, nên bản tĩnh
(A, B, mobile, in, no-JS, `prefers-reduced-motion`) **không đổi một pixel**.

### 7.3 Gate và lưới an toàn — để chuyển động không bao giờ làm mất nội dung

Trạng thái “from” của GSAP (`transform: scale(0)` cho đĩa accent) phải có mặt **ngay lần vẽ đầu**,
nếu không sẽ nháy hình. Nhưng nếu để nó vô điều kiện thì khi GSAP không nạp được, đĩa accent — thứ
mang câu hỏi trung tâm — sẽ **ẩn vĩnh viễn**. Cách xử lý:

1. `<head>` thêm class `motion-impact` **chỉ khi** `matchMedia` khớp điều kiện của gate.
2. Toàn bộ CSS chuyển động được scope dưới `html.motion-impact`.
3. `<head>` đặt một lưới an toàn 2,5s: **chỉ giữ** gate khi `window.__go4aiImpact.mode === 'gsap'`
   **và** đã có `timeline` thật. Mọi trường hợp khác — file thiếu, mạng chặn, hook không khớp, GSAP
   init lỗi — đều gỡ gate và trả section về bố cục tĩnh.
4. `assets/js/motion-impact.js` dùng `gsap.matchMedia()` với **cùng** điều kiện, nên khi viewport
   đổi qua lại ngưỡng thì gate bật/tắt nhất quán.

Điều kiện gate: `(min-width: 992px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)`.
Đo ở biên: **992×768 → gate BẬT** (`trackH = 1920 = 250vh`, kf60 = ±105 = 50% của 211) ·
**991×800 → gate TẮT** (`trackH = 804`, `position: static`, `ScrollTrigger.getAll().length = 0`).

### 7.4 Một chủ sở hữu cho mỗi thuộc tính

| Thuộc tính | Chủ sở hữu | Ghi chú |
|---|---|---|
| `transform` của `.impact-item` | GSAP | không rule CSS nào ghi `transform` cho `.impact-item` |
| `transform` của `.impact-accent` | GSAP | rule reveal theo class bị scope thành `.has-js:not(.motion-impact)` |
| `opacity` của `.impact-item__content`, `p` trong đĩa | GSAP | |
| class `.is--scrubbing` | **chỉ** `onUpdate` | `onLeave`/`onLeaveBack` đã bị **gỡ**: chúng cũng ghi class đó và đo được là gỡ nó ngay tại tiến độ 1, mâu thuẫn với chính điều kiện `progress > 0.29` |
| `--header-h` | JS đo rồi ghi | CSS chỉ để giá trị mặc định cho lần vẽ đầu |

Đĩa accent **không** dùng `position:absolute` + `translate(-50%,-50%)` để canh giữa, vì GSAP sở hữu
`transform` của nó và hai chủ sở hữu trên một thuộc tính là lỗi đã biết. Thay vào đó nó là grid item
phủ cả lưới (`grid-area: 1/1/3/3`) + `place-self: center`, nên GSAP chỉ phải ghi `scale()`.
Kích thước `width: 64%` = đúng tỉ lệ của b2b (đĩa 28,125rem trên khung 43,75rem) và luôn lớn hơn cụm
bốn vòng tròn đã tụ vào giữa (mỗi vòng = 50% khung).

### 7.5 Đổi so với b2b — có chủ ý, ghi rõ để không ai tưởng là port thiếu

| # | b2b | Ở đây | Vì sao |
|---|---|---|---|
| 1 | đĩa accent + `.impact-bg` dùng `--green-500 #08906c` | `--green-700 #06694f` | trắng trên `#08906c` chỉ đạt **4,03:1**, dưới ngưỡng AA 4,5:1 cho chữ cỡ body; trên `#06694f` đạt **6,69:1** |
| 2 | nhãn hover dùng `--green-200 #93dcc8` | `--green-100 #c4ece1` | `#93dcc8` trên `#06694f` chỉ đạt **4,24:1**, thiếu 4,5:1; `#c4ece1` đạt **5,23:1** |
| 3 | không có gate | có gate + lưới an toàn | b2b không có bản tĩnh để bảo vệ; `ban-ket.html` phải giữ nguyên bố cục A ở mọi trường hợp còn lại |

### 7.6 Kiểm chứng — và vì sao phải dựng harness CDP mới đo được

**Hai cái bẫy đã đo được, không phải suy đoán:**

1. `--dump-dom` + `--virtual-time-budget` **không chạy `requestAnimationFrame`**: đo được **0 frame
   trong 500ms**. GSAP scrub chạy bằng `gsap.ticker` = rAF ⇒ mọi số đọc “sau khi cuộn” theo đường
   này đều là ảnh đóng băng (§6.2 mục 6 đã ghi, lần này đo lại và xác nhận).
2. **Headless Chrome 152 mặc định trả `prefers-reduced-motion: reduce`**: đo được
   `reduce = true`, `no-preference = false`. Nghĩa là gate **không bật** — đúng như thiết kế, nhưng
   `--dump-dom` không đo được gì. Lần chạy đầu tiên qua `--dump-dom` cho `mode: "gsap"` nhưng
   `build: null`, `hasGate: false`, `ScrollTrigger count: 0` — nếu chỉ đọc exit code thì đã kết luận
   sai là “port hỏng”, trong khi thực tế là “thước đo không với tới”.

Vì vậy đã dựng `_qa/cdp-motion.mjs` — Chrome ở chế độ `--remote-debugging-port` (không `--dump-dom`,
không virtual time) nên **có vòng lặp frame thật**, rồi dùng CDP để
`Emulation.setDeviceMetricsOverride` + `Emulation.setEmulatedMedia`. Dùng `WebSocket` có sẵn trong
Node 22, không cần thư viện ngoài.

**Số đo ở 1440×900, `prefers-reduced-motion: no-preference`** (`_qa/evidence/motion-raw.txt`):

| Chỉ số | Đo được | Kết luận |
|---|---|---|
| `mode` / `build` / gate | `gsap` / `built` / `true` | timeline dựng thật |
| `ScrollTrigger.getAll().length` | `1` | đúng một trục, không rò rỉ |
| `trackH` / `pinH` | `2250` / `900` | = 250vh / 100svh |
| `trigger.start` → `end` | `6199` → `7549` | quãng ghim = **1350px = 150vh**, đúng spec |
| `pinTop` tại 6 mốc | **`0` ở tất cả** | khung ghim **đứng yên** suốt quãng cuộn |
| `contentH` ≤ `pinH` | `761 ≤ 900` (dư 139) | nội dung không bị `overflow:hidden` cắt |
| `headClearsHeader` | `31–33` | tiêu đề **không** bị thanh header che |
| `accentZ` / `bgZ` | `1` / `0` | đĩa accent sơn **trên** `.impact-bg` |
| `rafFrames` | `302` | vòng lặp frame thật, số đọc là thật |

Ánh xạ keyframe → tiến độ, đo bằng cuộn thật rồi để scrub đuổi kịp:

| mốc | tiến độ | dịch `(tx,ty)` | `labelOp` | `accentScale` |
|---|---|---|---|---|
| kf30 | 0,30 | `0,0` ×4 | `1,1,1,1` | `0` |
| kf40 | 0,40 | `±46` | `1,1,1,1` | `0` |
| kf60 | 0,60 | **`±138`** = 50% của 277 | `0,0,0,0` | `0` |
| kf70 | 0,70 | `±138` | `0,0,0,0` | `0` |
| kf80 | 0,80 | `±138` | `0,0,0,0` | **`1`** |
| end | 1,00 | `±138` | `0,0,0,0` | `1` · `accentTextOp = 1` |

`46` = `138/3` → đúng vị trí tuyến tính 1/3 giữa kf30 và kf60. `accentTextOp` chỉ lên `1` ở cuối,
đúng như b2b (chữ hiện khi đĩa đã đủ lớn).

**Canary — chứng minh thước đo còn “răng”** (§2c của skill `static-site-visual-qa`):

| | đo được |
|---|---|
| Trang cố tình rộng 1400px | `1080 @320 · 1010 @390 · 970 @430 · 800 @600 · 632 @768 · 500 @900 · 320 @1080 · 120 @1280 · 0 @1440` |
| 4 trang thật × 9 bề rộng | 36 hàng, **0 hàng tràn** (`_qa/evidence/overflow-20260916.json`) |

Bảng toàn số 0 chỉ đáng tin **sau khi** canary báo động đúng chỗ.

**Các đường render khác — đo để chứng minh gate không rò rỉ:**

| Trường hợp | gate | `trackH` | `position` | đĩa accent | lưới |
|---|---|---|---|---|---|
| ban-ket 1440×900 no-pref | **bật** | 2250 | sticky | GSAP | 2×2 |
| ban-ket 1440×900 reduce | tắt | 1104 | static | `scale(1)`, `.is--in` | 3×3, `itemW 299` |
| ban-ket 991×800 no-pref | tắt | 804 | static | `scale(1)` | 3×3, `itemW 213` |
| ban-ket 390×844 | tắt | 1910 | static | `scale(1)` | cột dọc |
| de-xuat-a 1440×900 | tắt | — (`hasTrack: false`) | — | `scale(1)` | 3×3, `itemW 299` |
| de-xuat-b 1440×900 | tắt | — (không có khối này) | — | — | — |

**Ảnh render** (`_qa/evidence/`, chụp bằng `_qa/cdp-shots.mjs` và `_qa/cdp-shot-at.mjs`):

`m-pin-00-start.png` · `m-pin-30.png` · `m-pin-40.png` · `m-pin-60.png` · `m-pin-70.png` ·
`m-pin-80.png` · `m-pin-100-end.png` · `s-banket-mobile-390.png` · `s-banket-below-gate.png` ·
`s-banket-reduced.png` · `s-a-impact.png` · `s-b-impact.png`

### 7.7 Hai lỗi mà chỉ ảnh render bắt được

Số đo gián tiếp nói “đạt” ở cả hai ca này. Ảnh mới là thứ tố cáo:

1. **Nhãn bị vòng tròn cắt.** Lần dựng đầu ép lưới 3×3 vào 100svh ⇒ vòng tròn còn 188px, chữ bị
   `overflow:hidden` cắt âm thầm: “chương trìn…”, “hoặc” → “oặc”, chú thích ô ~70% mất gần hết.
   Phép kiểm “hộp nội dung nằm trong hình vuông nội tiếp” mà tôi viết ban đầu báo `fits: false` cho
   **cả bản tĩnh đã được duyệt** ⇒ tiêu chí đó quá chặt (bốn góc hộp là chỗ trống, chữ không tới đó).
   **Bài học: một phép kiểm báo đỏ cho cả trường hợp đã biết là tốt thì phép kiểm sai, không phải
   sản phẩm sai.** Đã sửa bằng cách đổi hình học sang 2×2 (§7.2) và nghiệm thu bằng ảnh render.
2. **Tiêu đề khối nằm sau thanh header.** `.site-header` là `position:sticky; z-index:100`, nên khi
   ghim ở `top:0` nó đè lên chip “Bằng chứng”. Tôi viết tay `--header-h: 57px`; **phép đo cho ra
   75px** ⇒ vẫn che 18px. Đã sửa thành: JS đo chiều cao thật của header rồi ghi vào `--header-h`,
   CSS chỉ giữ giá trị mặc định. Đo lại: `headClearsHeader = 31–33`.

### 7.8 Giữ nguyên một đặc điểm của b2b — không tự “cải tiến”

Trong khoảng tiến độ **0,30 → 0,40**, bốn vòng tròn đã dịch 1/3 quãng đường trong khi nhãn **vẫn còn
`opacity: 1`** (b2b cho nhãn mờ dần từ kf40 tới kf60), nên các nhãn chồng lên nhau và khó đọc — xem
`m-pin-40.png`. Đây **đúng là hành vi của b2b** (đã đối chiếu tỉ lệ chồng: b2b 116/350 = 0,33 · ở đây
92/277 = 0,33), nên giữ nguyên. Nếu muốn tránh khoảnh khắc chồng chữ, cách sửa là cho nhãn mờ bắt
đầu từ kf30 thay vì kf40 — **cần Lucas chốt**, vì đó là sửa nguồn chứ không phải port.

### 7.9 File mới của phần này

| File | Vai trò |
|---|---|
| `assets/js/motion-impact.js` | spec gốc + phần dựng timeline GSAP |
| `assets/vendor/gsap.min.js` · `assets/vendor/ScrollTrigger.min.js` | GSAP 3.15.0, copy nguyên văn từ theme `LucasGo4ai` (`tai-nguyen/cdn.jsdelivr.net/npm/gsap@3/dist/`) |
| `_qa/cdp-motion.mjs` | harness CDP: đo chuyển động trong renderer thật, 4 ca (motion / reduce / biên gate / dưới gate) |
| `_qa/cdp-shots.mjs` | chụp khối đã ghim ở từng mốc keyframe |
| `_qa/cdp-shot-at.mjs` | chụp phần tử ở nhiều (trang × viewport × media) |
| `_qa/probe-motion.html` · `_qa/probe-media.html` | probe cũ qua `--dump-dom`; **giữ lại làm bằng chứng** cho hai cái bẫy ở §7.6 |
| `_qa/evidence/motion-raw.txt` | JSON thô của lần đo cuối |

---

## 8. Còn lại trước khi publish

- [ ] **Chốt câu hỏi trung tâm lặp hai lần ở bản kết** — giữ làm điệp khúc, hay đổi chữ trong vòng accent (§2.2)
- [ ] **Chốt khoảnh khắc chồng chữ ở tiến độ 0,30–0,40** của khối Bằng chứng: giữ nguyên như b2b, hay cho nhãn mờ từ kf30 (§7.8)
- [ ] Duyệt 4 dòng diễn giải ở cột “Khi GO4AI vào” (§3.1)
- [ ] Duyệt mô tả 7 bước học và 6 bước sau đào tạo (§3.2)
- [ ] Bổ sung logo đối tác thật và ảnh/video case
- [ ] Rà lại câu chữ tiếng Việt sau khi duyệt
- [ ] Nếu chọn bản kết: đổi `variant-switch` và liên kết trong `index.html` cho khớp, và cân nhắc bỏ
      hẳn `de-xuat-a.html` / `de-xuat-b.html` khỏi thư mục ship

### 8.1 Phát hiện ngoài phạm vi — chưa sửa, ghi lại để không mất

- **Liên kết neo che mất đầu khối.** `assets/css/go4ai.css` **không** đặt `scroll-padding-top` (đã
  grep: 0 kết quả), trong khi `.site-header` là `position:sticky` cao 75px. Nên bấm vào liên kết neo
  (`#bang-chung`, `#chuong-trinh`, …) sẽ đưa đầu khối nằm **sau** thanh header. Đây là lỗi **có sẵn
  trên cả 4 trang và cả A/B**, không phải do phần chuyển động sinh ra — xem `s-banket-mobile-390.png`.
  Sửa một dòng (`html { scroll-padding-top: 75px }`) nhưng sẽ đổi cả A và B, nên để Lucas quyết.

*(Việc “chốt 1 trong 2 đề xuất” đã xong: bản kết ở §2 là phương án ghép theo từng khối.)*
