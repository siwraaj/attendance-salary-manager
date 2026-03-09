import type {
  Advance,
  Attendance,
  ColumnType,
  Contract,
  MeshColumn,
} from "../hooks/useQueries";

export interface ContractAmounts {
  bedAmount: number;
  paperAmount: number;
  meshAmount: number;
}

export function calcContractAmounts(contract: Contract): ContractAmounts {
  const bedAmount = 11000 * contract.multiplier;
  const paperAmount = 7000 * contract.multiplier;
  const meshAmount =
    contract.contractAmount - bedAmount - paperAmount - contract.machineExp;
  return { bedAmount, paperAmount, meshAmount };
}

export interface LabourSalary {
  labourId: bigint;
  bedSalary: number;
  paperSalary: number;
  meshSalaries: Record<string, number>; // key: meshColumnId.toString()
  netSalary: number;
}

function getAttendanceValue(
  attendance: Attendance[],
  labourId: bigint,
  columnType: ColumnType,
): number {
  const entry = attendance.find((a) => {
    if (a.labourId !== labourId) return false;
    if (a.columnType.__kind__ !== columnType.__kind__) return false;
    if (columnType.__kind__ === "Mesh") {
      return (
        a.columnType.__kind__ === "Mesh" &&
        a.columnType.Mesh ===
          (columnType as { __kind__: "Mesh"; Mesh: bigint }).Mesh
      );
    }
    return true;
  });
  return entry?.value ?? 0;
}

export function calcLabourSalaries(
  labourIds: bigint[],
  attendance: Attendance[],
  meshColumns: MeshColumn[],
  amounts: ContractAmounts,
): LabourSalary[] {
  // Sum of bed column
  const bedSum = labourIds.reduce((sum, lid) => {
    return (
      sum + getAttendanceValue(attendance, lid, { __kind__: "Bed", Bed: null })
    );
  }, 0);

  // Sum of paper column
  const paperSum = labourIds.reduce((sum, lid) => {
    return (
      sum +
      getAttendanceValue(attendance, lid, { __kind__: "Paper", Paper: null })
    );
  }, 0);

  // Sum of each mesh column
  const meshSums: Record<string, number> = {};
  for (const col of meshColumns) {
    meshSums[col.id.toString()] = labourIds.reduce((sum, lid) => {
      return (
        sum +
        getAttendanceValue(attendance, lid, { __kind__: "Mesh", Mesh: col.id })
      );
    }, 0);
  }

  const meshAmountPerColumn =
    meshColumns.length > 0 ? amounts.meshAmount / meshColumns.length : 0;

  return labourIds.map((labourId) => {
    const bedVal = getAttendanceValue(attendance, labourId, {
      __kind__: "Bed",
      Bed: null,
    });
    const paperVal = getAttendanceValue(attendance, labourId, {
      __kind__: "Paper",
      Paper: null,
    });

    const bedSalary = bedSum > 0 ? (bedVal / bedSum) * amounts.bedAmount : 0;
    const paperSalary =
      paperSum > 0 ? (paperVal / paperSum) * amounts.paperAmount : 0;

    const meshSalaries: Record<string, number> = {};
    let totalMeshSalary = 0;
    for (const col of meshColumns) {
      const meshVal = getAttendanceValue(attendance, labourId, {
        __kind__: "Mesh",
        Mesh: col.id,
      });
      const colSum = meshSums[col.id.toString()];
      const meshSal = colSum > 0 ? (meshVal / colSum) * meshAmountPerColumn : 0;
      meshSalaries[col.id.toString()] = meshSal;
      totalMeshSalary += meshSal;
    }

    const netSalary = bedSalary + paperSalary + totalMeshSalary;

    return {
      labourId,
      bedSalary,
      paperSalary,
      meshSalaries,
      netSalary,
    };
  });
}

export function calcTotalAdvancePerLabour(
  advances: Advance[],
  labourId: bigint,
): number {
  return advances
    .filter((a) => a.labourId === labourId)
    .reduce((sum, a) => sum + a.amount, 0);
}

export const ATTENDANCE_OPTIONS = [
  { label: "Absent", value: "0" },
  { label: "Present", value: "1" },
  { label: "0.33", value: "0.33" },
  { label: "0.66", value: "0.66" },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
