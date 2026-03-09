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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Labour,
  useAllLabours,
  useCreateLabour,
  useDeleteLabour,
  useUpdateLabour,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";

interface LabourFormData {
  name: string;
  phone: string;
  notes: string;
}

const EMPTY_FORM: LabourFormData = { name: "", phone: "", notes: "" };

export function LaboursTab() {
  const { data: labours, isLoading } = useAllLabours();
  const createLabour = useCreateLabour();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();
  const { isGuest } = useUserRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Labour | null>(null);
  const [form, setForm] = useState<LabourFormData>(EMPTY_FORM);

  function openAdd() {
    setEditingLabour(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(labour: Labour) {
    setEditingLabour(labour);
    setForm({
      name: labour.name,
      phone: labour.phone ?? "",
      notes: labour.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Labour name is required");
      return;
    }
    const phone = form.phone.trim() || null;
    const notes = form.notes.trim() || null;

    try {
      if (editingLabour) {
        await updateLabour.mutateAsync({
          id: editingLabour.id,
          name: form.name.trim(),
          phone,
          notes,
        });
        toast.success("Labour updated");
      } else {
        await createLabour.mutateAsync({
          name: form.name.trim(),
          phone,
          notes,
        });
        toast.success("Labour added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save labour");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteLabour.mutateAsync(deleteTarget.id);
      toast.success("Labour deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete labour");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Labours
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage worker information
          </p>
        </div>
        {!isGuest && (
          <Button
            data-ocid="labours.add_button"
            onClick={openAdd}
            className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Labour
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!labours || labours.length === 0) && (
        <div
          data-ocid="labours.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            No Labours Added
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Add workers to start tracking attendance and calculating salaries.
          </p>
          {!isGuest && (
            <Button
              onClick={openAdd}
              className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Labour
            </Button>
          )}
        </div>
      )}

      {!isLoading && labours && labours.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <Table data-ocid="labours.table">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labours.map((labour, idx) => (
                <TableRow
                  key={labour.id.toString()}
                  data-ocid={`labours.row.${idx + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{labour.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {labour.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {labour.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isGuest && (
                      <div className="flex justify-end gap-1">
                        <Button
                          data-ocid={`labours.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(labour)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`labours.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(labour)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="labour.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingLabour ? "Edit Labour" : "Add Labour"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="l-name">Full Name *</Label>
              <Input
                id="l-name"
                data-ocid="labour.name.input"
                placeholder="e.g. Raju Kumar"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-phone">Phone</Label>
              <Input
                id="l-phone"
                data-ocid="labour.phone.input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-notes">Notes</Label>
              <Textarea
                id="l-notes"
                data-ocid="labour.notes.textarea"
                placeholder="Any additional info..."
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createLabour.isPending || updateLabour.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {(createLabour.isPending || updateLabour.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingLabour ? "Save Changes" : "Add Labour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Labour?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="delete.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteLabour.isPending}
            >
              {deleteLabour.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
