'use client';

import { useTestimonials } from "@/hooks/useTestimonials";
import Image from "next/image";
import Loader from "../ui/Loader";

const Banner = () => {
    const { testimonials } = useTestimonials();
    const isLoading = !testimonials?.data;
    const bannerImg = testimonials?.banner_img;

    return (
        <section className="bg-secondary_beg py-16 container mx-auto px-4">
            <div className="flex justify-center items-center">
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        {bannerImg && (
                            <Image
                                src={bannerImg}
                                alt="Banner"
                                width={800}
                                height={400}
                                // className="rounded-xl"
                            />
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default Banner;
