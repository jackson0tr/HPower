"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { ChevronDown, Edit, MapPin, Upload, File, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useServices } from "@/hooks/useServices";

interface EditProfileModalProps {
  email: string;
  phoneNumber: string;
  username: string;
  name: string;
  userType: string;
  address?: string;
  onUpdateProfile: (data: {
    email?: string;
    phoneNumber?: string;
    username?: string;
    name?: string;
    password?: string;
    userType?: string;
    address?: string;
  }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  email,
  phoneNumber,
  username,
  name,
  userType,
  address,
  onUpdateProfile,
}) => {
  const t = useTranslations("editProfile");
  const t2 = useTranslations("profile");

  const [newEmail, setNewEmail] = useState(email);
  const [newPhoneNumber, setNewPhoneNumber] = useState(phoneNumber);
  const [newName, setNewName] = useState(name);
  const [newAddress, setNewAddress] = useState(address);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"contact" | "password" | "addresses" | "id_upload">("contact");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { emirates } = useServices();

  // ID Upload states
  const [frontId, setFrontId] = useState<File | null>(null);
  const [backId, setBackId] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const frontIdRef = useRef<HTMLInputElement>(null);
  const backIdRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  // Get auth token
  const getAuthToken = () => Cookies.get("authToken") || "";

  // Update state when props change
  useEffect(() => {
    setNewEmail(email);
    setNewPhoneNumber(phoneNumber);
    setNewName(name);
    setNewAddress(address);
  }, [email, phoneNumber, username, name, address]);

  // Reset password fields when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("contact");
      // Reset ID upload fields
      setFrontId(null);
      setBackId(null);
      setSelfie(null);
    }
  }, [open]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file type
      if (!file.type.match("image.*")) {
        toast.error(t("invalid_file_type"));
        return;
      }
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("file_too_large"));
        return;
      }
      setter(file);
    }
  };

  const removeFile = (
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    setter(null);
    if (ref.current) {
      ref.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (activeTab === "id_upload") {
      // Handle ID upload
      if (!frontId || !backId) {
        toast.error(t("id_required"));
        setIsLoading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("front_id", frontId);
        formData.append("back_id", backId);
        if (selfie) formData.append("selfie", selfie);
        formData.append("user_type", userType);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile/upload-id`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || t("id_upload_failed"));
        }

        if (result.success) {
          toast.success(t("id_upload_success"));
          setOpen(false);
        } else {
          throw new Error(t("id_upload_failed"));
        }
      } catch (error: any) {
        toast.error(error.message || t("id_upload_failed"));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Existing contact/password update logic
    const updateData: {
      email?: string;
      phone_number?: string;
      username?: string;
      name?: string;
      password?: string;
      address?: string;
      current_password?: string;
      user_type?: string;
    } = { user_type: userType };

    if (activeTab === "contact") {
      if (newEmail !== email) updateData.email = newEmail;
      if (newAddress !== address) updateData.address = newAddress;
      if (newPhoneNumber !== phoneNumber)
        updateData.phone_number = newPhoneNumber;
      if (newName !== name) updateData.name = newName;
    } else if (activeTab === "password") {
      if (newPassword && newPassword === confirmPassword) {
        updateData.password = newPassword;
        updateData.current_password = currentPassword;
      } else {
        toast.error(t("passwords_dont_match"));
        setIsLoading(false);
        return;
      }
    }

    // Only send update if there are changes
    if (Object.keys(updateData).length === 1 && updateData.user_type) {
      toast.error(t("no_changes"));
      setIsLoading(false);
      setOpen(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("update_failed"));
      }

      if (result.success) {
        // Fetch the latest user data to ensure consistency
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/${userType}/me`,
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
          }
        );

        const userResult = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(userResult.message_en || t("fetch_user_failed"));
        }

        const updatedUserData = {
          email: userResult.data.email,
          phoneNumber: userResult.data.phone_number,
          username: userResult.data.username,
          name: userResult.data.name,
          address: userResult.data?.address,
          userType: userResult.data.user_type,
        };

        onUpdateProfile(updatedUserData);
        toast.success(t("update_success"));
        router.push("/profile");
        setOpen(false);
      } else {
        throw new Error(t("update_failed"));
      }
    } catch (error: any) {
      toast.error(error.message || t("update_failed"));
      router.prefetch("/profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <motion.button
          className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-interactive_color hover:bg-active_color text-white rounded-lg shadow-md transition-all duration-300 ease-in-out font-medium"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Edit className="h-4 w-4 mr-2" />
          {t("edit_profile")}
        </motion.button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle
            className="text-xl font-bold text-gray-800"
            dir="auto"
          >
            {t("edit_profile")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600" dir="auto">
            {t("update_profile_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex border-b mb-2">
          <button
            className={`py-2 px-4 transition-colors duration-200 ${activeTab === "contact"
              ? "border-b-2 border-interactive_color text-interactive_color font-medium"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab("contact")}
          >
            {t("contact_info")}
          </button>
          <button
            className={`py-2 px-4 transition-colors duration-200 ${activeTab === "id_upload"
              ? "border-b-2 border-interactive_color text-interactive_color font-medium"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab("id_upload")}
          >
            {t("id_upload")}
          </button>
          <button
            className={`py-2 px-4 transition-colors duration-200 ${activeTab === "password"
              ? "border-b-2 border-interactive_color text-interactive_color font-medium"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab("password")}
          >
            {t("change_password")}
          </button>
        </div>

        {activeTab === "contact" && (
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("name_label")}
              </label>
              <input
                type="text"
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("name_placeholder")}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("email_label")}
              </label>
              <input
                type="email"
                id="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("email_placeholder")}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("phone_label")}
              </label>
              <input
                type="tel"
                id="phone"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("phone_placeholder")}
              />
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("current_password_label")}
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("current_password_placeholder")}
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("new_password_label")}
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("new_password_placeholder")}
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
                dir="auto"
              >
                {t("confirm_password_label")}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-interborder-interactive_color focus:border-interactive_color transition-colors duration-200"
                placeholder={t("confirm_password_placeholder")}
              />
              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500 mt-1" dir="auto">
                    {t("passwords_dont_match")}
                  </p>
                )}
            </div>
          </div>
        )}

        {activeTab === "id_upload" && (
          <div className="space-y-6 py-2">
            <div className="text-sm text-gray-600 mb-2">
              {t("id_upload_description")}
            </div>

            {/* Front ID Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("front_id_label")} *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={frontIdRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setFrontId)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontIdRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Upload size={16} />
                  {t("choose_file")}
                </button>
                {frontId ? (
                  <div className="flex items-center gap-2 text-sm">
                    <File size={16} className="text-gray-600" />
                    <span className="truncate max-w-[150px]">{frontId.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(setFrontId, frontIdRef)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">{t("no_file_chosen")}</span>
                )}
              </div>
            </div>

            {/* Back ID Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("back_id_label")} *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={backIdRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setBackId)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backIdRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Upload size={16} />
                  {t("choose_file")}
                </button>
                {backId ? (
                  <div className="flex items-center gap-2 text-sm">
                    <File size={16} className="text-gray-600" />
                    <span className="truncate max-w-[150px]">{backId.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(setBackId, backIdRef)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">{t("no_file_chosen")}</span>
                )}
              </div>
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("selfie_label")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={selfieRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setSelfie)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => selfieRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Upload size={16} />
                  {t("choose_file")}
                </button>
                {selfie ? (
                  <div className="flex items-center gap-2 text-sm">
                    <File size={16} className="text-gray-600" />
                    <span className="truncate max-w-[150px]">{selfie.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(setSelfie, selfieRef)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">{t("no_file_chosen")}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("selfie_description")}
              </p>
            </div>

            <div className="text-xs text-gray-500">
              <p>{t("file_requirements")}</p>
              <p className="mt-1">{t("max_file_size")}</p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-4 py-2 bg-interactive_color text-white rounded-lg hover:bg-active_color transition-colors duration-200 ${isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isLoading
              ? activeTab === "id_upload"
                ? t("uploading")
                : t("saving")
              : activeTab === "id_upload"
                ? t("upload_id")
                : t("save_changes")
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditProfileModal;