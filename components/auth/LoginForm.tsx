"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

interface Props {
  labels: {
    password: string;
    submit: string;
    invalidCredentials: string;
  };
}

export function LoginForm({ labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        password: values.password,
        redirect: false,
      });
      if (!res || res.error) {
        setServerError(labels.invalidCredentials);
        return;
      }
      toast.success(labels.submit);
      router.push(callbackUrl);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.password}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {labels.submit}
        </Button>
      </form>
    </Form>
  );
}
