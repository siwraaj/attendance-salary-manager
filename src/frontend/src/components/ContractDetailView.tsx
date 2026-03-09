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
import { ArrowLeft, CheckCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ColumnType,
  useAllLabours,
  useAttendanceForContract,
  useContractDetails,
  useCreateMeshColumn,
  useMarkContractSettled,
  useSetAttendance,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";
import {
  ATTENDANCE_OPTIONS,
  calcContractAmounts,
  calcLabourSalaries,
  formatCurrency,
} from "../utils/calculations";

interface ContractDetailViewProps {
  contractId: bigint;
  onBack: () => void;
}

export function ContractDetailView({
  contractId,
  onBack,
}: ContractDetailViewProps) {
  const { data: details, isLoading: loadingDetails } =
    useContractDetails(contractId);
  const { data: labours, isLoading: loadingLabours } = useAllLabours();
  const { data: attendance, isLoading: loadingAttendance } =
    useAttendanceForContract(contractId);
  const setAttendance = useSetAttendance();
  const markSettled = useMarkContractSettled();
  const createMeshColumn = useCreateMeshColumn();

  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [meshDialogOpen, setMeshDialogOpen] = useState(false);
  const [meshColumnName, setMeshColumnName] = useState("");
  const { isGuest } = useUserRole();

  const isLoading = loadingDetails || loadingLabours || loadingAttendance;

  const contract = details?.contract;
  const meshColumns = details?.meshColumns ?? [];
  const labourList = labours ?? [];
  const attendanceList = attendance ?? [];

  const amounts = contract ? calcContractAmounts(contract) : null;

  const salaries =
    amounts && labourList.length > 0
      ? calcLabourSalaries(
          labourList.map((l) => l.id),
          attendanceList,
          meshColumns,
          amounts,
        )
      : [];

  function getAttendanceVal(labourId: bigint, colType: ColumnType): string {
    const entry = attendanceList.find((a) => {
      if (a.labourId !== labourId) return false;
      if (a.columnType.__kind__ !== colType.__kind__) return false;
      if (colType.__kind__ === "Mesh") {
        return (
          a.columnType.__kind__ === "Mesh" &&
          a.columnType.Mesh ===
            (colType as { __kind__: "Mesh"; Mesh: bigint }).Mesh
        );
      }
      return true;
    });
    return String(entry?.value ?? 0);
  }

  async function handleAttendanceChange(
    labourId: bigint,
    colType: ColumnType,
    value: string,
  ) {
    const numVal = Number.parseFloat(value);
    try {
      await setAttendance.mutateAsync({
        contractId,
        labourId,
        columnType: colType,
        value: numVal,
      });
    } catch {
      toast.error("Failed to save attendance");
    }
  }

  async function handleSettle() {
    try {
      await markSettled.mutateAsync(contractId);
      toast.success("Contract marked as settled");
      setSettleDialogOpen(false);
      onBack();
    } catch {
      toast.error("Failed to settle contract");
    }
  }

  async function handleAddMeshColumn() {
    if (!meshColumnName.trim()) {
      toast.error("Column name is required");
      return;
    }
    try {
      await createMeshColumn.mutateAsync({
        contractId,
        name: meshColumnName.trim(),
      });
      toast.success("Mesh column added");
      setMeshColumnName("");
      setMeshDialogOpen(false);
    } catch {
      toast.error("Failed to add mesh column");
    }
  }

  // Column sums
  const bedSum = labourList.reduce((sum, l) => {
    const val = Number.parseFloat(
      getAttendanceVal(l.id, { __kind__: "Bed", Bed: null }),
    );
    return sum + val;
  }, 0);
  const paperSum = labourList.reduce((sum, l) => {
    const val = Number.parseFloat(
      getAttendanceVal(l.id, { __kind__: "Paper", Paper: null }),
    );
    return sum + val;
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Contract not found.
        <Button variant="link" onClick={onBack} className="ml-2">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div data-ocid="contract.detail.panel" className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            data-ocid="contract.back.button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {contract.name}
            </h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs border-amber/40 text-amber-dim"
              >
                ×{contract.multiplier}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Contract: {formatCurrency(contract.contractAmount)}
              </Badge>
            </div>
          </div>
        </div>
        {!isGuest && (
          <div className="flex gap-2 flex-wrap">
            <Button
              data-ocid="contract.mesh.add_button"
              variant="outline"
              size="sm"
              onClick={() => setMeshDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Mesh Column
            </Button>
            <Button
              data-ocid="contract.settle.button"
              size="sm"
              className="gap-2 bg-green-600 text-white hover:bg-green-700"
              onClick={() => setSettleDialogOpen(true)}
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Settled
            </Button>
          </div>
        )}
      </div>

      {/* Amount summary */}
      {amounts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Bed Amount",
              value: amounts.bedAmount,
              color: "bg-blue-50 text-blue-700 border-blue-100",
            },
            {
              label: "Paper Amount",
              value: amounts.paperAmount,
              color: "bg-green-50 text-green-700 border-green-100",
            },
            {
              label: "Mesh Amount",
              value: Math.max(0, amounts.meshAmount),
              color: "bg-orange-50 text-orange-700 border-orange-100",
            },
            {
              label: "Machine Exp",
              value: contract.machineExp,
              color: "bg-slate-50 text-slate-600 border-slate-100",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-3 ${item.color}`}
            >
              <div className="text-xs opacity-70 mb-1">{item.label}</div>
              <div className="font-display font-bold text-lg leading-none">
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table
          data-ocid="contract.attendance.table"
          className="w-full text-sm min-w-[600px]"
        >
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground w-12">
                #
              </th>
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[140px]">
                Labour
              </th>
              <th className="text-center px-2 py-3 font-semibold text-blue-600 min-w-[100px]">
                Bed
              </th>
              <th className="text-center px-2 py-3 font-semibold text-green-600 min-w-[100px]">
                Paper
              </th>
              {meshColumns.map((col) => (
                <th
                  key={col.id.toString()}
                  className="text-center px-2 py-3 font-semibold text-orange-600 min-w-[100px]"
                >
                  {col.name}
                </th>
              ))}
              <th className="text-right px-3 py-3 font-semibold text-foreground min-w-[110px]">
                Net Salary
              </th>
            </tr>
          </thead>
          <tbody>
            {labourList.length === 0 && (
              <tr>
                <td
                  colSpan={4 + meshColumns.length}
                  className="text-center py-10 text-muted-foreground"
                >
                  No labours found. Add labours in the Labours tab.
                </td>
              </tr>
            )}
            {labourList.map((labour, idx) => {
              const salary = salaries.find((s) => s.labourId === labour.id);
              return (
                <tr
                  key={labour.id.toString()}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 text-muted-foreground text-center">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">{labour.name}</td>
                  {/* Bed */}
                  <td className="px-2 py-2">
                    <AttendanceSelect
                      value={getAttendanceVal(labour.id, {
                        __kind__: "Bed",
                        Bed: null,
                      })}
                      onChange={(v) =>
                        handleAttendanceChange(
                          labour.id,
                          { __kind__: "Bed", Bed: null },
                          v,
                        )
                      }
                      readOnly={isGuest}
                    />
                  </td>
                  {/* Paper */}
                  <td className="px-2 py-2">
                    <AttendanceSelect
                      value={getAttendanceVal(labour.id, {
                        __kind__: "Paper",
                        Paper: null,
                      })}
                      onChange={(v) =>
                        handleAttendanceChange(
                          labour.id,
                          { __kind__: "Paper", Paper: null },
                          v,
                        )
                      }
                      readOnly={isGuest}
                    />
                  </td>
                  {/* Mesh columns */}
                  {meshColumns.map((col) => (
                    <td key={col.id.toString()} className="px-2 py-2">
                      <AttendanceSelect
                        value={getAttendanceVal(labour.id, {
                          __kind__: "Mesh",
                          Mesh: col.id,
                        })}
                        onChange={(v) =>
                          handleAttendanceChange(
                            labour.id,
                            { __kind__: "Mesh", Mesh: col.id },
                            v,
                          )
                        }
                        readOnly={isGuest}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                    {formatCurrency(salary?.netSalary ?? 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Footer with sums */}
          {labourList.length > 0 && (
            <tfoot>
              <tr className="bg-muted/60 border-t border-border">
                <td
                  colSpan={2}
                  className="px-3 py-2 font-semibold text-muted-foreground"
                >
                  Column Total
                </td>
                <td className="px-2 py-2 text-center text-sm font-semibold text-blue-600">
                  {bedSum.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center text-sm font-semibold text-green-600">
                  {paperSum.toFixed(2)}
                </td>
                {meshColumns.map((col) => {
                  const colSum = labourList.reduce((sum, l) => {
                    return (
                      sum +
                      Number.parseFloat(
                        getAttendanceVal(l.id, {
                          __kind__: "Mesh",
                          Mesh: col.id,
                        }),
                      )
                    );
                  }, 0);
                  return (
                    <td
                      key={col.id.toString()}
                      className="px-2 py-2 text-center text-sm font-semibold text-orange-600"
                    >
                      {colSum.toFixed(2)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-semibold text-foreground">
                  {formatCurrency(
                    salaries.reduce((s, l) => s + l.netSalary, 0),
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mesh column dialog */}
      <Dialog open={meshDialogOpen} onOpenChange={setMeshDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Add Mesh Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Column Name</Label>
              <Input
                placeholder="e.g. Mesh 1"
                value={meshColumnName}
                onChange={(e) => setMeshColumnName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMeshColumn()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeshDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMeshColumn}
              disabled={createMeshColumn.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {createMeshColumn.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle confirm */}
      <AlertDialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Settled?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>{contract.name}</strong> to the Settled
              tab. You can revert this later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete.confirm_button"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleSettle}
              disabled={markSettled.isPending}
            >
              {markSettled.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Settle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AttendanceSelectProps {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}

function AttendanceSelect({
  value,
  onChange,
  readOnly,
}: AttendanceSelectProps) {
  const colorClass =
    value === "0"
      ? "text-muted-foreground"
      : value === "1"
        ? "text-green-600 font-semibold"
        : "text-amber-600 font-medium";

  if (readOnly) {
    const label =
      ATTENDANCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
    return (
      <div
        className={`h-8 text-xs w-full flex items-center justify-center px-2 rounded-md border border-border bg-muted/30 ${colorClass}`}
        title="Admin access required to edit attendance"
      >
        {label}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-8 text-xs w-full ${colorClass}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ATTENDANCE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
