"use client";
import React, { useEffect, useState } from "react";
import { useServices } from "@/hooks/useServices";
import ServiceCard from "./ServiceCard";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Loader from "../ui/Loader";

const FeaturedServices = () => {
  const { services } = useServices();
  const t = useTranslations("FeaturedServices");

  const featuredServices = services?.services?.filter(
    (service: any) => service.featured === "1"
  );

  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const itemsPerPage = windowWidth < 768 ? 1 : 3; 

  const [startIndex, setStartIndex] = useState(0);

  if (!featuredServices) {
    return <Loader/>
  }

  const maxStartIndex = Math.max(0, featuredServices.length - itemsPerPage);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(prev + 1, maxStartIndex));
  };

  const visibleServices = featuredServices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-mobile_header lg:text-header text-interactive_color mb-6">
            {t("featured_services_title")}
          </h2>
          <Link
            href="/services"
            className="text-interactive_color font-medium hover:underline hidden md:block"
          >
            {t("view_all_services")} →
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={handlePrev}
            disabled={startIndex === 0}
            className="absolute top-1/2 md:-left-10 left-0 transform -translate-y-1/2 z-10 bg-active_color text-white rounded-full p-2 shadow-md disabled:opacity-30"
            aria-label="Previous"
          >
            <FaChevronLeft size={20} />
          </button>

          <div
            className={`grid gap-6 overflow-hidden ${
              itemsPerPage === 1 ? "grid-cols-1" : "lg:grid-cols-3"
            }`}
          >
            {visibleServices.map((service: any) => (
              <ServiceCard
                key={"featured_service_" + service.id}
                id={service.id}
                title={service.name}
                description={service.description}
                image={service.images[0]}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={startIndex >= maxStartIndex}
            className="absolute top-1/2 md:-right-10 right-0 transform -translate-y-1/2 z-10 bg-active_color text-white rounded-full p-2 shadow-md disabled:opacity-30"
            aria-label="Next"
          >
            <FaChevronRight size={20} />
          </button>
        </div>

        <div className="mt-8 text-center md:hidden">
          <a
            href="/services"
            className="inline-block bg-white text-interactive_color border border-interactive_color px-5 py-2 rounded-full font-medium hover:bg-interactive_color hover:text-white transition-colors duration-200"
          >
            {t("view_all_services_mobile")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;