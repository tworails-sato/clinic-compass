"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    jQuery?: JQueryStatic;
    $?: JQueryStatic;
    jstz?: {
      determine: () => {
        name: () => string;
      };
    };
  }
}

type JQueryStatic = {
  (selector: string | HTMLElement | Document | HTMLFormElement): JQueryLike;
  ajax: (options: {
    url: string;
    type: string;
    data: FormData;
    dataType: string;
    async: boolean;
    contentType: false;
    processData: false;
  }) => {
    done: (callback: (data: { status?: string }) => void) => {
      fail: (callback: (data: { responseJSON?: NexproErrorResponse }) => void) => void;
    };
  };
};

type JQueryLike = {
  val: (value?: string) => string | JQueryLike | undefined;
  get: (index: number) => HTMLFormElement;
  on: (eventName: string, handler: () => false) => JQueryLike;
  off: (eventName: string) => JQueryLike;
  each: (callback: (index: number, element: HTMLElement) => void) => JQueryLike;
  remove: () => void;
  append: (content: string) => JQueryLike;
  parent: () => JQueryLike;
};

type NexproErrorResponse = {
  status?: string;
  errors?: Record<string, string>;
};

export type RefolmoRegistrationProfile = {
  name: string;
  email: string;
  clinic: string;
};

type Props = {
  onSuccess: (profile: RefolmoRegistrationProfile) => void;
};

export function RefolmoRegistrationGate({ onSuccess }: Props) {
  const [scriptLoadCount, setScriptLoadCount] = useState(0);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    const $ = window.jQuery || window.$;
    if (!$ || !window.jstz) return;

    setFormReady(true);

    const determineTimezone = window.jstz.determine().name();
    if (typeof determineTimezone !== "undefined" && determineTimezone !== "") {
      $("#profile_time_zone").val(determineTimezone);
    }

    const form = $("#new_mypage_campaign_apply_embedded_form");
    const url = String($("#nextpro_endpoint_url").val() ?? "");

    form.off("submit.refolmoCompass");
    form.on("submit.refolmoCompass", () => {
      $(".valid_error").each((_, element) => element.remove());
      let nexproPostResult = false;

      try {
        const formElement = form.get(0);
        const formData = new FormData(formElement);

        $.ajax({
          url,
          type: "POST",
          data: formData,
          dataType: "json",
          async: false,
          contentType: false,
          processData: false,
        })
          .done((data) => {
            if (data.status === "OK") {
              nexproPostResult = true;
            } else {
              console.warn("[clinic-compass] Unknown REFOLMO registration status");
            }
          })
          .fail((data) => {
            const json = data.responseJSON;
            if (json?.status === "NG" && json.errors) {
              Object.entries(json.errors).forEach(([key, message]) => {
                if (key === "base") {
                  form.append(`<p class='valid_error'><small><strong>${escapeHtml(message)}</strong></small></p>`);
                } else if (key === "schedule_select_error") {
                  $("#schedules_select").append(`<p class='valid_error'><small><strong>${escapeHtml(message)}</strong></small></p>`);
                } else {
                  $(`#profile_${key}`).parent().append(`<p class='valid_error'><small><strong>${escapeHtml(message)}</strong></small></p>`);
                }
              });
            } else {
              console.error("[clinic-compass] Unknown REFOLMO registration error");
            }
          });
      } catch (error) {
        console.error("[clinic-compass] REFOLMO registration failed", error);
      }

      if (nexproPostResult) {
        onSuccess({
          email: String($("#profile_email").val() ?? ""),
          name: String($("#profile_name").val() ?? ""),
          clinic: String($("#profile_company_name").val() ?? ""),
        });
      }

      return false;
    });
  }, [scriptLoadCount, onSuccess]);

  return (
    <section className="refolmo-gate-card">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jstimezonedetect/1.0.7/jstz.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoadCount((count) => count + 1)}
      />
      <Script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        strategy="afterInteractive"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
        crossOrigin="anonymous"
        onLoad={() => setScriptLoadCount((count) => count + 1)}
      />

      <p className="eyebrow teal">FREE MEMBER REGISTRATION</p>
      <h2>詳しい診断結果を見るには、REFOLMO Medの会員登録が必要です</h2>
      <p className="refolmo-gate-lead">
        簡単な情報登録で、以下がご覧いただけます。
      </p>
      <ul className="refolmo-gate-benefits">
        <li>あなただけの詳しい診断結果（6領域スコア・レーダーチャート・強み・課題）</li>
        <li>医療経営メディア「REFOLMO Med」のウェビナー・資料</li>
      </ul>

      {!formReady && <p className="hint">登録フォームを読み込んでいます。</p>}

      <form
        className="new_mypage_campaign_apply_embedded_form refolmo-form"
        id="new_mypage_campaign_apply_embedded_form"
        action="#"
        acceptCharset="UTF-8"
        method="post"
      >
        <input type="hidden" name="nextpro_endpoint_url" id="nextpro_endpoint_url" value="https://remed.refolmo.com/api/v1/campaign-applies/OTU3NTY%253D" autoComplete="off" />
        <input autoComplete="off" type="hidden" name="mypage_campaign_apply_embedded_form[is_profile]" id="mypage_campaign_apply_embedded_form_is_profile" />
        <input type="hidden" name="enterprise_code" id="enterprise_code" value="media-remed" autoComplete="off" />
        <div className="floating-labels pt-3">
          <input value="create_kind" autoComplete="off" type="hidden" name="profile[kind]" id="profile_kind" readOnly />
          <input autoComplete="off" type="hidden" name="profile[id]" id="profile_id" />
          <input value="ja" autoComplete="off" type="hidden" name="profile[language]" id="profile_language" readOnly />
          <input value="Asia/Tokyo" autoComplete="off" type="hidden" name="profile[time_zone]" id="profile_time_zone" readOnly />
          <input type="hidden" name="authenticity_token" id="authenticity_token" value="bZQ3EU8wTg==--vK//l0JXOLVc9M3S--Z+9L3pi7ZGYdyvRGRqAtaA==" autoComplete="off" />

          <div className="form-group nexpro_form_text required">
            <label htmlFor="profile_email">メールアドレス</label>
            <input type="text" name="profile[email]" id="profile_email" required />
            <small />
          </div>
          <div className="form-group nexpro_form_text required">
            <label htmlFor="profile_name">氏名</label>
            <input type="text" name="profile[propaties][name]" id="profile_name" required />
            <small />
          </div>
          <div className="form-group nexpro_form_text required">
            <label htmlFor="profile_company_name">法人名/医院名</label>
            <input type="text" name="profile[propaties][company_name]" id="profile_company_name" required />
            <small />
          </div>
          <div className="form-group nexpro_form_select required">
            <label htmlFor="profile_positioning">あなたのお立場に最も近いものをお選びください</label>
            <select name="profile[propaties][positioning]" id="profile_positioning" required>
              <option value="">選択してください。</option>
              <option value="院長・理事長・経営者">院長・理事長・経営者</option>
              <option value="役員・事務長・管理職">役員・事務長・管理職</option>
              <option value="医師・歯科医師">医師・歯科医師</option>
              <option value="医療従事者・スタッフ">医療従事者・スタッフ</option>
              <option value="医療関連企業の方">医療関連企業の方</option>
              <option value="その他">その他</option>
            </select>
            <small />
          </div>
        </div>
        <button type="submit" className="button cta-yellow refolmo-submit">
          詳しい診断結果を見る
        </button>
        <p className="refolmo-policy-note">
          ご登録前に
          <a href="https://remed.refolmo.com/library/MTA0NjM1" target="_blank" rel="noopener noreferrer">
            プライバシーポリシー
          </a>
          をご確認ください。
        </p>
      </form>
    </section>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
