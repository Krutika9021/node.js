import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const StarRating = ({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            star <= rating ? "fill-accent text-accent" : "text-muted-foreground",
            !readonly && "cursor-pointer hover:scale-110"
          )}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
