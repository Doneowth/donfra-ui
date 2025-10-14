"use client";

import "@/components/codepad.css"; // ← 使用单独 CSS（见下）
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import CodePad from "@/components/codepad";

type Phase = "loading" | "lobby" | "pad";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export default function CodingPage() {
  const query = useSearchParams();
  const inviteToken = useMemo(() => query.get("invite") || "", [query]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [initPass, setInitPass] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        if (inviteToken) {
          setBusy(true);
          await api.room.join(inviteToken);
          if (!cancelled) {
            setPhase("pad");
            setBusy(false);
            return;
          }
        }
        const cookie = getCookie("room_access");
        const st = await api.room.status();
        if (!cancelled) {
          if (cookie === "1" || st.open) setPhase("pad");
          else setPhase("lobby");
        }
      } catch {
        if (!cancelled) setPhase("lobby");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, [inviteToken]);

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(new URL(inviteUrl, window.location.origin).toString());
      setHint("Invite URL copied."); setTimeout(() => setHint(""), 1500);
    } catch { setHint("Copy failed."); setTimeout(() => setHint(""), 1500); }
  };

  const initRoom = async () => {
    if (!initPass.trim()) { setHint("请输入口令"); setTimeout(() => setHint(""), 1200); return; }
    try {
      setBusy(true); setHint("");
      const res = await api.room.init(initPass.trim());
      setInviteUrl(res.inviteUrl);
    } catch (e: any) {
      setHint(e?.message || "初始化失败"); setTimeout(() => setHint(""), 1500);
    } finally { setBusy(false); }
  };

  const onExit = () => {
    document.cookie = `room_access=; Path=/; Max-Age=0; SameSite=Lax`;
    setPhase("lobby"); setInviteUrl(""); setInitPass("");
  };

  if (phase === "pad") return <div className="coding-page"><CodePad onExit={onExit} /></div>;

  if (phase === "loading") {
    return <div className="coding-page"><div className="lobby-root"><div className="lobby-card">loading…</div></div></div>;
  }

  return (
    <div className="coding-page">
      <div className="lobby-root">
        <div className="lobby-card">
          <div className="lobby-head">
            <span className="brand">DONFRA</span>
            <span className="brand-sub">CodePad Lobby</span>
          </div>

          <div className="lobby-section">
            <div className="section-title">教练初始化（需要口令）</div>
            <div className="row gap-12">
              <input
                className="input"
                placeholder="输入教练口令，例如 19930115"
                value={initPass}
                onChange={(e) => setInitPass(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && initRoom()}
                disabled={busy}
              />
              <button className="btn-elegant" onClick={initRoom} aria-disabled={busy}>
                {busy ? "初始化中…" : "初始化房间"}
              </button>
            </div>

            {inviteUrl && (
              <>
                <div className="share-line">
                  已生成邀请链接：
                  <span className="share-url">
                    {typeof window !== "undefined" ? new URL(inviteUrl, window.location.origin).toString() : inviteUrl}
                  </span>
                </div>
                <div className="lobby-foot">
                  <button className="btn-ghost" onClick={copyInvite}>复制邀请链接</button>
                </div>
              </>
            )}
          </div>

          {hint && <div className="hint">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
