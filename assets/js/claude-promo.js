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
  document.addEventListener('DOMContentLoaded', function () {
    var registration = document.getElementById('tham-gia');
    if (!registration) return;
    var title = registration.querySelector('h2');
    if (title) title.textContent = 'Chương trình Claude 90 phút đã kết thúc';
    document.querySelectorAll('a[href="#tham-gia"]').forEach(function (link) {
      link.textContent = 'Xem thông tin chương trình';
    });
  });
}());
