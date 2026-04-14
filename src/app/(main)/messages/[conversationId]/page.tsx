'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MoveLeft, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { safeTimeFormat } from '@/lib/dateUtils';
import { getPusherClient, channels, events } from '@/lib/pusher';

interface Message {
  id: string;
  content: string;
  mediaUrl?: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function ChatViewPage() {
  const { data: session } = useSession();
  const userId = (session?.user as Record<string, unknown>)?.id as string;
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (!res.ok) throw new Error('Forbidden');
        const data = await res.json();
        setMessages(data.data || []);
        if (data.partner) setPartner(data.partner);
      } catch {
        router.push('/messages');
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [conversationId, router]);

  useEffect(() => {
    if (!conversationId) return;
    
    let pusher;
    try {
      pusher = getPusherClient();
    } catch (e) {
      console.error('Pusher Client Error:', e);
      return;
    }
    
    if (!pusher) return;
    
    const channelName = channels.conversation(conversationId);
    pusher.unsubscribe(channelName);
    const channel = pusher.subscribe(channelName);

    channel.bind(events.NEW_MESSAGE, (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Native Upload via Cloudinary signed upload ---
  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setMediaPreview(localPreview);

    try {
      // Get signature from our API
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'vertex_messages' }),
      });
      const signData = await signRes.json();
      if (!signData.success) throw new Error('Signing failed');

      const { signature, timestamp, cloudName, apiKey, folder, uploadUrl } = signData.data;

      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setMediaUrl(uploadData.secure_url);
        setMediaPreview(uploadData.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMediaPreview('');
      setMediaUrl('');
    } finally {
      setUploading(false);
    }
  }, []);

  // --- File input handler ---
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFile]);

  // --- Drag and drop handlers ---
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        uploadFile(file);
      }
    }
  }, [uploadFile]);

  // --- Paste handler (Ctrl+V images) ---
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadFile(file);
          break;
        }
      }
    }
  }, [uploadFile]);

  const clearMedia = useCallback(() => {
    setMediaUrl('');
    setMediaPreview('');
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !mediaUrl) || sending || uploading) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      content: inputText,
      mediaUrl: mediaUrl,
      senderId: userId,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: session?.user?.name || 'Me',
        avatar: session?.user?.image || '',
      },
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setMediaUrl('');
    setMediaPreview('');
    setSending(true);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempMsg.content, mediaUrl: tempMsg.mediaUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.data : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const partnerInfo = partner;

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] xl:h-screen w-full lg:max-w-[700px] xl:max-w-none bg-background relative"
    >
      {/* Removed full screen drag overlay as per user request */}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur z-10 sticky top-0 shrink-0">
        <Link href="/messages" className="md:hidden p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground mr-1">
          <MoveLeft className="w-5 h-5" />
        </Link>
        {loading ? (
          <>
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <Avatar className="w-10 h-10 ring-2 ring-cyan-500/20">
              <AvatarImage src={partnerInfo?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
                {partnerInfo?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-none">{partnerInfo?.name || 'Conversation'}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-[250px]' : 'w-[180px]'}`} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === userId;
            const showAvatar = !isMe && (i === messages.length - 1 || messages[i + 1]?.senderId === userId);

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 shrink-0 flex items-end">
                    {showAvatar && (
                      <Avatar className="w-8 h-8 ring-1 ring-border shadow-sm">
                        <AvatarImage src={msg.sender?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-[10px]">
                          {msg.sender?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div
                    className={`px-4 py-2 text-sm max-w-full break-words shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-cyan-600 to-emerald-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border/50'
                    } ${msg.mediaUrl ? 'p-2' : ''}`}
                  >
                    {msg.mediaUrl && (
                      <img src={msg.mediaUrl} alt="attachment" className="max-w-full sm:max-w-[240px] rounded-lg mb-1 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                    )}
                    {msg.content && <span>{msg.content}</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {safeTimeFormat(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border mt-auto shrink-0">
        {/* Image preview */}
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/50 p-1.5">
              <img src={mediaPreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={clearMedia}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Image button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full h-10 w-10"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </Button>

          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handlePaste}
            placeholder={isDragging ? "Drop image here..." : "Message... (drop or paste images)"}
            className={`flex-1 rounded-full border-none h-10 px-4 transition-all ${
              isDragging 
                ? 'bg-cyan-500/20 ring-2 ring-cyan-500 text-cyan-500 placeholder:text-cyan-500 font-medium' 
                : 'bg-muted focus-visible:ring-1 focus-visible:ring-cyan-500'
            }`}
          />
          <Button
            type="submit"
            disabled={(!inputText.trim() && !mediaUrl) || sending || uploading}
            className="shrink-0 rounded-full h-10 px-4 flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
