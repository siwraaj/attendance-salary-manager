import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Labour {
    id: bigint;
    name: string;
    notes?: string;
    phone?: string;
}
export interface Attendance {
    id: bigint;
    columnType: ColumnType;
    value: number;
    labourId: bigint;
    contractId: bigint;
}
export interface ContractDetails {
    contract: Contract;
    meshColumns: Array<MeshColumn>;
}
export interface MeshColumn {
    id: bigint;
    name: string;
    contractId: bigint;
}
export type ColumnType = {
    __kind__: "Bed";
    Bed: null;
} | {
    __kind__: "Mesh";
    Mesh: bigint;
} | {
    __kind__: "Paper";
    Paper: null;
};
export interface Contract {
    id: bigint;
    multiplier: number;
    isSettled: boolean;
    name: string;
    createdAt: bigint;
    machineExp: number;
    contractAmount: number;
}
export interface Advance {
    id: bigint;
    note?: string;
    labourId: bigint;
    createdAt: bigint;
    amount: number;
    contractId: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAdvanceEntry(contractId: bigint, labourId: bigint, amount: number, note: string | null): Promise<bigint>;
    createContract(name: string, multiplier: number, contractAmount: number, machineExp: number): Promise<bigint>;
    createLabour(name: string, phone: string | null, notes: string | null): Promise<bigint>;
    createMeshColumn(contractId: bigint, name: string): Promise<bigint>;
    deleteLabour(labourId: bigint): Promise<void>;
    getAdvancesForContract(contractId: bigint): Promise<Array<Advance>>;
    getAllContracts(): Promise<Array<Contract>>;
    getAllLabours(): Promise<Array<Labour>>;
    getAllMeshColumns(): Promise<Array<MeshColumn>>;
    getAttendanceForContract(contractId: bigint): Promise<Array<Attendance>>;
    getCallerUserProfileInternal(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContractById(contractId: bigint): Promise<Contract | null>;
    getContractDetails(contractId: bigint): Promise<ContractDetails | null>;
    getContractsBySettlement(isSettled: boolean): Promise<Array<Contract>>;
    getMeshColumnsForContract(contractId: bigint): Promise<Array<MeshColumn>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markContractAsSettled(contractId: bigint): Promise<void>;
    resetAdmin(userSecret: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAttendanceEntry(contractId: bigint, labourId: bigint, columnType: ColumnType, value: number): Promise<bigint>;
    unsettleContract(contractId: bigint): Promise<void>;
    updateContract(id: bigint, name: string, multiplier: number, contractAmount: number, machineExp: number): Promise<void>;
    updateLabour(id: bigint, name: string, phone: string | null, notes: string | null): Promise<void>;
}
