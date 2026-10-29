import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthSwitchLink } from "@/components/auth-switch-link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta · Universidade Monstro" };

// The form and the link read ?next= from the URL, so they sit behind Suspense
export default function SignUpPage() {
  return (
    <AuthCard
      footer={
        <>
          Já tem conta?{" "}
          <Suspense fallback={<span className="font-semibold text-accent">Entrar</span>}>
            <AuthSwitchLink href="/entrar">Entrar</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={<div className="h-80" />}>
        <SignUpForm />
      </Suspense>
    </AuthCard>
  );
}
