@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  /* ابزاری برای مخفی کردن نوار اسکرول */
  .scrollbar-hide {
    -ms-overflow-style: none; /* برای Internet Explorer و Edge */
    scrollbar-width: none; /* برای Firefox */
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* برای Chrome, Safari و Opera */
  }
}

:root {
  --foreground-rgb: 255, 255, 255;
}

html,
body {
  height: 100%;
  overflow-x: hidden;
  /* جلوگیری از افکت کشش و بازگشت در مرورگر سافاری iOS */
  overscroll-behavior: none;
}

body {
  color: rgb(var(--foreground-rgb));
}

/* پس‌زمینه گرادیان برای حالت روشن */
html:not(.dark) body {
  background: linear-gradient(
    180deg,
    #e6f3fb 0%,
    #eaf3f7 18%,
    #f7f7f3 38%,
    #e9ecef 60%,
    #dbe3ea 80%,
    #d3dde6 100%
  );
  background-attachment: fixed;
}

/* استایل‌های سفارشی برای نوار اسکرول در مرورگرهای WebKit */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.5);
}

/* افکت بزرگ‌نمایی هنگام هاور روی کارت ویدیو */
.video-card-hover {
  transition: transform 0.3s ease;
}

.video-card-hover:hover {
  transform: scale(1.05);
}

/* پوشش گرادیان تیره در پایین عناصر */
.gradient-overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

/* مخفی کردن نوار اسکرول عمودی در دستگاه‌های موبایل */
@media (max-width: 767px) {
  html,
  body {
    -ms-overflow-style: none; /* برای IE & Edge */
    scrollbar-width: none; /* برای Firefox */
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none; /* برای Chrome و Safari */
  }
}

/* مخفی کردن تمام نوارهای اسکرول در همه عناصر */
* {
  -ms-overflow-style: none; /* برای IE & Edge */
  scrollbar-width: none; /* برای Firefox */
}

*::-webkit-scrollbar {
  display: none; /* برای Chrome, Safari, Opera */
}

/* انیمیشن‌های View Transitions API */
@keyframes slide-from-top {
  from {
    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  }
  to {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}

@keyframes slide-from-bottom {
  from {
    clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  }
  to {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.8s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

/*
 * هنگام جابجایی بین تم‌ها، نمای قدیمی (old view) انیمیشنی ندارد
 * و در زیر قرار می‌گیرد تا از تغییر رنگ ناگهانی صفحه جلوگیری شود.
 */
::view-transition-old(root) {
  animation: none;
}

/* انیمیشن تغییر از تم روشن به تیره: محتوای جدید (تیره) از بالا وارد می‌شود. */
html.dark::view-transition-new(root) {
  animation-name: slide-from-top;
}

/* انیمیشن تغییر از تم تیره به روشن: محتوای جدید (روشن) از پایین وارد می‌شود. */
html:not(.dark)::view-transition-new(root) {
  animation-name: slide-from-bottom;
}

/* تنظیم ارتفاع عنصر video در پلیر برای نمایش کامل و حفظ نسبت تصویر */
div[data-media-provider] video {
  height: 100%;
  object-fit: contain;
}

/* استایل پوستر ویدیو در Artplayer */
.art-poster {
  background-size: contain !important; /* نمایش کامل تصویر پوستر */
  background-position: center center !important; /* تصویر در مرکز قرار گیرد */
  background-repeat: no-repeat !important; /* جلوگیری از تکرار تصویر */
  background-color: #000 !important; /* رنگ پس‌زمینه سیاه برای فضاهای خالی */
}

/* مخفی کردن برخی کنترل‌های پلیر در حالت عمودی موبایل */
@media (max-width: 768px) {
  .art-control-pip,
  .art-control-fullscreenWeb,
  .art-control-volume {
    display: none !important;
  }
}
