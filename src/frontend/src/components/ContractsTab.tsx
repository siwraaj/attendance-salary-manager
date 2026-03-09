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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Contract,
  useAllContracts,
  useCreateContract,
  useUpdateContract,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";
import { calcContractAmounts, formatCurrency } from "../utils/calculations";
import { ContractDetailView } from "./ContractDetailView";

interface ContractFormData {
  name: string;
  multiplier: string;
  contractAmount: string;
  machineExp: string;
}

const EMPTY_FORM: ContractFormData = {
  name: "",
  multiplier: "",
  contractAmount: "",
  machineExp: "",
};

export function ContractsTab() {
  const { data: contracts, isLoading } = useAllContracts();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { isGuest } = useUserRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [form, setForm] = useState<ContractFormData>(EMPTY_FORM);
  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(
    null,
  );

  const activeContracts = contracts?.filter((c) => !c.isSettled) ?? [];

  const multiplier = Number.parseFloat(form.multiplier) || 0;
  const contractAmount = Number.parseFloat(form.contractAmount) || 0;
  const machineExp = Number.parseFloat(form.machineExp) || 0;
  const bedPreview = 11000 * multiplier;
  const paperPreview = 7000 * multiplier;
  const meshPreview = contractAmount - bedPreview - paperPreview - machineExp;

  function openAdd() {
    setEditingContract(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(contract: Contract) {
    setEditingContract(contract);
    setForm({
      name: contract.name,
      multiplier: String(contract.multiplier),
      contractAmount: String(contract.contractAmount),
      machineExp: String(contract.machineExp),
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Contract name is required");
      return;
    }
    const multiplierVal = Number.parseFloat(form.multiplier);
    const contractAmountVal = Number.parseFloat(form.contractAmount);
    const machineExpVal = Number.parseFloat(form.machineExp) || 0;

    if (Number.isNaN(multiplierVal) || multiplierVal <= 0) {
      toast.error("Enter a valid multiplier value");
      return;
    }
    if (Number.isNaN(contractAmountVal) || contractAmountVal <= 0) {
      toast.error("Enter a valid contract amount");
      return;
    }

    try {
      if (editingContract) {
        await updateContract.mutateAsync({
          id: editingContract.id,
          name: form.name.trim(),
          multiplier: multiplierVal,
          contractAmount: contractAmountVal,
          machineExp: machineExpVal,
        });
        toast.success("Contract updated");
      } else {
        await createContract.mutateAsync({
          name: form.name.trim(),
          multiplier: multiplierVal,
          contractAmount: contractAmountVal,
          machineExp: machineExpVal,
        });
        toast.success("Contract created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save contract");
    }
  }

  if (selectedContractId !== null) {
    return (
      <ContractDetailView
        contractId={selectedContractId}
        onBack={() => setSelectedContractId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Active Contracts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage contracts, view attendance and calculate salaries
          </p>
        </div>
        {!isGuest && (
          <Button
            data-ocid="contracts.add_button"
            onClick={openAdd}
            className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Contract
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeContracts.length === 0 && (
        <div
          data-ocid="contracts.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            No Active Contracts
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first contract to start tracking attendance and
            calculating salaries.
          </p>
          {!isGuest && (
            <Button
              onClick={openAdd}
              className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Contract
            </Button>
          )}
        </div>
      )}

      {/* Contracts grid */}
      {!isLoading && activeContracts.length > 0 && (
        <div
          data-ocid="contracts.table"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {activeContracts.map((contract, idx) => {
            const amounts = calcContractAmounts(contract);
            return (
              <Card
                key={contract.id.toString()}
                data-ocid={`contracts.row.${idx + 1}`}
                className="border border-border hover:border-amber/40 transition-all hover:shadow-md group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-display text-base truncate">
                        {contract.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs border-amber/40 text-amber-dim"
                        >
                          ×{contract.multiplier}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(contract.contractAmount)}
                        </span>
                      </div>
                    </div>
                    {!isGuest && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          data-ocid={`contracts.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(contract)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`contracts.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(contract)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 rounded p-2 text-center">
                      <div className="text-blue-600 font-semibold">
                        {formatCurrency(amounts.bedAmount)}
                      </div>
                      <div className="text-blue-400 mt-0.5">Bed</div>
                    </div>
                    <div className="bg-green-50 rounded p-2 text-center">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(amounts.paperAmount)}
                      </div>
                      <div className="text-green-400 mt-0.5">Paper</div>
                    </div>
                    <div className="bg-orange-50 rounded p-2 text-center">
                      <div className="text-orange-600 font-semibold">
                        {formatCurrency(Math.max(0, amounts.meshAmount))}
                      </div>
                      <div className="text-orange-400 mt-0.5">Mesh</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Machine Exp: {formatCurrency(contract.machineExp)}
                  </div>
                  <Button
                    className="w-full gap-2 mt-2 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                    size="sm"
                    onClick={() => setSelectedContractId(contract.id)}
                  >
                    Open Attendance
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="contract.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingContract ? "Edit Contract" : "New Contract"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Contract Name *</Label>
              <Input
                id="c-name"
                data-ocid="contract.name.input"
                placeholder="e.g. Block A Construction"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-mult">Multiplier *</Label>
                <Input
                  id="c-mult"
                  data-ocid="contract.multiplier.input"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 2"
                  value={form.multiplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, multiplier: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-amount">Contract Amount *</Label>
                <Input
                  id="c-amount"
                  data-ocid="contract.amount.input"
                  type="number"
                  min="0"
                  placeholder="e.g. 150000"
                  value={form.contractAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contractAmount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-machine">Machine Expense</Label>
              <Input
                id="c-machine"
                data-ocid="contract.machineexp.input"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={form.machineExp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, machineExp: e.target.value }))
                }
              />
            </div>

            {/* Auto-calculated preview */}
            {multiplier > 0 && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Calculated Amounts
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Bed</div>
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(bedPreview)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paper</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(paperPreview)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mesh</div>
                    <div
                      className={`font-semibold ${meshPreview < 0 ? "text-destructive" : "text-orange-600"}`}
                    >
                      {formatCurrency(meshPreview)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="contract.save_button"
              onClick={handleSubmit}
              disabled={createContract.isPending || updateContract.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {(createContract.isPending || updateContract.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingContract ? "Save Changes" : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm - note: delete contract not in API so we just show a message */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All attendance and advance data for{" "}
              <strong>{deleteTarget?.name}</strong> will be permanently removed.
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
              onClick={() => {
                toast.info(
                  "Contract deletion is not supported by the backend.",
                );
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
