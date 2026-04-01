'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';

export default function EditProfilePage() {
  const { user, update } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: '',
    website: '',
    location: '',
    dob: '',
    privacy: 'public',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bio', form.bio);
      formData.append('website', form.website);
      formData.append('location', form.location);
      formData.append('dob', form.dob);
      formData.append('privacy', form.privacy);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: formData, // Auto-sets multipart/form-data boundary
      });

      if (res.ok) {
        await update({ name: form.name });
        toast.success('Profile updated!');
        router.push(`/profile/${user.username}`);
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Edit Profile</span>
      </h1>

      <Card className="rounded-2xl border border-border p-6">
        <div className="flex flex-col items-center mb-6">
          <Label htmlFor="avatar-upload" className="relative group cursor-pointer inline-block">
            <Avatar className="w-24 h-24 ring-4 ring-cyan-500/20">
              <AvatarImage src={avatarPreview || user?.image} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col gap-1 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-[10px] text-white/90 font-medium">Upload</span>
            </div>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
            />
          </Label>
          <p className="text-sm text-muted-foreground mt-2">@{user?.username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              className="mt-1.5 rounded-xl"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://yoursite.com"
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="City, Country"
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              className="mt-1.5 rounded-xl"
            />
          </div>
          
          <div className="pt-2">
            <Label className="mb-1.5 block">Account Privacy</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={form.privacy === 'public' ? 'default' : 'outline'}
                className={form.privacy === 'public' ? 'flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl' : 'flex-1 rounded-xl border-cyan-500/30 text-cyan-400'}
                onClick={() => setForm(p => ({ ...p, privacy: 'public' }))}
              >
                Public
              </Button>
              <Button
                type="button"
                variant={form.privacy === 'private' ? 'default' : 'outline'}
                className={form.privacy === 'private' ? 'flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl' : 'flex-1 rounded-xl border-emerald-500/30 text-emerald-400'}
                onClick={() => setForm(p => ({ ...p, privacy: 'private' }))}
              >
                Private
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Private accounts limit visibility and require direct approval for messages and follows.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
