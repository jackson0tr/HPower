"use client";
import { useLocale, useTranslations } from "next-intl";
import {
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiMinus,
  FiPlus,
  FiX,
  FiCalendar,
} from "react-icons/fi";
import { AiOutlineLoading } from "react-icons/ai";
import CustomButton from "../ui/CustomButton";
import useUserDetails from "@/hooks/useUserDetails";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, MailCheck } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { BiErrorAlt } from "react-icons/bi";
import CancelBooking from "../profile/CancelBooking";
import Cookies from "js-cookie";
import SuccessSendVemail from "./SuccessSendVemail";
import parse from "html-react-parser";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface BookingFormProps {
  couponCode: string;
  setCouponCode: (value: string) => void;
  saveAddress: boolean;
  setSaveAddress: (value: boolean) => void;
  appliedCoupon: boolean;
  bookingLoading: boolean;
  service: any;
  isBookingDisabled: boolean;
  handleApplyCoupon: (formData: FormData) => Promise<void>;
  handleBooking: (formData: FormData) => Promise<void>;
  quantity: number;
  setQuantity: (value: number) => void;
  address: string;
  emirate: string;
  setAddress: (value: string) => void;
  setEmirate: (value: string) => void;
  hint: string;
  setHint: (value: string) => void;
  loadingCheck: boolean;
  hasBookedService: boolean;
  setShowSuccessPopup: (showSuccessPopup: boolean) => void;
  buildingNumber: string;
  setBuildingNumber: (value: string) => void;
  setApartmentName: (value: string) => void;
  apartmentName: string;
  setSelectedSavedAddressId: (value: string) => void;
  selectedSavedAddressId: string;
}

const BookingForm = ({
  couponCode,
  setCouponCode,
  saveAddress,
  setSaveAddress,
  appliedCoupon,
  bookingLoading,
  setSelectedSavedAddressId,
  selectedSavedAddressId,
  service,
  loadingCheck,
  isBookingDisabled,
  handleApplyCoupon,
  handleBooking,
  quantity,
  setQuantity,
  address,
  setAddress,
  hint,
  setHint,
  buildingNumber,
  setBuildingNumber,
  apartmentName,
  setApartmentName,
  hasBookedService,
  setShowSuccessPopup,
  emirate,
  setEmirate,
}: BookingFormProps) => {
  const t = useTranslations("SingleService");
  const { user, userType, loading } = useUserDetails();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [zIndex, setZIndex] = useState(10);
  const locale = useLocale();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { emirates: data } = useServices();
  const emirates = data?.emirates;
  const userId = user?.id;
  const [selectedEmirate, selectedCity] = address
    ? address.split(", ")
    : ["", ""];
  const [showDateTimePopup, setShowDateTimePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const dateTimePopupRef = useRef<HTMLDivElement>(null);
  const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const getAuthToken = () => Cookies.get("authToken") || "";

  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get("date");

  const getNextTwoWeeks = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const nextTwoWeeks = getNextTwoWeeks();

  useEffect(() => {
    if (dateFromUrl && service?.provider?.schedules) {
      const dateObj = new Date(dateFromUrl);

      if (!isNaN(dateObj.getTime())) {
        // dateObj.setDate(dateObj.getHours() + 24);
        const formattedDate = formatDateValue2(dateObj);

        const isInRange = nextTwoWeeks.some(
          (d) => formatDateValue2(d) === formattedDate
        );

        if (!isInRange) return;

        const isToday =
          new Date().toDateString() === dateObj.toDateString();

        const dayOfWeek = [
          "SUN",
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI",
          "SAT",
        ][dateObj.getDay()];

        const schedule = service.provider.schedules.find(
          (s: any) => s.day === dayOfWeek
        );

        const isClosed =
          schedule?.working_hours === "Closed" || isToday;

        if (!isClosed) {
          setSelectedDate(formattedDate);
          if (!selectedDate && !selectedTime) {
            setShowDateTimePopup(true);
          }
        }
      }
    }
  }, []);

  const formatDateValue2 = (date: Date): string => {
    const correctedDate = new Date(date);
    correctedDate.setDate(correctedDate.getDate() + 1);
    return correctedDate.toISOString().split("T")[0];
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const hourStr = hour % 12 === 0 ? 12 : hour % 12;
      const amPm = hour < 12 ? "AM" : "PM";
      slots.push(`${hourStr}:00 ${amPm}`);
      if (hour < 20) {
        slots.push(`${hourStr}:30 ${amPm}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const convertTo24HourFormat = (timeStr: string): string => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const getStartAt = () => {
    if (!selectedDate || !selectedTime) return "";
    const time24Hour = convertTo24HourFormat(selectedTime);
    return `${selectedDate} ${time24Hour}`;
  };

  const handleVerifyEmail = async () => {
    if (!user?.email) return;

    setIsVerifyLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?email=${user.email}&lang=${locale}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setShowVerifyEmailPopup(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t("verify_email_error"));
      }
    } catch (err) {
      setError(t("verify_email_error"));
    } finally {
      setIsVerifyLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationSelector(false);
        setZIndex(10);
      }
      if (
        dateTimePopupRef.current &&
        !dateTimePopupRef.current.contains(event.target as Node)
      ) {
        setShowDateTimePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setShowTermsPopup(true);
      return;
    }

    const formData = new FormData(e.currentTarget);

    const startAt = getStartAt();

    if (startAt) {
      formData.append("start_at", startAt);
      formData.append("ends_at", startAt);
    }

    formData.append("emirate", emirate);

    formData.append("num_cleaner", cleaners.toString());
    formData.append("stay_hours", hours.toString());
    formData.append("cleaning_times", frequency);
    formData.append("cleaning_need", needsCleaningMaterials ? "1" : "0");
    formData.append("special_instructions", specialInstructions);

    handleBooking(formData);
  };

  console.log("service", service)

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, quantity + amount);
    if (newQuantity > service.qty_limit) {
      toast.error(t("quantity_limit_reached", { limit: service.qty_limit }), {
        duration: 4000,
        position: "top-center",
      });
      return;
    }
    setQuantity(newQuantity);
  };

  const calculateTotalPrice = (quantity: number) => {
    if (quantity <= 1) return parseFloat(service.price);
    return (parseFloat(service.price) + (quantity - 1) * 1800).toFixed(2);
  };

  const handleLocationSelect = (emirateSlug: string, cityName?: string) => {
    const emirateName = Object.keys(emirates).find((key) =>
      emirates[key].some((city: any) => city.slug === emirateSlug)
    );
    const newEmirate = cityName
      ? `${emirateName}, ${cityName}`
      : emirateName || emirateSlug;

    setEmirate(newEmirate);
    setShowLocationSelector(false);
    setZIndex(10);
  };

  const toggleLocationSelector = () => {
    if (!isProvider && !isBookingDisabled) {
      setShowLocationSelector(!showLocationSelector);
      setZIndex(showLocationSelector ? 10 : 1000);
    }
  };

  const toggleDateTimePopup = () => {
    if (!isProvider && !isBookingDisabled) {
      setShowDateTimePopup(!showDateTimePopup);
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleTimeSelect = (timeStr: string) => {
    setSelectedTime(timeStr);
    if (selectedDate) {
      setShowDateTimePopup(false);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const formatDateValue = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isProvider = userType !== "user";
  const userNotVerified = user?.email_verified_at === null;
  const isFormDisabled =
    loadingCheck ||
    userNotVerified ||
    userType !== "user" ||
    isBookingDisabled ||
    hasBookedService;

  const to24Hour = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours + minutes / 60;
  };

  const isWithinWorkingHours = (
    timeSlot: string,
    workingHours: string
  ): boolean => {
    if (workingHours === "Closed") return false;
    const [start, end] = workingHours.split(" - ").map(to24Hour);
    const slot = to24Hour(timeSlot);
    return slot >= start && slot <= end;
  };

  const [cleaners, setCleaners] = useState<number>(1);
  const [hours, setHours] = useState<number>(4);
  const [frequency, setFrequency] = useState<string>("once");
  const [needsCleaningMaterials, setNeedsCleaningMaterials] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');


  const formatSlug = (slug?: string) => {
    if (!slug) return "-";

    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const latestBooking = user?.bookings?.reduce((latest, current) =>
    current.id > (latest?.id ?? 0) ? current : latest,
    null
  );

  useEffect(() => {
    setEmirate(emirate ? emirate : user?.address);
    // setAddress(address ? address : latestBooking?.address);
  }, [user?.address]);

  const handleSavedAddressChange = (e) => {
    const selectedId = e.target.value;
    setSelectedSavedAddressId(selectedId);

    const selected = user.addresses.find((a) => a.id == selectedId);
    if (selected) {
      setAddress(selected.address || "");
      setApartmentName(selected.apartment_name || "");
      setBuildingNumber(selected.building_number || "");
    }
  };


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dateTimePopupRef.current &&
        !dateTimePopupRef.current.contains(event.target as Node)
      ) {
        setShowDateTimePopup(false);
      }
    }

    if (showDateTimePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDateTimePopup]);

  return (
    <>
      <Toaster />

      <div className="mb-8 p-3 rounded-xl">
        {hasBookedService && (
          <div className="mb-8 p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
            <div className="flex items-start gap-3">
              <BiErrorAlt className="flex-shrink-0 h-6 w-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800 mb-1">
                  {t("already_booked_message")}
                </h3>
              </div>
            </div>
            <CancelBooking
              bookingId={service.booking_id}
              status={service.payment_status.toLowerCase()}
              serviceName={service.name}
              userName={user?.name}
              userEmail={user?.email}
              userPhone={user?.phone_number}
              providerEmail={service.provider.email}
              providerName={service.provider.name}
              providerPhone={service.provider.phone_number}
              setShowSuccessPopup={setShowSuccessPopup}
            />
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          {t("apply_coupon")}
        </h3>
        <form
          action={handleApplyCoupon}
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyCoupon(new FormData(e.currentTarget));
          }}
          className="flex flex-col md:flex-row gap-4"
        >
          <input
            type="text"
            name="code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={t("enter_coupon_placeholder")}
            className={`flex-1 px-4 py-1 border border-interactive_color rounded-lg focus:border-interactive_color bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300 shadow-sm hover:shadow-md ${appliedCoupon || userType !== "user" || userNotVerified
              ? "opacity-50 cursor-not-allowed border-gray-400"
              : ""
              }`}
            disabled={
              appliedCoupon ||
              userNotVerified ||
              userType !== "user" ||
              isBookingDisabled ||
              hasBookedService
            }
          />
          <input type="hidden" name="service_id" value={service.id} />
          <button
            type="submit"
            disabled={
              loadingCheck ||
              userNotVerified ||
              appliedCoupon ||
              userType !== "user" ||
              isBookingDisabled ||
              hasBookedService
            }
            className={`px-6 py-3 ${appliedCoupon
              ? "bg-green-500 hover:bg-green-500"
              : "bg-interactive_color hover:bg-active_color"
              } text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${loadingCheck ||
                userNotVerified ||
                appliedCoupon ||
                userType !== "user" ||
                isBookingDisabled ||
                hasBookedService
                ? "opacity-70 cursor-not-allowed"
                : ""
              } flex items-center justify-center gap-2`}
          >
            {loadingCheck ? (
              <>
                <AiOutlineLoading className="animate-spin h-4 w-4 text-white" />
                {t("applying")}
              </>
            ) : appliedCoupon ? (
              <>
                <FiCheck className="h-5 w-5 font-bold" />
                {t("applied")}
              </>
            ) : (
              t("apply")
            )}
          </button>
        </form>
        {userType === "provider" && !loading && (
          <p className="mt-2 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md p-3">
            <svg
              className="w-5 h-5 mr-2 mt-0.5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.593c.75 1.334-.213 2.983-1.742 2.983H3.48c-1.53 0-2.492-1.65-1.742-2.983L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z"
                clipRule="evenodd"
              />
            </svg>
            {t("provider_note")}
          </p>
        )}
        {userNotVerified && !loading && (
          <div className="mt-4 p-3 flex items-center justify-between gap-4 border border-yellow-300 bg-yellow-100 text-yellow-800 text-md rounded-md shadow-sm">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 mt-0.5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.593c.75 1.334-.213 2.983-1.742 2.983H3.48c-1.53 0-2.492-1.65-1.742-2.983L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z"
                  clipRule="evenodd"
                />
              </svg>
              <span> {t("userNotVerified_note")}</span>
            </div>
            <button
              onClick={handleVerifyEmail}
              className={`w-full sm:w-auto px-6 py-3 whitespace-nowrap ${isVerifyLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-interactive_color hover:bg-active_color"
                } text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:shadow-md flex items-center justify-center gap-2`}
              disabled={isVerifyLoading}
            >
              <MailCheck className="h-5 w-5" />
              {isVerifyLoading ? <>{t("sending")}</> : t("resend")}
            </button>
          </div>
        )}
        {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
        {!user && !loading && (
          <div className="mt-4 p-3 flex items-center justify-between gap-4 border border-yellow-300 bg-yellow-100 text-yellow-800 text-md rounded-md shadow-sm">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 mt-0.5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.593c.75 1.334-.213 2.983-1.742 2.983H3.48c-1.53 0-2.492-1.65-1.742-2.983L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t("no_user_note")}</span>
            </div>
            <CustomButton children={t("login")} actionLink="/sign-in" />
          </div>
        )}
      </div>

      {showVerifyEmailPopup && (
        <SuccessSendVemail onClose={() => setShowVerifyEmailPopup(false)} />
      )}

      {showTermsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex confi items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">
                {t("terms_and_conditions")}
              </h3>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="prose prose-sm text-gray-700 mb-6">
              {parse(service.terms)}
            </div>

            <div className="flex items-center mb-6 gap-2">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-5 w-5 text-white focus:ring-interactive_color border-gray-300 rounded"
              />
              <label
                htmlFor="agreeTerms"
                className="text-sm text-gray-700 font-medium"
              >
                {t("agree_to_terms")}
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTermsPopup(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              >
                {t("cancel")}
              </button>
              {/* button */}
              <button
                onClick={() => {
                  if (agreedToTerms) {
                    setShowTermsPopup(false);
                    setAgreedToTerms(true);
                  }
                }}
                disabled={!agreedToTerms}
                className={`px-4 py-2 rounded-md transition-colors ${agreedToTerms
                  ? "bg-interactive_color text-white hover:bg-interactive_color"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        id="booking-form"
        onSubmit={handleBookingSubmit}
        className="space-y-6 p-3 bg-white rounded-xl shadow-md"
      >
        {userType === "user" && (
          <div className="mb-4 p-2 bg-gray-100 border-l-4 border-interactive_color rounded-lg">
            <p className="text-xs font-medium text-interactive_color">
              {t("booking_requirements_guide")}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between gap-10">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("quantity")}
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="px-4 py-2 bg-interactive_color hover:bg-active_color text-white transition-colors duration-300"
                disabled={isFormDisabled}
              >
                <FiMinus className="h-5 w-5" />
              </button>
              <input
                type="number"
                name="quantity"
                value={quantity}
                readOnly
                className="w-full px-4 py-2 text-center border-0 focus:ring-0 outline-none bg-gray-100"
                min="1"
                required
                disabled={isFormDisabled}
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="px-4 py-2 bg-interactive_color hover:bg-active_color text-white transition-colors duration-300"
                disabled={isFormDisabled}
              >
                <FiPlus className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t("max_quantity")}: {service.qty_limit}
            </p>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("emirate")}
            </label>

            <select
              name="emirate"
              value={emirate}
              onChange={(e) => setEmirate(e.target.value)}
              disabled={isFormDisabled}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${isFormDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-interactive_color"
                }`}
              required
            >
              <option value="">{t("select_location_placeholder")}</option>

              {service.addresses && service.addresses.map((item, index) => (
                <option key={index} value={item.address}>
                  <span className="font-medium">{formatSlug(item?.address)}</span> — {t("service_charge")}:
                  <Image
                    src="/aed.svg"
                    width={12}
                    height={12}
                    alt="AED"
                    className="inline-block hover:scale-110 transition-transform duration-200"
                  /> {item.service_charge}
                </option>
              ))}
            </select>


          </div>
        </div>

        {
          service?.category_id === "22" && (
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("cleaners_num")}</label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCleaners(num)}
                      className={`w-10 h-10 rounded-full border text-sm font-medium ${cleaners === num
                        ? "bg-interactive_color text-white"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("cleaners_hours")}
                </label>
                <div className="flex gap-4 overflow-x-auto pb-3 px-1 md:flex-wrap md:overflow-x-visible md:px-0">
                  {[2, 3, 4, 5, 6].map((hour) => {
                    // const price = hour <= 3 ? 35 : 33;
                    let price;
                    if (hour === 2) price = 39;
                    else if (hour === 3) price = 35;
                    else price = 33;
                    return (
                      <div key={hour} className="flex flex-col items-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setHours(hour)}
                          className={`w-10 h-10 rounded-full border text-sm font-medium relative ${hours === hour
                            ? "bg-interactive_color text-white border-interactive_color"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                          {hour}
                          {hour === 4 && (
                            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 z-10">
                              {t("popular")}
                            </span>
                          )}
                        </button>
                        <div className="text-xs mt-1 font-normal">
                          AED {price}/hr
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("often_cleaning")}</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start justify-between border rounded-lg px-9 py-3 cursor-pointer hover:bg-gray-50 w-full">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t("once")}</span>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                        <li>{t("book_time")}</li>
                      </ul>
                    </div>

                    <input
                      type="radio"
                      name="frequency"
                      value="once"
                      checked={frequency === "once"}
                      onChange={() => setFrequency("once")}
                      className="mt-1"
                    />
                  </label>

                  <label
                    className="relative flex items-start gap-2 border rounded-lg px-9 py-3 cursor-pointer w-full overflow-hidden"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    <div className="flex flex-col w-full relative z-10">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-medium">{t("weekly")}</span>
                        <span className="text-xs text-white rounded-full px-2 py-1 bg-orange-500">
                          {t("10_off")}
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                        <li>{t("same_cleaner")}</li>
                        <li>{t("reschedule_app")}</li>
                      </ul>
                    </div>

                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={frequency === "weekly"}
                      onChange={() => setFrequency("weekly")}
                      className={`mt-1 relative z-10 ${locale === "ar" ? "ml-auto" : "mr-auto"}`}
                    />

                    <div
                      className={`absolute top-5 ${locale === "ar" ? "right-0" : "left-0"} z-20 `}
                    >
                      <div
                        className={` bg-orange-500 text-white text-xs font-semibold px-3 pt-[16px] pb-[1px] shadow-md ${locale === "ar"
                          ? "rotate-45 origin-top-right !px-6 translate-x-[22px] translate-y-[6px]"
                          : "-rotate-45 origin-top-left -translate-x-[22px] translate-y-[6px]"} `}
                      >
                        {t("popular")}
                      </div>
                    </div>
                  </label>

                  <label className="flex flex-row-reverse items-start gap-2 border rounded-lg px-9 py-3 cursor-pointer hover:bg-gray-50 w-full">
                    <input
                      type="radio"
                      name="frequency"
                      value="multiple"
                      checked={frequency === "multiple"}
                      onChange={() => setFrequency("multiple")}
                      className="mt-1"
                    />

                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-medium">{t("multiple")}</span>
                        <span className="text-xs text-white rounded-full px-2 py-1 bg-orange-500">{t("15_off")}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                        <li>{t("same_cleaner")}</li>
                        <li>{t("reschedule_app")}</li>
                      </ul>
                    </div>
                  </label>

                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("cleaning_material")}
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    {t("additional_charge")}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${needsCleaningMaterials
                        ? 'bg-interactive_color text-white border-interactive_color'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      onClick={() => setNeedsCleaningMaterials(true)}
                    >
                      {t("yes")}
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${!needsCleaningMaterials
                        ? 'bg-interactive_color text-white border-interactive_color'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      onClick={() => setNeedsCleaningMaterials(false)}
                    >
                      {t("no")}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("special_instructions")}
                  </label>
                  <textarea
                    className="w-full border border-interactive_color rounded-lg px-4 py-3 text-sm focus:ring-orange-500 focus:border-orange-500"
                    // placeholder="Example: Please focus on the kitchen and bathroom"
                    rows={3}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>
              </div>

            </div>
          )
        }




        <div className="flex flex-col gap-4 justify-between">
          {/* Saved Address Selector */}
          {user?.addresses?.length > 0 &&
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("saved_addresses")}
              </label>
              <select
                name="saved_address"
                value={selectedSavedAddressId}
                onChange={handleSavedAddressChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${isFormDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-interactive_color"
                  }`}
              >
                <option value="">{t("select_saved_address")}</option>
                {user?.addresses?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.address}
                  </option>
                ))}
              </select>
            </div>}

          {/* Address Textarea */}
          <div className="flex  flex-col  ">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("address")}
              </label>
              <textarea
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isFormDisabled}
                placeholder={t("enter_your_address_placeholder")}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 resize-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${isFormDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-interactive_color"
                  }`}
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <input
                type="checkbox"
                id="save_address"
                name="save_address"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />

              <label htmlFor="save_address" className="text-sm text-gray-700">
                {t("save_address_label")}
              </label>
            </div>
          </div>

          {/* Apartment & Building */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("apartment_name")}
              </label>
              <input
                type="text"
                value={apartmentName}
                onChange={(e) => setApartmentName(e.target.value)}
                disabled={isFormDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("building_number")}
              </label>
              <input
                type="text"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
                disabled={isFormDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>


        <div className="w-full relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("booking_datetime") || "Booking Date & Time"}
          </label>
          <div
            onClick={isFormDisabled ? () => { } : toggleDateTimePopup}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-between transition-all duration-300 ${isFormDisabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-interactive_color focus:ring-2 focus:ring-indigo-100"
              }`}
          >
            <span
              className={
                selectedDate && selectedTime ? "text-gray-900" : "text-gray-500"
              }
            >
              {selectedDate && selectedTime
                ? `${selectedDate} at ${selectedTime}`
                : t("select_datetime_placeholder") || "Select date and time"}
            </span>
            <FiCalendar className="h-5 w-5 text-gray-500" />
          </div>

          {showDateTimePopup && (
            <div
              ref={dateTimePopupRef}
              className="absolute z-50 mt-2 w-full max-w-lg bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row max-h-[75vh] overflow-y-auto">
                {/* Left side – Dates */}
                <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="p-3 bg-interactive_color text-white text-center text-sm md:text-base font-medium">
                    {t("select_date") || "Select Date"}
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                    {nextTwoWeeks.map((date, index) => {
                      const dateStr = formatDateValue(date);

                      const isToday =
                        new Date().toDateString() === date.toDateString();

                      const dayOfWeek = [
                        "SUN",
                        "MON",
                        "TUE",
                        "WED",
                        "THU",
                        "FRI",
                        "SAT",
                      ][date.getDay()];

                      const schedule = service.provider.schedules.find(
                        (s: any) => s.day === dayOfWeek
                      );

                      const isClosed =
                        schedule?.working_hours === "Closed" || isToday;

                      const isSelected = selectedDate === dateStr;

                      return (
                        <div
                          key={index}
                          onClick={() => !isClosed && handleDateSelect(dateStr)}
                          className={`p-3 transition-colors duration-200 rounded-md mb-1 flex items-center justify-between ${isClosed
                            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                            : isSelected
                              ? "bg-interactive_color text-white"
                              : "cursor-pointer hover:bg-gray-100"
                            }`}
                        >
                          <span>{formatDateForDisplay(date)}</span>
                          {isSelected && <FiCheck className="h-4 w-4" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full md:w-1/2">
                  <div className="p-3 bg-interactive_color text-white text-center text-sm md:text-base font-medium">
                    {t("select_time") || "Select Time"}
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {timeSlots.map((time, idx) => {
                        const selectedDay = new Date(
                          selectedDate || Date.now()
                        ).getDay();
                        const dayName = [
                          "SUN",
                          "MON",
                          "TUE",
                          "WED",
                          "THU",
                          "FRI",
                          "SAT",
                        ][selectedDay];
                        const schedule = service.provider.schedules.find(
                          (s: any) => s.day === dayName
                        );
                        const workingHours = schedule?.working_hours || "";
                        const isEnabled = isWithinWorkingHours(
                          time,
                          workingHours
                        );
                        const isSelected = selectedTime === time;

                        return (
                          <div
                            key={idx}
                            onClick={() => isEnabled && handleTimeSelect(time)}
                            className={`p-2 text-center rounded-md mb-1 ${!isEnabled
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200"
                              : isSelected
                                ? "bg-interactive_color text-white"
                                : "hover:bg-gray-100 border border-gray-200 cursor-pointer"
                              }`}
                          >
                            {time}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDateTimePopup(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200 text-sm"
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDate && selectedTime) {
                      setShowDateTimePopup(false);
                    }
                  }}
                  disabled={!selectedDate || !selectedTime}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm transition-colors duration-200 ${selectedDate && selectedTime
                    ? "bg-interactive_color text-white hover:bg-active_color"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {t("confirm") || "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("hint")}
          </label>
          <input
            type="text"
            name="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-interactive_color bg-gray-100 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
            disabled={isFormDisabled}
          />
        </div>

        <div className="flex items-center mt-2 gap-2">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 text-interactive_color focus:ring-interactive_color border-gray-300 rounded"
            disabled={isFormDisabled}
          />

          <label
            htmlFor="agreeTerms"
            className="ml-2 text-sm text-gray-700 cursor-pointer flex gap-1"
            onClick={() => setShowTermsPopup(true)}
          >
            <p> {t("agree_to")}</p>
            <p className="underline text-active_color hover:text-interactive_color">
              {" "}
              {t("terms_and_conditions")}
            </p>
          </label>
        </div>

        <input type="hidden" name="service_id" value={service.id} />
        <input type="hidden" name="user_id" value={userId} />
        <input
          type="hidden"
          name="coupon"
          value={appliedCoupon ? couponCode : ""}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            className={`w-full sm:w-auto px-6 py-3 ${isFormDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-interactive_color hover:bg-active_color"
              } text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:shadow-md flex items-center justify-center gap-2`}
            disabled={isFormDisabled}
          >
            <FiClock className="h-5 w-5" />
            {bookingLoading ? (
              <>
                <AiOutlineLoading className="animate-spin h-4 w-4 text-white" />
                {t("booking")}
              </>
            ) : isFormDisabled ? (
              t("bookig_unavailable")
            ) : (
              t("book_now")
            )}
          </button>
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 border-2 border-interactive_color text-interactive_color font-semibold rounded-lg hover:bg-active_color hover:text-white transition-all duration-300 items-center justify-center gap-2 hidden"
            disabled={isProvider}
          >
            <FiMessageSquare className="h-5 w-5" />
            {t("contact_provider")}
          </button>
        </div>
      </form >
    </>
  );
};

export default BookingForm;
