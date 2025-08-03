"use client";

import React, { FC, useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/helper";

interface BookingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  onBookAppointment: () => void;
  handleDateSelect: (date: Date | undefined) => void;
}

interface Category {
  id: number;
  name: any;
  desc?: string;
  color?: string;
  image_path?: string;
  has_parent?: boolean;
  has_services?: boolean;
  has_children?: boolean;
  services?: Service[];
  children?: Category[];
  parent?: Category;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price?: string;
  discount_price?: string;
  image_path?: string;
}

const BookingModal: FC<BookingModalProps> = ({
  isOpen,
  onOpenChange,
  selectedDate,
  onBookAppointment,
  handleDateSelect
}) => {
  const t = useTranslations("BookingModal");
  const { categories } = useCategories();
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState<Category[]>([]);
  const [navigationStack, setNavigationStack] = useState<Category[][]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const locale = useLocale();

  useEffect(() => {
    if (isOpen && categories?.data) {
      const parentCats = categories.data.filter(
        (cat: Category) => !cat.has_parent
      );
      setCurrentLevel(parentCats);
      setNavigationStack([]);
      setSelectedService(null);
    }
  }, [isOpen, categories]);

  const handleCategorySelect = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setNavigationStack((prev) => [...prev, currentLevel]);
      setCurrentLevel(category.children);
    } else if (
      category.has_services &&
      category.services &&
      category.services.length > 0
    ) {
      setNavigationStack((prev) => [...prev, currentLevel]);
      setCurrentLevel(
        category.services.map((service) => ({
          ...service,
          name: service.name,
          image_path: service.image_path,
        }))
      );
    } else if (!category.has_services) {
      toast.error(t("noServicesAvailable"));
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleBack = () => {
    if (navigationStack.length > 0) {
      const previousLevel = navigationStack[navigationStack.length - 1];
      setCurrentLevel(previousLevel);
      setNavigationStack(navigationStack.slice(0, -1));
      setSelectedService(null);
    }
  };

  const handleBook = () => {
    let dateObj = new Date(selectedDate);
    let formattedDate = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;

    if (formattedDate.toString() == 'NaN-NaN-NaN') {
      dateObj = new Date();
      formattedDate = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate() + 1}`;
    }

    if (selectedService) {
      router.push(`/services/${selectedService.id}?date=${formattedDate.toString()}`);
      onBookAppointment();
    } else {
      console.warn("No selected service to book");
    }
  };


  const renderCard = (item: Category | Service) => {
    const isService = "price" in item;
    const isSelected = isService && selectedService?.id === item.id;

    return (
      <div
        key={item.id}
        className={`border rounded-lg cursor-pointer transition-all duration-300 shadow-lg p-4 ${isService
          ? isSelected
            ? "bg-[#f57f1e5b] border-interactive_color"
            : "bg-transparent"
          : "bg-white border-gray-200"
          } hover:bg-gray-100 active:bg-[var(--active-color)] transform hover:scale-105`}
        onClick={() =>
          isService
            ? handleServiceSelect(item as Service)
            : handleCategorySelect(item as Category)
        }
      >
        <div className="relative h-32 w-full overflow-hidden rounded-lg group">
          <Image
            src={item.image_path || "/placeholder.png"}
            alt={typeof item.name === "string" ? item.name : item.name.en}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            className={`${isService ? "object-cover" : "object-contain"} transition-transform duration-500 group-hover:scale-110`}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h4 className="text-white font-medium text-center text-lg shadow-text">
                {typeof item.name === "string" ? item.name : item.name.en}
              </h4>
            </div>
          </div>
        </div>

        <p className="text-center shadow-text">
          {typeof item.name === "string" ? item.name : item.name.en}
        </p>

        {isService && (
          <div>
            <div className="mt-2 text-sm text-gray-600 flex justify-between">
              <span>{t("price")}:</span>
              <span className="text-interactive_color font-semibold">
                {formatCurrency(
                  parseFloat(
                    parseInt(item.discount_price) < 1
                      ? item.price
                      : item.discount_price
                  ),
                  locale,
                  16
                )}
              </span>
            </div>

            <div className="flex justify-end">
              {parseInt(item.discount_price) > 1 && (
                <span className="text-gray-500 line-through" style={{ fontSize: "12px" }}>
                  {formatCurrency(parseFloat(item.price), locale, 14)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white max-w-3xl rounded-xl shadow-2xl w-md-[90%] max-h-[80vh] overflow-y-auto p-0">
        <AlertDialogHeader className="p-6 bg-interactive_color text-white hover:bg-active_color rounded-t-xl">
          <AlertDialogTitle className="text-2xl font-bold text-center">
            {t("title")}
          </AlertDialogTitle>
          <div className="mt-2 text-lg text-center">
            <span className="font-semibold">{t("selectedDate")}:</span>{" "}
            {selectedDate && (
              <span className="text-yellow-200">
                {format(selectedDate, "PPP")}
              </span>
            )}

            {!selectedDate && (
              <span className="text-yellow-200">
                {format(addDays(new Date(), 1), "PPP")}</span>
            )}
          </div>
          <p className="mt-1 text-sm opacity-90 text-center">
            {t("instructions")}
          </p>
        </AlertDialogHeader>

        <div className="space-y-6 px-2">
          <div className="flex items-center justify-between">
            <h3 className=" font-medium text-gray-800">
              {t("selectCategoryService")}
            </h3>

            <div>
              {navigationStack.length > 0 && (
                <button
                  onClick={() => { handleBack();
                  }}
                  className="text-sm mx-2 text-[var(--interactive-color)] underline hover:text-[var(--active-color)] transition-colors"
                >
                  {t("back")}
                </button> 
              )}

              {navigationStack.length <= 0 && (
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-sm mx-2 text-[var(--interactive-color)] underline hover:text-[var(--active-color)] transition-colors"
                >
                  {t("back")}
                </button>
              )}

              <a
                href={"/services"}
                className="text-sm ml-2 text-[var(--interactive-color)] underline hover:text-[var(--active-color)] transition-colors"
              >
                {t("show_all")}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
            {currentLevel.map((item) => renderCard(item))}
          </div>
        </div>

        <AlertDialogFooter className="p-6 bg-gray-50 rounded-b-xl border-t border-gray-200 flex gap-3 items-center">
          <AlertDialogCancel className="bg-gray-100 text-interactive_color hover:bg-gray-300 hover:text-gray-900 transition-colors border border-interactive_color">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBook}
            disabled={!selectedService}
            className={`bg-interactive_color disabled:bg-[#5c4255] text-white disabled:cursor-not-allowed hover:bg-active_color transition-colors ${!selectedService ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {t("bookAppointment")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BookingModal;
