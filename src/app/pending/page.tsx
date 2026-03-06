"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Zap } from "lucide-react";
import { AuthProviders } from "@/components/auth-providers";

function PendingContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 bg-card text-center">
        <CardHeader>
          <div className="mb-4 flex items-center justify-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "#FF6B35" }}
            >
              V
            </div>
            <span className="text-2xl font-bold text-foreground">Volley</span>
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/10">
            <Clock className="h-8 w-8 text-[#FF6B35]" />
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Volley is currently in beta. Your account has been created and is
            pending approval from an administrator. You&apos;ll be able to access
            the app once your account is approved.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PendingPage() {
  return (
    <AuthProviders>
      <PendingContent />
    </AuthProviders>
  );
}
