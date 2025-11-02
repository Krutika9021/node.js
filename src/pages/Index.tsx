import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Search, Tag } from "lucide-react";
import heroImage from "@/assets/hero-books.jpg";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setBooks(data);
      fetchRatings(data.map((b) => b.id));
    }
  };

  const fetchRatings = async (bookIds: string[]) => {
    const { data } = await supabase
      .from("ratings")
      .select("book_id, rating");

    if (data) {
      const ratingsMap: Record<string, { avg: number; count: number }> = {};
      
      bookIds.forEach((bookId) => {
        const bookRatings = data.filter((r) => r.book_id === bookId);
        if (bookRatings.length > 0) {
          const sum = bookRatings.reduce((acc, r) => acc + r.rating, 0);
          ratingsMap[bookId] = {
            avg: sum / bookRatings.length,
            count: bookRatings.length,
          };
        }
      });

      setRatings(ratingsMap);
    }
  };

  const genres = Array.from(new Set(books.map((b) => b.genre).filter(Boolean))) as string[];

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 max-w-2xl">
            Discover Your Next
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Great Read
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mb-8">
            Rate, review, and explore books from readers around the world
          </p>
        </div>
      </section>

      {/* Search & Books Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search books or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {genres.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Filter by Genre
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedGenre === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGenre(null)}
                >
                  All
                </Button>
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              {searchQuery ? "No books found matching your search" : "No books yet. Be the first to add one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url || undefined}
                averageRating={ratings[book.id]?.avg}
                totalRatings={ratings[book.id]?.count}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
