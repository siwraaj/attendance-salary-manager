import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Advance,
  Attendance,
  ColumnType,
  Contract,
  ContractDetails,
  Labour,
  MeshColumn,
} from "../backend.d";
import { useActor } from "./useActor";

export type {
  Contract,
  Labour,
  ContractDetails,
  Attendance,
  Advance,
  MeshColumn,
  ColumnType,
};

// ─── Contracts ─────────────────────────────────────────────────────────────

export function useAllContracts() {
  const { actor, isFetching } = useActor();
  return useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContracts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useContractDetails(contractId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ContractDetails | null>({
    queryKey: ["contractDetails", contractId?.toString()],
    queryFn: async () => {
      if (!actor || contractId === null) return null;
      return actor.getContractDetails(contractId);
    },
    enabled: !!actor && !isFetching && contractId !== null,
  });
}

export function useCreateContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      multiplier,
      contractAmount,
      machineExp,
    }: {
      name: string;
      multiplier: number;
      contractAmount: number;
      machineExp: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createContract(name, multiplier, contractAmount, machineExp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useUpdateContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      multiplier,
      contractAmount,
      machineExp,
    }: {
      id: bigint;
      name: string;
      multiplier: number;
      contractAmount: number;
      machineExp: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateContract(
        id,
        name,
        multiplier,
        contractAmount,
        machineExp,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useMarkContractSettled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markContractAsSettled(contractId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useUnsettleContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.unsettleContract(contractId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

// ─── Labours ───────────────────────────────────────────────────────────────

export function useAllLabours() {
  const { actor, isFetching } = useActor();
  return useQuery<Labour[]>({
    queryKey: ["labours"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLabours();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLabour() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      notes,
    }: {
      name: string;
      phone: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createLabour(name, phone, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labours"] });
    },
  });
}

export function useUpdateLabour() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      phone,
      notes,
    }: {
      id: bigint;
      name: string;
      phone: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateLabour(id, name, phone, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labours"] });
    },
  });
}

export function useDeleteLabour() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labourId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteLabour(labourId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labours"] });
    },
  });
}

// ─── Mesh Columns ──────────────────────────────────────────────────────────

export function useCreateMeshColumn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      name,
    }: {
      contractId: bigint;
      name: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createMeshColumn(contractId, name);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contractDetails", variables.contractId.toString()],
      });
    },
  });
}

// ─── Attendance ────────────────────────────────────────────────────────────

export function useAttendanceForContract(contractId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", contractId?.toString()],
    queryFn: async () => {
      if (!actor || contractId === null) return [];
      return actor.getAttendanceForContract(contractId);
    },
    enabled: !!actor && !isFetching && contractId !== null,
  });
}

export function useSetAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      labourId,
      columnType,
      value,
    }: {
      contractId: bigint;
      labourId: bigint;
      columnType: ColumnType;
      value: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setAttendanceEntry(contractId, labourId, columnType, value);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", variables.contractId.toString()],
      });
    },
  });
}

// ─── Advances ──────────────────────────────────────────────────────────────

export function useAdvancesForContract(contractId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Advance[]>({
    queryKey: ["advances", contractId?.toString()],
    queryFn: async () => {
      if (!actor || contractId === null) return [];
      return actor.getAdvancesForContract(contractId);
    },
    enabled: !!actor && !isFetching && contractId !== null,
  });
}

export function useCreateAdvance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      labourId,
      amount,
      note,
    }: {
      contractId: bigint;
      labourId: bigint;
      amount: number;
      note: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createAdvanceEntry(contractId, labourId, amount, note);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["advances", variables.contractId.toString()],
      });
    },
  });
}
