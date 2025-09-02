import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, insertUserSchema, type LoginData, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { useLocation } from "wouter";
import logoUrl from "@/assets/logo.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await apiPost<{ token: string; user: any }>("/api/auth/login", data);
      
      AuthService.setToken(response.token);
      AuthService.setUser(response.user);
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans MyJantes !",
      });
      
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: InsertUser) => {
    setIsLoading(true);
    try {
      const response = await apiPost<{ token: string; user: any }>("/api/auth/register", data);
      
      AuthService.setToken(response.token);
      AuthService.setUser(response.user);
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue dans MyJantes !",
      });
      
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 min-h-screen flex flex-col justify-center">
      {/* Logo */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <img 
            src={logoUrl} 
            alt="MyJantes" 
            className="w-full h-full object-contain"
            data-testid="img-logo-login"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">MyJantes</h1>
        <p className="text-muted-foreground">Votre expert en jantes et pneus</p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex bg-secondary rounded-ios p-1 mb-6">
        <button
          type="button"
          className={`flex-1 py-2 text-center rounded-ios transition-all ${
            !isSignUp
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
          onClick={() => setIsSignUp(false)}
          data-testid="tab-login"
        >
          Connexion
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-center rounded-ios transition-all ${
            isSignUp
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
          onClick={() => setIsSignUp(true)}
          data-testid="tab-signup"
        >
          Inscription
        </button>
      </div>

      {/* Login Form */}
      {!isSignUp && (
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@exemple.com"
              className="form-input"
              data-testid="input-email"
              {...loginForm.register("email")}
            />
            {loginForm.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="form-input"
              data-testid="input-password"
              {...loginForm.register("password")}
            />
            {loginForm.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="ios-button w-full"
            disabled={isLoading}
            data-testid="button-login"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      )}

      {/* Sign Up Form */}
      {isSignUp && (
        <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-6">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium mb-2">
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom et prénom"
              className="form-input"
              data-testid="input-name"
              {...signUpForm.register("name")}
            />
            {signUpForm.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {signUpForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="signup-email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="votre.email@exemple.com"
              className="form-input"
              data-testid="input-signup-email"
              {...signUpForm.register("email")}
            />
            {signUpForm.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="block text-sm font-medium mb-2">
              Téléphone (optionnel)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              className="form-input"
              data-testid="input-phone"
              {...signUpForm.register("phone")}
            />
          </div>

          <div>
            <Label htmlFor="signup-password" className="block text-sm font-medium mb-2">
              Mot de passe
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              className="form-input"
              data-testid="input-signup-password"
              {...signUpForm.register("password")}
            />
            {signUpForm.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="ios-button w-full"
            disabled={isLoading}
            data-testid="button-signup"
          >
            {isLoading ? "Inscription..." : "Créer mon compte"}
          </Button>
        </form>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-muted-foreground">
          En vous connectant, vous acceptez nos{" "}
          <a href="#" className="text-primary">
            CGV
          </a>{" "}
          et{" "}
          <a href="#" className="text-primary">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}
