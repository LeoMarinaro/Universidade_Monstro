import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta · Universidade Monstro" };

export default function SignUpPage() {
  return (
    <AuthCard
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-accent hover:text-accent-hover">
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
