/* 21:30 ngày 30/10/2026 theo giờ Việt Nam: dừng quảng bá sự kiện đã kết thúc. */
(function () {
  if (Date.now() < Date.parse('2026-10-30T21:30:00+07:00')) return;
  document.documentElement.classList.add('claude-promo-ended');

  /* Khi ẩn spotlight, tiêu đề danh sách tin trở thành tiêu đề chính của trang. */
  document.addEventListener('DOMContentLoaded', function () {
    var heading = document.getElementById('ev-news-title');
    if (!heading || heading.tagName !== 'H2') return;
    var replacement = document.createElement('h1');
    replacement.id = heading.id;
    replacement.className = heading.className;
    replacement.innerHTML = heading.innerHTML;
    heading.replaceWith(replacement);
  });
  /* Khối báo-hết-hạn được DỰNG Ở ĐÂY, không nằm sẵn trong HTML.
     [ĐO 2026-09-27] Trước đây khối này nằm trong HTML tĩnh và chỉ bị ẩn bằng một rule
     CSS của stylesheet khác (#registration-closed{display:none}). Hệ quả: chỉ cần stylesheet đó
     không tải được là MỌI khách thấy thông báo hết hạn trong khi form vẫn đang mở; và chuỗi đó
     cũng nằm sẵn trong HTML cho mọi crawler / trình đọc bỏ qua CSS.
     Dựng bằng JS ⇒ trước hạn, không có chuỗi hết hạn nào trong trang phục vụ. */
  function buildClosedNotice() {
    var registration = document.getElementById('tham-gia');
    if (!registration || document.getElementById('registration-closed')) return;
    var box = document.createElement('div');
    box.id = 'registration-closed';
    box.className = 'registration-closed';
    box.setAttribute('role', 'status');
    var p = document.createElement('p');
    p.textContent = 'Buổi trực tuyến ngày 30/10/2026 đã kết thúc. GO4AI sẽ cập nhật thông tin xem lại khi bản ghi sẵn sàng.';
    var contact = document.createElement('a');
    contact.href = 'mailto:hocvien@go4ai.life?subject=Claude%2090%20ph%C3%BAt';
    contact.textContent = 'Liên hệ GO4AI';
    box.appendChild(p);
    box.appendChild(contact);
    /* ⛔ querySelector('.reg') trả về hậu duệ BẤT KỲ, không phải con trực tiếp.
       [ĐO 2026-09-27] `.reg` nằm trong `.wrap`, KHÔNG nằm trong `#tham-gia`
       ⇒ `registration.insertBefore(box, reg)` ném NotFoundError và GIẾT phần còn lại của
       handler (tiêu đề không đổi, link không đổi). Chèn vào đúng CHA của .reg. */
    var reg = registration.querySelector('.reg');
    if (reg && reg.parentNode) reg.parentNode.insertBefore(box, reg);
    else registration.appendChild(box);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var registration = document.getElementById('tham-gia');
    if (!registration) return;
    buildClosedNotice();
    var title = registration.querySelector('h2');
    if (title) title.textContent = 'Chương trình Claude 90 phút đã kết thúc';
    document.querySelectorAll('a[href="#tham-gia"]').forEach(function (link) {
      link.textContent = 'Xem thông tin chương trình';
    });
  });
}());
