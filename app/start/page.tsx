"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { emptyProfile, Profile, roles, storageKeys } from "@/lib/assessment";
import { ParticipantType } from "@/lib/questions";

const referralSources = [
  "SNS",
  "note",
  "Web検索",
  "知人の紹介",
  "経営支援者・コンサルタントからの紹介",
  "セミナー・イベント",
  "その他",
];

export default function StartPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(storageKeys.profile);
    if (saved) setProfile({ ...emptyProfile, ...JSON.parse(saved) });
  }, []);

  function updateProfile(next: Partial<Profile>) {
    setProfile((current) => ({ ...current, ...next }));
    setError("");
  }

  function start() {
    if (!profile.name || !profile.email || !profile.clinic || !profile.type) {
      setError("氏名・メールアドレス・医院名・対象者区分を入力してください。");
      return;
    }

    if (profile.referralSource === "知人の紹介" && !profile.referrerName?.trim()) {
      setError("ご紹介者様のお名前を入力してください。");
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
                <button
                  className={`role ${profile.type === type ? "active" : ""}`}
                  key={type}
                  onClick={() => updateProfile({ type })}
                  type="button"
                >
                  <strong>{roles[type][0]}</strong>
                  <span>{roles[type][1]}</span>
                </button>
              ))}
            </div>
            <div className="profile">
              <label>
                氏名
                <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
              </label>
              <label>
                メールアドレス
                <input type="email" value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} />
              </label>
              <label>
                医院名
                <input value={profile.clinic} onChange={(e) => updateProfile({ clinic: e.target.value })} />
              </label>
              <label>
                この診断をどちらでお知りになりましたか？
                <select
                  value={profile.referralSource ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      referralSource: e.target.value,
                      referrerName: e.target.value === "知人の紹介" ? profile.referrerName ?? "" : "",
                    })
                  }
                >
                  <option value="">選択してください</option>
                  {referralSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>
              {profile.referralSource === "知人の紹介" && (
                <label>
                  ご紹介者様のお名前
                  <input
                    value={profile.referrerName ?? ""}
                    onChange={(e) => updateProfile({ referrerName: e.target.value })}
                    placeholder="例：山田 太郎"
                  />
                </label>
              )}
            </div>
            {error && <p className="error">{error}</p>}
            <button className="button" onClick={start} type="button">
              設問へ進む →
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
