import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  category: string;
}

interface ClientNotesTabProps {
  clientId: string;
}

export const ClientNotesTab = ({ clientId }: ClientNotesTabProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for notes
    setNotes([
      {
        id: '1',
        content: 'Client is very punctual with payments and has shown excellent financial discipline.',
        created_by: 'Admin User',
        created_at: '2024-01-15T10:30:00Z',
        category: 'general'
      },
      {
        id: '2',
        content: 'Discussed loan restructuring options. Client prefers monthly payments.',
        created_by: 'Loan Officer',
        created_at: '2024-01-10T14:20:00Z',
        category: 'loan'
      }
    ]);
    setLoading(false);
  }, [clientId]);

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      general: 'bg-blue-100 text-blue-800',
      loan: 'bg-green-100 text-green-800',
      savings: 'bg-purple-100 text-purple-800',
      kyc: 'bg-orange-100 text-orange-800',
      complaint: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        created_by: 'Current User',
        created_at: new Date().toISOString(),
        category: 'general'
      };
      setNotes([note, ...notes]);
      setNewNote("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Add New Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter note about the client..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Client Notes History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notes found for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(note.category)}
                        <span className="text-sm text-muted-foreground">
                          by {note.created_by}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{note.content}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'PPP p')}
                      {note.updated_at && (
                        <span> · Edited {format(new Date(note.updated_at), 'PPP p')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};