import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Hash, Tag, BookOpen, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  isbn: string | null;
  published_year: number | null;
  genre: string | null;
}

interface Review {
  id: string;
  review_text: string;
  created_at: string;
  profiles: {
    username: string | null;
  };
}

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  useEffect(() => {
    if (id) {
      fetchBook();
      fetchRatings();
      fetchReviews();
    }
  }, [id, user]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      setBook(data);
    }
  };

  const fetchRatings = async () => {
    const { data } = await supabase
      .from("ratings")
      .select("rating, user_id")
      .eq("book_id", id);

    if (data) {
      setTotalRatings(data.length);
      if (data.length > 0) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating(sum / data.length);
      }

      if (user) {
        const userRatingData = data.find((r) => r.user_id === user.id);
        if (userRatingData) {
          setUserRating(userRatingData.rating);
        }
      }
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select(`
        id,
        review_text,
        created_at,
        profiles (
          username
        )
      `)
      .eq("book_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data as any);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to rate books",
        variant: "destructive",
      });
      return;
    }

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from("ratings")
      .select("id")
      .eq("book_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    
    if (existingRating) {
      // Update existing rating
      const result = await supabase
        .from("ratings")
        .update({ rating })
        .eq("id", existingRating.id);
      error = result.error;
    } else {
      // Insert new rating
      const result = await supabase
        .from("ratings")
        .insert({ book_id: id, user_id: user.id, rating });
      error = result.error;
    }

    if (error) {
      console.error("Rating error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save rating",
        variant: "destructive",
      });
    } else {
      setUserRating(rating);
      fetchRatings();
      toast({
        title: "Rating saved!",
      });
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to write reviews",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review required",
        description: "Please write a review",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .upsert({ book_id: id, user_id: user.id, review_text: reviewText });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save review",
        variant: "destructive",
      });
    } else {
      setReviewText("");
      fetchReviews();
      toast({
        title: "Review posted!",
      });
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Book deleted successfully",
      });
      navigate("/");
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Button>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/edit-book/${id}`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Book
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Book
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          <div className="space-y-4">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted" style={{ boxShadow: 'var(--shadow-book)' }}>
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={`${book.title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span className="text-6xl font-bold text-muted-foreground/30">
                    {book.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {user && (
              <Button 
                className="w-full gap-2" 
                onClick={() => navigate(`/read/${id}`)}
              >
                <BookOpen className="h-4 w-4" />
                Read Book
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{book.author}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {book.genre && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {book.genre}
                  </div>
                )}
                {book.published_year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {book.published_year}
                  </div>
                )}
                {book.isbn && (
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    {book.isbn}
                  </div>
                )}
              </div>
            </div>

            {book.description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="font-semibold mb-2">About this book</h2>
                  <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h2 className="font-semibold mb-3">Overall Rating</h2>
                  <div className="flex items-center gap-3">
                    <StarRating rating={Math.round(averageRating)} readonly size="lg" />
                    <div>
                      <p className="font-bold text-2xl">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</p>
                      <p className="text-sm text-muted-foreground">{totalRatings} ratings</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h2 className="font-semibold mb-3">Your Rating</h2>
                  {user ? (
                    <StarRating rating={userRating} onRatingChange={handleRating} size="lg" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Login to rate this book</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold">Write a Review</h2>
                {user ? (
                  <>
                    <Textarea
                      placeholder="Share your thoughts about this book..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleReviewSubmit}>Post Review</Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Login to write a review</p>
                )}
              </CardContent>
            </Card>

            {reviews.length > 0 && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold">Reviews ({reviews.length})</h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.profiles?.username || "Anonymous"}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{book?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookDetail;
