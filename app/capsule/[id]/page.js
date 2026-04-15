"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export default function CapsulePage() {
  const { id } = useParams();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [canOpen, setCanOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Check if we already unlocked this capsule in session storage
    const unlockedCapsules = JSON.parse(
      sessionStorage.getItem("unlockedCapsules") || "{}",
    );
    if (unlockedCapsules[id]) {
      setFiles(unlockedCapsules[id].files);
      setIsOpen(true);
    }

    fetch(`/api/capsule/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.capsule) {
          setCapsule(data.capsule);
          if (data.capsule.openDate) {
            if (new Date() >= new Date(data.capsule.openDate)) setCanOpen(true);
          } else {
            setCanOpen(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!capsule?.openDate) return;
    const openDate = new Date(capsule.openDate);
    if (new Date() >= openDate) return;
    const interval = setInterval(() => {
      const diff = openDate - new Date();
      if (diff <= 0) {
        setCanOpen(true);
        setCountdown(null);
        clearInterval(interval);
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [capsule]);

  const isImage = (f) => f.type?.startsWith("image/");
  const formatSize = (b) =>
    b > 1048576
      ? `${(b / 1048576).toFixed(1)} MB`
      : `${(b / 1024).toFixed(0)} KB`;
  const getIcon = (type) => {
    if (!type) return "📄";
    if (type.includes("pdf")) return "📕";
    if (type.includes("video")) return "🎬";
    if (type.includes("audio")) return "🎵";
    if (type.includes("zip") || type.includes("rar")) return "🗜️";
    if (type.includes("text")) return "📝";
    return "📄";
  };
  const download = (file) => {
    const a = document.createElement("a");
    a.href = file.data;
    a.download = file.name;
    a.click();
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsUnlocking(true);
    try {
      const res = await fetch(`/api/capsule/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.unlocked) {
        // Fetch the full capsule data with files now
        const capsuleRes = await fetch(`/api/capsule/${id}?unlocked=true`);
        const capsuleData = await capsuleRes.json();
        if (capsuleData.capsule && capsuleData.capsule.files) {
          const filesData = capsuleData.capsule.files;
          setFiles(filesData);
          // Store in session storage
          const unlockedCapsules = JSON.parse(
            sessionStorage.getItem("unlockedCapsules") || "{}",
          );
          unlockedCapsules[id] = { files: filesData };
          sessionStorage.setItem(
            "unlockedCapsules",
            JSON.stringify(unlockedCapsules),
          );
        }
        setIsOpen(true);
        toast("Capsule unlocked!");
        setPassword("");
      } else {
        toast(data.error || "Invalid password");
      }
    } catch (err) {
      toast("Error unlocking capsule");
    }
    setIsUnlocking(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">
          Chargement...
        </p>
      </div>
    );

  if (!capsule)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-lg">Capsule introuvable</p>
          <p className="text-muted-foreground text-sm mt-1">
            Ce lien n&apos;existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );

  const capsuleFiles = Array.isArray(files) ? files : [];
  const images = capsuleFiles.filter(isImage);
  const others = capsuleFiles.filter((f) => !isImage(f));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[url(/background_cap.webp)] bg-cover bg-center">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            CapsuleStudio
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{capsule.name}</CardTitle>
                {capsule.user?.name && (
                  <CardDescription className="mt-1">
                    Par {capsule.user.name}
                  </CardDescription>
                )}
              </div>
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Ouverte" : "Scellée"}
              </Badge>
            </div>
          </CardHeader>

          {!isOpen ? (
            <CardContent className="space-y-4">
              {capsule.description && (
                <p className="text-sm text-muted-foreground">
                  {capsule.description}
                </p>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Créée le
                  </p>
                  <p className="font-medium">
                    {new Date(capsule.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {capsule.openDate && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">
                      S&apos;ouvre le
                    </p>
                    <p className="font-medium">
                      {new Date(capsule.openDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Fichiers
                  </p>
                  <p className="font-medium">
                    {capsuleFiles.length} fichier
                    {capsuleFiles.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Visibilité
                  </p>
                  <p className="font-medium capitalize">{capsule.visibility}</p>
                </div>
              </div>

              <Separator />

              {capsule.visibility === "private" && !isOpen ? (
                <form onSubmit={handleUnlock} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>This capsule is password protected</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isUnlocking}
                    />
                    <Button type="submit" disabled={isUnlocking || !password}>
                      {isUnlocking ? "Unlocking..." : "Unlock"}
                    </Button>
                  </div>
                </form>
              ) : countdown ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center uppercase tracking-widest">
                    S&apos;ouvre dans
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { v: countdown.days, l: "Jours" },
                      { v: countdown.hours, l: "Heures" },
                      { v: countdown.minutes, l: "Min" },
                      { v: countdown.seconds, l: "Sec" },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-muted rounded-lg py-3">
                        <p className="text-xl font-bold tabular-nums">
                          {String(v).padStart(2, "0")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => setIsOpen(true)}
                  disabled={!canOpen}
                >
                  Ouvrir la capsule
                </Button>
              )}
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              {capsule.description && (
                <p className="text-sm text-muted-foreground">
                  {capsule.description}
                </p>
              )}

              <Separator />

              {capsuleFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucun fichier dans cette capsule.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    {capsuleFiles.length} fichier
                    {capsuleFiles.length > 1 ? "s" : ""}
                  </p>

                  {/* Grille images */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((file, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-md overflow-hidden cursor-pointer bg-muted group"
                          onClick={() => setSelectedFile(file)}
                        >
                          <img
                            src={file.data}
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              Voir
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Autres fichiers */}
                  {others.length > 0 && (
                    <div className="space-y-2">
                      {others.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <span className="text-xl">{getIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatSize(file.size)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => download(file)}
                          >
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Partagé via CapsuleStudio
        </p>
      </div>

      {/* Lightbox */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="sm"
              className="absolute -top-10 right-0"
              onClick={() => setSelectedFile(null)}
            >
              Fermer
            </Button>
            <img
              src={selectedFile.data}
              alt={selectedFile.name}
              className="w-full rounded-lg object-contain max-h-[78vh]"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-white/60 truncate">
                {selectedFile.name}
              </p>
              <Button size="sm" onClick={() => download(selectedFile)}>
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
