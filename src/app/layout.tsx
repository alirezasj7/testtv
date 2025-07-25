import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { getConfig } from '@/lib/config';

import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

// ایجاد متادیتا به صورت پویا، برای پشتیبانی از تغییرات عنوان پس از به‌روزرسانی پیکربندی
export async function generateMetadata(): Promise<Metadata> {
  let siteName = process.env.SITE_NAME || 'MoonTV';
  if (process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'd1') {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
  }

  return {
    title: siteName,
    description: 'مجموعه فیلم و سریال',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteName = process.env.SITE_NAME || 'MoonTV';
  let announcement =
    process.env.ANNOUNCEMENT ||
    'این وب‌سایت فقط خدمات جستجوی اطلاعات فیلم و سریال را ارائه می‌دهد و تمام محتوا از وب‌سایت‌های شخص ثالث تهیه شده است. این سایت هیچ منبع ویدیویی را ذخیره نمی‌کند و مسئولیتی در قبال صحت، قانونی بودن یا کامل بودن هیچ محتوایی ندارد.';
  let enableRegister = process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true';
  let imageProxy = process.env.NEXT_PUBLIC_IMAGE_PROXY || '';
  if (process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'd1') {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
    announcement = config.SiteConfig.Announcement;
    enableRegister = config.UserConfig.AllowRegister;
    imageProxy = config.SiteConfig.ImageProxy;
  }

  // تزریق پیکربندی زمان اجرا به شیء گلوبال window، تا کلاینت بتواند در زمان اجرا آن را بخواند
  const runtimeConfig = {
    STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
    ENABLE_REGISTER: enableRegister,
    IMAGE_PROXY: imageProxy,
  };

  return (
    // زبان صفحه به فارسی تغییر کرد
    <html lang='fa-IR' suppressHydrationWarning>
      <head>
        {/* پیکربندی را پس از سریال‌سازی مستقیماً در اسکریپت می‌نویسد، سمت مرورگر می‌تواند از طریق window.RUNTIME_CONFIG به آن دسترسی پیدا کند */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <SiteProvider siteName={siteName} announcement={announcement}>
            {children}
          </SiteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
