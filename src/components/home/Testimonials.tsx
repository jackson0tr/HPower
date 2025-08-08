// 'use client';

// import { FaStar } from "react-icons/fa";
// import { useTestimonials } from "@/hooks/useTestimonials";
// import parse from "html-react-parser";
// import Loader from "../ui/Loader";
// import { useLocale, useTranslations } from "next-intl";

// const Testimonials = () => {
//   const t = useTranslations("Testimonials");
//   const { testimonials } = useTestimonials();
//   const isLoading = !testimonials?.data;
//   const locale = useLocale();

//   return (
//     <section className="container py-16 mx-auto px-4">
//       <div className="max-w-6xl mx-auto">
//         <div className="mb-12">
//           <h1 className="text-4xl font-bold mb-4 text-interactive_color">
//             {t("title")}
//           </h1>
//           <p className="text-lg mx-auto text-interactive_color">
//             {t("sub_title")}
//           </p>
//         </div>

//         {isLoading ? (
//           <Loader />
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {testimonials.data.map((testimonial: any) => (
//               <div
//                 key={testimonial.id}
//                 className="p-6 rounded-xl hover:shadow-xl transition-shadow duration-300"
//               >
//                 <div className="flex mb-4">
//                   {[...Array(Number(testimonial.stars))].map((_, i) => (
//                     <FaStar
//                       key={i}
//                       className="w-5 h-5 fill-current !text-text_color"
//                     />
//                   ))}
//                 </div>

//                 <div className="mb-4 text-text_color italic text-sm">
//                   {parse(testimonial.description[locale])}
//                 </div>

//                 <p className="font-semibold text-text_color">
//                   {testimonial.name[locale]}
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default Testimonials;

'use client';

import { FaStar } from "react-icons/fa";
import { useTestimonials } from "@/hooks/useTestimonials";
import parse from "html-react-parser";
import Loader from "../ui/Loader";
import { useLocale, useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Testimonials = () => {
  const t = useTranslations("Testimonials");
  const { testimonials } = useTestimonials();
  const isLoading = !testimonials?.data;
  const locale = useLocale();

  return (
    <section className="container py-16 mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 text-interactive_color">
            {t("title")}
          </h1>
          <p className="text-lg text-interactive_color">
            {t("sub_title")}
          </p>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            pagination={{ clickable: true }}
            navigation
            breakpoints={{
              320: { slidesPerView: 1 }, 
              768: { slidesPerView: 2 }, 
              1024: { slidesPerView: 4 }, 
            }}
          >
            {testimonials.data.map((testimonial: any) => (
              <SwiperSlide key={testimonial.id}>
                <div className="p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 bg-transparent">
                  <div className="flex mb-4">
                    {[...Array(Number(testimonial.stars))].map((_, i) => (
                      <FaStar
                        key={i}
                        className="w-5 h-5 fill-current !text-text_color"
                      />
                    ))}
                  </div>

                  <div className="mb-4 text-text_color italic text-sm">
                    {parse(testimonial.description[locale])}
                  </div>

                  <p className="font-semibold text-text_color">
                    {testimonial.name[locale]}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
