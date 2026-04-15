import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Models to try in order for image generation
const IMAGE_MODELS = [
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash-exp-image-generation", 
  "gemini-2.5-flash-preview-native-audio-dialog",
];

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { title, content, platform, style } = await req.json();
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const platformName =
      platform === "xiaohongshu" ? "小红书" :
      platform === "wechat" ? "微信公众号" :
      platform === "douyin" ? "抖音" : "社交媒体";

    const prompt = `Generate an image: A beautiful cover photo for a ${platformName} social media article titled "${title}". ${(content || "").substring(0, 150)}. Style: ${style || "Modern, clean, vibrant colors, professional photography style"}. Do NOT include any text or letters in the image. Clean composition, harmonious colors, visually striking hero image.`;

    let lastError = "";

    for (const model of IMAGE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      
      console.log(`Trying model: ${model}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const t = await response.text();
        console.error(`Model ${model} error:`, response.status, t);
        lastError = t;
        continue; // Try next model
      }

      const result = await response.json();
      const parts = result.candidates?.[0]?.content?.parts || [];
      let imageUrl = "";

      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      if (imageUrl) {
        console.log(`Success with model: ${model}`);
        return new Response(
          JSON.stringify({ imageUrl, description: "" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Model ${model} returned no image`);
    }

    console.error("All models failed. Last error:", lastError);
    return new Response(
      JSON.stringify({ error: "图片生成失败，请稍后重试" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-cover error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
