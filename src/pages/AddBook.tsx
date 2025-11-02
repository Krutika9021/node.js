import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  author: z.string().min(1, "Author is required").max(100, "Author name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  coverUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  isbn: z.string().max(20, "ISBN too long").optional(),
  publishedYear: z.number().min(1000).max(new Date().getFullYear() + 1).optional(),
  genre: z.string().max(50, "Genre too long").optional(),
});

const AddBook = () => {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [genre, setGenre] = useState("");
  const [bookContent, setBookContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!id;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      fetchBookData();
    }
  }, [id, isEditMode]);

  const fetchBookData = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      setTitle(data.title);
      setAuthor(data.author);
      setDescription(data.description || "");
      setCoverUrl(data.cover_url || "");
      setIsbn(data.isbn || "");
      setPublishedYear(data.published_year?.toString() || "");
      setGenre(data.genre || "");
      setBookContent(data.book_content || "");
    } else {
      toast({
        title: "Error",
        description: "Failed to load book data",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "Only admins can manage books",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setUser(session.user);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = bookSchema.parse({
        title,
        author,
        description: description || undefined,
        coverUrl: coverUrl || undefined,
        isbn: isbn || undefined,
        publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
        genre: genre || undefined,
      });

      let error;
      
      if (isEditMode) {
        const result = await supabase
          .from("books")
          .update({
            title: validatedData.title,
            author: validatedData.author,
            description: validatedData.description || null,
            cover_url: validatedData.coverUrl || null,
            isbn: validatedData.isbn || null,
            published_year: validatedData.publishedYear || null,
            genre: validatedData.genre || null,
            book_content: bookContent || null,
          })
          .eq("id", id);
        error = result.error;
      } else {
        const result = await supabase.from("books").insert({
          title: validatedData.title,
          author: validatedData.author,
          description: validatedData.description || null,
          cover_url: validatedData.coverUrl || null,
          isbn: validatedData.isbn || null,
          published_year: validatedData.publishedYear || null,
          genre: validatedData.genre || null,
          book_content: bookContent || null,
          created_by: user.id,
        });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: isEditMode ? "Book updated successfully." : "Book added successfully.",
      });
      navigate(isEditMode ? `/book/${id}` : "/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add book",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{isEditMode ? "Edit Book" : "Add a New Book"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  type="text"
                  placeholder="The Great Gatsby"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Author *</label>
                <Input
                  type="text"
                  placeholder="F. Scott Fitzgerald"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of the book..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Input
                    type="text"
                    placeholder="Fiction"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Published Year</label>
                  <Input
                    type="number"
                    placeholder="1925"
                    value={publishedYear}
                    onChange={(e) => setPublishedYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ISBN</label>
                <Input
                  type="text"
                  placeholder="978-0-123456-78-9"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Image URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Book Content (Full Text)</label>
                <Textarea
                  placeholder="Paste the full book content here..."
                  value={bookContent}
                  onChange={(e) => setBookContent(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Book" : "Add Book")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddBook;
