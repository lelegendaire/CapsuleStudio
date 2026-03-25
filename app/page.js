"use client";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState, useRef } from "react";

import { DatePickerDemo } from "./DatePicker";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription } from "@/components/ui/field";
import { Cloud } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [session, setSession] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(null);
  const [visibility, setVisibility] = useState("private");
  const [password, setPassword] = useState("");
  const [capsuleLink, setCapsuleLink] = useState("");
  const [creating, setCreating] = useState(false);
  // Ajouter le state
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setFiles(Array.from(e.dataTransfer.files));
  };
  // Lire le token/user depuis localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      setSession({ user: JSON.parse(user) });
    }
  }, []);

  const createCapsule = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDrawerOpen(true);

      return;
    }

    setCreating(true);
    // Convertir les fichiers en base64
    const filesData = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result, // base64
              });
            reader.readAsDataURL(file);
          }),
      ),
    );
    const res = await fetch("/api/capsule", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        date,
        visibility,
        // Mot de passe seulement si privé
        password: visibility === "private" ? password : undefined,
        files: filesData, // ✅ Envoyer les fichiers
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setCreating(false);

    if (res.ok) {
      const link = `${window.location.origin}/capsule/${data.capsule.id}`;
      setCapsuleLink(link);
      toast("Capsule créée !");
    } else {
      toast(data.error || "Erreur lors de la création");
    }
  };

  const handleCreate = () => {
    if (session) {
      createCapsule();
    } else {
      setDrawerOpen(true);
    }
  };

  const isPrivate = visibility === "private";
  const isPublic = visibility === "public";

  return (
    <main className="w-full h-screen flex items-center justify-center">
      <Card className={"w-40/100 h-80/100 rounded-2xl"}>
        <ScrollArea className={"h-full"}>
          <CardHeader>
            <CardTitle>Create a capsule</CardTitle>
            <CardDescription>You can create a capsule here</CardDescription>
            <CardAction>
              {session ? (
                // Si connecté, afficher avatar
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="/porsche.jpg" alt={session.user.name} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{session.user.name || "User"}</span>
                </div>
              ) : (
                // Sinon bouton Sign Up
                <Button variant="link" onClick={() => setDrawerOpen(true)}>
                  Sign Up
                </Button>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6 mt-5">
                <div className="grid gap-2">
                  <Label>Upload files</Label>

                  {/* Input caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                  />

                  {/* Zone cliquable */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
      border-4 border-dashed rounded-4xl cursor-pointer
      transition-colors duration-200 select-none
      ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
      }
    `}
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Cloud />
                        </EmptyMedia>
                        <EmptyTitle>Capsule cloud</EmptyTitle>
                        <EmptyDescription>
                          {files.length > 0
                            ? `${files.length} fichier(s) sélectionné(s)`
                            : "Clique ou glisse tes fichiers ici."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capsuleid">Name of your capsule</Label>
                  <Input
                    id="capsuleid"
                    type="text"
                    placeholder="My capsule"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="description">Description</Label>
                  </div>
                  <Textarea
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="description">Visibility</Label>
                  </div>
                  <RadioGroup
                    value={visibility}
                    onValueChange={setVisibility}
                    defaultValue="private"
                    className="w-fit"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="private" id="r1" />
                      <Label htmlFor="r1">Private</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="public" id="r2" />
                      <Label htmlFor="r2">Public</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="unlisted" id="r3" />
                      <Label htmlFor="r3">Unlisted (link only)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="gap-2 flex justify-between">
                  <div className="w-1/2">
                    <div className="flex items-center">
                      <Label htmlFor="date">Date</Label>
                    </div>
                    <DatePickerDemo value={date} onChange={setDate} />
                  </div>
                  {/* Password seulement si NON public */}
                  {!isPublic && (
                    <div className="gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {/* Share — désactivé si privé */}
                <div className="grid gap-2">
                  <Label>Share</Label>
                  <Field orientation="horizontal">
                    <Input
                      type="text"
                      readOnly
                      disabled={isPrivate}
                      value={
                        isPrivate
                          ? "Not available for private capsules"
                          : capsuleLink || "Create your capsule to get the link"
                      }
                    />
                    <Button
                      type="button"
                      disabled={isPrivate || !capsuleLink}
                      onClick={() => {
                        navigator.clipboard.writeText(capsuleLink);
                        toast("Link copied!");
                      }}
                    >
                      Share
                    </Button>
                  </Field>
                  {isPrivate && (
                    <p className="text-xs text-muted-foreground">
                      Sharing is not available for private capsules.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="description">Preview</Label>
                  </div>
                  <AspectRatio
                    ratio={16 / 9}
                    className="rounded-lg bg-muted mb-5"
                  >
                    <Skeleton className={"w-full rounded-lg"} />
                  </AspectRatio>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="button" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </CardFooter>
        </ScrollArea>
      </Card>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
          <ScrollArea className={"h-full"}>
            <DrawerHeader className={"hidden"}>
              <DrawerTitle>Login</DrawerTitle>
              <DrawerDescription>
                Sign in to create your capsule
              </DrawerDescription>
            </DrawerHeader>
            {mode === "login" ? (
              <LoginForm
                onSuccess={() => {
                  setDrawerOpen(false);
                  setSession({
                    user: JSON.parse(localStorage.getItem("user")),
                  });
                }}
              />
            ) : (
              <SignupForm
                onSuccess={() => {
                  setMode("login");
                  toast("Account created! Please log in.");
                }}
              />
            )}
            <DrawerFooter>
              <FieldDescription className="text-center">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <Button
                  variant="outline"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Sign Up" : "Login"}
                </Button>
              </FieldDescription>
            </DrawerFooter>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
