import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Book {
  id: string;
  title: string;
  author: string;
  book_content: string | null;
}

interface Note {
  id: string;
  note_text: string;
  page_number: number | null;
  created_at: string;
}

const ReadBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (id && user) {
      fetchBook();
      fetchNotes();
    }
  }, [id, user]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, book_content")
      .eq("id", id)
      .single();

    if (data && !error) {
      setBook(data);
    }
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("book_id", id)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      setNotes(data);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Note required",
        description: "Please write a note",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("notes").insert({
      book_id: id,
      user_id: user.id,
      note_text: newNote,
      page_number: pageNumber ? parseInt(pageNumber) : null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } else {
      setNewNote("");
      setPageNumber("");
      fetchNotes();
      toast({
        title: "Note saved!",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } else {
      fetchNotes();
      toast({
        title: "Note deleted",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please write your feedback",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("feedback").insert({
      book_id: id,
      user_id: user.id,
      feedback_text: feedbackText,
      rating: feedbackRating,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } else {
      setFeedbackText("");
      setFeedbackRating(5);
      toast({
        title: "Thank you for your feedback!",
      });
    }
  };

  const handleDownload = () => {
    if (!book?.book_content) {
      toast({
        title: "No content available",
        description: "This book doesn't have downloadable content",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([book.book_content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started!",
    });
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(`/book/${id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-muted-foreground">{book.author}</p>
        </div>

        <Tabs defaultValue="read" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="notes">My Notes</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="read" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {book.book_content ? (
                  <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {book.book_content}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Book content not available yet. Check back later!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Add New Note</h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Page number (optional)"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button onClick={handleAddNote} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {note.page_number && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Page {note.page_number}
                            </p>
                          )}
                          <p className="text-sm">{note.note_text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No notes yet. Add your first note above!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Share Your Feedback</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Rating</label>
                    <select
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(parseInt(e.target.value))}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={3}>3 - Good</option>
                      <option value={2}>2 - Fair</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="What did you think about this book?"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={5}
                  />
                  <Button onClick={handleSubmitFeedback}>
                    Submit Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReadBook;
