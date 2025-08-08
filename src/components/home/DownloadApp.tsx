'use client'
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

const DownloadAppSection = () => {
  const locale = useLocale();
  const t = useTranslations("Download");
  return (
    <section className="container md:!h-[50vh] xxl:!h-[30vh] mx-auto px-4 py-10 md:py-0 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 meb-10 md:mb-0 md:pt-24 md:pr-10">
        <h4 className="text-2xl md:text-3xl text-interactive_color font-bold mb-4">
          {t("title")}
        </h4>

        <p className={`mb-4 text-interactive_color max-w-lg`}>
          {t("sub_title")}
        </p>

        <div className="flex space-x-4">
          <a
            href="#"
          >
            <Image
              src="/images/download-from-app-store.png"
              alt="App Store"
              width={150}
              height={40}
            />
          </a>

          <a
            href="#"
          >
            <Image
              src="/images/download-from-google-play.png"
              alt="Google Play"
              width={150}
              height={40}
            />
          </a>
        </div>
      </div>

      <div className="md:w-1/2 flex justify-center">
        <div className="md:relative md:translate-y-24">
          <Image
            src={locale === "ar" ? "/images/hpower-screens-ar.png" : "/images/hpower-screens-en.png"}
            alt="App Preview"
            width={500}
            height={700}
            className="md:relative md:!-bottom-30 rounded-xl "
          />
        </div>
      </div>
    </section>
  );
};

export default DownloadAppSection;