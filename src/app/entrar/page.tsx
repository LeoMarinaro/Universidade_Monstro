import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Universidade Monstro" };

export default function LoginPage() {
  return (
    <AuthCard
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-accent hover:text-accent-hover">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
