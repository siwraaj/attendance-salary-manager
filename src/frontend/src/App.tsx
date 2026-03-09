import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  HardHat,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdvancesTab } from "./components/AdvancesTab";
import { ContractsTab } from "./components/ContractsTab";
import { LaboursTab } from "./components/LaboursTab";
import { PaymentsTab } from "./components/PaymentsTab";
import { SettledTab } from "./components/SettledTab";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserRole } from "./hooks/useUserRole";

type Tab = "contracts" | "labours" | "advances" | "payments" | "settled";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof HardHat }[] = [
  { id: "contracts", label: "Contracts", icon: HardHat },
  { id: "labours", label: "Labours", icon: Users },
  { id: "advances", label: "Advances", icon: Wallet },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settled", label: "Settled", icon: CheckSquare },
];

// ─── App Header (shared) ─────────────────────────────────────────────────────
function AppHeader() {
  return (
    <header className="nav-bg shadow-lg border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber flex items-center justify-center">
            <HardHat className="w-5 h-5 text-yellow-950" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold nav-fg leading-none">
              AttendPay
            </h1>
            <p className="text-xs text-white/50 leading-none mt-0.5">
              Attendance & Salary Manager
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

interface LoginScreenProps {
  onGuestContinue: () => void;
}

function LoginScreen({ onGuestContinue }: LoginScreenProps) {
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [showResetSection, setShowResetSection] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  async function handleClaimAdmin() {
    if (!actor || !adminToken.trim()) return;
    setIsResetting(true);
    try {
      await actor.resetAdmin(adminToken.trim());
      await queryClient.invalidateQueries({ queryKey: ["userRole"] });
      toast.success("Admin access claimed! Reloading…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid admin token. Please try again.";
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      <AppHeader />

      {/* Login content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon + Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber flex items-center justify-center shadow-lg">
                  <HardHat className="w-9 h-9 text-yellow-950" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Welcome to AttendPay
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Manage contracts, track attendance, and calculate salaries.
                </p>
              </div>
            </div>

            {/* Role options */}
            <div className="space-y-3">
              {/* Admin Login */}
              <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center shrink-0 mt-0.5">
                    <Settings className="w-4.5 h-4.5 text-yellow-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        Admin Login
                      </span>
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber/20 text-amber-900 border border-amber/40 hover:bg-amber/20">
                        Full Access
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Create, edit, and delete contracts, labours, attendance &
                      advances
                    </p>
                  </div>
                </div>

                {isInitializing ? (
                  <div
                    data-ocid="login.loading_state"
                    className="flex items-center justify-center gap-2 text-muted-foreground py-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Initializing…</span>
                  </div>
                ) : (
                  <Button
                    data-ocid="login.admin.primary_button"
                    onClick={login}
                    disabled={isLoggingIn}
                    className="w-full bg-amber hover:bg-amber/90 text-yellow-950 font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm hover:shadow-md"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In with Internet Identity
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Guest mode */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        Continue as Guest
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-amber-400/50 text-amber-700"
                      >
                        View Only
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Browse all data — contracts, attendance, payments —
                      without making changes
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="login.guest.secondary_button"
                  variant="outline"
                  onClick={onGuestContinue}
                  className="w-full font-medium py-2.5 rounded-lg text-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse as Guest
                </Button>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {[
                "Track attendance for Bed, Paper & Mesh work",
                "Auto-calculate salaries from contract amounts",
                "Manage advances and final payments",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-dim mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Admin Recovery Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <button
                type="button"
                data-ocid="login.reset_admin.toggle"
                onClick={() => setShowResetSection((v) => !v)}
                className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-dim" />
                  <span className="font-medium">Lost admin access?</span>
                </div>
                {showResetSection ? (
                  <ChevronUp className="w-4 h-4 group-hover:text-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 group-hover:text-foreground" />
                )}
              </button>

              {showResetSection && (
                <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 space-y-4">
                  {identity ? (
                    <>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You are signed in. Enter the admin token below to claim
                        admin access with your current Internet Identity.
                      </p>
                      <div className="space-y-2">
                        <Label
                          htmlFor="login-admin-token-input"
                          className="text-xs font-medium text-foreground"
                        >
                          Admin Token
                        </Label>
                        <Input
                          id="login-admin-token-input"
                          data-ocid="login.reset_admin.input"
                          type="password"
                          placeholder="Enter admin token…"
                          value={adminToken}
                          onChange={(e) => setAdminToken(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleClaimAdmin();
                          }}
                          className="text-sm h-9 bg-background border-amber/30 focus-visible:ring-amber/50"
                          disabled={isResetting}
                        />
                      </div>
                      <Button
                        data-ocid="login.reset_admin.primary_button"
                        onClick={() => void handleClaimAdmin()}
                        disabled={isResetting || !adminToken.trim()}
                        className="w-full bg-amber hover:bg-amber/90 text-yellow-950 font-semibold py-2 rounded-lg text-sm transition-all shadow-sm"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Claiming…
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Claim Admin
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sign in with Internet Identity first, then use this option
                      to reclaim admin access using your admin token.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// ─── Access Denied Screen ────────────────────────────────────────────────────
function AccessDeniedScreen() {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [showResetSection, setShowResetSection] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  async function handleClaimAdmin() {
    if (!actor || !adminToken.trim()) return;
    setIsResetting(true);
    try {
      await actor.resetAdmin(adminToken.trim());
      await queryClient.invalidateQueries({ queryKey: ["userRole"] });
      toast.success("Admin access claimed! Reloading…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid admin token. Please try again.";
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      <AppHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-destructive/30 rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-lg">
                  <ShieldAlert className="w-9 h-9 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Access Denied
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This app is restricted to a single admin account. You are
                  signed in with a different Internet Identity account.
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Only the designated admin can access this application. If you
                believe this is an error, please contact the app owner.
              </p>
            </div>

            {/* Sign Out */}
            <Button
              data-ocid="access_denied.primary_button"
              onClick={clear}
              variant="destructive"
              className="w-full font-semibold py-2.5 rounded-lg text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            {/* Admin Recovery Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <button
                type="button"
                data-ocid="access_denied.reset_admin.toggle"
                onClick={() => setShowResetSection((v) => !v)}
                className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-dim" />
                  <span className="font-medium">Lost admin access?</span>
                </div>
                {showResetSection ? (
                  <ChevronUp className="w-4 h-4 group-hover:text-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 group-hover:text-foreground" />
                )}
              </button>

              {showResetSection && (
                <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you know the admin token, you can claim admin access with
                    your current Internet Identity.
                  </p>
                  <div className="space-y-2">
                    <Label
                      htmlFor="admin-token-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Admin Token
                    </Label>
                    <Input
                      id="admin-token-input"
                      data-ocid="access_denied.reset_admin.input"
                      type="password"
                      placeholder="Enter admin token…"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleClaimAdmin();
                      }}
                      className="text-sm h-9 bg-background border-amber/30 focus-visible:ring-amber/50"
                      disabled={isResetting}
                    />
                  </div>
                  <Button
                    data-ocid="access_denied.reset_admin.primary_button"
                    onClick={() => void handleClaimAdmin()}
                    disabled={isResetting || !adminToken.trim()}
                    className="w-full bg-amber hover:bg-amber/90 text-yellow-950 font-semibold py-2 rounded-lg text-sm transition-all shadow-sm"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Claiming…
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Claim Admin
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function RoleBadge() {
  const { role, isLoading } = useUserRole();
  const { identity } = useInternetIdentity();

  if (isLoading) return null;

  if (!identity) {
    return (
      <Badge className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/20">
        Guest
      </Badge>
    );
  }

  if (role === "admin") {
    return (
      <Badge className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/20">
        Admin
      </Badge>
    );
  }

  if (role === "user") {
    return (
      <Badge className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-200 border border-teal-400/30 hover:bg-teal-500/20">
        User
      </Badge>
    );
  }

  return (
    <Badge className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/20">
      Guest
    </Badge>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("contracts");
  const [guestMode, setGuestMode] = useState(false);
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();
  const { role, isLoading: isRoleLoading } = useUserRole();

  // Show global loading spinner while identity is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster richColors position="top-right" />
        <div
          data-ocid="app.loading_state"
          className="flex items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-display text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // Show login screen only if: not logged in AND not in guest mode
  if (!identity && !guestMode) {
    return <LoginScreen onGuestContinue={() => setGuestMode(true)} />;
  }

  // If authenticated but role is still loading, show a spinner to avoid flicker
  if (identity && isRoleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster richColors position="top-right" />
        <div
          data-ocid="app.loading_state"
          className="flex items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-display text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  // If authenticated but role returned "guest", the query may still be resolving or retrying
  // Show a loading spinner instead of incorrectly blocking access
  if (identity && !isRoleLoading && role === "guest") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster richColors position="top-right" />
        <div
          data-ocid="app.loading_state"
          className="flex items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-display text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  // Only show access denied if explicitly registered as non-admin (role === "user")
  if (identity && !isRoleLoading && role === "user") {
    return <AccessDeniedScreen />;
  }

  function handleSignOut() {
    clear();
    setGuestMode(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="nav-bg shadow-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber flex items-center justify-center">
              <HardHat className="w-5 h-5 text-yellow-950" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold nav-fg leading-none">
                AttendPay
              </h1>
              <p className="text-xs text-white/50 leading-none mt-0.5">
                Attendance & Salary Manager
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {actorLoading && (
              <div
                data-ocid="header.loading_state"
                className="flex items-center gap-1.5 text-white/50"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs hidden sm:inline">Syncing…</span>
              </div>
            )}

            {/* Role badge */}
            <RoleBadge />

            {/* Guest: show Sign In button */}
            {!identity && guestMode && (
              <button
                type="button"
                data-ocid="header.signin.button"
                onClick={() => setGuestMode(false)}
                title="Sign in as Admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-amber/20 hover:bg-amber/30 transition-all border border-amber/30 hover:border-amber/50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Authenticated: show Sign Out button */}
            {identity && (
              <button
                type="button"
                data-ocid="header.signout.button"
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/25"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="max-w-[1400px] mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.tab`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? "bg-background text-foreground border-amber"
                    : "nav-fg border-transparent hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6">
        {activeTab === "contracts" && <ContractsTab />}
        {activeTab === "labours" && <LaboursTab />}
        {activeTab === "advances" && <AdvancesTab />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "settled" && <SettledTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
