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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckSquare, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Contract,
  useAllContracts,
  useUnsettleContract,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";
import { calcContractAmounts, formatCurrency } from "../utils/calculations";

export function SettledTab() {
  const { data: contracts, isLoading } = useAllContracts();
  const unsettleContract = useUnsettleContract();
  const [unsettleTarget, setUnsettleTarget] = useState<Contract | null>(null);
  const { isGuest } = useUserRole();

  const settledContracts = contracts?.filter((c) => c.isSettled) ?? [];

  async function handleUnsettle() {
    if (!unsettleTarget) return;
    try {
      await unsettleContract.mutateAsync(unsettleTarget.id);
      toast.success(`${unsettleTarget.name} moved back to active`);
      setUnsettleTarget(null);
    } catch {
      toast.error("Failed to unsettle contract");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Settled Contracts
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Contracts that have been fully settled and closed
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && settledContracts.length === 0 && (
        <div
          data-ocid="settled.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            No Settled Contracts
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Mark a contract as settled from the contract detail view to see it
            here.
          </p>
        </div>
      )}

      {!isLoading && settledContracts.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <Table data-ocid="settled.table">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Contract Name</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="text-right">Contract Amount</TableHead>
                <TableHead className="text-right">Bed</TableHead>
                <TableHead className="text-right">Paper</TableHead>
                <TableHead className="text-right">Mesh</TableHead>
                <TableHead className="text-right">Machine Exp</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settledContracts.map((contract, idx) => {
                const amounts = calcContractAmounts(contract);
                return (
                  <TableRow
                    key={contract.id.toString()}
                    data-ocid={`settled.row.${idx + 1}`}
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {contract.name}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ×{contract.multiplier}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(contract.contractAmount)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 text-sm">
                      {formatCurrency(amounts.bedAmount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 text-sm">
                      {formatCurrency(amounts.paperAmount)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 text-sm">
                      {formatCurrency(Math.max(0, amounts.meshAmount))}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatCurrency(contract.machineExp)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">
                        Settled
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isGuest && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => setUnsettleTarget(contract)}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reopen
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Unsettle confirm */}
      <AlertDialog
        open={unsettleTarget !== null}
        onOpenChange={(o) => !o && setUnsettleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>{unsettleTarget?.name}</strong> back to
              active contracts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="delete.cancel_button"
              onClick={() => setUnsettleTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete.confirm_button"
              className="bg-amber text-yellow-950 hover:bg-amber-dim"
              onClick={handleUnsettle}
              disabled={unsettleContract.isPending}
            >
              {unsettleContract.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reopen Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
