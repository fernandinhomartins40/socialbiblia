import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [currentTab, setCurrentTab] = useState<"login" | "register">(defaultTab);

  const handleSuccess = () => {
    onClose();
  };

  const switchToLogin = () => {
    setCurrentTab("login");
  };

  const switchToRegister = () => {
    setCurrentTab("register");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        {currentTab === "login" ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm 
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}