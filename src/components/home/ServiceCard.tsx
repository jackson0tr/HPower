'use client'
import Image from "next/image";
import parse from "html-react-parser";

interface ServiceCardProps {
  title: string;
  description?: string;
  image: string;
  id: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  image,
  id,
}) => {

  return (
    <div className="w-full rounded-xl overflow-hidden cursor-pointer">
      <div className="relative w-full h-64 md:h-72">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold mb-2 text-interactive_color">{title}</h3>
        {description && (
          <p className="text-interactive_color text-sm line-clamp-3">{parse(description)}</p>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
