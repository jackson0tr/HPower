"use client";

import { getAllData } from "@/utils/getData";
//================ Imports =================
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

//================ Custom Hook for Data Fetching =================
export const useTestimonials = () => {
  const locale = useLocale();
  
  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => getAllData(`testimonials`, locale),
  });

  return {
    testimonials,
  };
};
