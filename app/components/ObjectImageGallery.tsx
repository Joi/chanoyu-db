import Image from 'next/image';
import Link from 'next/link';

interface MediaItem {
  id: string;
  uri: string;
  sort_order?: number;
}

interface ObjectImageGalleryProps {
  media: MediaItem[];
  title: string;
}

export default function ObjectImageGallery({ media, title }: ObjectImageGalleryProps) {
  if (!media.length) return null;
  
  if (media.length === 1) {
    return (
      <div className="relative w-full aspect-[4/3] bg-background rounded-lg overflow-hidden border border-border">
        <Link href={`/media/${media[0].id}`}>
          <Image 
            src={media[0].uri} 
            alt={title} 
            fill 
            sizes="(max-width: 1024px) 100vw, 1024px" 
            className="object-cover" 
          />
        </Link>
      </div>
    );
  }

  // Always show the first (featured) image as the main image
  const featuredImage = media[0];

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-background rounded-lg overflow-hidden border border-border">
        <Link href={`/media/${featuredImage.id}`}>
          <Image 
            src={featuredImage.uri} 
            alt={title} 
            fill 
            sizes="(max-width: 1024px) 100vw, 1024px" 
            className="object-cover" 
          />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {media.map((item, index) => (
          <Link
            key={item.id}
            href={`/media/${item.id}`}
            className={`relative w-full aspect-[4/3] bg-background rounded-md overflow-hidden border-2 transition-colors block ${
              index === 0 
                ? 'border-primary' 
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <Image 
              src={item.uri} 
              alt={`${title} - image ${index + 1}`} 
              fill 
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" 
              className="object-cover" 
            />
          </Link>
        ))}
      </div>
    </div>
  );
}