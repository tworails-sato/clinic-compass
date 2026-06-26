"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { emptyProfile, Profile, roles, storageKeys } from "@/lib/assessment";
import { ParticipantType } from "@/lib/questions";

export default function StartPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(storageKeys.profile);
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  function start() {
    if (!profile.name || !profile.email || !profile.clinic || !profile.type) {
      setError("氏名・メールアドレス・医院名・対象者区分を入力してください。");
      return;
    }
    window.sessionStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.sessionStorage.removeItem(storageKeys.answers);
    router.push("/questions");
  }

  return (
    <>
      <SiteHeader />
      <main className="main">
        <div className="wrap">
          <section className="card profile-card">
            <p className="step">STEP 1 / 基本情報</p>
            <h2>診断をはじめましょう</h2>
            <p className="lead">対象者区分に応じて、表示する設問が切り替わります。</p>
            <div className="roles">
              {(Object.keys(roles) as ParticipantType[]).map((type) => (
                <button className={`role ${profile.type === type ? "active" : ""}`} key={type} onClick={() => setProfile({ ...profile, type })}>
                  <strong>{roles[type][0]}</strong>
                  <span>{roles[type][1]}</span>
                </button>
              ))}
            </div>
            <div className="profile">
              <label>
                氏名
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </label>
              <label>
                メールアドレス
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </label>
              <label>
                医院名
                <input value={profile.clinic} onChange={(e) => setProfile({ ...profile, clinic: e.target.value })} />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="button" onClick={start}>
              設問へ進む →
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
