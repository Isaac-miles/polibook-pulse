import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadArchiveForm } from "@/components/UploadArchiveForm";

interface AddArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchiveAdded?: () => void;
}

export function AddArchiveModal({ open, onOpenChange, onArchiveAdded }: AddArchiveModalProps) {
  const [formKey, setFormKey] = useState(0);
  const [hasDraftData, setHasDraftData] = useState(false);
  const [skipDraftPrompt, setSkipDraftPrompt] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setShowDraftPrompt(false);
      onOpenChange(true);
      return;
    }

    if (skipDraftPrompt) {
      setSkipDraftPrompt(false);
      onOpenChange(false);
      return;
    }

    if (!hasDraftData) {
      onOpenChange(false);
      return;
    }
    // Show a sonner toast action and also render an inline prompt inside the modal
    // as a fallback if the toast can't be reached (prevents the modal feeling "frozen").
    // toast("Save draft?", {
    //   type: "action",
    //   description: "Keep your current archive draft or discard it.",
    //   action: {
    //     label: "Keep draft",
    //     onClick: () => {
    //       setShowDraftPrompt(false);
    //       onOpenChange(false);
    //     },
    //   },
    //   cancel: {
    //     label: "Discard",
    //     onClick: () => {
    //       try {
    //         localStorage.removeItem("archiveDraft");
    //       } catch (err) {
    //         // ignore
    //       }
    //       setFormKey((current) => current + 1);
    //       onOpenChange(false);
    //     },
    //   },
    //   duration: 15000,
    //   closeButton: true,
    //   richColors: true,
    // });

    setShowDraftPrompt(true);
  };

  const handleSaveSuccess = () => {
    setSkipDraftPrompt(true);
    onOpenChange(false);
    onArchiveAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to archive</DialogTitle>
          <DialogDescription>Archive a statement with details and screenshots.</DialogDescription>
        </DialogHeader>

        {showDraftPrompt && (
          <div className="mb-4 rounded-md border border-yellow-400 bg-yellow-50 p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <strong>Save draft?</strong>
                <div className="text-xs text-muted-foreground">
                  Keep your current archive draft or discard it.
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn inline-flex items-center rounded-md bg-primary px-3 py-1 text-white"
                  onClick={() => {
                    setShowDraftPrompt(false);
                    onOpenChange(false);
                  }}
                >
                  Keep draft
                </button>
                <button
                  className="btn inline-flex items-center rounded-md border border-border bg-white px-3 py-1"
                  onClick={() => {
                    try {
                      localStorage.removeItem("archiveDraft");
                    } catch (err) {
                      // ignore
                    }
                    setFormKey((current) => current + 1);
                    setShowDraftPrompt(false);
                    onOpenChange(false);
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <UploadArchiveForm
          key={formKey}
          submitLabel="Save archive"
          onSuccess={handleSaveSuccess}
          onDraftStateChange={setHasDraftData}
        />
      </DialogContent>
    </Dialog>
  );
}
