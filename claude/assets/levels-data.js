/* Dữ liệu 6 cấp độ cho Go4ai: Tập trung sâu vào nghiệp vụ Phòng HR & L/D
   Level 3 (Cowork): AI trực tiếp đọc CV và tự động nhập liệu ứng viên thay HR vào CRM / ATS / Hệ thống
   Level 4 (Automation): Tự động cập nhật file Excel/Sheet ứng viên sau Cowork; cuối tháng tổng kết KPI dài, Claude kết hợp AI Agent & Apps Script tự động hóa phân tích, tìm insight, xây dựng kế hoạch hành động họp đa phòng ban
   Level 5 (AI App): Đóng gói ứng dụng thông minh có AI hỗ trợ chấm điểm Employer Brand, nghiên cứu thị trường lao động, khảo sát đối thủ và chuẩn hóa đánh giá ứng viên
*/
window.GO4AI_ICONS = window.GO4AI_ICONS || {
  search:'<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  columns:'<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/>',
  tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  mail:'<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  pkg:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22" x2="12" y2="12"/>',
  home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
  award:'<circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  archive:'<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>',
  cpu:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  filter:'<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  percent:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  send:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  list:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  case:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trend:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  clip:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  branch:'<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  msg:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  refresh:'<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',
  sliders:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'
};

window.GO4AI_LEVELS = [
  {
    n: 1,
    color: '#478fb8',
    step: 'HỎI',
    eyebrow: 'ASK · SCREEN · WRITE',
    title: 'Chatbot',
    lead: 'AI làm từng tác vụ Nhân sự & Đào tạo',
    desc: 'Chỉ riêng một cửa sổ chat đã có thể giải phóng hàng giờ của chuyên viên Tuyển dụng & L/D: từ viết JD chuẩn hóa, tóm tắt hồ sơ năng lực đến soạn bài kiểm tra trắc nghiệm đào tạo nội bộ.',
    rows: [
      {
        items: [
          { cat: 'CV SCREEN', t: 'Đọc CV ứng viên', ic: 'file' },
          { cat: 'JD DRAFT', t: 'Soạn thảo JD', ic: 'columns' },
          { cat: 'POLICY', t: 'Tra cứu Luật LĐ', ic: 'shield' },
          { cat: 'QUIZ GEN', t: 'Soạn đề test L/D', ic: 'award' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'CLAUDE CHAT', t: 'HR Chatbot', s: 'Một cửa sổ chat xử lý nghiệp vụ', ic: 'msg' }]
      },
      {
        items: [
          { cat: 'INTERVIEW', t: 'Bộ câu hỏi PV', s: 'Hành vi · STAR · Chuyên môn', ic: 'user' },
          { cat: 'EMAIL HR', t: 'Thư mời & Phản hồi', s: 'Cá nhân hóa từng ứng viên', ic: 'mail' },
          { cat: 'L/D OUTLINE', t: 'Khung bài giảng', s: 'Slide tóm tắt cho đào tạo', ic: 'layout' }
        ]
      },
      {
        items: [{ cat: 'HR ASSETS', t: 'Tài liệu bàn giao', s: 'PDF JD · ĐỀ PHỎNG VẤN · BẢN BRIEF ỨNG VIÊN', ic: 'pkg' }]
      }
    ],
    blurbs: [
      { t: 'Soạn JD chuẩn trong 30 giây', d: 'Từ yêu cầu tuyển dụng sơ sài của Trưởng bộ phận thành bản Mô tả công việc chuyên nghiệp, chuẩn khung năng lực.' },
      { t: 'Tóm tắt hồ sơ & trích xuất năng lực', d: '20 trang CV được trích xuất thành 5 gạch đầu dòng then chốt: kỹ năng thực tế, dự án nổi bật, mức lương kỳ vọng.' },
      { t: 'Soạn bộ câu hỏi phỏng vấn theo phương pháp STAR', d: 'AI tự động tạo câu hỏi tình huống và thang điểm đánh giá chi tiết cho từng vòng tuyển chọn.' },
      { t: 'Kết thúc bằng tài liệu bàn giao hoàn chỉnh', d: 'Bộ câu hỏi, thư mời nhận việc (Offer Letter), tài liệu bài giảng L/D sẵn sàng gửi đi ngay.' }
    ],
    bridge: 'NHƯNG — mỗi ứng viên mới hay đợt tuyển dụng mới, HR vẫn phải copy-paste và giải thích lại từ đầu.'
  },
  {
    n: 2,
    color: '#08906c',
    step: 'HIỂU',
    eyebrow: 'FROM GENERAL HR → YOUR TALENT COPILOT',
    title: 'HR & L/D Copilot',
    lead: 'AI hiểu văn hóa, thang bảng lương & quy chế của bạn',
    desc: 'Claude không chỉ hiểu nghiệp vụ nhân sự chung. Claude nạp toàn bộ Khung năng lực, Từ điển năng lực, Văn hóa doanh nghiệp, Thang bảng lương và Quy trình Onboarding của riêng doanh nghiệp bạn.',
    rows: [
      {
        items: [
          { cat: 'COMPETENCY', t: 'Từ điển năng lực', ic: 'award' },
          { cat: 'SALARY SCALE', t: 'Thang bảng lương', ic: 'dollar' },
          { cat: 'CULTURE', t: 'Văn hóa tổ chức', ic: 'home' },
          { cat: 'ONBOARDING', t: 'Quy chế nội bộ', ic: 'shield' }
        ]
      },
      {
        items: [
          { cat: 'SKILL MATRIX', t: 'Ma trận kỹ năng', ic: 'grid' },
          { cat: 'CASE STUDY', t: 'Tình huống nội bộ', ic: 'case' },
          { cat: 'TEMPLATES', t: 'Mẫu đánh giá 360', ic: 'layout' },
          { cat: 'PAST TALENT', t: 'Hồ sơ Top Performer', ic: 'users' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'HR PROJECT', t: 'HR & L/D Copilot', s: 'Đã nạp toàn bộ dữ liệu chuẩn nhân sự tổ chức', ic: 'cpu' }]
      },
      {
        items: [
          { cat: 'TALENT MATCH', t: 'Đối soát ứng viên', s: 'So chuẩn Top Performer', ic: 'target' },
          { cat: 'L/D ROADMAP', t: 'Lộ trình phát triển', s: 'IDP học tập cá nhân hóa', ic: 'branch' },
          { cat: 'OFFER PROPOSAL', t: 'Đề xuất mức lương', s: 'Đúng band lương nội bộ', ic: 'check' }
        ]
      }
    ],
    blurbs: [
      { t: 'Nạp toàn bộ khung năng lực & văn hóa công ty', d: 'Không còn câu trả lời chung chung. AI đối chiếu ứng viên với đúng tiêu chuẩn nội bộ của tổ chức.' },
      { t: 'L/D định vị lộ trình đào tạo (IDP) cá nhân hóa', d: 'Dựa trên khoảng trống kỹ năng (skill gaps) của nhân sự để sinh lộ trình đào tạo 30-60-90 ngày.' },
      { t: 'Claude trở thành Chuyên gia tuyển dụng & L/D đồng hành', d: 'Hiểu rõ phong cách tuyển trạch của từng Hiring Manager và tone giọng truyền thông nội bộ.' },
      { t: 'Giao việc trực tiếp bằng ngữ cảnh', d: '“Vị trí Senior Account Manager này có ứng viên A, đối soát giúp tôi theo Khung năng lực cấp 3 và đề xuất mức offer phù hợp.”' }
    ],
    bridge: 'Nhưng Claude vẫn chỉ đưa nội dung trên màn hình — HR vẫn phải tự tay copy từng trường dữ liệu vào hệ thống.'
  },
  {
    n: 3,
    color: '#ce3c2b',
    step: 'LÀM',
    eyebrow: 'FROM CHATTING → AUTONOMOUS SYSTEM WORK',
    title: 'Cowork',
    lead: 'AI tự động nhập liệu ứng viên thay HR vào CRM & Hệ thống',
    desc: 'Không còn cảnh HR phải ngồi gõ từng dòng thông tin ứng viên thủ công. Claude trực tiếp đọc hàng trăm hồ sơ CV từ mail và ổ đĩa, trích xuất dữ liệu, mở CRM/ATS và tự động nhập liệu ứng viên thay cho HR.',
    rows: [
      {
        items: [{ cat: 'INPUT', t: 'Hồ sơ ứng viên (CV Pool)', s: 'Hàng trăm CV từ Email, Job Portal, Google Drive', ic: 'folder' }]
      },
      {
        items: [
          { cat: 'PARSE CV', t: 'Bóc tách thông tin', s: 'Họ tên · SĐT · Email · Kỹ năng', ic: 'file' },
          { cat: 'VERIFY', t: 'Đối soát hồ sơ', s: 'Tra cứu LinkedIn · Portfolio', ic: 'globe' },
          { cat: 'MAP FIELD', t: 'Map trường dữ liệu', s: 'Chuẩn hóa cột theo form CRM / ATS', ic: 'target' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'AI COWORK', t: 'HR Cowork Engine', s: 'Tự động đăng nhập & thao tác trên hệ thống thật thay HR', ic: 'cpu' }]
      },
      {
        items: [
          { cat: 'CRM / ATS', t: 'Tự động nhập liệu CRM', s: 'Tạo Contact · Gắn Tag · Đính kèm CV', ic: 'db' },
          { cat: 'PIPELINE', t: 'Phân luồng hồ sơ', s: 'Xếp Stage phỏng vấn · Hẹn lịch vòng 1', ic: 'branch' },
          { cat: 'L/D PROFILE', t: 'Cập nhật hồ sơ L/D', s: 'Lưu kỹ năng vào Ngân hàng nhân tài', ic: 'users' }
        ]
      },
      {
        items: [{ cat: 'HR REVIEW', t: 'HR xác nhận & gọi phỏng vấn', s: 'Kiểm tra tóm tắt, nhấn duyệt và kết nối ứng viên', ic: 'check' }]
      }
    ],
    blurbs: [
      { t: 'Bắt đầu từ tệp CV thật trên máy và email', d: 'Không phải dữ liệu gõ lại vào khung chat. Claude đọc trực tiếp hàng trăm tệp PDF/Docx của ứng viên nộp về.' },
      { t: 'Bóc tách thông tin & chuẩn hóa trường dữ liệu', d: 'Tự động bóc tách chính xác: Họ tên, Số điện thoại, Email, Vị trí ứng tuyển, Số năm kinh nghiệm, Mức lương hiện tại.' },
      { t: 'AI trực tiếp nhập liệu ứng viên thay HR vào CRM/ATS', d: 'Mở giao diện CRM (HubSpot, Lark, Base, Zoho, SAP...), điền từng ô dữ liệu, đính kèm file gốc mà HR không cần gõ một phím nào.' },
      { t: 'Tự động phân loại, gắn tag & xếp pipeline', d: 'Gắn nhãn kỹ năng chuyên môn, chấm điểm sơ loại và chuyển ứng viên vào đúng giai đoạn phỏng vấn trong hệ thống.' },
      { t: 'HR giải phóng 80% thời gian nhập liệu thủ công', d: 'Thay vì mất hàng giờ copy-paste nhàm chán, HR dành toàn bộ thời gian để phỏng vấn sâu và xây dựng mối quan hệ với ứng viên.' }
    ],
    bridge: 'Nhưng sau khi nhập liệu xong, làm thế nào để số liệu KPI dài cả nghìn dòng được tổng hợp tự động để báo cáo đa phòng ban?'
  },
  {
    n: 4,
    color: '#2b4d60',
    step: 'TỰ CHẠY',
    eyebrow: 'FROM MANUAL DATA → APPS SCRIPT & AI AGENT PIPELINE',
    title: 'HR & Workforce Automation',
    lead: 'Tự động cập nhật Excel/Sheet, kết hợp AI Agent & Apps Script phân tích dữ liệu lớn',
    desc: 'Sau bước nhập liệu Cowork, thông tin ứng viên tự động đổ về bảng tính Excel / Google Sheet. Cuối tháng với bảng số liệu KPI khổng lồ, Claude kết hợp AI Agent cùng Google Apps Script tự động làm sạch dữ liệu, tìm insight và xây dựng kế hoạch hành động họp đa phòng ban.',
    rows: [
      {
        items: [
          { cat: 'COWORK SYNC', t: 'Đồng bộ từ Cowork', s: 'Tự cập nhật File Excel / Sheet ứng viên', ic: 'folder' },
          { cat: 'BIG DATA', t: 'Bảng số liệu KPI dài', s: 'Hàng nghìn dòng tuyển dụng, chi phí, L/D', ic: 'file' },
          { cat: 'SCHEDULE', t: 'Kích hoạt định kỳ', s: 'Tự chạy cuối tháng / tuần không cần bấm nút', ic: 'zap' }
        ]
      },
      {
        items: [
          { cat: 'APPS SCRIPT', t: 'Tự động hóa Apps Script', s: 'Làm sạch bảng, ghép nguồn, tính công thức', ic: 'filter' },
          { cat: 'KPI METRICS', t: 'Tính toán chỉ số', s: 'Time-to-Hire, Cost-per-Hire, ROI đào tạo', ic: 'percent' },
          { cat: 'ANOMALY', t: 'Phát hiện bất thường', s: 'Điểm nghẽn phễu · Chi phí vượt trần', ic: 'alert' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'AI AGENT & CLAUDE', t: 'Phân tích đa chiều & Tìm Insight', s: 'AI Agent đọc số liệu, tìm nguyên nhân cốt lõi và xây dựng giải pháp', ic: 'activity' }]
      },
      {
        items: [
          { cat: 'ACTION PLAN', t: 'Kế hoạch hành động', s: 'Nội dung chốt cho cuộc họp đa phòng ban', ic: 'cal' },
          { cat: 'DASHBOARD', t: 'Báo cáo trực quan', s: 'Dashboard & Chart tự động cập nhật', ic: 'monitor' },
          { cat: 'DELIVERY', t: 'Gửi báo cáo lãnh đạo', s: 'Email tự động gửi Ban Giám đốc & Trưởng bộ phận', ic: 'send' }
        ]
      },
      {
        items: [{ cat: 'AUDIT LOG', t: 'Lưu nhật ký vận hành', s: 'Ghi nhận lịch sử chạy, số liệu và kiến nghị', ic: 'list' }]
      }
    ],
    blurbs: [
      { t: 'Dữ liệu ứng viên từ Cowork tự động cập nhật vào Excel / Google Sheet', d: 'Mỗi khi AI nhập ứng viên vào CRM, dữ liệu lập tức đồng bộ về bảng tính quản trị nhân sự, chấm dứt hoàn toàn việc gõ tay hay đối soát hai lần.' },
      { t: 'Apps Script tự động xử lý bảng số liệu KPI khổng lồ cuối tháng', d: 'Hàng nghìn dòng dữ liệu tuyển dụng, chi phí quảng cáo và tiến độ đào tạo L/D được Google Apps Script ghép bảng, làm sạch và tính toán trong tích tắc.' },
      { t: 'Claude kết hợp AI Agent tìm ra insight kinh doanh đắt giá', d: 'Không chỉ dừng lại ở con số: AI chỉ rõ vì sao phòng ban nào tuyển chậm, nguồn ứng viên nào mang lại nhân sự gắn bó lâu nhất và chi phí tuyển dụng bị đội ở đâu.' },
      { t: 'Xây dựng nội dung kế hoạch hành động sẵn sàng cho cuộc họp đa phòng ban', d: 'Tự động tổng hợp Action Items cụ thể cho HR, L/D, Finance và các Hiring Manager để cuộc họp giao ban ra quyết định ngay mà không cần tranh cãi số liệu.' },
      { t: 'Báo cáo & Dashboard cập nhật tự động gửi đến Ban Lãnh đạo', d: 'Biểu đồ trực quan tự động làm mới, file báo cáo hoàn chỉnh được gửi thẳng đến CHRO và CEO theo đúng lịch định kỳ.' }
    ],
    bridge: 'Nhưng các phân tích nội bộ vẫn cần kết hợp với dữ liệu thị trường bên ngoài và sức hút của Thương hiệu tuyển dụng.'
  },
  {
    n: 5,
    color: 'var(--lv5)',
    step: 'ĐÓNG GÓI',
    eyebrow: 'FROM WORKFLOW → TALENT & BRAND INTELLIGENCE APP',
    title: 'Talent & Market Intelligence App',
    lead: 'Đóng gói ứng dụng chấm điểm Brand, nghiên cứu thị trường & đánh giá nhân tài',
    desc: 'Đóng gói toàn bộ bí quyết thành phần mềm chuyên biệt: AI tự động nghiên cứu thị trường lao động, khảo sát chính sách đối thủ, chấm điểm thương hiệu tuyển dụng (Employer Branding) và chuẩn hóa đánh giá ứng viên.',
    rows: [
      {
        items: [
          { cat: 'MARKET CRAWL', t: 'Nghiên cứu thị trường', ic: 'globe' },
          { cat: 'COMPETITOR', t: 'Khảo sát đối thủ', ic: 'users' },
          { cat: 'BRAND DATA', t: 'Employer Brand', ic: 'share' },
          { cat: 'INTERNAL JD', t: 'Tiêu chuẩn nội bộ', ic: 'file' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'AI APP ENGINE', t: 'Talent & Brand Intelligence', s: 'Nghiên cứu thị trường · Chấm điểm Brand · Đánh giá năng lực 360', ic: 'activity' }]
      },
      {
        items: [
          { cat: 'BRAND SCORE', t: 'Chấm điểm Brand', ic: 'star' },
          { cat: 'SALARY BENCH', t: 'Đối soát bảng lương', ic: 'dollar' },
          { cat: 'TALENT GAP', t: 'Khoảng trống nhân tài', ic: 'columns' },
          { cat: 'CANDIDATE FIT', t: 'Đánh giá ứng viên 360', ic: 'target' }
        ]
      },
      {
        items: [
          { cat: 'BRAND SCORECARD', t: 'Thẻ điểm Brand & Thị trường', s: 'Báo cáo định vị thương hiệu tuyển dụng', ic: 'clip' },
          { cat: 'ACTION 60 DAYS', t: 'Kế hoạch phát triển 60 ngày', s: 'Chiến lược thu hút nhân tài & đào tạo L/D', ic: 'cal' }
        ]
      }
    ],
    blurbs: [
      { t: 'AI tự động nghiên cứu thị trường lao động & phân tích đối thủ', d: 'Crawl và tổng hợp dữ liệu mức lương, phúc lợi, xu hướng tuyển dụng từ các đối thủ cùng ngành trên thị trường theo thời gian thực.' },
      { t: 'Hỗ trợ chấm điểm Thương hiệu tuyển dụng (Employer Branding)', d: 'Phân tích các điểm chạm thương hiệu, phản hồi nhân sự trên mạng xã hội, đo lường sức hút của doanh nghiệp so với các đối thủ cạnh tranh.' },
      { t: 'Chuẩn hóa công thức đánh giá ứng viên cho mọi Trưởng bộ phận', d: 'Mọi Quản lý đều có thể truy cập app để phỏng vấn, đối chiếu năng lực ứng viên với mặt bằng thị trường và văn hóa công ty.' },
      { t: 'Xuất Thẻ điểm năng lực & Báo cáo định vị thị trường trực quan', d: 'Báo cáo chi tiết giúp ban lãnh đạo biết chính xác band lương công ty đang ở đâu, thương hiệu mạnh/yếu điểm nào và cách tối ưu nguồn ứng viên.' },
      { t: 'Gắn kết nghiên cứu thị trường với kế hoạch đào tạo L/D', d: 'Chỉ ra các kỹ năng đang khan hiếm ngoài thị trường để phòng L/D chủ động xây dựng chương trình đào tạo nội bộ thay vì phải tuyển giá cao.' }
    ],
    bridge: 'Một ứng dụng nghiên cứu thị trường & chấm điểm brand đã rất mạnh. Nhưng doanh nghiệp cần một Hệ điều hành AI kết nối toàn bộ tổ chức.'
  },
  {
    n: 6,
    color: '#15171a',
    step: 'NHÂN RỘNG',
    eyebrow: 'FROM AI APP → HR WORKFORCE OPERATING SYSTEM',
    title: 'HR & Workforce AI OS',
    lead: 'Hệ sinh thái AI đồng bộ toàn bộ tổ chức nhân sự',
    desc: 'Khi 1 người dùng: Chatbot là đủ. Khi 10 người: Cần Copilot chuẩn hóa. Nhưng khi quy mô 100 - 5.000 nhân sự: Cần một Hệ điều hành AI hợp nhất từ Tuyển dụng, Onboarding, Đào tạo L/D, Đánh giá hiệu suất đến Giữ chân nhân tài.',
    rows: [
      {
        items: [
          { cat: 'RECRUITMENT', t: 'AI Tuyển dụng', ic: 'trend' },
          { cat: 'L&D ACADEMY', t: 'AI Đào tạo L/D', ic: 'award' },
          { cat: 'C&B PAYROLL', t: 'AI Lương thưởng C&B', ic: 'dollar' },
          { cat: 'TALENT OPS', t: 'AI Vận hành nhân sự', ic: 'users' },
          { cat: 'STRATEGY', t: 'AI Chiến lược nhân sự', ic: 'sliders' }
        ]
      },
      {
        hub: true,
        items: [{ cat: 'HR AI OS', t: 'HR Workforce Operating System', s: 'Nhiều AI Agent · Nhiều ứng dụng nghiệp vụ · Một nền tảng quản trị', ic: 'grid' }]
      },
      {
        items: [{ cat: 'SHARED KNOWLEDGE', t: 'Ngân hàng tri thức nhân sự dùng chung', s: 'Một nguồn sự thật duy nhất về chính sách, năng lực và con người', ic: 'layers' }]
      },
      {
        items: [
          { cat: 'DATA PRIVACY', t: 'Bảo mật dữ liệu', ic: 'lock' },
          { cat: 'HRIS / ERP', t: 'Đồng bộ hệ thống lõi', ic: 'db' },
          { cat: 'EXECUTIVE AUDIT', t: 'Phê duyệt C-Level', ic: 'branch' },
          { cat: 'WORKFORCE ROI', t: 'Đo lường năng suất', ic: 'chart' }
        ]
      }
    ],
    blurbs: [
      { t: 'Quản trị xuyên suốt toàn bộ vòng đời nhân sự', d: 'Từ khi là ứng viên tiềm năng ngoài thị trường, qua các kỳ đào tạo L/D, đánh giá KPI, cho đến khi trở thành lãnh đạo kế cận.' },
      { t: 'Một nguồn dữ liệu chuẩn hóa duy nhất (Single Source of Truth)', d: 'Toàn bộ chính sách nhân sự, từ điển năng lực và tài nguyên đào tạo được đồng bộ tức thì cho mọi phòng ban.' },
      { t: 'Mạng lưới AI Agent phối hợp liên phòng ban', d: 'AI Tuyển dụng bàn giao dữ liệu ứng viên cho AI L/D thiết kế chương trình học, đồng thời thông báo cho AI Tiền lương tạo hợp đồng lao động.' },
      { t: 'Bảo mật thông tin nhân sự theo tiêu chuẩn nghiêm ngặt', d: 'Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, mã hóa dữ liệu lương thưởng và phân quyền chặt chẽ.' },
      { t: 'Cung cấp bức tranh phân tích nhân tài cho Ban Lãnh đạo', d: 'Giúp CEO và Giám đốc Nhân sự (CHRO) dự báo biến động nhân sự, tỷ lệ nghỉ việc và tối ưu hóa ngân sách phát triển nhân tài.' }
    ],
    bridge: 'Bắt đầu từ buổi hội thảo 90 phút hôm nay để đặt nền móng AI đầu tiên cho tổ chức của bạn.'
  }
];
