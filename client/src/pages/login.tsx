import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { useLocation } from "wouter";
import { Car } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
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

  return (
    <div className="px-6 py-8 min-h-screen flex flex-col justify-center">
      {/* Logo */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-primary rounded-ios-xl mx-auto mb-6 flex items-center justify-center">
          <Car className="text-4xl text-white" size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-2">MyJantes</h1>
        <p className="text-muted-foreground">Votre expert en jantes et pneus</p>
      </div>

      {/* Login Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.email.message}
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
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.password.message}
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

        <div className="text-center">
          <a href="#" className="text-primary text-sm">
            Mot de passe oublié ?
          </a>
        </div>
      </form>

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
