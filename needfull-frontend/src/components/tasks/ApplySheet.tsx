"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ApplySheetProps {
  taskId: string;
  taskTitle: string;
  budgetKobo: number;
  onApply: (pitch: string) => Promise<void>;
}

export function ApplySheet({ taskId, taskTitle, budgetKobo, onApply }: ApplySheetProps) {
  const [pitch, setPitch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!pitch.trim()) return;
    setIsSubmitting(true);
    try {
      await onApply(pitch);
      setOpen(false);
      setPitch("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full">Apply to Task</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl sm:h-auto sm:max-w-md sm:mx-auto">
        <SheetHeader>
          <SheetTitle>Apply for Task</SheetTitle>
          <SheetDescription>
            Tell the poster why you're a good fit for "{taskTitle}". The budget is ₦{(budgetKobo / 100).toLocaleString()}.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Why should they pick you?</label>
            <Textarea 
              placeholder="I have experience doing this..."
              rows={5}
              value={pitch}
              onChange={(e: any) => setPitch(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={!pitch.trim() || isSubmitting}
          >
            {isSubmitting ? "Applying..." : "Submit Application"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
