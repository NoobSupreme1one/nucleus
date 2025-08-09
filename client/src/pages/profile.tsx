import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

export default function Profile() {
  const qc = useQueryClient();
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    setUploading(true);
    try {
      const res = await fetch("/api/users/profile-image", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Upload failed");
      await qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={user?.profileImageUrl || "/placeholder-user.png"}
                alt="Profile"
                className="w-20 h-20 rounded-full border object-cover bg-muted"
              />
              <div>
                <div className="font-medium">{user?.firstName || user?.email || "User"}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Profile picture</label>
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={onSelect} ref={fileRef} disabled={uploading} />
                <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG/JPG up to 10MB.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

