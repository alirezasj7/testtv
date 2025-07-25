/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem } from '@/lib/types';

import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import DoubanSelector from '@/components/DoubanSelector';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

function DoubanPageClient() {
  const searchParams = useSearchParams();
  const [doubanData, setDoubanData] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectorsReady, setSelectorsReady] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const type = searchParams.get('type') || 'movie';

  // وضعیت انتخابگرها - کاملاً مستقل و بدون وابستگی به پارامترهای URL
  const [primarySelection, setPrimarySelection] = useState<string>(() => {
    return type === 'movie' ? 'محبوب' : '';
  });
  const [secondarySelection, setSecondarySelection] = useState<string>(() => {
    if (type === 'movie') return 'همه';
    if (type === 'tv') return 'tv';
    if (type === 'show') return 'show';
    return 'همه';
  });

  // در زمان مقداردهی اولیه، انتخابگرها را به عنوان آماده علامت‌گذاری می‌کند
  useEffect(() => {
    // یک تأخیر کوتاه برای اطمینان از تکمیل تنظیمات اولیه
    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []); // فقط یک بار هنگام بارگذاری کامپوننت اجرا می‌شود

  // هنگام تغییر type، بلافاصله selectorsReady را ریست می‌کند (بالاترین اولویت)
  useEffect(() => {
    setSelectorsReady(false);
    setLoading(true); // فوراً وضعیت loading را نمایش می‌دهد
  }, [type]);

  // هنگام تغییر type، وضعیت انتخابگرها را ریست می‌کند
  useEffect(() => {
    // به‌روزرسانی گروهی وضعیت انتخابگرها
    if (type === 'movie') {
      setPrimarySelection('محبوب');
      setSecondarySelection('همه');
    } else if (type === 'tv') {
      setPrimarySelection('');
      setSecondarySelection('tv');
    } else if (type === 'show') {
      setPrimarySelection('');
      setSecondarySelection('show');
    } else {
      setPrimarySelection('');
      setSecondarySelection('همه');
    }

    // استفاده از یک تأخیر کوتاه برای اطمینان از آماده بودن انتخابگرها پس از به‌روزرسانی وضعیت
    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [type]);

  // ایجاد داده‌های اسکلتی (Skeleton)
  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

  // تابع کمکی برای ایجاد پارامترهای درخواست API
  const getRequestParams = useCallback(
    (pageStart: number) => {
      // زمانی که type برابر با 'tv' یا 'show' است، kind همیشه 'tv' و category خود type خواهد بود
      if (type === 'tv' || type === 'show') {
        return {
          kind: 'tv' as const,
          category: type,
          type: secondarySelection,
          pageLimit: 25,
          pageStart,
        };
      }

      // برای نوع فیلم، منطق قبلی حفظ می‌شود
      return {
        kind: type as 'tv' | 'movie',
        category: primarySelection,
        type: secondarySelection,
        pageLimit: 25,
        pageStart,
      };
    },
    [type, primarySelection, secondarySelection]
  );

  // تابع بارگذاری داده با استفاده از debounce
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoubanCategories(getRequestParams(0));

      if (data.code === 200) {
        setDoubanData(data.list);
        setHasMore(data.list.length === 25);
        setLoading(false);
      } else {
        throw new Error(data.message || 'دریافت داده‌ها ناموفق بود');
      }
    } catch (err) {
      console.error(err);
    }
  }, [type, primarySelection, secondarySelection, getRequestParams]);

  // داده‌ها فقط پس از آماده شدن انتخابگرها بارگذاری می‌شوند
  useEffect(() => {
    // بارگذاری فقط زمانی شروع می‌شود که انتخابگرها آماده باشند
    if (!selectorsReady) {
      return;
    }

    // ریست کردن وضعیت صفحه
    setDoubanData([]);
    setCurrentPage(0);
    setHasMore(true);
    setIsLoadingMore(false);

    // پاک کردن تایمر debounce قبلی
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // استفاده از مکانیزم debounce برای جلوگیری از درخواست‌های مکرر
    debounceTimeoutRef.current = setTimeout(() => {
      loadInitialData();
    }, 100); // تأخیر 100 میلی‌ثانیه

    // تابع پاکسازی
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    selectorsReady,
    type,
    primarySelection,
    secondarySelection,
    loadInitialData,
  ]);

  // مدیریت جداگانه تغییر currentPage (برای بارگذاری بیشتر)
  useEffect(() => {
    if (currentPage > 0) {
      const fetchMoreData = async () => {
        try {
          setIsLoadingMore(true);

          const data = await getDoubanCategories(
            getRequestParams(currentPage * 25)
          );

          if (data.code === 200) {
            setDoubanData((prev) => [...prev, ...data.list]);
            setHasMore(data.list.length === 25);
          } else {
            throw new Error(data.message || 'دریافت داده‌ها ناموفق بود');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingMore(false);
        }
      };

      fetchMoreData();
    }
  }, [currentPage, type, primarySelection, secondarySelection]);

  // تنظیم IntersectionObserver برای اسکرول بی‌نهایت
  useEffect(() => {
    // اگر داده بیشتری وجود ندارد یا در حال بارگذاری است، observer را تنظیم نکن
    if (!hasMore || isLoadingMore || loading) {
      return;
    }

    // اطمینان از وجود loadingRef.current
    if (!loadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loading]);

  // مدیریت تغییر انتخابگر اصلی
  const handlePrimaryChange = useCallback(
    (value: string) => {
      // وضعیت loading فقط زمانی تنظیم می‌شود که مقدار واقعاً تغییر کند
      if (value !== primarySelection) {
        setLoading(true);
        setPrimarySelection(value);
      }
    },
    [primarySelection]
  );

    // مدیریت تغییر انتخابگر فرعی
  const handleSecondaryChange = useCallback(
    (value: string) => {
      // وضعیت loading فقط زمانی تنظیم می‌شود که مقدار واقعاً تغییر کند
      if (value !== secondarySelection) {
        setLoading(true);
        setSecondarySelection(value);
      }
    },
    [secondarySelection]
  );

  const getPageTitle = () => {
    // ایجاد عنوان بر اساس type
    return type === 'movie' ? 'فیلم' : type === 'tv' ? 'سریال' : 'برنامه تلویزیونی';
  };

  const getActivePath = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);

    const queryString = params.toString();
    const activePath = `/douban${queryString ? `?${queryString}` : ''}`;
    return activePath;
  };

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        {/* عنوان صفحه و انتخابگرها */}
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          {/* عنوان صفحه */}
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200'>
              {getPageTitle()}
            </h1>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
              محتوای منتخب از Douban
            </p>
          </div>

          {/* کامپوننت انتخابگر */}
          <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm'>
            <DoubanSelector
              type={type as 'movie' | 'tv' | 'show'}
              primarySelection={primarySelection}
              secondarySelection={secondarySelection}
              onPrimaryChange={handlePrimaryChange}
              onSecondaryChange={handleSecondaryChange}
            />
          </div>
        </div>

        {/* ناحیه نمایش محتوا */}
        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          {/* گرید محتوا */}
          <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
            {loading || !selectorsReady
              ? // نمایش اسکلت (Skeleton)
                skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
              : // نمایش داده‌های واقعی
                doubanData.map((item, index) => (
                  <div key={`${item.title}-${index}`} className='w-full'>
                    <VideoCard
                      from='douban'
                      title={item.title}
                      poster={item.poster}
                      douban_id={item.id}
                      rate={item.rate}
                      year={item.year}
                      type={type === 'movie' ? 'movie' : ''} // نوع فیلم به شدت کنترل می‌شود، اما tv نه
                    />
                  </div>
                ))}
          </div>

          {/* نشانگر بارگذاری بیشتر */}
          {hasMore && !loading && (
            <div
              ref={(el) => {
                if (el && el.offsetParent !== null) {
                  (
                    loadingRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                }
              }}
              className='flex justify-center mt-12 py-8'
            >
              {isLoadingMore && (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-500'></div>
                  <span className='text-gray-600'>در حال بارگذاری...</span>
                </div>
              )}
            </div>
          )}

          {/* پیام "داده بیشتری وجود ندارد" */}
          {!hasMore && doubanData.length > 0 && (
            <div className='text-center text-gray-500 py-8'>تمام محتوا بارگذاری شد</div>
          )}

          {/* وضعیت خالی */}
          {!loading && doubanData.length === 0 && (
            <div className='text-center text-gray-500 py-8'>محتوای مرتبطی یافت نشد</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function DoubanPage() {
  return (
    <Suspense>
      <DoubanPageClient />
    </Suspense>
  );
}
