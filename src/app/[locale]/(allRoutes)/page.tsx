"use client";

import AddressPromptDialog from "@/components/home/AddressPromptDialog";
import Banner from "@/components/home/Banner";
import BookAnAppointment from "@/components/home/BookAnAppointment";
import ContactForm from "@/components/home/ContactForm";
import DownloadAppSection from "@/components/home/DownloadApp";
import FeaturedServices from "@/components/home/FeaturedServices";
import OurServices from "@/components/home/OurServices";
import Search from "@/components/home/Search";
import Slider from "@/components/home/Slider";
import Testimonials from "@/components/home/Testimonials";

export default function HomePage() {
  return (
    <div className="">
      <Slider />
      <div className="bg-transparent flex justify-center w-full relative">
        <Search />
      </div>
      <OurServices />
      <BookAnAppointment />
      <FeaturedServices />
      {/* <Pricing /> */}
      {/* <Partners /> */}
      <ContactForm fromHome />
      <Testimonials/>
      <Banner/>
      <DownloadAppSection/>

      <AddressPromptDialog />
    </div>
  );
}
