
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from "@/firebase";
import { useProfile } from "@/hooks/use-profile";
import { doc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Building, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import type { Company } from "@/lib/types";


const formSchema = z.object({
  name: z.string().min(2, "Le nom de l'entreprise doit comporter au moins 2 caractères."),
  address: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email("Adresse e-mail invalide.").optional().or(z.literal('')),
  taxId: z.string().optional(),
});

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const { profile } = useProfile();
  const companyId = profile?.companyId;

  const companyRef = useMemoFirebase(() => {
    if (!companyId || !firestore) return null;
    return doc(firestore, "companies", companyId);
  }, [firestore, companyId]);

  const { data: company, isLoading, mutate: mutateCompany } = useDoc<Company>(companyRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      contactEmail: "",
      taxId: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        address: company.address || "",
        phone: company.phone || "",
        contactEmail: company.contactEmail || "",
        taxId: company.taxId || "",
      });
    }
  }, [company, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!companyRef) return;
    updateDocumentNonBlocking(companyRef, values);
    toast({
      title: "Paramètres enregistrés",
      description: "Les informations de votre entreprise ont été mises à jour.",
    });
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;

    setIsAvatarUploading(true);
    try {
      const photoURL = await uploadToCloudinary(file, `avatars/${user.uid}`);

      if (photoURL) {
        await updateProfile(auth.currentUser, { photoURL });
        setLocalAvatarUrl(photoURL);
        toast({
          title: "Avatar mis à jour",
          description: "Votre nouvelle image de profil a été enregistrée sur Cloudinary.",
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: "destructive",
        title: "Erreur de téléversement",
        description: "Impossible de téléverser votre avatar.",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !companyRef) return;

    setIsLogoUploading(true);
    try {
      const logoUrl = await uploadToCloudinary(file, `logos/${companyId}`);

      if (logoUrl) {
        updateDocumentNonBlocking(companyRef, { logoUrl });
        toast({
          title: "Logo mis à jour",
          description: "Le logo de votre entreprise a été enregistré sur Cloudinary.",
        });
        mutateCompany();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Erreur de téléversement",
        description: "Impossible de téléverser votre logo.",
      });
    } finally {
      setIsLogoUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profil de l'entreprise</CardTitle>
          <CardDescription>
            Mettez à jour les informations de votre profil et de votre entreprise ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Profil Utilisateur</h3>
            <div className="flex items-center gap-6 p-4 border rounded-lg bg-muted/10">
              <div className="relative group cursor-pointer" onClick={() => avatarFileInputRef.current?.click()}>
                <Avatar className="h-24 w-24 border-2 border-primary/20 transition-all group-hover:border-primary/50 group-hover:shadow-md">
                  <AvatarImage src={localAvatarUrl || user?.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/5">
                    <UserIcon className="h-12 w-12 text-primary/40" />
                  </AvatarFallback>
                </Avatar>
                {isAvatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlusCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-medium text-sm">Avatar de profil</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">Cliquez sur l'image pour charger un nouvel avatar. PNG, JPG jusqu'à 2MB.</p>
                <Input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  disabled={isAvatarUploading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Logo de l'entreprise</h3>
            <div className="flex items-center gap-6 p-4 border rounded-lg bg-muted/10">
              <div
                className="relative group cursor-pointer h-24 w-24 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-all bg-background"
                onClick={() => logoFileInputRef.current?.click()}
              >
                {company?.logoUrl ? (
                  <CldImage src={company.logoUrl} alt="Logo de l'entreprise" width={96} height={96} preserveTransformations className="object-contain rounded-md transition-transform group-hover:scale-105" />
                ) : (
                  <Building className="h-12 w-12 text-muted-foreground/30" />
                )}
                {isLogoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlusCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-medium text-sm">Logo de la marque</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">Format PNG recommandé pour la transparence. Cliquez sur le cadre pour changer.</p>
                <Input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  disabled={isLogoUploading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Informations Générales</h3>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre Entreprise SAS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue de la République, 75001 Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 1 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de contact</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@votre-entreprise.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro d'identification fiscale</FormLabel>
                        <FormControl>
                          <Input placeholder="FR123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer les modifications
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
