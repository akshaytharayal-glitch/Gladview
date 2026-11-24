import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Button from "./common/custom-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { pb } from "@/lib/pocketbase";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" width="16" height="16" className={className} aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.7 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
  </svg>
);

type FormData = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

function LoginPopoverButton() {
  const auth = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [tabValue, setTabValue] = useState<"login" | "signup">("login");

  const applyPbAuth = () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      auth.setAuth({
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        username: pb.authStore.record.username,
        avatar: pb.authStore.record.avatar,
        collectionId: pb.authStore.record.collectionId,
        collectionName: pb.authStore.record.collectionName,
        autoSkip: pb.authStore.record.autoSkip,
        created: pb.authStore.record.created,
      });
      return true;
    }
    return false;
  };

  const showError = (e: any, fallback: string) => {
    if (e?.status === 0) {
      toast.error(
        "Can't reach the account server. Please check your connection or try again later.",
        { style: { background: "red" } },
      );
      return;
    }
    const fields = e?.response?.data;
    if (fields && Object.keys(fields).length) {
      for (const key in fields) {
        toast.error(`${key}: ${fields[key]?.message ?? "invalid"}`, {
          style: { background: "red" },
        });
      }
      return;
    }
    toast.error(e?.response?.message || fallback, {
      style: { background: "red" },
    });
  };

  const loginWithEmail = async () => {
    try {
      if (formData.username === "" || formData.password === "") {
        toast.error("Please fill in all fields", {
          style: { background: "red" },
        });
        return;
      }

      await pb
        .collection("users")
        .authWithPassword(formData.username, formData.password);

      if (applyPbAuth()) {
        toast.success("Login successful", { style: { background: "green" } });
        clearForm();
      }
    } catch (e: any) {
      console.error("Login error:", e);
      if (e?.status === 400) {
        toast.error("Invalid username/email or password", {
          style: { background: "red" },
        });
      } else {
        showError(e, "Login failed. Please try again.");
      }
    }
  };

  const signupWithEmail = async () => {
    if (
      formData.username === "" ||
      formData.password === "" ||
      formData.email === "" ||
      formData.confirm_password === ""
    ) {
      toast.error("Please fill in all fields", {
        style: { background: "red" },
      });
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match", { style: { background: "red" } });
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters", {
        style: { background: "red" },
      });
      return;
    }

    try {
      const user = await pb.collection("users").create({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirm_password,
      });

      if (user) {
        try {
          await pb
            .collection("users")
            .authWithPassword(formData.email, formData.password);
          if (applyPbAuth()) {
            toast.success("Account created. Welcome!", {
              style: { background: "green" },
            });
            clearForm();
            return;
          }
        } catch {
          /* fall through to manual login */
        }
        toast.success("Account created successfully. Please login.", {
          style: { background: "green" },
        });
        clearForm();
        setTabValue("login");
      }
    } catch (e: any) {
      console.error("Signup error:", e);
      showError(e, "Signup failed. Please try again.");
    }
  };

  const clearForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    });
  };

  const loginWithGoogle = async () => {
    try {
      const res = await pb.collection("users").authWithOAuth2({
        provider: "google",
      });

      if (pb.authStore.isValid && pb.authStore.record) {
        // Brand-new Google accounts get a random username: use their name.
        const name = String(res.meta?.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 16);
        if (res.meta?.isNew && name) {
          try {
            await pb.collection("users").update(pb.authStore.record.id, {
              username: `${name}${Math.floor(1000 + Math.random() * 9000)}`,
            });
          } catch {
            /* keep the generated username */
          }
        }
        applyPbAuth();
        toast.success("Login successful", { style: { background: "green" } });
      }
    } catch (e: any) {
      console.error("Google login error:", e);
      showError(e, "Google login failed or was cancelled.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-0 bg-gradient-to-r from-amber-300 to-amber-600 text-md font-bold text-slate-950 hover:from-amber-200 hover:to-amber-500 transition-all duration-300"
        >
          Login
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        className="z-[110] bg-slate-950/75 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] rounded-xl w-[300px] mt-4 mr-4 p-4"
      >
        <Tabs
          defaultValue={tabValue}
          value={tabValue}
          onValueChange={(value) => setTabValue(value as "login" | "signup")}
        >
          <TabsList>
            <TabsTrigger onClick={clearForm} value="login">
              Login
            </TabsTrigger>
            <TabsTrigger onClick={clearForm} value="signup">
              Signup
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="flex flex-col gap-2">
            <div className="mt-2">
              <p className="text-gray-300 text-xs">Email or Username:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                value={formData.username}
                placeholder="Enter your email/username"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Password:</p>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={loginWithEmail}
            >
              Login
            </Button>
            <hr className="text-white text-xs text-center" />
            <Button
              variant="default"
              className="bg-white hover:bg-gray-200 text-black w-full text-xs"
              size="sm"
              onClick={loginWithGoogle}
            >
              <GoogleIcon className="mr-2" />
              Continue with Google
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="flex flex-col gap-2">
            <div>
              <p className="text-gray-300 text-xs">Username:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                value={formData.username}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Email:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                type="email"
                value={formData.email}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Password:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                type="password"
                value={formData.password}
                placeholder="Enter your password"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Confirm Password:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                type="password"
                value={formData.confirm_password}
                placeholder="Enter your password again"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={signupWithEmail}
            >
              Signup
            </Button>
            <hr className="text-white text-xs text-center" />
            <Button
              variant="default"
              className="bg-white hover:bg-gray-200 text-black w-full text-xs"
              size="sm"
              onClick={loginWithGoogle}
            >
              <GoogleIcon className="mr-2" />
              Sign up with Google
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default LoginPopoverButton;
