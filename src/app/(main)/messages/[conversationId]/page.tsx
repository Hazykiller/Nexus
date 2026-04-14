'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MoveLeft, Send, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { safeTimeFormat } from '@/lib/dateUtils';
import { getPusherClient, channels, events } from '@/lib/pusher';
import { CldUploadWidget } from 'next-cloudinary';

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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    const channelName = channels.conversation(conversationId);
    
    // Unbind and rebind to prevent duplicates if mounted multiple times
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
    // Determine target based on scrolling behavior wanted.
    // For now, auto scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !mediaUrl) || sending) return;

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
      }
    } catch {
      // Revert if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const partnerInfo = partner;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] xl:h-screen w-full lg:max-w-[700px] xl:max-w-none bg-background">
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
                      <img src={msg.mediaUrl} alt="attachment" className="max-w-full sm:max-w-[200px] rounded-lg mb-2 object-cover" />
                    )}
                    {msg.content}
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
      <div className="p-3 bg-card border-t border-border mt-auto shrink-0 flex flex-col gap-2">
        {mediaUrl && (
          <div className="relative inline-block mb-2 self-start bg-muted p-2 rounded-xl">
            <img src={mediaUrl} alt="Upload preview" className="h-20 w-auto rounded-lg object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
              onClick={() => setMediaUrl('')}
            >
              <span className="text-xs">×</span>
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
          <CldUploadWidget
            uploadPreset="vertex_social"
            onSuccess={(result: any) => {
              const url = result?.info?.secure_url;
              if (url) {
                setMediaUrl(url);
              }
            }}
          >
            {({ open }: { open: () => void }) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => open()}
                className="shrink-0 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
            )}
          </CldUploadWidget>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            className="flex-1 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-cyan-500 h-10 px-4"
          />
          <Button
            type="submit"
            disabled={(!inputText.trim() && !mediaUrl) || sending}
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
