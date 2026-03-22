import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useUpdateProfileMutation } from "@/store/services/user.api";
import { updateUserName } from "@/store/slices/auth.slice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  User,
  Shield,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || "");
  const [activeTab, setActiveTab] = useState("profile");
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [success, setSuccess] = useState(false);

  // Theme support
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await updateProfile({ name }).unwrap();
      dispatch(updateUserName(name));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    // In a real app, we'd apply the dark class to documentElement here
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal workspace, account security, and dashboard
          appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-2 bg-muted/40 p-2 rounded-xl border border-muted-foreground/10">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "account", label: "Account", icon: Shield },
            { id: "appearance", label: "Appearance", icon: Palette },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon
                  className={cn(
                    "w-4 h-4",
                    activeTab === tab.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                {tab.label}
              </div>
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 opacity-0 transition-opacity",
                  activeTab === tab.id ? "opacity-100" : "",
                )}
              />
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-6 min-h-[500px]">
          {activeTab === "profile" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <form onSubmit={handleUpdateProfile}>
                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl">Public Profile</CardTitle>
                    <CardDescription>
                      This information is public within your organization and
                      used for identification in teams.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid gap-4">
                      <Label
                        htmlFor="name"
                        className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80"
                      >
                        Display Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="h-12 text-lg border-muted-foreground/20 focus-visible:ring-primary/30"
                        disabled={isLoading}
                      />
                      <p className="text-sm text-muted-foreground/70 italic">
                        People will see this name next to your messages and
                        tasks.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="h-12 bg-muted/50 border-muted-foreground/10 cursor-not-allowed pr-10"
                        />
                        <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border border-muted-foreground/5">
                        <span className="font-bold text-primary">Note:</span>{" "}
                        Your email is linked to your Firebase account and cannot
                        be modified here for security reasons.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                    <div className="flex-1">
                      {success && (
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold animate-in bounce-in duration-500">
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-background" />
                          Settings updated successfully!
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || name === user?.name}
                      className="w-full sm:w-auto px-8 h-11 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Update Profile
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === "account" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Account Status</CardTitle>
                  <CardDescription>
                    Information about your roles and system identifies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold opacity-60 uppercase tracking-widest">
                        Organization Role
                      </p>
                      <p className="text-xl font-extrabold capitalize text-primary">
                        {user?.role?.toLowerCase() || "Member"}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Internal Database ID
                    </Label>
                    <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border">
                      <code className="text-[13px] font-mono flex-1 truncate select-all">
                        {user?._id}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] font-bold"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Appearance</CardTitle>
                  <CardDescription>
                    Select how the workspace feels to you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4">
                    <Label className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                      Color Theme
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      {["light", "dark", "system"].map((m) => (
                        <button
                          key={m}
                          onClick={() => handleThemeChange(m)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                            theme === m
                              ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                              : "border-muted-foreground/10 hover:border-primary/40 bg-muted/20",
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              m === "dark" ? "bg-slate-900" : "bg-slate-100",
                            )}
                          >
                            {m === "light" ? (
                              <Palette className="w-5 h-5 text-slate-800" />
                            ) : (
                              <Palette className="w-5 h-5 text-slate-200" />
                            )}
                          </div>
                          <span className="text-xs font-bold capitalize">
                            {m}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-muted/30 border border-muted-foreground/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight text-foreground">
                          Compact Mode
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Reduce whitespace for higher information density.
                        </p>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-muted border border-muted-foreground/20 cursor-not-allowed opacity-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
