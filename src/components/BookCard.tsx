import { Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  averageRating?: number;
  totalRatings?: number;
}

const BookCard = ({ id, title, author, coverUrl, averageRating = 0, totalRatings = 0 }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer group hover:shadow-[var(--shadow-hover)] transition-all duration-300 overflow-hidden"
      onClick={() => navigate(`/book/${id}`)}
      style={{ boxShadow: 'var(--shadow-book)' }}
    >
      <div className="aspect-[2/3] overflow-hidden bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <span className="text-4xl font-bold text-muted-foreground/30">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <CardContent className="pt-4 pb-2">
        <h3 className="font-bold text-lg line-clamp-2 mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{author}</p>
      </CardContent>
      <CardFooter className="pt-0 flex items-center gap-1">
        <Star className="h-4 w-4 fill-accent text-accent" />
        <span className="font-semibold text-sm">
          {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
        </span>
        {totalRatings > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({totalRatings})
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default BookCard;
