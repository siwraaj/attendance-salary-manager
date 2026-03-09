import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdvancesForContract,
  useAllContracts,
  useAllLabours,
  useCreateAdvance,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";
import { formatCurrency, formatDate } from "../utils/calculations";

export function AdvancesTab() {
  const { data: contracts } = useAllContracts();
  const { data: labours } = useAllLabours();
  const { isGuest } = useUserRole();

  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ labourId: "", amount: "", note: "" });

  const { data: advances, isLoading: loadingAdvances } =
    useAdvancesForContract(selectedContractId);
  const createAdvance = useCreateAdvance();

  const activeContracts = contracts?.filter((c) => !c.isSettled) ?? [];
  const selectedContract = activeContracts.find(
    (c) => c.id.toString() === selectedContractId?.toString(),
  );

  async function handleSubmit() {
    if (!selectedContractId) return;
    if (!form.labourId) {
      toast.error("Select a labour");
      return;
    }
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await createAdvance.mutateAsync({
        contractId: selectedContractId,
        labourId: BigInt(form.labourId),
        amount,
        note: form.note.trim() || null,
      });
      toast.success("Advance recorded");
      setForm({ labourId: "", amount: "", note: "" });
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save advance");
    }
  }

  // Group advances by labour
  const advancesByLabour: Record<string, { name: string; total: number }> = {};
  if (advances && labours) {
    for (const adv of advances) {
      const key = adv.labourId.toString();
      const labour = labours.find((l) => l.id === adv.labourId);
      if (!advancesByLabour[key]) {
        advancesByLabour[key] = { name: labour?.name ?? "Unknown", total: 0 };
      }
      advancesByLabour[key].total += adv.amount;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Advances
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track advance payments per contract
          </p>
        </div>
        {selectedContractId && !isGuest && (
          <Button
            data-ocid="advances.add_button"
            onClick={() => setDialogOpen(true)}
            className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Advance
          </Button>
        )}
      </div>

      {/* Contract selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">
          Contract:
        </Label>
        <Select
          value={selectedContractId?.toString() ?? ""}
          onValueChange={(v) => setSelectedContractId(v ? BigInt(v) : null)}
        >
          <SelectTrigger data-ocid="advances.contract.select" className="w-64">
            <SelectValue placeholder="Select a contract..." />
          </SelectTrigger>
          <SelectContent>
            {activeContracts.map((c) => (
              <SelectItem key={c.id.toString()} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedContract && (
          <Badge
            variant="outline"
            className="text-xs border-amber/40 text-amber-dim"
          >
            ×{selectedContract.multiplier}
          </Badge>
        )}
      </div>

      {!selectedContractId && (
        <div
          data-ocid="advances.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            Select a Contract
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose a contract above to view and manage advance payments.
          </p>
        </div>
      )}

      {selectedContractId && loadingAdvances && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      )}

      {selectedContractId && !loadingAdvances && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Labour summary */}
          {Object.keys(advancesByLabour).length > 0 && (
            <div className="lg:col-span-1">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Summary by Labour
              </h3>
              <div className="space-y-2">
                {Object.entries(advancesByLabour).map(([, data]) => (
                  <div
                    key={data.name}
                    className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium truncate">{data.name}</span>
                    <span className="font-semibold text-orange-600 ml-2 shrink-0">
                      {formatCurrency(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advances table */}
          <div
            className={
              Object.keys(advancesByLabour).length > 0
                ? "lg:col-span-2"
                : "lg:col-span-3"
            }
          >
            {advances && advances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No advances recorded for this contract.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <Table data-ocid="advances.table">
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead>#</TableHead>
                      <TableHead>Labour</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advances?.map((adv, idx) => {
                      const labour = labours?.find(
                        (l) => l.id === adv.labourId,
                      );
                      return (
                        <TableRow
                          key={adv.id.toString()}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {labour?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(adv.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {adv.note ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(adv.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Advance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="advance.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Labour *</Label>
              <Select
                value={form.labourId}
                onValueChange={(v) => setForm((f) => ({ ...f, labourId: v }))}
              >
                <SelectTrigger data-ocid="advance.labour.select">
                  <SelectValue placeholder="Select labour..." />
                </SelectTrigger>
                <SelectContent>
                  {labours?.map((l) => (
                    <SelectItem key={l.id.toString()} value={l.id.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-amount">Amount *</Label>
              <Input
                id="adv-amount"
                data-ocid="advance.amount.input"
                type="number"
                min="0"
                placeholder="e.g. 2000"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-note">Note</Label>
              <Input
                id="adv-note"
                data-ocid="advance.note.input"
                placeholder="Optional note..."
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="advance.submit_button"
              onClick={handleSubmit}
              disabled={createAdvance.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {createAdvance.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
