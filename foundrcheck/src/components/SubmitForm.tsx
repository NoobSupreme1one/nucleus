'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SubmitFormProps {
  onSubmit: (title: string, description: string) => Promise<{ id: string; status: string }>;
  isSubmitting?: boolean;
}

export function SubmitForm({ onSubmit, isSubmitting = false }: SubmitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both title and description');
      return;
    }

    if (title.length > 120) {
      toast.error('Title must be 120 characters or less');
      return;
    }

    if (description.length > 2000) {
      toast.error('Description must be 2000 characters or less');
      return;
    }

    try {
      await onSubmit(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      toast.success('Nice! We\'re analyzing your idea. This usually takes ~30s.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit idea';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Startup Idea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Idea Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief, catchy title for your idea"
              maxLength={120}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/120 characters
            </p>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Idea Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your startup idea in 3–6 sentences. What problem does it solve? Who is the target audience? How does it work?"
              maxLength={2000}
              rows={6}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Idea'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}